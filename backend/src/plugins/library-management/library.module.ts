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
import { LibraryCategorySchema } from './schemas/category.schema';
import { LibraryMemberSchema } from './schemas/member.schema';

import { TenantContext } from '../../common/tenant/tenant.context';

@Module({
    imports: [
        MongooseModule.forFeature([
            // New comprehensive schemas
            { name: 'LibraryBookTitle', schema: LibraryBookTitleSchema },
            { name: 'LibraryBookCopy', schema: NewLibraryBookCopySchema },
            { name: 'LibraryLocation', schema: LibraryLocationSchema },
            { name: 'LibraryBorrowTransaction', schema: LibraryBorrowTransactionSchema },
            { name: 'LibraryReservation', schema: LibraryReservationSchema },
            { name: 'LibraryFineLedger', schema: LibraryFineLedgerSchema },
            { name: 'LibrarySettings', schema: LibrarySettingsSchema },
            { name: 'LibraryNotificationLog', schema: LibraryNotificationLogSchema },
            
            // Legacy schemas (keeping for backward compatibility during migration)
            { name: 'LibraryCategory', schema: LibraryCategorySchema },
            { name: 'LibraryMember', schema: LibraryMemberSchema },
        ]),
    ],
    controllers: [LibraryController],
    providers: [
        LibraryManagementPlugin,
        LibraryService,
        TenantContext,
    ],
    exports: [LibraryManagementPlugin],
})
export class LibraryManagementModule { }

