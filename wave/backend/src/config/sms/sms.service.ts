import { Injectable, Logger } from '@nestjs/common';
import { SmsTemplateData, SmsTemplateName, SmsTemplates } from './sms.templates.js';

// Stubbed until a real provider (Twilio/MSG91/...) + SMS_* env vars are
// wired in - see mail.service.ts's own comment, same convention.
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async send(to: string, template: SmsTemplateName, data: SmsTemplateData): Promise<void> {
    const body = SmsTemplates[template].render(data);
    this.logger.warn(`SmsService.send is a stub - would send to ${to}: ${body}`);
  }
}
