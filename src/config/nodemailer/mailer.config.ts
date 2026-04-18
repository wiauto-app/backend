import { MailerOptions } from '@nestjs-modules/mailer';

import { envs } from '@/src/common/envs';

export const MailerConfig: MailerOptions = {
  transport: {
    host: envs.MAIL_HOST,
    port: envs.MAIL_PORT,
    secure: envs.MAIL_PORT === 465,
    auth: {
      user: envs.MAIL_USER,
      pass: envs.MAIL_PASSWORD,
    },
  },
  defaults: {
    from: envs.MAIL_FROM,
  },
};
