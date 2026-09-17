import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NewsletterService } from "@/src/contexts/newsletter/services/newsletter.service";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";

const buildService = () => {
  const newsletter_repository = {
    findOne: vi.fn(),
    create: vi.fn((data: Record<string, unknown>) => data),
    save: vi.fn((data: Record<string, unknown>) =>
      Promise.resolve({ id: "sub-1", ...data }),
    ),
    preload: vi.fn(),
    createQueryBuilder: vi.fn(),
  };
  const user_repository = {
    createQueryBuilder: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawOne: vi.fn().mockResolvedValue(null),
    })),
    findOne: vi.fn(),
  };
  const outbound_mail_enqueue_service = {
    enqueue_newsletter_subscribed: vi.fn().mockResolvedValue(null),
  } as unknown as OutboundMailEnqueueService;

  const service = new NewsletterService(
    newsletter_repository as never,
    user_repository as never,
    outbound_mail_enqueue_service,
  );

  return { service, newsletter_repository, outbound_mail_enqueue_service };
};

describe("NewsletterService.subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("encola la confirmación de newsletter en un alta nueva", async () => {
    const { service, newsletter_repository, outbound_mail_enqueue_service } =
      buildService();
    newsletter_repository.findOne.mockResolvedValue(null);

    await service.subscribe({ email: "user@example.com" });

    expect(
      outbound_mail_enqueue_service.enqueue_newsletter_subscribed,
    ).toHaveBeenCalledTimes(1);
    expect(
      outbound_mail_enqueue_service.enqueue_newsletter_subscribed,
    ).toHaveBeenCalledWith({ to: "user@example.com" });
  });

  it("no encola confirmación al reclamar un perfil existente sin profile_id", async () => {
    const { service, newsletter_repository, outbound_mail_enqueue_service } =
      buildService();
    newsletter_repository.findOne.mockResolvedValue({
      id: "sub-1",
      email: "user@example.com",
      profile_id: null,
    });
    newsletter_repository.preload.mockResolvedValue(null);

    await expect(
      service.subscribe({ email: "user@example.com" }),
    ).rejects.toThrow(BadRequestException);

    expect(
      outbound_mail_enqueue_service.enqueue_newsletter_subscribed,
    ).not.toHaveBeenCalled();
  });

  it("no encola confirmación en suscripción duplicada", async () => {
    const { service, newsletter_repository, outbound_mail_enqueue_service } =
      buildService();
    newsletter_repository.findOne.mockResolvedValue({
      id: "sub-1",
      email: "user@example.com",
      profile_id: "profile-1",
    });

    await expect(
      service.subscribe({ email: "user@example.com" }),
    ).rejects.toThrow(BadRequestException);

    expect(
      outbound_mail_enqueue_service.enqueue_newsletter_subscribed,
    ).not.toHaveBeenCalled();
  });

  it("no propaga el error si falla el enqueue de confirmación", async () => {
    const { service, newsletter_repository, outbound_mail_enqueue_service } =
      buildService();
    newsletter_repository.findOne.mockResolvedValue(null);
    (
      outbound_mail_enqueue_service.enqueue_newsletter_subscribed as ReturnType<
        typeof vi.fn
      >
    ).mockRejectedValue(new Error("queue down"));

    const result = await service.subscribe({ email: "user@example.com" });

    expect(result).not.toBeNull();
    expect(newsletter_repository.save).toHaveBeenCalled();
  });
});
