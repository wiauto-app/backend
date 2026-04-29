import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { UPLOAD_VIDEO_QUEUE } from "../../../infrastructure/media.constants";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { file_key_to_mp4_storage_key } from "../../../infrastructure/utils/file-key-to-mp4-storage-key.util";
import { ConfirmVideoUploadDto, type ConfirmVideoUploadResult } from "./confirm-video-upload.dto";

@Injectable()
export class ConfirmVideoUploadUseCase {
  constructor(
    @InjectQueue(UPLOAD_VIDEO_QUEUE)
    private readonly uploadVideoQueue: Queue<ConfirmVideoUploadDto>,
  ) {}

  async execute(confirmVideoUploadDto: ConfirmVideoUploadDto): Promise<ConfirmVideoUploadResult> {
    await this.uploadVideoQueue.add(confirmVideoUploadDto.file_key, confirmVideoUploadDto);
    return {
      file_key: confirmVideoUploadDto.file_key,
      file_key_en_storage: file_key_to_mp4_storage_key(confirmVideoUploadDto.file_key),
    };
  }
}