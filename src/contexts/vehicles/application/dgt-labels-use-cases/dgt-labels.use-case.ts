import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { DgtLabelsRepository } from "../../domain/repositories/dgt-labels.repository";
import { CreateDgtLabelDto } from "./dto/create-dgt-label.dto";
import { UpdateDgtLabelDto } from "./dto/update-dgt-label.dto";
import { DgtLabel, PrimitiveDgtLabel } from "../../domain/entities/dgt-label";
import { DgtLabelNotFoundException } from "../../domain/exceptions/dgt-label-not-found.exception";

@Injectable()
export class DgtLabelsUseCase {
  constructor(private readonly dgt_labels_repository: DgtLabelsRepository) {}

  async create(
    create_dgt_label_dto: CreateDgtLabelDto,
  ): Promise<{ dgt_label: PrimitiveDgtLabel }> {
    const label = DgtLabel.create({
      name: create_dgt_label_dto.name,
      code: create_dgt_label_dto.code,
      description: create_dgt_label_dto.description,
    });
    await this.dgt_labels_repository.save(label);
    return { dgt_label: label.toPrimitives() };
  }

  async update(
    id: string,
    update_dgt_label_dto: UpdateDgtLabelDto,
  ): Promise<{ dgt_label: PrimitiveDgtLabel }> {
    const existing = await this.dgt_labels_repository.findOne(id);
    if (!existing) {
      throw new DgtLabelNotFoundException(id);
    }
    const updated = existing.update({
      name: update_dgt_label_dto.name,
      code: update_dgt_label_dto.code,
      description: update_dgt_label_dto.description,
    });
    await this.dgt_labels_repository.persist_updated(updated);
    return { dgt_label: updated.toPrimitives() };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveDgtLabel>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.dgt_labels_repository.find_all(filter);
    return page.map((l) => l.toPrimitives());
  }

  async findOne(id: string): Promise<{ dgt_label: PrimitiveDgtLabel }> {
    const label = await this.dgt_labels_repository.findOne(id);
    if (!label) {
      throw new DgtLabelNotFoundException(id);
    }
    return { dgt_label: label.toPrimitives() };
  }

  async remove(id: string): Promise<void> {
    await this.dgt_labels_repository.remove(id);
  }
}
