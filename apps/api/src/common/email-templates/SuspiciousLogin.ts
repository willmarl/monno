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
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f3f3f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px 0 48px;
        margin-bottom: 64px;
      }
      .box {
        padding: 0 48px;
      }
      .alert-heading {
        color: #d32f2f;
        font-size: 28px;
        font-weight: bold;
        line-height: 36px;
        text-align: center;
        margin: 24px 0;
      }
      .paragraph {
        color: #525f7f;
        font-size: 16px;
        line-height: 24px;
        text-align: left;
        margin: 16px 0;
      }
      .alert-box {
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 4px;
        padding: 16px;
        margin: 16px 0;
      }
      .alert-text {
        color: #856404;
        font-size: 14px;
        line-height: 20px;
        margin: 0;
      }
      .subheading {
        color: #1d1c1d;
        font-size: 18px;
        font-weight: 600;
        line-height: 24px;
        text-align: left;
        margin: 16px 0 12px 0;
      }
      .details-box {
        background-color: #f9f9f9;
        border: 1px solid #e5e5e5;
        border-radius: 4px;
        padding: 16px;
        margin: 12px 0;
      }
      .detail-row {
        margin-bottom: 12px;
      }
      .detail-label {
        color: #1d1c1d;
        font-size: 14px;
        font-weight: 600;
        margin: 0;
        display: inline-block;
        width: 100px;
      }
      .detail-value {
        color: #525f7f;
        font-size: 14px;
        margin: 0;
        display: inline-block;
      }
      .button {
        background-color: #d32f2f;
        border-radius: 4px;
        color: #fff;
        font-size: 16px;
        font-weight: bold;
        text-decoration: none;
        text-align: center;
        display: inline-block;
        padding: 12px 24px;
        margin: 24px 0;
        cursor: pointer;
      }
      .hr {
        border: none;
        border-color: #e5e5e5;
        border-top: 1px solid #e5e5e5;
        margin: 20px 0;
      }
      .warning-text {
        background-color: #ffebee;
        border: 1px solid #ef5350;
        border-radius: 4px;
        color: #c62828;
        font-size: 14px;
        line-height: 20px;
        padding: 12px;
        margin: 16px 0;
      }
      .footer {
        color: #898989;
        margin-top: 32px;
        margin-bottom: 32px;
      }
      .footer-text {
        color: #898989;
        font-size: 12px;
        line-height: 16px;
        text-align: center;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="box">
        <p class="alert-heading">🔐 Suspicious Login Attempt</p>
        <p class="paragraph">Hi ${props.userName},</p>
        <div class="alert-box">
          <p class="alert-text">
            We detected a login to your account from a new device. Please review the details below.
          </p>
        </div>
        <p class="subheading">Login Details:</p>
        <div class="details-box">
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
        <a href="${props.sessionsUrl}" class="button">Review Your Sessions</a>
        <hr class="hr" />
        <p class="warning-text">
          ⚠️ If you didn't authorize this login, please change your password immediately and review your account security.
        </p>
      </div>
      <div class="footer">
        <p class="footer-text">© 2025 Your App. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;
