import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { LibraryBookCopy, CopyStatus, CopyCondition } from '../schemas/copy.schema';
import { CreateCopyDto, UpdateCopyDto, UpdateCopyStatusDto, CopyQueryDto, BulkCreateCopiesDto } from '../dto/copy.dto';
import { TenantContext } from '../../../common/tenant/tenant.context';
import { TitlesService } from './titles.service';

interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class CopiesService {
    // Valid status transitions (state machine)
    private readonly STATUS_TRANSITIONS: Map<CopyStatus, CopyStatus[]> = new Map([
        [CopyStatus.AVAILABLE, [CopyStatus.CHECKED_OUT, CopyStatus.RESERVED, CopyStatus.IN_TRANSIT, CopyStatus.PROCESSING, CopyStatus.DAMAGED, CopyStatus.LOST, CopyStatus.WITHDRAWN]],
        [CopyStatus.CHECKED_OUT, [CopyStatus.AVAILABLE, CopyStatus.LOST, CopyStatus.DAMAGED]],
        [CopyStatus.RESERVED, [CopyStatus.AVAILABLE, CopyStatus.ON_HOLD_SHELF, CopyStatus.CHECKED_OUT]],
        [CopyStatus.ON_HOLD_SHELF, [CopyStatus.CHECKED_OUT, CopyStatus.AVAILABLE, CopyStatus.RESERVED]],
        [CopyStatus.IN_TRANSIT, [CopyStatus.AVAILABLE, CopyStatus.ON_HOLD_SHELF]],
        [CopyStatus.PROCESSING, [CopyStatus.AVAILABLE]],
        [CopyStatus.DAMAGED, [CopyStatus.PROCESSING, CopyStatus.WITHDRAWN, CopyStatus.AVAILABLE]],
        [CopyStatus.LOST, [CopyStatus.AVAILABLE, CopyStatus.WITHDRAWN]],
        [CopyStatus.WITHDRAWN, []],
        [CopyStatus.MISSING, [CopyStatus.AVAILABLE, CopyStatus.LOST, CopyStatus.WITHDRAWN]],
    ]);

    constructor(
        @InjectModel('LibraryBookCopy')
        private readonly copyModel: Model<LibraryBookCopy>,
        private readonly tenantContext: TenantContext,
        private readonly titlesService: TitlesService,
    ) {}

    /**
     * Create a new book copy
     * - Generates barcode if not provided
     * - Validates title exists
     * - Updates title inventory counts
     */
    async create(createDto: CreateCopyDto): Promise<LibraryBookCopy> {
        const tenantId = this.tenantContext.tenantId;

        // Validate title exists
        await this.titlesService.findById(createDto.bookTitleId);

        // Check for duplicate barcode
        const existing = await this.copyModel.findOne({ tenantId, barcode: createDto.barcode });
        if (existing) {
            throw new ConflictException(`A copy with barcode ${createDto.barcode} already exists`);
        }

        const copy = new this.copyModel({
            ...createDto,
            tenantId,
            status: createDto.status || CopyStatus.AVAILABLE,
            condition: createDto.condition || CopyCondition.GOOD,
        });

        await copy.save();

        // Update title inventory counts
        const isAvailable = copy.status === CopyStatus.AVAILABLE;
        await this.titlesService.updateInventoryCounts(
            createDto.bookTitleId,
            1, // totalCopies +1
            isAvailable ? 1 : 0 // availableCopies +1 if available
        );

        return copy;
    }

    /**
     * Bulk create copies for a title
     */
    async bulkCreate(bulkDto: BulkCreateCopiesDto): Promise<LibraryBookCopy[]> {
        const tenantId = this.tenantContext.tenantId;

        // Validate title exists
        await this.titlesService.findById(bulkDto.bookTitleId);

        const copies: LibraryBookCopy[] = [];
        
        for (let i = 0; i < bulkDto.quantity; i++) {
            const barcode = await this.generateBarcode();
            
            const copy = new this.copyModel({
                tenantId,
                bookTitleId: bulkDto.bookTitleId,
                barcode,
                status: CopyStatus.AVAILABLE,
                condition: bulkDto.condition || CopyCondition.GOOD,
                locationId: bulkDto.locationId,
                acquisitionCost: bulkDto.acquisitionCost,
                acquisitionDate: bulkDto.acquisitionDate || new Date(),
                vendor: bulkDto.vendor,
                notes: bulkDto.notes,
            });

            await copy.save();
            copies.push(copy);
        }

        // Update title inventory counts
        await this.titlesService.updateInventoryCounts(
            bulkDto.bookTitleId,
            bulkDto.quantity, // totalCopies
            bulkDto.quantity  // availableCopies (all new copies are available)
        );

        return copies;
    }

    /**
     * Find all copies with filtering and pagination
     */
    async findAll(queryDto: CopyQueryDto): Promise<PaginatedResponse<LibraryBookCopy>> {
        const tenantId = this.tenantContext.tenantId;
        const { 
            bookTitleId, 
            barcode, 
            status, 
            condition, 
            locationId,
            page = 1, 
            limit = 50 
        } = queryDto;

        const filter: FilterQuery<LibraryBookCopy> = { tenantId };

        if (bookTitleId) filter.bookTitleId = bookTitleId;
        if (barcode) filter.barcode = new RegExp(barcode, 'i');
        if (status) filter.status = status;
        if (condition) filter.condition = condition;
        if (locationId) filter.locationId = locationId;

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.copyModel
                .find(filter)
                .populate('bookTitleId', 'title authors isbn coverImageUrl')
                .populate('locationId', 'name code fullPath')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.copyModel.countDocuments(filter)
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Find copy by barcode
     */
    async findByBarcode(barcode: string): Promise<LibraryBookCopy> {
        const tenantId = this.tenantContext.tenantId;
        
        const copy = await this.copyModel
            .findOne({ tenantId, barcode })
            .populate('bookTitleId', 'title authors isbn coverImageUrl')
            .populate('locationId', 'name code fullPath');

        if (!copy) {
            throw new NotFoundException(`Copy with barcode ${barcode} not found`);
        }

        return copy;
    }

    /**
     * Find copy by ID
     */
    async findById(id: string): Promise<LibraryBookCopy> {
        const tenantId = this.tenantContext.tenantId;
        
        const copy = await this.copyModel
            .findOne({ _id: id, tenantId })
            .populate('bookTitleId', 'title authors isbn coverImageUrl')
            .populate('locationId', 'name code fullPath');

        if (!copy) {
            throw new NotFoundException(`Copy with ID ${id} not found`);
        }

        return copy;
    }

    /**
     * Update copy status with state machine validation
     */
    async updateStatus(id: string, updateDto: UpdateCopyStatusDto): Promise<LibraryBookCopy> {
        const tenantId = this.tenantContext.tenantId;
        
        const copy = await this.findById(id);
        const currentStatus = copy.status;
        const newStatus = updateDto.newStatus;

        // Validate transition
        if (!this.isValidTransition(currentStatus, newStatus)) {
            throw new BadRequestException(
                `Invalid status transition from ${currentStatus} to ${newStatus}`
            );
        }

        // Track if availability changes
        const wasAvailable = currentStatus === CopyStatus.AVAILABLE;
        const isAvailable = newStatus === CopyStatus.AVAILABLE;

        copy.status = newStatus;
        copy.statusChangedAt = new Date();
        copy.statusChangedBy = updateDto.updatedBy || 'SYSTEM';

        await copy.save();

        // Update title availability count if needed
        if (wasAvailable !== isAvailable) {
            const availableChange = isAvailable ? 1 : -1;
            await this.titlesService.updateInventoryCounts(
                copy.bookTitleId.toString(),
                0, // totalCopies unchanged
                availableChange
            );
        }

        return copy;
    }

    /**
     * Update copy details
     */
    async update(id: string, updateDto: UpdateCopyDto): Promise<LibraryBookCopy> {
        const tenantId = this.tenantContext.tenantId;
        
        const copy = await this.copyModel.findOneAndUpdate(
            { _id: id, tenantId },
            { ...updateDto },
            { new: true }
        ).populate('bookTitleId', 'title authors isbn coverImageUrl')
         .populate('locationId', 'name code fullPath');

        if (!copy) {
            throw new NotFoundException(`Copy with ID ${id} not found`);
        }

        return copy;
    }

    /**
     * Delete a copy (soft delete recommended)
     */
    async delete(id: string): Promise<void> {
        const tenantId = this.tenantContext.tenantId;
        
        const copy = await this.findById(id);

        // Check if copy is currently borrowed
        if (copy.status === CopyStatus.CHECKED_OUT) {
            throw new BadRequestException('Cannot delete a copy that is currently checked out');
        }

        const wasAvailable = copy.status === CopyStatus.AVAILABLE;

        await this.copyModel.deleteOne({ _id: id, tenantId });

        // Update title inventory counts
        await this.titlesService.updateInventoryCounts(
            copy.bookTitleId.toString(),
            -1, // totalCopies -1
            wasAvailable ? -1 : 0
        );
    }

    /**
     * Generate unique barcode
     */
    async generateBarcode(): Promise<string> {
        const tenantId = this.tenantContext.tenantId;
        
        // Simple barcode generation (can be enhanced with settings)
        const prefix = 'LIB';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        let barcode = `${prefix}${timestamp}${random}`;
        
        // Ensure uniqueness
        let existing = await this.copyModel.findOne({ tenantId, barcode });
        while (existing) {
            const newRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            barcode = `${prefix}${timestamp}${newRandom}`;
            existing = await this.copyModel.findOne({ tenantId, barcode });
        }

        return barcode;
    }

    /**
     * Validate status transition
     */
    private isValidTransition(from: CopyStatus, to: CopyStatus): boolean {
        if (from === to) return true; // Same status is allowed
        
        const allowedTransitions = this.STATUS_TRANSITIONS.get(from);
        return allowedTransitions ? allowedTransitions.includes(to) : false;
    }

    /**
     * Get all copies for a title
     */
    async getCopiesByTitle(titleId: string): Promise<LibraryBookCopy[]> {
        const tenantId = this.tenantContext.tenantId;
        
        return this.copyModel
            .find({ tenantId, bookTitleId: titleId })
            .populate('locationId', 'name code fullPath')
            .sort({ barcode: 1 });
    }

    /**
     * Get available copies for a title
     */
    async getAvailableCopiesByTitle(titleId: string): Promise<LibraryBookCopy[]> {
        const tenantId = this.tenantContext.tenantId;
        
        return this.copyModel.find({
            tenantId,
            bookTitleId: titleId,
            status: CopyStatus.AVAILABLE
        }).populate('locationId', 'name code fullPath');
    }

    /**
     * Increment circulation count
     */
    async incrementCirculationCount(copyId: string): Promise<void> {
        const tenantId = this.tenantContext.tenantId;
        
        await this.copyModel.updateOne(
            { _id: copyId, tenantId },
            { 
                $inc: { 'usageStatistics.circulationCount': 1 },
                $set: { 'usageStatistics.lastBorrowedAt': new Date() }
            }
        );
    }
}
