import { getEmailHead, getEmailHeader, getEmailFooter } from './emailConfig';

export const resetPasswordTemplate = ({
  userName,
  resetLink,
}: {
  userName: string;
  resetLink: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html>
      ${getEmailHead()}
      <body>
        <div class="container">
          <div class="box">
            ${getEmailHeader()}
            <p class="heading">Reset Your Password</p>
            <p class="paragraph">Hi ${userName},</p>
            <p class="paragraph">We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <p class="paragraph">To reset your password, click the button below:</p>
            <a href="${resetLink}" class="button button-primary">Reset Password</a>
            <hr class="hr" />
            <p class="paragraph">Or copy and paste this link in your browser:</p>
            <p class="link-text">${resetLink}</p>
            <p class="paragraph" style="font-size: 14px; color: #898989;">
              This link will expire in 1 hour.
            </p>
            <p class="warning-box">
              ⚠️ If you did not request a password reset, please ignore this email or contact support immediately.
            </p>
            ${getEmailFooter()}
          </div>
        </div>
      </body>
    </html>
  `;
};
