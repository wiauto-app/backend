import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ColorsRepository } from "../../domain/repositories/colors.repository";
import { CreateColorDto } from "./dto/create-color.dto";
import { Color, PrimitiveColor } from "../../domain/entities/color";
import { ColorNotFoundException } from "../../domain/exceptions/color-not-found.exception";
import { UpdateColorDto } from "./dto/update-color.dto";

@Injectable()
export class ColorsUseCase {
  constructor(private readonly colors_repository: ColorsRepository) {}

  async create(
    create_color_dto: CreateColorDto,
  ): Promise<{ color: PrimitiveColor }> {
    const color = Color.create({
      name: create_color_dto.name,
      hex_code: create_color_dto.hex_code,
    });
    await this.colors_repository.save(color);
    return { color: color.toPrimitives() };
  }

  async update(
    id: string,
    update_color_dto: UpdateColorDto,
  ): Promise<{ color: PrimitiveColor }> {
    const color = await this.colors_repository.findOne(id);
    if (!color) {
      throw new ColorNotFoundException(id);
    }
    const previous = color.toPrimitives();
    const next_name = update_color_dto.name ?? previous.name;
    const next_hex_code = update_color_dto.hex_code ?? previous.hex_code;
    const updated_color = color.update({
      name: next_name,
      hex_code: next_hex_code,
    });
    await this.colors_repository.update(
      id,
      updated_color.toPrimitives().name,
      updated_color.toPrimitives().hex_code,
    );
    return { color: updated_color.toPrimitives() };
  }

  async findAll(): Promise<{ colors: PrimitiveColor[] }> {
    const colors = await this.colors_repository.findAll();
    return { colors: colors.map((c) => c.toPrimitives()) };
  }

  async findOne(id: string): Promise<{ color: PrimitiveColor }> {
    const color = await this.colors_repository.findOne(id);
    if (!color) {
      throw new ColorNotFoundException(id);
    }
    return { color: color.toPrimitives() };
  }

  async remove(id: string): Promise<void> {
    await this.colors_repository.remove(id);
  }
}
