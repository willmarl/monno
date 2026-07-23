/**
 * Email Templates — plain HTML string generators.
 *
 * Full steps (template + enqueue + what NOT to change in the worker):
 *   docs/email-job.md
 *
 * Quick add: new .ts here → export below → QueueService.enqueueEmail(..., 'kebab-name').
 * Job name is always "send-email"; templateName is for logs only.
 */

export { welcomeEmailTemplate, type WelcomeEmailProps } from './Welcome.js';
export { verifyEmailTemplate, type VerifyEmailProps } from './VerifyEmail.js';
export {
  suspiciousLoginTemplate,
  type SuspiciousLoginProps,
} from './SuspiciousLogin.js';
export {
  resetPasswordTemplate,
  type ResetPasswordProps,
} from './ResetPassword.js';
export {
  engagementNotificationEmailTemplate,
  type EngagementNotificationEmailProps,
} from './EngagementNotification.js';
export {
  accountStatusChangedEmailTemplate,
  type AccountStatusChangedEmailProps,
} from './AccountStatusChanged.js';
export {
  purchaseReceiptEmailTemplate,
  type PurchaseReceiptEmailProps,
  type PurchaseReceiptKind,
} from './PurchaseReceipt.js';
export {
  purchaseRefundEmailTemplate,
  type PurchaseRefundEmailProps,
  type PurchaseRefundKind,
} from './PurchaseRefund.js';
