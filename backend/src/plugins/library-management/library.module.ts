import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LibraryManagementPlugin } from './library.plugin';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { LibraryBookSchema } from './schemas/book.schema';
import { LibraryBookCopySchema } from './schemas/book-copy.schema';
import { LibraryCategorySchema } from './schemas/category.schema';
import { LibraryTransactionSchema } from './schemas/transaction.schema';
import { LibraryMemberSchema } from './schemas/member.schema';
import { LibraryReservationSchema } from './schemas/reservation.schema';
import { LibraryFineSchema } from './schemas/fine.schema';
import { TenantContext } from '../../common/tenant/tenant.context';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'LibraryBook', schema: LibraryBookSchema },
            { name: 'LibraryBookCopy', schema: LibraryBookCopySchema },
            { name: 'LibraryCategory', schema: LibraryCategorySchema },
            { name: 'LibraryTransaction', schema: LibraryTransactionSchema },
            { name: 'LibraryMember', schema: LibraryMemberSchema },
            { name: 'LibraryReservation', schema: LibraryReservationSchema },
            { name: 'LibraryFine', schema: LibraryFineSchema },
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
