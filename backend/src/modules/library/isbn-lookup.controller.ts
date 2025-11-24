import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { Public } from '../../common/tenant/public.decorator';

@Controller('library/isbn-lookup')
export class IsbnLookupController {
    @Get()
    @Public()
    async lookupIsbn(@Query('isbn') isbn: string) {
        if (!isbn) {
            throw new HttpException('ISBN is required', HttpStatus.BAD_REQUEST);
        }

        const cleanIsbn = isbn.replace(/[-\s]/g, '');

        // Validate ISBN format
        if (!/^\d{10}(\d{3})?$/.test(cleanIsbn)) {
            throw new HttpException('Invalid ISBN format', HttpStatus.BAD_REQUEST);
        }

        try {
            // Try Open Library first
            const openLibraryUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
            const openLibraryResponse = await fetch(openLibraryUrl);
            const openLibraryData = await openLibraryResponse.json();

            const bookKey = `ISBN:${cleanIsbn}`;
            if (openLibraryData[bookKey]) {
                const book = openLibraryData[bookKey];
                return {
                    source: 'openlibrary',
                    title: book.title || '',
                    authors: book.authors?.map((a: any) => a.name) || [],
                    publisher: book.publishers?.[0]?.name || '',
                    publishedDate: book.publish_date || '',
                    description: book.notes || book.subtitle || '',
                    subjects: book.subjects?.map((s: any) => s.name) || [],
                    isbn: cleanIsbn,
                };
            }

            // Fallback to Google Books
            const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
            const googleBooksResponse = await fetch(googleBooksUrl);
            const googleBooksData = await googleBooksResponse.json();

            if (googleBooksData.items && googleBooksData.items.length > 0) {
                const book = googleBooksData.items[0].volumeInfo;
                return {
                    source: 'googlebooks',
                    title: book.title || '',
                    authors: book.authors || [],
                    publisher: book.publisher || '',
                    publishedDate: book.publishedDate || '',
                    description: book.description || '',
                    subjects: book.categories || [],
                    isbn: cleanIsbn,
                };
            }

            throw new HttpException('Book not found', HttpStatus.NOT_FOUND);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'ISBN lookup service unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
    }
}
