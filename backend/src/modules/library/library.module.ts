import { Module } from '@nestjs/common';
import { IsbnLookupController } from './isbn-lookup.controller';

@Module({
    controllers: [IsbnLookupController],
})
export class LibraryModule { }
