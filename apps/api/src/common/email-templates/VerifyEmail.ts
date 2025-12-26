export interface VerifyEmailProps {
  userName: string;
  verificationLink: string;
}

export const verifyEmailTemplate = (props: VerifyEmailProps): string => `
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
      .heading {
        color: #1d1c1d;
        font-size: 32px;
        font-weight: bold;
        line-height: 42px;
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
      .button {
        background-color: #28a745;
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
      .link-text {
        color: #667eea;
        font-size: 12px;
        line-height: 16px;
        text-align: left;
        margin: 8px 0;
        word-break: break-all;
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
        <p class="heading">Verify Your Email</p>
        <p class="paragraph">Hi ${props.userName},</p>
        <p class="paragraph">
          Thank you for signing up! Please verify your email address by clicking the button below.
        </p>
        <a href="${props.verificationLink}" class="button">Verify Email Address</a>
        <hr class="hr" />
        <p class="paragraph">
          This link expires in 24 hours. If you didn't create this account, please ignore this email.
        </p>
        <p class="footer-text">Or copy and paste this link in your browser:</p>
        <p class="link-text">${props.verificationLink}</p>
      </div>
      <div class="footer">
        <p class="footer-text">© 2025 Your App. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;
