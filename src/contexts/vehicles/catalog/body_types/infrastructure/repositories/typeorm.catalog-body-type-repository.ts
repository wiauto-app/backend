import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CatalogBodyType } from "../../domain/entities/catalog-body-type";
import { CatalogBodyTypesRepository } from "../../domain/repositories/catalog-body-types.repository";
import { CatalogBodyTypeEntity } from "../persistence/catalog-body-type.entity";
import { CatalogBodyTypeNotFoundException } from "../../domain/exceptions/catalog-body-type-not-found.exception";

export class TypeormCatalogBodyTypeRepository extends CatalogBodyTypesRepository {
  constructor(
    @InjectRepository(CatalogBodyTypeEntity)
    private readonly repo: Repository<CatalogBodyTypeEntity>,
  ) {
    super();
  }

  async findAll(): Promise<CatalogBodyType[]> {
    const rows = await this.repo.find({ order: { id: "ASC" } });
    return rows.map((row) =>
      CatalogBodyType.fromPrimitives({
        id: row.id,
        body_type_id: row.body_type_id,
        doors: row.doors,
        name: row.name,
        slug: row.slug,
        created_at: row.created_at,
      }),
    );
  }

  async findOne(id: number): Promise<CatalogBodyType | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return CatalogBodyType.fromPrimitives({
      id: row.id,
      body_type_id: row.body_type_id,
      doors: row.doors,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
    });
  }

  async save(row: CatalogBodyType): Promise<CatalogBodyType> {
    const p = row.toPrimitives();
    if (p.id === undefined) {
      const saved = await this.repo.save(
        this.repo.create({
          body_type_id: p.body_type_id,
          doors: p.doors,
          name: p.name,
          slug: p.slug,
        }),
      );
      return CatalogBodyType.fromPrimitives({
        id: saved.id,
        body_type_id: saved.body_type_id,
        doors: saved.doors,
        name: saved.name,
        slug: saved.slug,
        created_at: saved.created_at,
      });
    }
    const pre = await this.repo.preload({
      id: p.id,
      body_type_id: p.body_type_id,
      doors: p.doors,
      name: p.name,
      slug: p.slug,
    });
    if (!pre) {
      throw new CatalogBodyTypeNotFoundException(p.id);
    }
    const saved = await this.repo.save(pre);
    return CatalogBodyType.fromPrimitives({
      id: saved.id,
      body_type_id: saved.body_type_id,
      doors: saved.doors,
      name: saved.name,
      slug: saved.slug,
      created_at: saved.created_at,
    });
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
