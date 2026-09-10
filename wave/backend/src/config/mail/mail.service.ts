import { Injectable, Logger } from '@nestjs/common';
import { MailTemplateData, MailTemplateName, MailTemplates } from './mail.templates.js';
import { FeaturesConfig } from '../features.config.js';

// Stubbed until a real provider (nodemailer/SES/SendGrid/...) + MAIL_* env
// vars are wired in - a service should still call this today so nothing
// else needs to change once it's real, only this file's body does.
// FeaturesConfig.mailer (MAILER_FROM) is the "from" address the real
// provider will send as.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async send(to: string, template: MailTemplateName, data: MailTemplateData): Promise<void> {
    const { subject, render } = MailTemplates[template];
    const body = render(data);
    this.logger.warn(`MailService.send is a stub - would send "${subject}" from ${FeaturesConfig.mailer} to ${to}: ${body}`);
  }
}
