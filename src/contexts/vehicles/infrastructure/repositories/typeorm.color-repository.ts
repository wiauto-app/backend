import { InjectRepository } from "@nestjs/typeorm";
import { ColorsRepository } from "../../domain/repositories/colors.repository";
import { ColorEntity } from "../persistence/color.entity";
import { Repository } from "typeorm";
import { Color } from "../../domain/entities/color";

export class TypeormColorRepository extends ColorsRepository {
  constructor(
    @InjectRepository(ColorEntity)
    private readonly color_repository: Repository<ColorEntity>,
  ) {
    super();
  }

  async findAll(): Promise<Color[]> {
    const rows = await this.color_repository.find();
    return rows.map((row) => Color.fromPrimitives(row));
  }

  async findOne(id: string): Promise<Color | null> {
    const row = await this.color_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return Color.fromPrimitives(row);
  }

  async save(color: Color): Promise<void> {
    await this.color_repository.save(color.toPrimitives());
  }

  async update(id: string, name: string, hex_code: string): Promise<void> {
    await this.color_repository.update(id, { name, hex_code });
  }

  async remove(id: string): Promise<void> {
    await this.color_repository.delete(id);
  }
}
