import { getEmailHead, getEmailHeader, getEmailFooter } from './emailConfig';

export type PurchaseRefundKind = 'product' | 'credits';

export interface PurchaseRefundEmailProps {
  userName: string;
  kind: PurchaseRefundKind;
  itemLabel: string;
  ctaUrl: string;
  logoUrl?: string;
}

function body(kind: PurchaseRefundKind, itemLabel: string): string {
  if (kind === 'credits') {
    return `We refunded your purchase and removed <strong>${itemLabel}</strong> from your balance. The payment provider will return the funds to your original payment method (timing varies by bank).`;
  }
  return `We refunded your purchase of <strong>${itemLabel}</strong> and revoked access. The payment provider will return the funds to your original payment method (timing varies by bank).`;
}

export const purchaseRefundEmailTemplate = (
  props: PurchaseRefundEmailProps,
): string => `
<!DOCTYPE html>
<html>
  ${getEmailHead()}
  <body>
    <div class="container">
      <div class="box">
        ${getEmailHeader(props.logoUrl)}
        <p class="heading">Refund processed</p>
        <p class="paragraph">Hi ${props.userName},</p>
        <p class="paragraph">${body(props.kind, props.itemLabel)}</p>
        <a href="${props.ctaUrl}" class="button">Open account</a>
        <p class="paragraph">
          If you have questions, reply via in-app support — this address may not accept replies.
        </p>
        ${getEmailFooter()}
      </div>
    </div>
  </body>
</html>
`;
