import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

/**
 * Email Service - Handles sending emails via Resend
 * This is used by both:
 * - API endpoints (for synchronous email sending)
 * - Worker jobs (for asynchronous email sending)
 */
@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not found in environment variables. Email sending will fail.',
      );
    }
    this.resend = new Resend(apiKey);
  }

  /**
   * Send an email via Resend
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param htmlContent - Email HTML content
   * @throws Error if email sending fails
   */
  async send(to: string, subject: string, htmlContent: string): Promise<void> {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev';
      const fromName = process.env.RESEND_FROM_NAME || 'Your App';

      const response = await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        html: htmlContent,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      this.logger.log(`✓ Email sent to ${to} (ID: ${response.data?.id})`);
    } catch (error) {
      this.logger.error(`✗ Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
