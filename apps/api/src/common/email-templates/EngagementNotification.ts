import { getEmailHead, getEmailHeader, getEmailFooter } from './emailConfig';

export interface EngagementNotificationEmailProps {
  recipientName: string;
  actorName: string;
  actionLabel: string;
  targetLabel: string;
  targetUrl: string;
  logoUrl?: string;
}

export const engagementNotificationEmailTemplate = (
  props: EngagementNotificationEmailProps,
): string => `
<!DOCTYPE html>
<html>
  ${getEmailHead()}
  <body>
    <div class="container">
      <div class="box">
        ${getEmailHeader(props.logoUrl)}
        <p class="heading">Hi ${props.recipientName},</p>
        <p class="paragraph">
          <strong>${props.actorName}</strong> ${props.actionLabel} your ${props.targetLabel}.
        </p>
        <a href="${props.targetUrl}" class="button">View</a>
        <hr class="hr" />
        <p class="paragraph">
          You can manage notification emails in your account settings.
        </p>
        ${getEmailFooter()}
      </div>
    </div>
  </body>
</html>
`;
