import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { MailRequest, MailSender } from './mail.types';

@Injectable()
export class NodemailerSender implements MailSender {
    private readonly logger = new Logger(NodemailerSender.name);
    private transporter: Transporter | null = null;
    private readonly fromAddress: string;

    constructor(private readonly configService: ConfigService) {
        this.fromAddress = this.configService.get<string>('EMAIL_FROM') || 'no-reply@mindbloom.app';
    }

    private buildTransporter(): Transporter | null {
        const smtpUrl = this.configService.get<string>('SMTP_URL');
        const host = this.configService.get<string>('SMTP_HOST');
        const port = Number(this.configService.get<string>('SMTP_PORT') || this.configService.get<string>('EMAIL_PORT') || 0);
        const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('EMAIL_USER');
        const pass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('EMAIL_PASS');
        const secure = this.configService.get<boolean>('SMTP_SECURE');
        const ignoreTLS = this.configService.get<boolean>('SMTP_IGNORE_TLS');
        const pool = this.configService.get<boolean>('SMTP_POOL');

        if (!smtpUrl && !host) {
            this.logger.warn('SMTP configuration missing (SMTP_URL or SMTP_HOST). Emails will be logged only.');
            return null;
        }

        const isUrlLike = !!smtpUrl && smtpUrl.includes('://');
        const transporter = smtpUrl && isUrlLike
            ? createTransport(smtpUrl)
            : createTransport({
                host: smtpUrl && !isUrlLike ? smtpUrl : host,
                port: port || 587,
                secure: typeof secure === 'boolean' ? secure : (port || 587) === 465,
                ignoreTLS,
                pool: !!pool,
                auth: user && pass ? { user, pass } : undefined,
            });

        return transporter;
    }

    private getTransporter(): Transporter | null {
        if (this.transporter) {
            return this.transporter;
        }
        this.transporter = this.buildTransporter();
        return this.transporter;
    }

    async send(payload: MailRequest): Promise<void> {
        const transporter = this.getTransporter();
        if (!transporter) {
            this.logger.log(`Email (logged only) to=${payload.to} subject="${payload.subject}"`);
            return;
        }

        await transporter.sendMail({
            from: this.fromAddress,
            to: payload.to,
            cc: payload.cc,
            bcc: payload.bcc,
            replyTo: payload.replyTo,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
            headers: payload.headers,
            messageId: payload.messageId,
        });
    }
}
