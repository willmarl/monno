/**
 * Email Templates
 *
 * Add new email templates here as plain HTML string generators.
 *
 * To add a new email template:
 * 1. Create a new .ts file in this folder (e.g., MyEmail.ts)
 * 2. Export a function that takes props and returns an HTML string
 * 3. In your service/controller, use it and enqueue:
 *
 *    const { welcomeEmailTemplate } = await import('./email-templates/Welcome.js');
 *    const htmlContent = welcomeEmailTemplate({ userName: 'John', accountUrl: '...' });
 *
 *    await this.queueService.enqueueEmail(
 *      'recipient@example.com',
 *      'Email Subject',
 *      htmlContent,
 *      'my-email'
 *    );
 *
 * That's it! The worker will automatically send it via Resend.
 */

export { welcomeEmailTemplate, type WelcomeEmailProps } from './Welcome.js';
export { verifyEmailTemplate, type VerifyEmailProps } from './VerifyEmail.js';
export {
  suspiciousLoginTemplate,
  type SuspiciousLoginProps,
} from './SuspiciousLogin.js';
