export type MailTemplateData = Record<string, unknown>;

type MailTemplateDef = {
  subject: string;
  render: (data: MailTemplateData) => string;
};

// One entry per template - `subject` and `render` are the only two things
// MailService needs, so a template's copy can change here without
// touching send logic at all. `data` is loosely typed on purpose (kept a
// plain Record instead of a per-template generic) since this is scaffolding
// with no real templates yet - tighten it once actual ones exist.
export const MailTemplates = {
  otp: {
    subject: 'Your verification code',
    render: (data) => `Your verification code is ${data.code}. It expires in 10 minutes.`,
  },
  welcome: {
    subject: 'Welcome!',
    render: (data) => `Hi ${data.name}, welcome aboard!`,
  },
} satisfies Record<string, MailTemplateDef>;

export type MailTemplateName = keyof typeof MailTemplates;
