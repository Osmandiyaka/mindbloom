import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LibrarySettings } from '../schemas/settings.schema';
import { UpdateSettingsDto, GetLoanPolicyDto, LoanPolicyDto } from '../dto/settings.dto';
import { TenantContext } from '../../../common/tenant/tenant.context';

@Injectable()
export class SettingsService {
    constructor(
        @InjectModel('LibrarySettings')
        private readonly settingsModel: Model<LibrarySettings>,
        private readonly tenantContext: TenantContext,
    ) { }

    /**
     * Get settings for current tenant
     * Creates default settings if none exist
     */
    async getSettings(): Promise<any> {
        const tenantId = this.tenantContext.tenantId;

        let settings = await this.settingsModel.findOne({ tenantId });

        if (!settings) {
            // Create default settings
            settings = await this.createDefaultSettings();
        }

        return settings;
    }

    /**
     * Update settings
     */
    async updateSettings(updateDto: UpdateSettingsDto): Promise<LibrarySettings> {
        const tenantId = this.tenantContext.tenantId;

        let settings = await this.settingsModel.findOne({ tenantId });

        if (!settings) {
            settings = new this.settingsModel({
                tenantId,
                ...updateDto,
            });
        } else {
            Object.assign(settings, updateDto);
        }

        await settings.save();

        return settings;
    }

    /**
     * Get loan policy for a patron type
     */
    async getLoanPolicy(patronType: string): Promise<LoanPolicyDto> {
        const settings = await this.getSettings();

        if (settings.loanPolicies && settings.loanPolicies[patronType]) {
            return settings.loanPolicies[patronType];
        }

        // Return default policy
        return settings.defaultLoanPolicy;
    }

    /**
     * Create default settings for a tenant
     */
    private async createDefaultSettings(): Promise<any> {
        const tenantId = this.tenantContext.tenantId;

        const defaultSettings = new this.settingsModel({
            tenantId,
            defaultLoanPolicy: {
                loanPeriodDays: 14,
                maxRenewals: 2,
                maxItemsCheckedOut: 5,
                maxReservations: 3,
                canRenewOverdue: false,
            },
            finePolicy: {
                overdueRatePerDay: 0.5,
                maxFineAmount: 10.0,
                gracePeriodDays: 0,
                lostItemReplacementMultiplier: 2,
                damagedItemFinePercentage: 50,
                processingFee: 5.0,
            },
            reservationPolicy: {
                holdDays: 3,
                maxNotifications: 3,
                notificationIntervalDays: 1,
                autoExpireHours: 72,
                allowAutoCheckout: false,
            },
            renewalPolicy: {
                renewBeforeDueDays: 3,
                renewAfterDueDays: 1,
                blockRenewalIfReserved: true,
                autoRenewEnabled: false,
            },
            notificationSettings: {
                overdueReminderDays: [1, 3, 7, 14],
                dueSoonDays: 2,
                reservationAvailableChannels: ['EMAIL', 'SMS', 'IN_APP'],
                overdueChannels: ['EMAIL', 'SMS'],
                enableEmailNotifications: true,
                enableSmsNotifications: false,
                enableInAppNotifications: true,
            },
            barcodeSettings: {
                prefix: 'LIB',
                length: 14,
                checkDigit: false,
                format: 'CODE128',
            },
            catalogingSettings: {
                defaultClassificationSystem: 'DEWEY',
                requireISBN: false,
                autoFetchMetadata: true,
                metadataSources: ['GOOGLE_BOOKS', 'OPEN_LIBRARY'],
            },
            circulationSettings: {
                enableSelfCheckout: false,
                enableSelfCheckin: false,
                requireLibrarianApproval: false,
                blockCheckoutIfFines: true,
                fineThresholdForBlock: 5.0,
                enableBulkCheckout: true,
                enableBulkCheckin: true,
            },
            inventorySettings: {
                lowStockThreshold: 2,
                enableAutomaticOrdering: false,
                defaultVendor: '',
                trackSerialNumbers: false,
            },
            reportingSettings: {
                fiscalYearStart: '01-01',
                currency: 'USD',
                timezone: 'UTC',
                defaultReportFormat: 'PDF',
            },
            displaySettings: {
                itemsPerPage: 20,
                defaultSortOrder: 'title',
                showCoverImages: true,
                coverImageSource: 'GOOGLE_BOOKS',
            },
            integrations: {
                openLibraryEnabled: true,
            },
            businessHours: {
                monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
                tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
                wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
                thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
                friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
                saturday: { isOpen: false, openTime: '09:00', closeTime: '13:00' },
                sunday: { isOpen: false, openTime: '00:00', closeTime: '00:00' },
            },
            holidays: [],
            customFields: {},
            featureFlags: {
                enableReservations: true,
                enableFines: true,
                enableEBooks: false,
                enableAudioBooks: false,
                enablePeriodicalsModule: false,
                enableRFID: false,
                enableBarcodeScanner: true,
            },
            isActive: true,
        });

        await defaultSettings.save();

        return defaultSettings;
    }

    /**
     * Reset settings to defaults
     */
    async resetToDefaults(): Promise<any> {
        const tenantId = this.tenantContext.tenantId;

        await this.settingsModel.deleteOne({ tenantId });

        return this.createDefaultSettings();
    }
}
