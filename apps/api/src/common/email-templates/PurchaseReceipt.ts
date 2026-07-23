import { getEmailHead, getEmailHeader, getEmailFooter } from './emailConfig';

export type PurchaseReceiptKind = 'product' | 'credits' | 'subscription';

export interface PurchaseReceiptEmailProps {
  userName: string;
  kind: PurchaseReceiptKind;
  /** Human label: "Course A", "500 credits", "BASIC plan" */
  itemLabel: string;
  amountLabel?: string | null;
  ctaUrl: string;
  ctaLabel: string;
  logoUrl?: string;
}

function headline(kind: PurchaseReceiptKind): string {
  switch (kind) {
    case 'subscription':
      return 'Subscription confirmed';
    case 'credits':
      return 'Credits added';
    default:
      return 'Purchase confirmed';
  }
}

function body(kind: PurchaseReceiptKind, itemLabel: string): string {
  switch (kind) {
    case 'subscription':
      return `Your <strong>${itemLabel}</strong> subscription is now active. Thanks for supporting us.`;
    case 'credits':
      return `We added <strong>${itemLabel}</strong> to your account. They're ready to use.`;
    default:
      return `You now have access to <strong>${itemLabel}</strong>.`;
  }
}

export const purchaseReceiptEmailTemplate = (
  props: PurchaseReceiptEmailProps,
): string => `
<!DOCTYPE html>
<html>
  ${getEmailHead()}
  <body>
    <div class="container">
      <div class="box">
        ${getEmailHeader(props.logoUrl)}
        <p class="heading">${headline(props.kind)}</p>
        <p class="paragraph">Hi ${props.userName},</p>
        <p class="paragraph">${body(props.kind, props.itemLabel)}</p>
        ${
          props.amountLabel
            ? `<div class="info-box">
          <div class="detail-row">
            <span class="detail-label">Amount:</span>
            <span class="detail-value">${props.amountLabel}</span>
          </div>
        </div>`
            : ''
        }
        <a href="${props.ctaUrl}" class="button">${props.ctaLabel}</a>
        <p class="paragraph">
          A payment receipt may also be available from our payment provider.
          This message is your confirmation from us.
        </p>
        ${getEmailFooter()}
      </div>
    </div>
  </body>
</html>
`;
