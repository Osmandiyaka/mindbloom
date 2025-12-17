import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { convert } from 'html-to-text';
import { TemplateRequest } from './mail.types';

const BASE_LAYOUT = `
<div style="font-family:'Inter',Arial,sans-serif; background:#0f172a; padding:24px;">
  <div style="max-width:600px; margin:0 auto; background:#0b1221; border:1px solid #1f2937; border-radius:14px; overflow:hidden; box-shadow:0 12px 30px rgba(0,0,0,0.35);">
    <div style="padding:24px 24px 12px; color:#e5e7eb;">
      <p style="margin:0 0 6px; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#94a3b8;">MindBloom</p>
      <div style="margin:0 0 10px;">{{{content}}}</div>
      <div style="margin-top:20px; padding-top:12px; border-top:1px solid #1f2937; color:#9ca3af; font-size:12px; line-height:1.4;">
        <p style="margin:0 0 4px;">You are receiving this email because your account is associated with MindBloom.</p>
        <p style="margin:0;">If you were not expecting this message, you can ignore it.</p>
      </div>
    </div>
  </div>
</div>`;

@Injectable()
export class MailTemplateRenderer {
    private readonly compiledLayout = Handlebars.compile<{ content: string }>(BASE_LAYOUT);

    constructor() {
        Handlebars.registerHelper('uppercase', (value: string) => (value || '').toUpperCase());
        Handlebars.registerHelper('date', (value: Date | string, locale = 'en-GB', options: Intl.DateTimeFormatOptions = {}) => {
            if (!value) return '';
            const date = typeof value === 'string' ? new Date(value) : value;
            return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', ...options }).format(date);
        });
    }

    render(template: TemplateRequest): string {
        const { body, context = {}, wrapLayout = true } = template;
        const compiledBody = Handlebars.compile(body)(context);
        if (!wrapLayout) {
            return compiledBody;
        }
        return this.compiledLayout({ content: compiledBody });
    }

    asText(html: string): string {
        return convert(html, { wordwrap: 120, selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }] });
    }
}
