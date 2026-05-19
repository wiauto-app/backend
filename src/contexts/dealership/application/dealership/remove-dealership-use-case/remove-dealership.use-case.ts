import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipRepository } from "../../../domain/repositories/dealership.repository";

import { RemoveDealershipDto } from "./remove-dealership.dto";
import { RemoveFilesUseCase } from "@/src/contexts/shared/file/application/images-use-cases/remove-files-use-case/remove-files.use-case";
import { DealershipNotFoundException } from "../../../domain/exceptions/dealership-not-found.exception";

@Injectable()
export class RemoveDealershipUseCase {
  constructor(
    private readonly dealership_repository: DealershipRepository,
    private readonly remove_image_use_case: RemoveFilesUseCase,
  ) { }

  async execute(remove_dealership_dto: RemoveDealershipDto): Promise<void> {
    const dealership = await this.dealership_repository.findOne(remove_dealership_dto.id).then((dealership) => dealership?.toPrimitives());
    if (!dealership) {
      throw new DealershipNotFoundException(remove_dealership_dto.id);
    }

    const bucket = 'dealership-images';
    const images = [
      dealership.avatar_url ? `/${dealership.avatar_url}` : undefined,
      dealership.banner_url ? `/${dealership.banner_url}` : undefined
    ].filter((image) => image !== undefined);
    const formated_images = images
      .filter(Boolean)
      .map((url) =>
        url
          .replace(/^\/+/, '') // quita slash inicial
          .replace(`${bucket}/`, '') // quita bucket del path
      );
    await this.remove_image_use_case.execute({ paths: formated_images, bucket_name: bucket });

    await this.dealership_repository.delete(remove_dealership_dto.id);
  }
}
