import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LibraryManagementPlugin } from './library.plugin';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';

// New comprehensive schemas
import { LibraryBookTitleSchema } from './schemas/book-title.schema';
import { LibraryBookCopySchema as NewLibraryBookCopySchema } from './schemas/copy.schema';
import { LibraryLocationSchema } from './schemas/location.schema';
import { LibraryBorrowTransactionSchema } from './schemas/borrow-transaction.schema';
import { LibraryReservationSchema } from './schemas/reservation.schema';
import { LibraryFineLedgerSchema } from './schemas/fine-ledger.schema';
import { LibrarySettingsSchema } from './schemas/settings.schema';
import { LibraryNotificationLogSchema } from './schemas/notification-log.schema';

// Legacy schemas (to be deprecated)
import { LibraryBookSchema } from './schemas/book.schema';
import { LibraryBookCopySchema as LegacyLibraryBookCopySchema } from './schemas/book-copy.schema';
import { LibraryTransactionSchema } from './schemas/transaction.schema';
import { LibraryFineSchema } from './schemas/fine.schema';
import { LibraryCategorySchema } from './schemas/category.schema';
import { LibraryMemberSchema } from './schemas/member.schema';

// New services
import { TitlesService } from './services/titles.service';
import { CopiesService } from './services/copies.service';
import { LocationsService } from './services/locations.service';
import { CirculationService } from './services/circulation.service';
import { ReservationsService } from './services/reservations.service';
import { FinesService } from './services/fines.service';
import { SettingsService } from './services/settings.service';

import { TenantContext } from '../../common/tenant/tenant.context';

@Module({
    imports: [
        MongooseModule.forFeature([
            // New comprehensive schemas (used by new services)
            { name: 'LibraryBookTitle', schema: LibraryBookTitleSchema },
            { name: 'LibraryBookCopy', schema: NewLibraryBookCopySchema }, // New comprehensive copy schema
            { name: 'LibraryLocation', schema: LibraryLocationSchema },
            { name: 'LibraryBorrowTransaction', schema: LibraryBorrowTransactionSchema },
            { name: 'LibraryReservation', schema: LibraryReservationSchema },
            { name: 'LibraryFineLedger', schema: LibraryFineLedgerSchema },
            { name: 'LibrarySettings', schema: LibrarySettingsSchema },
            { name: 'LibraryNotificationLog', schema: LibraryNotificationLogSchema },

            // Legacy schemas (keeping for backward compatibility - used by old LibraryService)
            { name: 'LibraryBook', schema: LibraryBookSchema },
            // Note: Legacy LibraryBookCopy removed - using new comprehensive schema above
            { name: 'LibraryTransaction', schema: LibraryTransactionSchema },
            { name: 'LibraryFine', schema: LibraryFineSchema },
            { name: 'LibraryCategory', schema: LibraryCategorySchema },
            { name: 'LibraryMember', schema: LibraryMemberSchema },
        ]),
    ],
    controllers: [LibraryController],
    providers: [
        LibraryManagementPlugin,
        LibraryService,
        TenantContext,
        // New services
        TitlesService,
        CopiesService,
        LocationsService,
        CirculationService,
        ReservationsService,
        FinesService,
        SettingsService,
    ],
    exports: [LibraryManagementPlugin],
})
export class LibraryManagementModule { }

