export interface WelcomeEmailProps {
  userName: string;
  accountUrl: string;
}

export const welcomeEmailTemplate = (props: WelcomeEmailProps): string => `
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
      .subheading {
        color: #1d1c1d;
        font-size: 20px;
        font-weight: 600;
        line-height: 28px;
        text-align: left;
        margin: 16px 0 8px 0;
      }
      .list-item {
        color: #525f7f;
        font-size: 16px;
        line-height: 24px;
        text-align: left;
        margin: 8px 0;
        padding-left: 8px;
      }
      .button {
        background-color: #667eea;
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
        <p class="heading">Welcome ${props.userName}! 🎉</p>
        <p class="paragraph">
          We're excited to have you on board. Your account has been successfully created and you're all set to start using our app!
        </p>
        <a href="${props.accountUrl}" class="button">Go to Your Account</a>
        <hr class="hr" />
        <p class="subheading">Here's what you can do:</p>
        <p class="list-item">✨ Create and manage posts</p>
        <p class="list-item">❤️ Like and interact with content</p>
        <p class="list-item">👥 Connect with other users</p>
        <p class="list-item">🔐 Manage your account and sessions</p>
        <hr class="hr" />
        <p class="paragraph">
          If you have any questions, feel free to reach out to our support team.
        </p>
        <p class="paragraph">Happy exploring!</p>
      </div>
      <div class="footer">
        <p class="footer-text">© 2025 Your App. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;
