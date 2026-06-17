import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { ALERT_PROCESSING_QUEUE } from "./alert-processing.queue.constants";
import { AlertProcessingEnqueueService } from "./alert-processing-enqueue.service";

@Module({
  imports: [BullModule.registerQueue({ name: ALERT_PROCESSING_QUEUE })],
  providers: [AlertProcessingEnqueueService],
  exports: [AlertProcessingEnqueueService],
})
export class AlertProcessingEnqueueModule {}
