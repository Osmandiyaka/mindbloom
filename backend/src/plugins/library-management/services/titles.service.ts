import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { LibraryBookTitle } from '../schemas/book-title.schema';
import { CreateTitleDto, UpdateTitleDto, TitleQueryDto } from '../dto/title.dto';
import { TenantContext } from '../../../common/tenant/tenant.context';

interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class TitlesService {
    constructor(
        @InjectModel('LibraryBookTitle')
        private readonly titleModel: Model<LibraryBookTitle>,
        private readonly tenantContext: TenantContext,
    ) { }

    /**
     * Create a new book title
     * - Validates ISBN uniqueness per tenant
     * - Auto-fetches metadata from external sources if enabled
     * - Initializes inventory counters
     */
    async create(createDto: CreateTitleDto): Promise<LibraryBookTitle> {
        const tenantId = this.tenantContext.tenantId;

        // Check for duplicate ISBN within tenant
        const existing = await this.titleModel.findOne({
            tenantId,
            $or: [
                { isbn: createDto.isbn },
                { isbn10: createDto.isbn10 }
            ]
        });

        if (existing) {
            throw new ConflictException(
                `A book with ISBN ${createDto.isbn} already exists in your library`
            );
        }

        // Auto-fetch metadata if enabled (placeholder for future implementation)
        // const metadata = await this.fetchMetadataFromExternalSources(createDto.isbn);

        const title = new this.titleModel({
            ...createDto,
            tenantId,
            totalCopies: 0,
            availableCopies: 0,
            isActive: true,
        });

        return title.save();
    }

    /**
     * Find all titles with advanced filtering, search, and pagination
     */
    async findAll(queryDto: TitleQueryDto): Promise<PaginatedResponse<LibraryBookTitle>> {
        const tenantId = this.tenantContext.tenantId;
        const {
            search,
            isbn,
            categories,
            authors,
            publishedYear,
            language,
            isActive,
            hasAvailableCopies,
            page = 1,
            limit = 20,
            sortBy = 'title',
            sortOrder = 'asc'
        } = queryDto;

        const filter: FilterQuery<LibraryBookTitle> = { tenantId };

        // Full-text search across title, authors, description
        if (search) {
            filter.$text = { $search: search };
        }

        // Exact match filters
        if (isbn) {
            filter.$or = [{ isbn }, { isbn10: isbn }];
        }

        if (categories && categories.length > 0) {
            filter.categories = { $in: categories };
        }

        if (authors && authors.length > 0) {
            filter.authors = { $in: authors };
        }

        if (publishedYear) {
            filter.publishedYear = publishedYear;
        }

        if (language) {
            filter.language = language;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive;
        }

        if (hasAvailableCopies) {
            filter.availableCopies = { $gt: 0 };
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Sort configuration
        const sortConfig: any = {};
        if (search && sortBy === 'relevance') {
            sortConfig.score = { $meta: 'textScore' };
        } else {
            sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }

        // Execute query
        const [data, total] = await Promise.all([
            this.titleModel
                .find(filter)
                .sort(sortConfig)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.titleModel.countDocuments(filter)
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
     * Find a single title by ID
     */
    async findById(id: string): Promise<LibraryBookTitle> {
        const tenantId = this.tenantContext.tenantId;

        const title = await this.titleModel.findOne({ _id: id, tenantId });

        if (!title) {
            throw new NotFoundException(`Book title with ID ${id} not found`);
        }

        return title;
    }

    /**
     * Find a title by ISBN
     */
    async findByISBN(isbn: string): Promise<LibraryBookTitle | null> {
        const tenantId = this.tenantContext.tenantId;

        return this.titleModel.findOne({
            tenantId,
            $or: [{ isbn }, { isbn10: isbn }]
        });
    }

    /**
     * Update a book title
     */
    async update(id: string, updateDto: UpdateTitleDto): Promise<LibraryBookTitle> {
        const tenantId = this.tenantContext.tenantId;

        const title = await this.titleModel.findOneAndUpdate(
            { _id: id, tenantId },
            { ...updateDto },
            { new: true }
        );

        if (!title) {
            throw new NotFoundException(`Book title with ID ${id} not found`);
        }

        return title;
    }

    /**
     * Soft delete a title (mark as inactive)
     */
    async softDelete(id: string): Promise<LibraryBookTitle> {
        const tenantId = this.tenantContext.tenantId;

        // Check if there are any copies associated
        const title = await this.findById(id);

        if (title.totalCopies > 0) {
            throw new BadRequestException(
                `Cannot delete title with existing copies. Please remove all copies first.`
            );
        }

        const deleted = await this.titleModel.findOneAndUpdate(
            { _id: id, tenantId },
            { isActive: false },
            { new: true }
        );

        if (!deleted) {
            throw new NotFoundException(`Book title with ID ${id} not found`);
        }

        return deleted;
    }

    /**
     * Hard delete a title (permanent removal)
     * Should only be used in special cases, requires admin permission
     */
    async hardDelete(id: string): Promise<void> {
        const tenantId = this.tenantContext.tenantId;

        const title = await this.findById(id);

        if (title.totalCopies > 0) {
            throw new BadRequestException(
                `Cannot delete title with existing copies. Please remove all copies first.`
            );
        }

        const result = await this.titleModel.deleteOne({ _id: id, tenantId });

        if (result.deletedCount === 0) {
            throw new NotFoundException(`Book title with ID ${id} not found`);
        }
    }

    /**
     * Update inventory counts (called when copies are added/removed)
     */
    async updateInventoryCounts(
        titleId: string,
        totalChange: number,
        availableChange: number
    ): Promise<void> {
        const tenantId = this.tenantContext.tenantId;

        await this.titleModel.updateOne(
            { _id: titleId, tenantId },
            {
                $inc: {
                    totalCopies: totalChange,
                    availableCopies: availableChange
                }
            }
        );
    }

    /**
     * Get titles with low stock (available copies below threshold)
     */
    async getLowStockTitles(threshold: number = 2): Promise<LibraryBookTitle[]> {
        const tenantId = this.tenantContext.tenantId;

        return this.titleModel.find({
            tenantId,
            isActive: true,
            availableCopies: { $lt: threshold, $gt: 0 },
            totalCopies: { $gt: 0 }
        }).sort({ availableCopies: 1 });
    }

    /**
     * Get out of stock titles (no available copies but has total copies)
     */
    async getOutOfStockTitles(): Promise<LibraryBookTitle[]> {
        const tenantId = this.tenantContext.tenantId;

        return this.titleModel.find({
            tenantId,
            isActive: true,
            availableCopies: 0,
            totalCopies: { $gt: 0 }
        });
    }

    /**
     * Get popular titles (by borrow count)
     */
    async getPopularTitles(limit: number = 10): Promise<LibraryBookTitle[]> {
        const tenantId = this.tenantContext.tenantId;

        return this.titleModel
            .find({ tenantId, isActive: true })
            .sort({ 'popularity.borrowCount': -1 })
            .limit(limit);
    }

    /**
     * Get recently added titles
     */
    async getRecentlyAdded(limit: number = 10): Promise<LibraryBookTitle[]> {
        const tenantId = this.tenantContext.tenantId;

        return this.titleModel
            .find({ tenantId, isActive: true })
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    /**
     * Increment popularity metrics
     */
    async incrementBorrowCount(titleId: string): Promise<void> {
        const tenantId = this.tenantContext.tenantId;

        await this.titleModel.updateOne(
            { _id: titleId, tenantId },
            {
                $inc: { 'popularity.borrowCount': 1 },
                $set: { 'popularity.lastBorrowedAt': new Date() }
            }
        );
    }

    /**
     * Get titles by category
     */
    async findByCategory(category: string, limit: number = 20): Promise<LibraryBookTitle[]> {
        const tenantId = this.tenantContext.tenantId;

        return this.titleModel
            .find({
                tenantId,
                isActive: true,
                categories: category
            })
            .sort({ title: 1 })
            .limit(limit);
    }

    /**
     * Get all unique categories in the library
     */
    async getAllCategories(): Promise<string[]> {
        const tenantId = this.tenantContext.tenantId;

        const categories = await this.titleModel.distinct('categories', {
            tenantId,
            isActive: true
        });

        return categories.sort();
    }

    /**
     * Get all unique authors in the library
     */
    async getAllAuthors(): Promise<string[]> {
        const tenantId = this.tenantContext.tenantId;

        const authors = await this.titleModel.distinct('authors', {
            tenantId,
            isActive: true
        });

        return authors.sort();
    }

    /**
     * Placeholder for future metadata fetching from external sources
     */
    private async fetchMetadataFromExternalSources(isbn: string): Promise<any> {
        // TODO: Implement integration with Google Books API, OpenLibrary API, etc.
        // This would auto-populate title, author, description, cover image, etc.
        return null;
    }

    /**
     * Get distinct categories
     */
    async getDistinctCategories(): Promise<string[]> {
        const tenantId = this.tenantContext.tenantId;
        return this.getAllCategories();
    }

    /**
     * Find popular titles (most borrowed)
     */
    async findPopular(limit: number = 10): Promise<LibraryBookTitle[]> {
        const tenantId = this.tenantContext.tenantId;
        return this.titleModel
            .find({ tenantId, isActive: true })
            .sort({ totalCheckouts: -1 })
            .limit(limit)
            .exec();
    }

    /**
     * Find recently added titles
     */
    async findRecent(limit: number = 10): Promise<LibraryBookTitle[]> {
        const tenantId = this.tenantContext.tenantId;
        return this.titleModel
            .find({ tenantId, isActive: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }
}

