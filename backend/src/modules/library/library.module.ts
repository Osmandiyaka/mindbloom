import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IsbnLookupController } from './isbn-lookup.controller';
import { TitlesController } from './controllers/titles.controller';
import { CopiesController } from './controllers/copies.controller';
import { LibraryBookTitleSchema } from '../../plugins/library-management/schemas/book-title.schema';
import { LibraryBookCopySchema } from '../../plugins/library-management/schemas/book-copy.schema';
import { TitlesService } from '../../plugins/library-management/services/titles.service';
import { CopiesService } from '../../plugins/library-management/services/copies.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'LibraryBookTitle', schema: LibraryBookTitleSchema },
            { name: 'LibraryBookCopy', schema: LibraryBookCopySchema },
        ]),
    ],
    controllers: [IsbnLookupController, TitlesController, CopiesController],
    providers: [TitlesService, CopiesService],
})
export class LibraryModule { }
