import { EmailService } from "../services/email.service";

/**
 * Handler for email jobs
 * Processes email jobs from the queue and sends them via Resend
 */
export async function handleEmailJob(data: {
  to: string;
  subject: string;
  htmlContent: string;
  templateName: string;
}): Promise<void> {
  console.log(
    `[Email Handler] Processing email job: ${data.templateName} to ${data.to}`
  );

  try {
    const emailService = new EmailService();
    await emailService.send(data.to, data.subject, data.htmlContent);
    console.log(
      `[Email Handler] ✓ Successfully sent ${data.templateName} email`
    );
  } catch (error) {
    console.error(`[Email Handler] ✗ Failed to send email:`, error);
    throw error;
  }
}
