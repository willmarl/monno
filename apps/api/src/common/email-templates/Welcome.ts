import { getEmailHead, getEmailHeader, getEmailFooter } from './emailConfig';

export interface WelcomeEmailProps {
  userName: string;
  accountUrl: string;
  logoUrl?: string;
}

export const welcomeEmailTemplate = (props: WelcomeEmailProps): string => `
<!DOCTYPE html>
<html>
  ${getEmailHead()}
  <body>
    <div class="container">
      <div class="box">
        ${getEmailHeader(props.logoUrl)}
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
        ${getEmailFooter()}
      </div>
    </div>
  </body>
</html>
`;
