import { IsMongoId, IsNotEmpty, IsOptional, IsDate, IsString, IsNumber, IsEnum, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus, NotificationChannel } from '../schemas/reservation.schema';

export class CreateReservationDto {
    @IsMongoId()
    @IsNotEmpty()
    bookTitleId: string;

    @IsMongoId()
    @IsNotEmpty()
    patronId: string;

    @IsMongoId()
    @IsOptional()
    pickupLocationId?: string;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    preferredPickupDate?: Date;

    @IsArray()
    @IsEnum(NotificationChannel, { each: true })
    @IsOptional()
    preferredNotificationChannels?: NotificationChannel[];

    @IsOptional()
    autoCheckout?: boolean;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class CancelReservationDto {
    @IsString()
    @IsNotEmpty()
    cancellationReason: string;
}

export class FulfillReservationDto {
    @IsMongoId()
    @IsNotEmpty()
    assignedCopyId: string;

    @IsMongoId()
    @IsOptional()
    holdShelfLocationId?: string;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    pickupDeadline?: Date; // Auto-calculated from policy if not provided
}

export class NotifyPatronDto {
    @IsArray()
    @IsEnum(NotificationChannel, { each: true })
    @IsNotEmpty()
    channels: NotificationChannel[];

    @IsString()
    @IsOptional()
    customMessage?: string;
}

export class ReservationQueryDto {
    @IsMongoId()
    @IsOptional()
    bookTitleId?: string;

    @IsMongoId()
    @IsOptional()
    patronId?: string;

    @IsEnum(ReservationStatus)
    @IsOptional()
    status?: ReservationStatus;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    fromDate?: Date;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    toDate?: Date;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    limit?: number = 50;
}
