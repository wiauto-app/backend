import { Repository } from "typeorm";
import { Injectable } from "../../shared/dependency-injectable/injectable";
import { MakeEntity } from "../catalog/makes/entities/make.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CatalogModelEntity } from "../catalog/models/entities/catalog-model.entity";
import { VersionEntity } from "../catalog/versions/entities/version.entity";
import {
  ApiVehicleData,
  ApiVehicleResponse,
} from "../clients/apivehiculo.client";
import { BadRequestException } from "@nestjs/common";
import { TractionEntity } from "../entities/traction.entity";
import { TransmissionType } from "../types/vehicle";
import { CatalogFuelTypeEntity } from "../catalog/fuel_types/entities/catalog-fuel-type.entity";

@Injectable()
export class CatalogReverseMatchService {
  constructor(
    @InjectRepository(MakeEntity)
    private readonly make_repository: Repository<MakeEntity>,
    @InjectRepository(CatalogModelEntity)
    private readonly model_repository: Repository<CatalogModelEntity>,
    @InjectRepository(VersionEntity)
    private readonly version_repository: Repository<VersionEntity>,
    @InjectRepository(TractionEntity)
    private readonly traction_repository: Repository<TractionEntity>,
    @InjectRepository(CatalogFuelTypeEntity)
    private readonly fuel_type_repository: Repository<CatalogFuelTypeEntity>,
  ) { }

  async execute(api_data: ApiVehicleData): Promise<ApiVehicleResponse> {
    const version_label = api_data.version?.trim();
    if (!version_label) {
      throw new BadRequestException("Version is required");
    }

    const registration_year = this.parse_registration_year(
      api_data.firstRegistrationDate,
    );
    if (registration_year == null) {
      throw new BadRequestException(
        "firstRegistrationDate is required to resolve the catalog year",
      );
    }

    const power_hp = this.parse_power_hp(api_data.powerHP);

    const make = await this.make_repository
      .createQueryBuilder("make")
      .where("unaccent(make.name) ILIKE unaccent(:name)", {
        name: api_data.brand.trim(),
      })
      .getOne();

    if (!make) {
      throw new BadRequestException("Make not found");
    }

    const model = await this.model_repository
      .createQueryBuilder("model")
      .where("model.make_id = :make_id", { make_id: make.id })
      .andWhere("unaccent(model.name) ILIKE unaccent(:name)", {
        name: api_data.model.trim(),
      })
      .getOne();

    if (!model) {
      throw new BadRequestException("Model not found");
    }

    const fuel_type = await this.fuel_type_repository
      .createQueryBuilder("fuel_type")
      .where("unaccent(fuel_type.name) ILIKE unaccent(:name)", {
        name: api_data.fuelType.trim(),
      })
      .getOne();

    if (!fuel_type) {
      throw new BadRequestException("Fuel type not found");
    }

    const version = await this.find_best_version({
      make_id: make.id,
      model_id: model.id,
      fuel_type_id: fuel_type.id,
      year: registration_year,
      version_label,
      power_hp,
    });

    if (!version) {
      throw new BadRequestException("Version not found");
    }

    const traction_id = await this.getTractionId(api_data.transmissionType);
    const transmission_type = this.getTransmissionType(api_data.gearboxType);

    return {
      version_id: version.id,
      catalog_make_id: version.make_id,
      catalog_model_id: version.model_id,
      catalog_year_id: version.year_id,
      power: power_hp,
      displacement: Number(api_data.engineCapacityLiters) * 1000,
      traction_id,
      transmission_type,
      vin: api_data.vin,
      license_plate: api_data.plate,
    };
  }

  /**
   * Match progresivo:
   * 1) make + model + year + fuel + nombre contiene version + cv (powerHP)
   * 2) sin cv
   * 3) solo make + model + year + fuel (el mejor por score de nombre/cv)
   */
  private async find_best_version(params: {
    make_id: number;
    model_id: number;
    fuel_type_id: number;
    year: number;
    version_label: string;
    power_hp: number | null;
  }): Promise<VersionEntity | null> {
    const base = () =>
      this.version_repository
        .createQueryBuilder("version")
        .innerJoin("version.year", "year")
        .where("version.make_id = :make_id", { make_id: params.make_id })
        .andWhere("version.model_id = :model_id", { model_id: params.model_id })
        .andWhere("version.fuel_type_id = :fuel_type_id", {
          fuel_type_id: params.fuel_type_id,
        })
        .andWhere("year.year = :year", { year: params.year });

    if (params.power_hp != null) {
      const with_label_and_power = await base()
        .andWhere("unaccent(version.name) ILIKE unaccent(:version_pattern)", {
          version_pattern: `%${params.version_label}%`,
        })
        .andWhere(
          "(unaccent(version.name) ILIKE unaccent(:power_cv) OR unaccent(version.name) ILIKE unaccent(:power_cv_spaced))",
          {
            power_cv: `%${params.power_hp}cv%`,
            power_cv_spaced: `%${params.power_hp} cv%`,
          },
        )
        .getMany();

      const picked = this.pick_best_version(
        with_label_and_power,
        params.version_label,
        params.power_hp,
      );
      if (picked) {
        return picked;
      }
    }

    const with_label = await base()
      .andWhere("unaccent(version.name) ILIKE unaccent(:version_pattern)", {
        version_pattern: `%${params.version_label}%`,
      })
      .getMany();

    const picked_label = this.pick_best_version(
      with_label,
      params.version_label,
      params.power_hp,
    );
    if (picked_label) {
      return picked_label;
    }

    const fallback = await base().getMany();
    return this.pick_best_version(
      fallback,
      params.version_label,
      params.power_hp,
    );
  }

  private pick_best_version(
    candidates: VersionEntity[],
    version_label: string,
    power_hp: number | null,
  ): VersionEntity | null {
    if (candidates.length === 0) {
      return null;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    const normalized_label = this.normalize_text(version_label);
    const label_tokens = normalized_label
      .split(/\s+/)
      .filter((token) => token.length > 0);

    const scored = candidates.map((candidate) => {
      const name = this.normalize_text(candidate.name);
      let score = 0;

      if (name.includes(normalized_label)) {
        score += 50;
      }

      for (const token of label_tokens) {
        if (name.includes(token)) {
          score += 10;
        }
      }

      if (power_hp != null) {
        if (
          name.includes(`${power_hp}cv`) ||
          name.includes(`${power_hp} cv`)
        ) {
          score += 40;
        }
      }

      // Preferir nombres más cortos a igualdad de score (menos ruido de acabado).
      score -= Math.min(candidate.name.length, 80) * 0.05;

      return { candidate, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.candidate ?? null;
  }

  private parse_registration_year(value: string | null | undefined): number | null {
    if (!value?.trim()) {
      return null;
    }

    const year = Number(value.trim().slice(0, 4));
    if (!Number.isFinite(year) || year < 1900 || year > 2100) {
      return null;
    }

    return year;
  }

  private parse_power_hp(value: string | null | undefined): number | null {
    if (!value?.trim()) {
      return null;
    }

    const power = Number(value.trim().replace(",", "."));
    if (!Number.isFinite(power) || power <= 0) {
      return null;
    }

    return Math.round(power);
  }

  private normalize_text(value: string): string {
    return value
      .normalize("NFD")
      .replaceAll(/\p{M}/gu, "")
      .toLowerCase()
      .trim();
  }

  async getTractionId(traction_type: string) {
    const mapping = {
      FWD: "traccion-delantera",
      RWD: "traccion-trasera",
      AWD: "traccion-integral",
    };
    const slug = mapping[traction_type as keyof typeof mapping];
    const traction = await this.traction_repository.findOne({
      where: {
        slug,
      },
    });

    if (!traction) {
      throw new BadRequestException("Traction not found");
    }
    return traction.id;
  }

  getTransmissionType(transmission_type: string): TransmissionType {
    const normalized = transmission_type.trim().toLowerCase();

    if (normalized === "manual" || normalized === "sequential") {
      return "manual";
    }

    if (
      normalized === "automatic" ||
      normalized === "cvt" ||
      normalized === "automated_manual"
    ) {
      return "automatic";
    }

    throw new BadRequestException(
      `Tipo de transmisión desconocido: ${transmission_type}`,
    );
  }
}
