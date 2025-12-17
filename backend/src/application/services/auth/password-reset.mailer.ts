import { Injectable } from '@nestjs/common';
import { MailService } from '../../../infrastructure/mail/mail.service';

@Injectable()
export class PasswordResetMailer {
  constructor(
    private readonly mailService: MailService,
  ) { }

  async sendResetEmail(to: string, name: string, resetLink: string, expiresAt: Date): Promise<void> {
    const subject = 'Reset your MindBloom password';
    const text = `Hi ${name || 'there'},\n\nWe received a request to reset your MindBloom password. Click the link below to set a new password. This link expires at ${expiresAt.toUTCString()}.\n\n${resetLink}\n\nIf you did not request this, you can safely ignore this email.`;
    const body = `
            <h2 style="margin:0 0 10px; font-size:20px; color:#f8fafc;">Reset your MindBloom password</h2>
            <p style="margin:0 0 12px; line-height:1.6;">Hi {{name}},</p>
            <p style="margin:0 0 16px; line-height:1.6;">We received a request to reset your MindBloom password. Click the button below to choose a new password. This link will expire at <strong>{{expiry}}</strong>.</p>
            <div style="text-align:center; margin:24px 0;">
              <a href="{{resetLink}}" style="display:inline-block; padding:12px 20px; background:#38bdf8; color:#0b1221; border-radius:10px; font-weight:700; text-decoration:none; box-shadow:0 10px 30px rgba(56,189,248,0.4);">
                Reset password
              </a>
            </div>
            <p style="margin:0 0 12px; line-height:1.6;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break:break-all; background:#0b1221; padding:12px; border-radius:10px; font-family:monospace; font-size:13px; color:#e2e8f0;">{{resetLink}}</p>
            <p style="margin:20px 0 0; color:#94a3b8; font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        `;

    await this.mailService.send({
      to,
      subject,
      text,
      template: {
        body,
        context: {
          name: name || 'there',
          expiry: expiresAt.toUTCString(),
          resetLink,
        },
      },
    });
  }
}
