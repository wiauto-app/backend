import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { AlertsModule } from "@/src/contexts/alerts/alerts.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { FileModule } from "@/src/contexts/shared/file/file.module";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";

import { TypeOrmChatRepository } from "@/src/contexts/chat/repositories/typeorm.chat-repository";
import { TypeOrmChatMessageRepository } from "@/src/contexts/chat/repositories/typeorm.chat-message-repository";
import { TypeOrmChatParticipantStateRepository } from "@/src/contexts/chat/repositories/typeorm.chat-participant-state-repository";
import { ChatParticipantLookupPort } from "../ports/chat-participant-lookup.port";
import { ChatListItemMapper } from "../services/chat-list-item.mapper";
import { ChatReadModelService } from "../services/chat-read-model.service";
import { ChatMessageReadModelService } from "../services/chat-message-read-model.service";
import { ChatService } from "../services/chat.service";
import { ChatMessageService } from "../services/chat-message.service";

import { ChatMessageGateway } from "../gateways/chat-message.gateway";
import { ChatEntity } from "../entities/chat.entity";
import { ChatMessageEntity } from "../entities/chat-message.orm.entity";
import { ChatParticipantStateEntity } from "../entities/chat-participant-state.orm.entity";
import { TypeOrmChatParticipantLookupAdapter } from "../clients/typeorm-chat-participant-lookup.adapter";
import { ChatAccessService } from "../services/chat-access.service";

import { CreateChatController } from "../api/v1/chats/create-chat/create-chat.controller";
import { DeleteChatController } from "../api/v1/chats/delete-chat/delete-chat.controller";
import { FindChatController } from "../api/v1/chats/find-chat/find-chat.controller";
import { FindChatsByParticipantController } from "../api/v1/chats/find-chats-by-participant/find-chats-by-participant.controller";
import { CreateChatMessageController } from "../api/v1/chats/create-chat-message/create-chat-message.controller";
import { FindMessagesByChatController } from "../api/v1/chats/find-messages-by-chat/find-messages-by-chat.controller";
import { MarkChatMessagesReadController } from "../api/v1/chats/mark-chat-messages-read/mark-chat-messages-read.controller";
import { GetChatUnreadTotalController } from "../api/v1/chats/get-chat-unread-total/get-chat-unread-total.controller";
import { DeleteChatMessageController } from "../api/v1/chat-messages/delete-chat-message/delete-chat-message.controller";
import { FindChatMessageController } from "../api/v1/chat-messages/find-chat-message/find-chat-message.controller";
import { UpdateChatMessageController } from "../api/v1/chat-messages/update-chat-message/update-chat-message.controller";
import { WsJwtGuard } from "../../auth/guards/ws-jwt.guard";

@Module({
  controllers: [
    CreateChatController,
    FindChatsByParticipantController,
    GetChatUnreadTotalController,
    FindChatController,
    DeleteChatController,
    FindMessagesByChatController,
    CreateChatMessageController,
    MarkChatMessagesReadController,
    FindChatMessageController,
    UpdateChatMessageController,
    DeleteChatMessageController],
  imports: [
    AuthModule,
    ProfileModule,
    FileModule,
    forwardRef(() => AlertsModule),
    forwardRef(() => VehiclesModule),
    TypeOrmModule.forFeature([
      ChatEntity,
      ChatMessageEntity,
      ChatParticipantStateEntity])],
  providers: [
    ChatAccessService,
    ChatMessageGateway,
    ChatListItemMapper,
    ChatReadModelService,
    ChatMessageReadModelService,
    ChatService,
    ChatMessageService,

    TypeOrmChatRepository,
    TypeOrmChatMessageRepository,
    TypeOrmChatParticipantStateRepository,
    TypeOrmChatParticipantLookupAdapter,
    {
      provide: ChatParticipantLookupPort,
      useExisting: TypeOrmChatParticipantLookupAdapter,
    },
    WsJwtGuard],
  exports: [
    TypeOrmChatRepository,
    TypeOrmChatMessageRepository,
    ChatService,
    ChatMessageService],
})
export class ChatModule {}
