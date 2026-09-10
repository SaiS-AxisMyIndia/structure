export type SmsTemplateData = Record<string, unknown>;

type SmsTemplateDef = {
  render: (data: SmsTemplateData) => string;
};

// Same shape/convention as mail.templates.ts, minus `subject` - an SMS is
// just a body.
export const SmsTemplates = {
  otp: {
    render: (data) => `${data.code} is your verification code. Do not share it with anyone.`,
  },
} satisfies Record<string, SmsTemplateDef>;

export type SmsTemplateName = keyof typeof SmsTemplates;
