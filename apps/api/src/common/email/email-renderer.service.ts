import { Injectable, Logger } from '@nestjs/common';

/**
 * Email Renderer Service
 * Handles rendering React Email components to HTML
 */
@Injectable()
export class EmailRendererService {
  private readonly logger = new Logger(EmailRendererService.name);

  /**
   * Return HTML string as-is (no rendering needed for vanilla HTML)
   * @param html - HTML string
   * @returns HTML string
   */
  async render(html: string): Promise<string> {
    try {
      if (!html || typeof html !== 'string') {
        throw new Error('Invalid HTML content provided');
      }
      return html;
    } catch (error) {
      this.logger.error('Failed to render email template:', error);
      throw error;
    }
  }
}
