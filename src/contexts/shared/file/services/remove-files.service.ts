import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { firstValueFrom } from "rxjs";

import { RemoveFilesDto } from "../dto/remove-files.dto";

@Injectable()
export class RemoveFilesService {
  constructor(private readonly objectStorageService: ObjectStorageService) {}

  async execute(removeFilesDto: RemoveFilesDto): Promise<void> {
    await firstValueFrom(
      this.objectStorageService.deleteFiles(
        removeFilesDto.paths,
        removeFilesDto.bucket_name,
      ),
    );
  }
}
