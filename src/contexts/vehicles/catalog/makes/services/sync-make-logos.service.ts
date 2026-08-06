import { Injectable, Logger } from "@nestjs/common";
import sharp from "sharp";

import { STORAGE_DIRECTORIES } from "@/src/contexts/shared/file/storage-directories";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { WikimediaCommonsClient } from "../clients/wikimedia-commons.client";
import { resolveMakeLogoSearchQuery } from "../constants/make-logo-search-aliases";
import { MakeNotFoundException } from "../exceptions/make-not-found.exception";
import { TypeormMakeRepository } from "../repositories/typeorm.make-repository";
import { Make } from "../types/make";

const LOGO_SIZE = 256;

export interface SyncMakeLogosInput {
  make_id?: number;
  force?: boolean;
}

export interface SyncMakeLogosFailedItem {
  make_id: number;
  name: string;
  reason: string;
}

export interface SyncMakeLogosResult {
  processed: number;
  updated: number;
  skipped: number;
  failed: SyncMakeLogosFailedItem[];
}

@Injectable()
export class SyncMakeLogosService {
  private readonly logger = new Logger(SyncMakeLogosService.name);

  constructor(
    private readonly makes_repository: TypeormMakeRepository,
    private readonly wikimedia_client: WikimediaCommonsClient,
    private readonly objectStorageService: ObjectStorageService,
  ) {}

  async execute(input: SyncMakeLogosInput = {}): Promise<SyncMakeLogosResult> {
    const force = input.force === true;
    const makes = await this.makes_repository.findAllForLogoSync({
      make_id: input.make_id,
    });

    if (input.make_id != null && makes.length === 0) {
      throw new MakeNotFoundException(input.make_id);
    }

    const result: SyncMakeLogosResult = {
      processed: 0,
      updated: 0,
      skipped: 0,
      failed: [],
    };

    for (let index = 0; index < makes.length; index += 1) {
      const make = makes[index];
      const primitives = make.toPrimitives();
      const make_id = primitives.id;
      if (make_id === undefined) {
        continue;
      }

      result.processed += 1;

      const has_image =
        typeof primitives.image_url === "string" &&
        primitives.image_url.trim().length > 0;

      if (has_image && !force) {
        result.skipped += 1;
        continue;
      }

      try {
        await this.sync_one_make(make);
        result.updated += 1;
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Error desconocido";
        this.logger.warn(
          `Logo sync falló para make ${make_id} (${primitives.name}): ${reason}`,
        );
        result.failed.push({
          make_id,
          name: primitives.name,
          reason,
        });
      }

      if (index < makes.length - 1) {
        await this.wikimedia_client.delayBetweenRequests();
      }
    }

    return result;
  }

  private async sync_one_make(make: Make): Promise<void> {
    const primitives = make.toPrimitives();
    const make_id = primitives.id;
    if (make_id === undefined) {
      throw new Error("La marca no tiene id");
    }

    const search_query = resolveMakeLogoSearchQuery(primitives.name);
    const search_result =
      await this.wikimedia_client.searchSvgLogo(search_query);

    if (!search_result) {
      throw new Error(
        `No se encontró un SVG usable en Wikimedia para "${search_query}"`,
      );
    }

    const svg_buffer = await this.wikimedia_client.downloadBytes(
      search_result.url,
    );

    const webp_buffer = await sharp(svg_buffer)
      .resize(LOGO_SIZE, LOGO_SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 90 })
      .toBuffer();

    const object_key = `makes/${primitives.slug}.webp`;
    await this.objectStorageService.putObjectToBucket(
      STORAGE_DIRECTORIES.FILES,
      object_key,
      webp_buffer,
      "image/webp",
    );

    const image_url = `/${STORAGE_DIRECTORIES.FILES}/${object_key}`;
    await this.makes_repository.save(
      make.update({ image_url }),
    );
  }
}
