import { getEmailHead, getEmailHeader, getEmailFooter } from './emailConfig';

export interface SuspiciousLoginProps {
  userName: string;
  deviceName: string;
  location: string;
  ipAddress: string;
  timestamp: string;
  sessionsUrl: string;
}

export const suspiciousLoginTemplate = (
  props: SuspiciousLoginProps,
): string => `
<!DOCTYPE html>
<html>
  ${getEmailHead()}
  <body>
    <div class="container">
      <div class="box">
        ${getEmailHeader()}
        <p class="heading" style="color: #d32f2f; margin-bottom: 20px;">🔐 Suspicious Login Attempt</p>
        <p class="paragraph">Hi ${props.userName},</p>
        <div class="alert-box">
          <p class="alert-text">
            We detected a login to your account from a new device. Please review the details below.
          </p>
        </div>
        <p class="subheading">Login Details:</p>
        <div class="info-box">
          <div class="detail-row">
            <span class="detail-label">Device:</span>
            <span class="detail-value">${props.deviceName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${props.location}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">IP Address:</span>
            <span class="detail-value">${props.ipAddress}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span class="detail-value">${props.timestamp}</span>
          </div>
        </div>
        <hr class="hr" />
        <p class="paragraph">
          If this was you, you can safely ignore this email. If you don't recognize this login, please review your active sessions immediately.
        </p>
        <a href="${props.sessionsUrl}" class="button button-danger">Review Your Sessions</a>
        <hr class="hr" />
        <p class="warning-box">
          ⚠️ If you didn't authorize this login, please change your password immediately and review your account security.
        </p>
        ${getEmailFooter()}
      </div>
    </div>
  </body>
</html>
`;
