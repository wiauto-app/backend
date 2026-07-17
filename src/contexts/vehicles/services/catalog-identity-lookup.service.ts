import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { MakeEntity } from "@/src/contexts/vehicles/catalog/makes/entities/make.entity";
import { CatalogModelEntity } from "@/src/contexts/vehicles/catalog/models/entities/catalog-model.entity";
import { CatalogYearEntity } from "@/src/contexts/vehicles/catalog/years/entities/catalog-year.entity";
import { VersionEntity } from "@/src/contexts/vehicles/catalog/versions/entities/version.entity";
import { TractionEntity } from "@/src/contexts/vehicles/entities/traction.entity";

export interface CatalogIdentityMake {
  id: number;
  name: string;
  slug: string;
}

export interface CatalogIdentityModel {
  id: number;
  make_id: number;
  name: string;
  slug: string;
}

export interface CatalogIdentityYear {
  id: number;
  year: number;
  slug: string;
}

export interface CatalogIdentityVersion {
  id: number;
  name: string;
  slug: string;
  fuel_type_id: number;
}

export interface CatalogIdentityTraction {
  id: string;
  name: string;
  slug: string;
}

@Injectable()
export class CatalogIdentityLookupService {
  constructor(
    @InjectRepository(MakeEntity)
    private readonly make_repository: Repository<MakeEntity>,
    @InjectRepository(CatalogModelEntity)
    private readonly model_repository: Repository<CatalogModelEntity>,
    @InjectRepository(CatalogYearEntity)
    private readonly year_repository: Repository<CatalogYearEntity>,
    @InjectRepository(VersionEntity)
    private readonly version_repository: Repository<VersionEntity>,
    @InjectRepository(TractionEntity)
    private readonly traction_repository: Repository<TractionEntity>,
  ) {}

  async findMakeBySlugOrName(
    slug: string,
    name: string,
  ): Promise<CatalogIdentityMake | null> {
    const by_slug = await this.make_repository.findOne({ where: { slug } });
    if (by_slug) {
      return { id: by_slug.id, name: by_slug.name, slug: by_slug.slug };
    }

    const by_name = await this.make_repository
      .createQueryBuilder("make")
      .where("make.name ILIKE :name", { name })
      .orWhere("make.slug ILIKE :slug_like", { slug_like: slug })
      .orderBy("make.name", "ASC")
      .getOne();

    if (!by_name) {
      return null;
    }
    return { id: by_name.id, name: by_name.name, slug: by_name.slug };
  }

  async findModelByMakeAndSlugOrName(
    make_id: number,
    slug: string,
    name: string,
  ): Promise<CatalogIdentityModel | null> {
    const by_slug = await this.model_repository.findOne({
      where: { make_id, slug },
    });
    if (by_slug) {
      return {
        id: by_slug.id,
        make_id: by_slug.make_id,
        name: by_slug.name,
        slug: by_slug.slug,
      };
    }

    const by_name = await this.model_repository
      .createQueryBuilder("model")
      .where("model.make_id = :make_id", { make_id })
      .andWhere("(model.name ILIKE :name OR model.slug ILIKE :slug_like)", {
        name,
        slug_like: slug,
      })
      .orderBy("model.name", "ASC")
      .getOne();

    if (!by_name) {
      return null;
    }
    return {
      id: by_name.id,
      make_id: by_name.make_id,
      name: by_name.name,
      slug: by_name.slug,
    };
  }

  async findYearByValue(year: number): Promise<CatalogIdentityYear | null> {
    const row = await this.year_repository.findOne({ where: { year } });
    if (!row) {
      return null;
    }
    return { id: row.id, year: row.year, slug: row.slug };
  }

  async findVersionsByMakeModelYear(
    make_id: number,
    model_id: number,
    year_id: number,
  ): Promise<CatalogIdentityVersion[]> {
    const rows = await this.version_repository.find({
      where: { make_id, model_id, year_id },
      order: { name: "ASC" },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      fuel_type_id: row.fuel_type_id,
    }));
  }

  async findTractionBySlugs(
    slugs: string[],
  ): Promise<CatalogIdentityTraction | null> {
    if (slugs.length === 0) {
      return null;
    }
    const row = await this.traction_repository.findOne({
      where: { slug: In(slugs) },
    });
    if (!row) {
      return null;
    }
    return { id: row.id, name: row.name, slug: row.slug };
  }
}
