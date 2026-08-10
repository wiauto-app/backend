import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "@/src/contexts/users/entities/user.entity";

import { DEFAULT_NEWS_CATEGORY_SLUGS } from "../constants/default-news-category-slugs";
import { SubscribeNewsletterHttpDto } from "../dto/subscribe-newsletter.http-dto";
import { UpdateNewsletterPreferencesHttpDto } from "../dto/update-newsletter-preferences.http-dto";
import { NewsletterSubscriptionEntity } from "../entities/newsletter-subscription.entity";

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscriptionEntity)
    private readonly newsletter_repository: Repository<NewsletterSubscriptionEntity>,
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
  ) {}

  async subscribe(
    dto: SubscribeNewsletterHttpDto,
  ): Promise<NewsletterSubscriptionEntity> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.newsletter_repository.findOne({
      where: { email },
    });

    if (existing) {
      if (!existing.profile_id) {
        const profile_id = await this.findProfileIdByEmail(email);
        if (profile_id) {
          const claimed = await this.newsletter_repository.preload({
            id: existing.id,
            profile_id,
          });
          if (claimed) {
            return this.newsletter_repository.save(claimed);
          }
        }
      }
      throw new BadRequestException("El correo electrónico ya está suscrito");
    }

    const profile_id = await this.findProfileIdByEmail(email);
    const created = this.newsletter_repository.create({
      email,
      profile_id,
      enabled_category_slugs: [...DEFAULT_NEWS_CATEGORY_SLUGS],
      channel_email: true,
      channel_push: true,
      channel_in_app: true,
      channel_whatsapp: false,
      channel_sms: false,
    });

    return this.newsletter_repository.save(created);
  }

  async claimByEmail(email: string, profile_id: string): Promise<number> {
    const normalized = email.trim().toLowerCase();
    const result = await this.newsletter_repository
      .createQueryBuilder()
      .update(NewsletterSubscriptionEntity)
      .set({ profile_id })
      .where("profile_id IS NULL")
      .andWhere("LOWER(email) = LOWER(:email)", { email: normalized })
      .execute();

    return result.affected ?? 0;
  }

  async getOrCreateForProfile(
    profile_id: string,
  ): Promise<NewsletterSubscriptionEntity> {
    const by_profile = await this.newsletter_repository.findOne({
      where: { profile_id },
    });
    if (by_profile) {
      return by_profile;
    }

    const email = await this.findEmailByProfileId(profile_id);
    if (!email) {
      throw new NotFoundException(
        "No se encontró el correo del perfil para la newsletter",
      );
    }

    const by_email = await this.newsletter_repository.findOne({
      where: { email },
    });
    if (by_email) {
      if (by_email.profile_id !== profile_id) {
        const linked = await this.newsletter_repository.preload({
          id: by_email.id,
          profile_id,
        });
        if (linked) {
          return this.newsletter_repository.save(linked);
        }
      }
      return by_email;
    }

    const created = this.newsletter_repository.create({
      email,
      profile_id,
      enabled_category_slugs: [...DEFAULT_NEWS_CATEGORY_SLUGS],
      channel_email: true,
      channel_push: true,
      channel_in_app: true,
      channel_whatsapp: false,
      channel_sms: false,
    });

    return this.newsletter_repository.save(created);
  }

  async updatePreferences(
    profile_id: string,
    patch: UpdateNewsletterPreferencesHttpDto,
  ): Promise<NewsletterSubscriptionEntity> {
    const has_updates = Object.values(patch).some((value) => value !== undefined);
    if (!has_updates) {
      throw new BadRequestException(
        "Debes enviar al menos un campo para actualizar",
      );
    }

    const subscription = await this.getOrCreateForProfile(profile_id);
    const updated = await this.newsletter_repository.preload({
      id: subscription.id,
      ...(patch.enabled_category_slugs !== undefined
        ? {
            enabled_category_slugs: patch.enabled_category_slugs.map((slug) =>
              slug.trim().toLowerCase(),
            ),
          }
        : {}),
      ...(patch.channel_email !== undefined
        ? { channel_email: patch.channel_email }
        : {}),
      ...(patch.channel_push !== undefined
        ? { channel_push: patch.channel_push }
        : {}),
      ...(patch.channel_sms !== undefined
        ? { channel_sms: patch.channel_sms }
        : {}),
      ...(patch.channel_in_app !== undefined
        ? { channel_in_app: patch.channel_in_app }
        : {}),
      ...(patch.channel_whatsapp !== undefined
        ? { channel_whatsapp: patch.channel_whatsapp }
        : {}),
    });

    if (!updated) {
      throw new NotFoundException("Suscripción de newsletter no encontrada");
    }

    return this.newsletter_repository.save(updated);
  }

  async findByCategorySlug(
    slug: string,
  ): Promise<NewsletterSubscriptionEntity[]> {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return this.newsletter_repository
      .createQueryBuilder("subscription")
      .where(":slug = ANY(subscription.enabled_category_slugs)", {
        slug: normalized,
      })
      .getMany();
  }

  private async findProfileIdByEmail(email: string): Promise<string | null> {
    const user = await this.user_repository
      .createQueryBuilder("user")
      .select("user.id", "id")
      .where("LOWER(user.email) = LOWER(:email)", { email })
      .getRawOne<{ id: string }>();
    return user?.id ?? null;
  }

  private async findEmailByProfileId(
    profile_id: string,
  ): Promise<string | null> {
    const user = await this.user_repository.findOne({
      select: { email: true },
      where: { id: profile_id },
    });
    return user?.email?.trim().toLowerCase() ?? null;
  }
}
