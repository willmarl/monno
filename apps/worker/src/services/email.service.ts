import { Resend } from "resend";

/**
 * Email Service for Worker
 * Handles sending emails via Resend
 * Note: This is a standalone version for the worker app
 */
export class EmailService {
  private readonly resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "[Email] RESEND_API_KEY not found in environment variables. Email sending will fail."
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
      const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@resend.dev";
      const fromName = process.env.RESEND_FROM_NAME || "Your App";

      console.log(`[Email] Sending email...`);
      console.log(`[Email]   From: ${fromName} <${fromEmail}>`);
      console.log(`[Email]   To: ${to}`);
      console.log(`[Email]   Subject: ${subject}`);
      console.log(
        `[Email]   API Key: ${
          process.env.RESEND_API_KEY ? "✓ Present" : "✗ Missing"
        }`
      );

      const response = await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`[Email] Response:`, JSON.stringify(response, null, 2));

      if (response.error) {
        console.error(`[Email] ✗ Resend error:`, response.error);
        throw new Error(response.error.message);
      }

      console.log(`[Email] ✓ Email sent to ${to} (ID: ${response.data?.id})`);
    } catch (error) {
      console.error(`[Email] ✗ Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
