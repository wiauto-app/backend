import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { MinioService } from "@/src/contexts/shared/minio-provider/minio.service";
import { BadRequestException, CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Request } from "express";
import { normalize_image_filename_for_storage } from "@/src/contexts/shared/file/infrastructure/utils/normalize-image-filename-for-storage";
import { firstValueFrom, Observable } from "rxjs";

@Injectable()
export class UploadFileInterceptor implements NestInterceptor {

  constructor(
    private readonly minioService: MinioService
  ) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<Request>()
    const file = req.file

    if (!file) {
      throw new BadRequestException("File is required")
    }

    const safe_name = normalize_image_filename_for_storage(
      file.originalname,
      file.mimetype,
    );
    const uniqueName = `${Date.now()}-${safe_name}`;
    const storagePath = `vehicles/${uniqueName}`;
    const publicUrl = await firstValueFrom(
      this.minioService.uploadFile(file.buffer, storagePath, file.mimetype)
    )
    const url = new URL(publicUrl)
    const pathname = url.pathname

    req.uploaded_file = pathname
    return next.handle()
  }

}