import { getEmailHead, getEmailHeader, getEmailFooter } from './emailConfig';

export interface VerifyEmailProps {
  userName: string;
  verificationLink: string;
}

export const verifyEmailTemplate = (props: VerifyEmailProps): string => `
<!DOCTYPE html>
<html>
  ${getEmailHead()}
  <body>
    <div class="container">
      <div class="box">
        ${getEmailHeader()}
        <p class="heading">Verify Your Email</p>
        <p class="paragraph">Hi ${props.userName},</p>
        <p class="paragraph">
          Thank you for signing up! Please verify your email address by clicking the button below.
        </p>
        <a href="${props.verificationLink}" class="button button-success">Verify Email Address</a>
        <hr class="hr" />
        <p class="paragraph">
          This link expires in 24 hours. If you didn't create this account, please ignore this email.
        </p>
        <p class="paragraph">Or copy and paste this link in your browser:</p>
        <p class="link-text">${props.verificationLink}</p>
        ${getEmailFooter()}
      </div>
    </div>
  </body>
</html>
`;
