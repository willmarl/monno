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
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Reset Your Password</h2>
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
            ${resetLink}
          </p>
          <p style="color: #666; font-size: 12px;">
            This link will expire in 1 hour.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you did not request a password reset, please ignore this email or contact support.
          </p>
        </div>
      </body>
    </html>
  `;
};
