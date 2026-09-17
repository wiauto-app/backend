import { describe, expect, it, vi } from "vitest";

import { OutboundMailProcessor } from "@/src/contexts/shared/mail/queues/outbound-mail.processor";
import { OUTBOUND_MAIL_JOB_NEWSLETTER_SUBSCRIBED } from "@/src/contexts/shared/mail/queues/outbound-mail.queue.constants";
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
