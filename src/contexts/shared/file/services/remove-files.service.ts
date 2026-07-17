import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { RemoveFilesDto } from "../dto/remove-files.dto";
import { MinioService } from "@/src/contexts/shared/minio-provider/minio.service";
import { firstValueFrom } from "rxjs";

@Injectable()

export class RemoveFilesService {
  constructor(private readonly minioService: MinioService) {}

  async execute(removeFilesDto: RemoveFilesDto): Promise<void> {
    await firstValueFrom(this.minioService.deleteFiles(removeFilesDto.paths, removeFilesDto.bucket_name));
  }
}