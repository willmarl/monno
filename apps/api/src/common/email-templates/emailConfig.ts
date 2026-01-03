/**
 * Centralized Email Configuration and Styling
 *
 * This file contains shared styling, branding, and configuration for all email templates.
 * Update these values to maintain consistency across all emails.
 */

export const emailConfig = {
  // App branding
  appName: 'Monno',
  appUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  faviconUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/favicon.ico`,
  supportEmail: process.env.RESEND_FROM_EMAIL || 'support@monno.com',

  // Colors
  colors: {
    primary: '#667eea', // Primary action color
    success: '#28a745', // Success/verification
    danger: '#d32f2f', // Warning/security alerts
    warning: '#ffc107', // Caution
    text: '#1d1c1d', // Main text
    textSecondary: '#525f7f', // Secondary text
    textMuted: '#898989', // Muted text
    background: '#f3f3f5', // Email background
    white: '#ffffff', // White
    border: '#e5e5e5', // Border color
    alertBg: '#fff3cd', // Alert background
    dangerBg: '#ffebee', // Danger background
  },

  // Font stack
  fontStack:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',

  // Common styles
  baseStyles: `
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      line-height: 1.6;
      color: #1d1c1d;
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
    .header {
      text-align: center;
      border-bottom: 2px solid #667eea;
      padding: 16px 0 24px 0;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      margin: 0;
      display: inline-block;
      letter-spacing: 0.5px;
    }
    .heading {
      color: #1d1c1d;
      font-size: 32px;
      font-weight: bold;
      line-height: 42px;
      text-align: center;
      margin: 24px 0;
    }
    .subheading {
      color: #1d1c1d;
      font-size: 18px;
      font-weight: 600;
      line-height: 24px;
      text-align: left;
      margin: 16px 0 12px 0;
    }
    .paragraph {
      color: #525f7f;
      font-size: 16px;
      line-height: 24px;
      text-align: left;
      margin: 16px 0;
    }
    .button {
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
    .button-primary {
      background-color: #667eea;
    }
    .button-success {
      background-color: #28a745;
    }
    .button-danger {
      background-color: #d32f2f;
    }
    .hr {
      border: none;
      border-color: #e5e5e5;
      border-top: 1px solid #e5e5e5;
      margin: 20px 0;
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
    .warning-box {
      background-color: #ffebee;
      border: 1px solid #ef5350;
      border-radius: 4px;
      color: #c62828;
      font-size: 14px;
      line-height: 20px;
      padding: 12px;
      margin: 16px 0;
    }
    .info-box {
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
      width: 120px;
    }
    .detail-value {
      color: #525f7f;
      font-size: 14px;
      margin: 0;
      display: inline-block;
    }
    .list-item {
      color: #525f7f;
      font-size: 16px;
      line-height: 24px;
      text-align: left;
      margin: 8px 0;
      padding-left: 8px;
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
    .footer-divider {
      border-top: 1px solid #e5e5e5;
      margin-top: 32px;
      padding-top: 24px;
    }
    .link-text {
      color: #667eea;
      font-size: 12px;
      line-height: 16px;
      text-align: left;
      margin: 8px 0;
      word-break: break-all;
      background-color: #f9f9f9;
      padding: 10px;
      border-radius: 4px;
    }
  `,
};

/**
 * Generate the HTML head section with consistent styling
 */
export const getEmailHead = (additionalStyles = ''): string => {
  return `
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${emailConfig.baseStyles}
        ${additionalStyles}
      </style>
    </head>
  `;
};

/**
 * Generate the email header with app branding and logo
 */
export const getEmailHeader = (): string => {
  return `
    <div class="header">
      <div style="text-align: center; margin-bottom: 16px;">
        <!-- SVG Logo Placeholder -->
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
          <rect width="48" height="48" rx="12" fill="#667eea"/>
          <circle cx="24" cy="18" r="6" fill="#ffffff"/>
          <path d="M16 32C16 27.58 19.58 24 24 24C28.42 24 32 27.58 32 32" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p class="logo">${emailConfig.appName}</p>
    </div>
  `;
};

/**
 * Generate the email footer with copyright and support info
 */
export const getEmailFooter = (): string => {
  return `
    <div class="footer-divider">
      <p class="footer-text">© ${new Date().getFullYear()} ${emailConfig.appName}. All rights reserved.</p>
      <p class="footer-text">
        Questions? <a href="mailto:${emailConfig.supportEmail}" style="color: #667eea; text-decoration: none;">${emailConfig.supportEmail}</a>
      </p>
    </div>
  `;
};
