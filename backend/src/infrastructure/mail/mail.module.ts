import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailTemplateRenderer } from './mail.template-renderer';
import { MailService } from './mail.service';
import { NodemailerSender } from './nodemailer.sender';
import { MAIL_SENDER } from './mail.types';

@Module({
    imports: [ConfigModule],
    providers: [MailTemplateRenderer, MailService, NodemailerSender, { provide: MAIL_SENDER, useExisting: NodemailerSender }],
    exports: [MailService],
})
export class MailModule { }
