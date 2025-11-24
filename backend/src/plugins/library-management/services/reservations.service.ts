import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LibraryReservation, ReservationStatus } from '../schemas/reservation.schema';
import { CreateReservationDto, CancelReservationDto, FulfillReservationDto, NotifyPatronDto, ReservationQueryDto } from '../dto/reservation.dto';
import { TenantContext } from '../../../common/tenant/tenant.context';
import { TitlesService } from './titles.service';
import { CopiesService } from './copies.service';

interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class ReservationsService {
    constructor(
        @InjectModel('LibraryReservation')
        private readonly reservationModel: Model<LibraryReservation>,
        private readonly tenantContext: TenantContext,
        private readonly titlesService: TitlesService,
        private readonly copiesService: CopiesService,
    ) {}

    /**
     * Create a new reservation
     * - Validates title exists
     * - Assigns queue position
     * - Checks patron limits
     */
    async create(createDto: CreateReservationDto): Promise<LibraryReservation> {
        const tenantId = this.tenantContext.tenantId;

        // Validate title exists
        await this.titlesService.findById(createDto.bookTitleId);

        // Check if patron already has an active reservation for this title
        const existingReservation = await this.reservationModel.findOne({
            tenantId,
            bookTitleId: createDto.bookTitleId,
            patronId: createDto.patronId,
            status: { $in: [ReservationStatus.WAITING, ReservationStatus.NOTIFIED, ReservationStatus.ON_HOLD_SHELF] },
        });

        if (existingReservation) {
            throw new BadRequestException('Patron already has an active reservation for this title');
        }

        // Calculate queue position
        const queueLength = await this.reservationModel.countDocuments({
            tenantId,
            bookTitleId: createDto.bookTitleId,
            status: ReservationStatus.WAITING,
        });

        const queuePosition = queueLength + 1;

        // Create reservation
        const reservation = new this.reservationModel({
            ...createDto,
            tenantId,
            queuePosition,
            initialQueueLength: queueLength,
            status: ReservationStatus.WAITING,
            reservedAt: new Date(),
        });

        await reservation.save();

        return reservation.populate([
            { path: 'bookTitleId', select: 'title authors isbn coverImageUrl' },
            { path: 'patronId', select: 'name email phone' }
        ]);
    }

    /**
     * Cancel a reservation
     */
    async cancel(id: string, cancelDto: CancelReservationDto, cancelledBy: string): Promise<LibraryReservation> {
        const tenantId = this.tenantContext.tenantId;

        const reservation = await this.reservationModel.findOne({ _id: id, tenantId });

        if (!reservation) {
            throw new NotFoundException('Reservation not found');
        }

        if (reservation.status === ReservationStatus.FULFILLED || reservation.status === ReservationStatus.CANCELLED) {
            throw new BadRequestException('Reservation is already fulfilled or cancelled');
        }

        const oldQueuePosition = reservation.queuePosition;

        reservation.status = ReservationStatus.CANCELLED;
        reservation.cancelledAt = new Date();
        reservation.cancellationReason = cancelDto.cancellationReason;
        reservation.cancelledBy = cancelledBy;

        await reservation.save();

        // Reorder queue - decrease position for all reservations after this one
        await this.reorderQueue(reservation.bookTitleId.toString(), oldQueuePosition);

        return reservation;
    }

    /**
     * Assign a copy to the next reservation in queue
     */
    async assignCopy(reservationId: string, copyId: string): Promise<LibraryReservation> {
        const tenantId = this.tenantContext.tenantId;

        const reservation = await this.reservationModel.findOne({ _id: reservationId, tenantId });

        if (!reservation) {
            throw new NotFoundException('Reservation not found');
        }

        if (reservation.status !== ReservationStatus.WAITING) {
            throw new BadRequestException('Only waiting reservations can have copies assigned');
        }

        // Validate copy belongs to the reserved title
        const copy = await this.copiesService.findById(copyId);
        if (copy.bookTitleId.toString() !== reservation.bookTitleId.toString()) {
            throw new BadRequestException('Copy does not match the reserved title');
        }

        // Calculate pickup deadline
        const holdDays = reservation.holdDays || 3;
        const pickupDeadline = new Date();
        pickupDeadline.setDate(pickupDeadline.getDate() + holdDays);

        reservation.status = ReservationStatus.ON_HOLD_SHELF;
        reservation.assignedCopyId = copy._id as any;
        reservation.notifiedAt = new Date();
        reservation.pickupDeadline = pickupDeadline;

        await reservation.save();

        // Notify patron (placeholder - actual implementation would send email/SMS)
        await this.notifyPatron(reservationId, {
            channels: reservation.preferredNotificationChannels || ['EMAIL' as any],
        });

        return reservation.populate([
            { path: 'bookTitleId', select: 'title authors isbn coverImageUrl' },
            { path: 'patronId', select: 'name email phone' },
            { path: 'assignedCopyId', select: 'barcode status' }
        ]);
    }

    /**
     * Fulfill a reservation (when patron checks out)
     */
    async fulfill(reservationId: string, borrowTransactionId: string): Promise<LibraryReservation> {
        const tenantId = this.tenantContext.tenantId;

        const reservation = await this.reservationModel.findOne({ _id: reservationId, tenantId });

        if (!reservation) {
            throw new NotFoundException('Reservation not found');
        }

        reservation.status = ReservationStatus.FULFILLED;
        reservation.fulfilledAt = new Date();
        reservation.borrowTransactionId = borrowTransactionId as any;

        await reservation.save();

        return reservation;
    }

    /**
     * Expire a reservation (not picked up in time)
     */
    async expire(reservationId: string): Promise<LibraryReservation> {
        const tenantId = this.tenantContext.tenantId;

        const reservation = await this.reservationModel.findOne({ _id: reservationId, tenantId });

        if (!reservation) {
            throw new NotFoundException('Reservation not found');
        }

        reservation.status = ReservationStatus.EXPIRED;

        await reservation.save();

        // Reorder queue
        await this.reorderQueue(reservation.bookTitleId.toString(), reservation.queuePosition);

        return reservation;
    }

    /**
     * Get next reservation in queue for a title
     */
    async getNextInQueue(titleId: string): Promise<LibraryReservation | null> {
        const tenantId = this.tenantContext.tenantId;

        return this.reservationModel
            .findOne({
                tenantId,
                bookTitleId: titleId,
                status: ReservationStatus.WAITING,
            })
            .sort({ queuePosition: 1 })
            .populate('patronId', 'name email phone');
    }

    /**
     * Check if title has waiting reservations
     */
    async hasWaitingReservations(titleId: string): Promise<boolean> {
        const tenantId = this.tenantContext.tenantId;

        const count = await this.reservationModel.countDocuments({
            tenantId,
            bookTitleId: titleId,
            status: ReservationStatus.WAITING,
        });

        return count > 0;
    }

    /**
     * Get reservations queue for a title
     */
    async getQueueForTitle(titleId: string): Promise<LibraryReservation[]> {
        const tenantId = this.tenantContext.tenantId;

        return this.reservationModel
            .find({
                tenantId,
                bookTitleId: titleId,
                status: { $in: [ReservationStatus.WAITING, ReservationStatus.NOTIFIED, ReservationStatus.ON_HOLD_SHELF] },
            })
            .populate('patronId', 'name email phone')
            .sort({ queuePosition: 1 });
    }

    /**
     * Get patron's active reservations
     */
    async getPatronReservations(patronId: string): Promise<LibraryReservation[]> {
        const tenantId = this.tenantContext.tenantId;

        return this.reservationModel
            .find({
                tenantId,
                patronId,
                status: { $in: [ReservationStatus.WAITING, ReservationStatus.NOTIFIED, ReservationStatus.ON_HOLD_SHELF] },
            })
            .populate('bookTitleId', 'title authors isbn coverImageUrl')
            .populate('assignedCopyId', 'barcode status')
            .sort({ reservedAt: 1 });
    }

    /**
     * Find all reservations with filtering
     */
    async findAll(queryDto: ReservationQueryDto): Promise<PaginatedResponse<LibraryReservation>> {
        const tenantId = this.tenantContext.tenantId;
        const {
            bookTitleId,
            patronId,
            status,
            fromDate,
            toDate,
            page = 1,
            limit = 50,
        } = queryDto;

        const filter: any = { tenantId };

        if (bookTitleId) filter.bookTitleId = bookTitleId;
        if (patronId) filter.patronId = patronId;
        if (status) filter.status = status;

        if (fromDate || toDate) {
            filter.reservedAt = {};
            if (fromDate) filter.reservedAt.$gte = fromDate;
            if (toDate) filter.reservedAt.$lte = toDate;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.reservationModel
                .find(filter)
                .populate('bookTitleId', 'title authors isbn coverImageUrl')
                .populate('patronId', 'name email phone')
                .populate('assignedCopyId', 'barcode status')
                .sort({ reservedAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.reservationModel.countDocuments(filter)
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
     * Notify patron about reservation
     */
    async notifyPatron(reservationId: string, notifyDto: NotifyPatronDto): Promise<void> {
        const tenantId = this.tenantContext.tenantId;

        const reservation = await this.reservationModel.findOne({ _id: reservationId, tenantId });

        if (!reservation) {
            throw new NotFoundException('Reservation not found');
        }

        // Placeholder for actual notification implementation
        // Would integrate with email/SMS service
        const notification = {
            channel: notifyDto.channels[0],
            sentAt: new Date(),
            success: true,
        };

        if (!reservation.notifications) reservation.notifications = [];
        reservation.notifications.push(notification as any);
        reservation.notificationsSent = (reservation.notificationsSent || 0) + 1;
        reservation.lastNotificationAt = new Date();

        await reservation.save();
    }

    /**
     * Reorder queue after cancellation/expiration
     */
    private async reorderQueue(titleId: string, removedPosition: number): Promise<void> {
        const tenantId = this.tenantContext.tenantId;

        // Decrease position for all reservations after the removed one
        await this.reservationModel.updateMany(
            {
                tenantId,
                bookTitleId: titleId,
                status: ReservationStatus.WAITING,
                queuePosition: { $gt: removedPosition },
            },
            {
                $inc: { queuePosition: -1, positionsMovedUp: 1 },
            }
        );
    }

    /**
     * Check for expired holds (to be run as cron job)
     */
    async checkExpiredHolds(): Promise<number> {
        const tenantId = this.tenantContext.tenantId;
        const now = new Date();

        const expiredReservations = await this.reservationModel.find({
            tenantId,
            status: ReservationStatus.ON_HOLD_SHELF,
            pickupDeadline: { $lt: now },
        });

        for (const reservation of expiredReservations) {
            await this.expire(reservation._id.toString());
        }

        return expiredReservations.length;
    }
}
