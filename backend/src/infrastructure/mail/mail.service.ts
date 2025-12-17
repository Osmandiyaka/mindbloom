import { Inject, Injectable, Logger } from '@nestjs/common';
import { MailTemplateRenderer } from './mail.template-renderer';
import { MAIL_SENDER, MailSendRequest, MailSender } from './mail.types';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        @Inject(MAIL_SENDER) private readonly sender: MailSender,
        private readonly renderer: MailTemplateRenderer,
    ) { }

    async send(request: MailSendRequest): Promise<void> {
        const to = Array.isArray(request.to) ? request.to : [request.to];
        if (!request.html && !request.template && !request.text) {
            throw new Error('MailService requires html, text, or template content to send an email');
        }

        const html = request.html ?? (request.template ? this.renderer.render(request.template) : undefined);
        const text = request.text ?? (html ? this.renderer.asText(html) : undefined);

        try {
            await this.sender.send({
                to,
                cc: request.cc,
                bcc: request.bcc,
                replyTo: request.replyTo,
                subject: request.subject,
                html,
                text,
                headers: request.headers,
                messageId: request.messageId,
            });
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
            throw error;
        }
    }
}
