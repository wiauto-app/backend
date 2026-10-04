import { describe, expect, it, vi } from "vitest";

import { OutboundMailProcessor } from "@/src/contexts/shared/mail/queues/outbound-mail.processor";
import {
  OUTBOUND_MAIL_JOB_NEW_USER_REGISTERED,
  OUTBOUND_MAIL_JOB_NEWSLETTER_SUBSCRIBED,
} from "@/src/contexts/shared/mail/queues/outbound-mail.queue.constants";
import { MailService } from "@/src/contexts/shared/mail/mail.service";

describe("OutboundMailProcessor — newsletter_subscribed", () => {
  it("delega en MailService.sendNewsletterSubscribedEmail con los datos del job", async () => {
    const mail_service = {
      sendNewsletterSubscribedEmail: vi.fn().mockResolvedValue(null),
    } as unknown as MailService;
    const processor = new OutboundMailProcessor(mail_service);

    await processor.process({
      name: OUTBOUND_MAIL_JOB_NEWSLETTER_SUBSCRIBED,
      data: { to: "user@example.com" },
    } as never);

    expect(mail_service.sendNewsletterSubscribedEmail).toHaveBeenCalledWith({
      to: "user@example.com",
    });
  });
});

describe("OutboundMailProcessor — new_user_registered", () => {
  it("delega en MailService.sendNewUserRegisteredEmail con los datos del job", async () => {
    const mail_service = {
      sendNewUserRegisteredEmail: vi.fn().mockResolvedValue(null),
    } as unknown as MailService;
    const processor = new OutboundMailProcessor(mail_service);
    const data = {
      to: "admin@wiauto.es",
      user: {
        email: "ana@example.com",
        name: "Ana",
        last_name: "García",
        phone_code: "+34",
        phone: "600000000",
      },
      created_at: "2026-10-03T22:00:00.000Z",
    };

    await processor.process({
      name: OUTBOUND_MAIL_JOB_NEW_USER_REGISTERED,
      data,
    } as never);

    expect(mail_service.sendNewUserRegisteredEmail).toHaveBeenCalledWith(data);
  });
});
