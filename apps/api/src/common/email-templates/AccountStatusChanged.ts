import { getEmailHead, getEmailHeader, getEmailFooter } from './emailConfig';

export interface AccountStatusChangedEmailProps {
  userName: string;
  previousStatus: string;
  newStatus: string;
  reason?: string | null;
  expireAt?: string | null;
  supportUrl?: string;
  logoUrl?: string;
}

function statusHeadline(status: string): string {
  switch (status) {
    case 'SUSPENDED':
      return 'Your account has been suspended';
    case 'BANNED':
      return 'Your account has been banned';
    case 'DELETED':
      return 'Your account has been deleted';
    case 'ACTIVE':
      return 'Your account has been restored';
    default:
      return 'Your account status has changed';
  }
}

function statusBody(status: string): string {
  switch (status) {
    case 'SUSPENDED':
      return 'You will not be able to sign in until the suspension ends or an administrator restores access.';
    case 'BANNED':
      return 'You will not be able to sign in while this ban is in effect.';
    case 'DELETED':
      return 'Your account has been deactivated. Contact support if you believe this was a mistake.';
    case 'ACTIVE':
      return 'You can sign in again with your usual credentials.';
    default:
      return 'Please review the details below.';
  }
}

export const accountStatusChangedEmailTemplate = (
  props: AccountStatusChangedEmailProps,
): string => `
<!DOCTYPE html>
<html>
  ${getEmailHead()}
  <body>
    <div class="container">
      <div class="box">
        ${getEmailHeader(props.logoUrl)}
        <p class="heading">${statusHeadline(props.newStatus)}</p>
        <p class="paragraph">Hi ${props.userName},</p>
        <p class="paragraph">${statusBody(props.newStatus)}</p>
        <div class="info-box">
          <div class="detail-row">
            <span class="detail-label">Previous status:</span>
            <span class="detail-value">${props.previousStatus}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">New status:</span>
            <span class="detail-value">${props.newStatus}</span>
          </div>
          ${
            props.reason
              ? `<div class="detail-row">
            <span class="detail-label">Reason:</span>
            <span class="detail-value">${props.reason}</span>
          </div>`
              : ''
          }
          ${
            props.expireAt
              ? `<div class="detail-row">
            <span class="detail-label">Expires:</span>
            <span class="detail-value">${props.expireAt}</span>
          </div>`
              : ''
          }
        </div>
        ${
          props.supportUrl
            ? `<a href="${props.supportUrl}" class="button">Go to the site</a>`
            : ''
        }
        <hr class="hr" />
        ${getEmailFooter()}
      </div>
    </div>
  </body>
</html>
`;
