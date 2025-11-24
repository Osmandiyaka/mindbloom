import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LibraryLocation, LocationType } from '../schemas/location.schema';
import { CreateLocationDto, UpdateLocationDto, LocationQueryDto } from '../dto/location.dto';
import { TenantContext } from '../../../common/tenant/tenant.context';

@Injectable()
export class LocationsService {
    constructor(
        @InjectModel('LibraryLocation')
        private readonly locationModel: Model<LibraryLocation>,
        private readonly tenantContext: TenantContext,
    ) { }

    /**
     * Create a new location
     * - Builds fullPath based on parent hierarchy
     * - Validates parent exists if provided
     */
    async create(createDto: CreateLocationDto): Promise<LibraryLocation> {
        const tenantId = this.tenantContext.tenantId;

        // Validate parent exists if provided
        let level = 0;
        let fullPath = createDto.name;

        if (createDto.parentId) {
            const parent = await this.findById(createDto.parentId.toString());
            level = parent.level + 1;
            fullPath = `${parent.fullPath}/${createDto.name}`;

            // Add this location to parent's childIds
            await this.locationModel.updateOne(
                { _id: createDto.parentId, tenantId },
                { $addToSet: { childIds: null } } // Will be updated after save
            );
        }

        const location = new this.locationModel({
            ...createDto,
            tenantId,
            level,
            fullPath,
            currentCount: 0,
            isActive: true,
        });

        await location.save();

        // Update parent's childIds
        if (createDto.parentId) {
            await this.locationModel.updateOne(
                { _id: createDto.parentId, tenantId },
                { $addToSet: { childIds: location._id } }
            );
        }

        return location;
    }

    /**
     * Find all locations with optional filtering
     */
    async findAll(queryDto?: LocationQueryDto): Promise<LibraryLocation[]> {
        const tenantId = this.tenantContext.tenantId;
        const filter: any = { tenantId };

        if (queryDto) {
            if (queryDto.type) filter.type = queryDto.type;
            if (queryDto.parentId) filter.parentId = queryDto.parentId;
            if (queryDto.isActive !== undefined) filter.isActive = queryDto.isActive;
            if (queryDto.level !== undefined) filter.level = queryDto.level;
        }

        return this.locationModel
            .find(filter)
            .populate('parentId', 'name code type')
            .sort({ fullPath: 1 });
    }

    /**
     * Find location by ID
     */
    async findById(id: string): Promise<LibraryLocation> {
        const tenantId = this.tenantContext.tenantId;

        const location = await this.locationModel
            .findOne({ _id: id, tenantId })
            .populate('parentId', 'name code type fullPath');

        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }

        return location;
    }

    /**
     * Find location by code
     */
    async findByCode(code: string): Promise<LibraryLocation> {
        const tenantId = this.tenantContext.tenantId;

        const location = await this.locationModel
            .findOne({ tenantId, code })
            .populate('parentId', 'name code type fullPath');

        if (!location) {
            throw new NotFoundException(`Location with code ${code} not found`);
        }

        return location;
    }

    /**
     * Get all children of a location
     */
    async getChildren(parentId: string): Promise<LibraryLocation[]> {
        const tenantId = this.tenantContext.tenantId;

        return this.locationModel
            .find({ tenantId, parentId })
            .sort({ name: 1 });
    }

    /**
     * Build hierarchical tree structure
     */
    async buildHierarchy(rootId?: string): Promise<any[]> {
        const tenantId = this.tenantContext.tenantId;

        const filter: any = { tenantId };

        if (rootId) {
            filter.parentId = rootId;
        } else {
            filter.$or = [
                { parentId: { $exists: false } },
                { parentId: null }
            ];
        }

        const locations = await this.locationModel.find(filter).sort({ name: 1 });

        const hierarchy = await Promise.all(
            locations.map(async (location) => {
                const children = await this.buildHierarchy(location._id.toString());
                return {
                    ...location.toObject(),
                    children
                };
            })
        );

        return hierarchy;
    }

    /**
     * Update location
     */
    async update(id: string, updateDto: UpdateLocationDto): Promise<LibraryLocation> {
        const tenantId = this.tenantContext.tenantId;

        const location = await this.locationModel.findOneAndUpdate(
            { _id: id, tenantId },
            { ...updateDto },
            { new: true }
        ).populate('parentId', 'name code type fullPath');

        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }

        return location;
    }

    /**
     * Delete location (only if no children and no copies)
     */
    async delete(id: string): Promise<void> {
        const tenantId = this.tenantContext.tenantId;

        const location = await this.findById(id);

        // Check for children
        if (location.childIds && location.childIds.length > 0) {
            throw new BadRequestException(
                'Cannot delete location with child locations. Please remove children first.'
            );
        }

        // Check for items in this location
        if (location.currentCount > 0) {
            throw new BadRequestException(
                `Cannot delete location with ${location.currentCount} items. Please move items first.`
            );
        }

        // Remove from parent's childIds
        if (location.parentId) {
            await this.locationModel.updateOne(
                { _id: location.parentId, tenantId },
                { $pull: { childIds: location._id } }
            );
        }

        await this.locationModel.deleteOne({ _id: id, tenantId });
    }

    /**
     * Soft delete (mark as inactive)
     */
    async softDelete(id: string): Promise<LibraryLocation> {
        const tenantId = this.tenantContext.tenantId;

        const location = await this.locationModel.findOneAndUpdate(
            { _id: id, tenantId },
            { isActive: false },
            { new: true }
        );

        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }

        return location;
    }

    /**
     * Increment item count
     */
    async incrementCount(locationId: string, count: number = 1): Promise<void> {
        const tenantId = this.tenantContext.tenantId;

        await this.locationModel.updateOne(
            { _id: locationId, tenantId },
            { $inc: { currentCount: count } }
        );
    }

    /**
     * Decrement item count
     */
    async decrementCount(locationId: string, count: number = 1): Promise<void> {
        const tenantId = this.tenantContext.tenantId;

        await this.locationModel.updateOne(
            { _id: locationId, tenantId },
            { $inc: { currentCount: -count } }
        );
    }

    /**
     * Get location path from root to this location
     */
    async getLocationPath(locationId: string): Promise<LibraryLocation[]> {
        const path: LibraryLocation[] = [];
        let currentLocation = await this.findById(locationId);

        while (currentLocation) {
            path.unshift(currentLocation);

            if (currentLocation.parentId) {
                currentLocation = await this.findById(currentLocation.parentId.toString());
            } else {
                break;
            }
        }

        return path;
    }

    /**
     * Get root locations (buildings)
     */
    async getRootLocations(): Promise<LibraryLocation[]> {
        const tenantId = this.tenantContext.tenantId;

        return this.locationModel.find({
            tenantId,
            level: 0,
            isActive: true
        }).sort({ name: 1 });
    }

    /**
     * Check if location is at or over capacity
     */
    async isOverCapacity(locationId: string): Promise<boolean> {
        const location = await this.findById(locationId);

        if (!location.capacity) return false;

        return location.currentCount >= location.capacity;
    }
}
