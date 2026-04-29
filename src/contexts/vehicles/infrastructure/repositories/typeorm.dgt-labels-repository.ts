import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DgtLabel } from "../../domain/entities/dgt-label";
import { DgtLabelsRepository } from "../../domain/repositories/dgt-labels.repository";
import { DgtLabelEntity } from "../persistence/dgt-label.entity";
import { DgtLabelNotFoundException } from "../../domain/exceptions/dgt-label-not-found.exception";

export class TypeormDgtLabelsRepository extends DgtLabelsRepository {
  constructor(
    @InjectRepository(DgtLabelEntity)
    private readonly dgt_label_repository: Repository<DgtLabelEntity>,
  ) {
    super();
  }

  async findAll(): Promise<DgtLabel[]> {
    const rows = await this.dgt_label_repository.find({
      order: { code: "asc" },
    });
    return rows.map((row) => DgtLabel.fromPrimitives(row));
  }

  async findOne(id: string): Promise<DgtLabel | null> {
    const row = await this.dgt_label_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return DgtLabel.fromPrimitives(row);
  }

  async save(label: DgtLabel): Promise<void> {
    await this.dgt_label_repository.save(label.toPrimitives());
  }

  async persist_updated(label: DgtLabel): Promise<void> {
    const primitive = label.toPrimitives();
    const row = await this.dgt_label_repository.preload({
      id: primitive.id,
      name: primitive.name,
      code: primitive.code,
      description: primitive.description,
      slug: primitive.slug,
    });
    if (!row) {
      throw new DgtLabelNotFoundException(primitive.id);
    }
    await this.dgt_label_repository.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.dgt_label_repository.delete(id);
  }
}
