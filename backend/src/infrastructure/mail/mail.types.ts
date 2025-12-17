export interface MailRequest {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    subject: string;
    html?: string;
    text?: string;
    headers?: Record<string, string>;
    messageId?: string;
}

export interface TemplateRequest {
    body: string;
    context?: Record<string, unknown>;
    wrapLayout?: boolean;
}

export interface MailSendRequest extends MailRequest {
    template?: TemplateRequest;
}

export interface MailSender {
    send(payload: MailRequest): Promise<void>;
}

export const MAIL_SENDER = 'MAIL_SENDER';
