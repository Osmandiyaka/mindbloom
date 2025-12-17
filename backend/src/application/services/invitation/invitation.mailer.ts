import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../../infrastructure/mail/mail.service';

@Injectable()
export class InvitationMailer {
  private readonly frontendBase: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    const base = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    this.frontendBase = base.replace(/\/$/, '');
  }

  private buildInviteLink(token: string): string {
    return `${this.frontendBase}/auth/invite/${token}`;
  }

  async sendInvitation(to: string, token: string, roles: string[], expiresAt: Date): Promise<void> {
    const inviteLink = this.buildInviteLink(token);
    const subject = 'You have been invited to MindBloom';
    const roleList = roles.length ? roles.join(', ') : 'the assigned roles';
    const text = `You have been invited to MindBloom with ${roleList}. Use this link to join: ${inviteLink}. This link expires at ${expiresAt.toUTCString()}.`;

    const body = `
            <h2 style="margin:0 0 10px; font-size:20px; color:#f8fafc;">You're invited</h2>
            <p style="margin:0 0 12px; line-height:1.6;">You've been invited to join MindBloom${roles.length ? ` with the following role(s): <strong>{{roleList}}</strong>` : ''}.</p>
            <p style="margin:0 0 16px; line-height:1.6;">Accept the invitation before <strong>{{expiry}}</strong>.</p>
            <div style="text-align:center; margin:24px 0;">
              <a href="{{inviteLink}}" style="display:inline-block; padding:12px 20px; background:#22c55e; color:#0b1221; border-radius:10px; font-weight:700; text-decoration:none; box-shadow:0 10px 30px rgba(34,197,94,0.35);">
                Accept invitation
              </a>
            </div>
            <p style="margin:0 0 12px; line-height:1.6;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break:break-all; background:#0b1221; padding:12px; border-radius:10px; font-family:monospace; font-size:13px; color:#e2e8f0;">{{inviteLink}}</p>
            <p style="margin:20px 0 0; color:#94a3b8; font-size:13px;">If you weren't expecting this invite, you can ignore this email.</p>
        `;

    await this.mailService.send({
      to,
      subject,
      text,
      template: {
        body,
        context: {
          inviteLink,
          roleList,
          expiry: expiresAt.toUTCString(),
        },
      },
    });
  }
}
