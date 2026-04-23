import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "../../../dependency-injectable/injectable";
import { FileQueuePort, UploadJob } from "../../domain/ports/file-queue.port";
import { UPLOAD_IMAGE_QUEUE } from "../media.constants";
import { Queue } from "bullmq";

@Injectable()
export class FileQueueAdapter extends FileQueuePort {
  constructor(
    @InjectQueue(UPLOAD_IMAGE_QUEUE)
      private readonly uploadImageQueue: Queue<UploadJob>
  ){
    super();
  }
  async enqueue(uploadJob: UploadJob): Promise<void> {
    await this.uploadImageQueue.add(uploadJob.entityId, uploadJob);
  }
}