import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { BadRequestException, CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Request } from "express";
import { STORAGE_DIRECTORIES } from "@/src/contexts/shared/file/storage-directories";
import { normalize_image_filename_for_storage } from "@/src/contexts/shared/file/utils/normalize-image-filename-for-storage";
import { firstValueFrom, Observable } from "rxjs";

@Injectable()
export class UploadFileInterceptor implements NestInterceptor {
  constructor(private readonly objectStorageService: ObjectStorageService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<Request>();
    const file = req.file;

    if (!file) {
      throw new BadRequestException("File is required");
    }

    const safeName = normalize_image_filename_for_storage(
      file.originalname,
      file.mimetype,
    );
    const uniqueName = `${Date.now()}-${safeName}`;
    const storagePath = `vehicles/${uniqueName}`;
    const publicUrl = await firstValueFrom(
      this.objectStorageService.uploadFile(
        file.buffer,
        storagePath,
        file.mimetype,
        STORAGE_DIRECTORIES.VEHICLES_IMAGES,
      ),
    );
    const url = new URL(publicUrl);
    const pathname = url.pathname;

    req.uploaded_file = pathname;
    return next.handle();
  }
}
