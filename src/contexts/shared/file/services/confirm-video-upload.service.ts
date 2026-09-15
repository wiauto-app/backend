import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import {
  ConfirmVideoUploadDto,
  type ConfirmVideoUploadResult,
} from "../dto/confirm-video-upload.dto";

@Injectable()
export class ConfirmVideoUploadService {
  async execute(
    confirmVideoUploadDto: ConfirmVideoUploadDto,
  ): Promise<ConfirmVideoUploadResult> {
    return {
      file_key: confirmVideoUploadDto.file_key,
      file_key_en_storage: confirmVideoUploadDto.file_key,
    };
  }
}
