import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { FileModule } from "@/src/contexts/shared/file/file.module";

import { CreateChatUseCase } from "../application/chat-use-cases/create-chat-use-case/create-chat.use-case";
import { DeleteChatUseCase } from "../application/chat-use-cases/delete-chat-use-case/delete-chat.use-case";
import { FindChatUseCase } from "../application/chat-use-cases/find-chat-use-case/find-chat.use-case";
import { FindChatsByParticipantUseCase } from "../application/chat-use-cases/find-chats-by-participant-use-case/find-chats-by-participant.use-case";
import { GetChatUnreadTotalUseCase } from "../application/chat-use-cases/get-chat-unread-total-use-case/get-chat-unread-total.use-case";
import { CreateChatMessageUseCase } from "../application/chat-message-use-cases/create-chat-message-use-case/create-chat-message.use-case";
import { DeleteChatMessageUseCase } from "../application/chat-message-use-cases/delete-chat-message-use-case/delete-chat-message.use-case";
import { FindChatMessageUseCase } from "../application/chat-message-use-cases/find-chat-message-use-case/find-chat-message.use-case";
import { FindMessagesByChatUseCase } from "../application/chat-message-use-cases/find-messages-by-chat-use-case/find-messages-by-chat.use-case";
import { MarkChatMessagesReadUseCase } from "../application/chat-message-use-cases/mark-chat-messages-read-use-case/mark-chat-messages-read.use-case";
import { UpdateChatMessageUseCase } from "../application/chat-message-use-cases/update-chat-message-use-case/update-chat-message.use-case";

import { ChatRepository } from "../domain/repositories/chat.repository";
import { ChatMessageRepository } from "../domain/repositories/chat-message.repository";
import { ChatParticipantStateRepository } from "../domain/repositories/chat-participant-state.repository";
import { ChatParticipantLookupPort } from "../application/ports/chat-participant-lookup.port";
import { ChatListItemMapper } from "../application/mappers/chat-list-item.mapper";
import { ChatReadModelService } from "../application/services/chat-read-model.service";
import { ChatMessageReadModelService } from "../application/services/chat-message-read-model.service";

import { ChatMessageGateway } from "../infrastructure/gateways/chat-message.gateway";
import { ChatEntity } from "../infrastructure/persistence/chat.entity";
import { ChatMessageEntity } from "../infrastructure/persistence/chat-message.orm.entity";
import { ChatParticipantStateEntity } from "../infrastructure/persistence/chat-participant-state.orm.entity";
import { TypeOrmChatParticipantLookupAdapter } from "../infrastructure/adapters/typeorm-chat-participant-lookup.adapter";
import { TypeOrmChatRepository } from "../infrastructure/repositories/typeorm.chat-repository";
import { TypeOrmChatMessageRepository } from "../infrastructure/repositories/typeorm.chat-message-repository";
import { TypeOrmChatParticipantStateRepository } from "../infrastructure/repositories/typeorm.chat-participant-state-repository";
import { ChatAccessService } from "../infrastructure/services/chat-access.service";

import { CreateChatController } from "../infrastructure/http-api/v1/chats/create-chat/create-chat.controller";
import { DeleteChatController } from "../infrastructure/http-api/v1/chats/delete-chat/delete-chat.controller";
import { FindChatController } from "../infrastructure/http-api/v1/chats/find-chat/find-chat.controller";
import { FindChatsByParticipantController } from "../infrastructure/http-api/v1/chats/find-chats-by-participant/find-chats-by-participant.controller";
import { CreateChatMessageController } from "../infrastructure/http-api/v1/chats/create-chat-message/create-chat-message.controller";
import { FindMessagesByChatController } from "../infrastructure/http-api/v1/chats/find-messages-by-chat/find-messages-by-chat.controller";
import { MarkChatMessagesReadController } from "../infrastructure/http-api/v1/chats/mark-chat-messages-read/mark-chat-messages-read.controller";
import { GetChatUnreadTotalController } from "../infrastructure/http-api/v1/chats/get-chat-unread-total/get-chat-unread-total.controller";
import { DeleteChatMessageController } from "../infrastructure/http-api/v1/chat-messages/delete-chat-message/delete-chat-message.controller";
import { FindChatMessageController } from "../infrastructure/http-api/v1/chat-messages/find-chat-message/find-chat-message.controller";
import { UpdateChatMessageController } from "../infrastructure/http-api/v1/chat-messages/update-chat-message/update-chat-message.controller";
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
    DeleteChatMessageController,
  ],
  imports: [
    AuthModule,
    ProfileModule,
    FileModule,
    TypeOrmModule.forFeature([
      ChatEntity,
      ChatMessageEntity,
      ChatParticipantStateEntity,
    ]),
  ],
  providers: [
    ChatAccessService,
    ChatMessageGateway,
    ChatListItemMapper,
    ChatReadModelService,
    ChatMessageReadModelService,

    CreateChatUseCase,
    FindChatUseCase,
    FindChatsByParticipantUseCase,
    DeleteChatUseCase,
    GetChatUnreadTotalUseCase,

    CreateChatMessageUseCase,
    FindChatMessageUseCase,
    FindMessagesByChatUseCase,
    MarkChatMessagesReadUseCase,
    UpdateChatMessageUseCase,
    DeleteChatMessageUseCase,

    TypeOrmChatRepository,
    {
      provide: ChatRepository,
      useExisting: TypeOrmChatRepository,
    },
    TypeOrmChatMessageRepository,
    {
      provide: ChatMessageRepository,
      useExisting: TypeOrmChatMessageRepository,
    },
    TypeOrmChatParticipantStateRepository,
    {
      provide: ChatParticipantStateRepository,
      useExisting: TypeOrmChatParticipantStateRepository,
    },
    TypeOrmChatParticipantLookupAdapter,
    {
      provide: ChatParticipantLookupPort,
      useExisting: TypeOrmChatParticipantLookupAdapter,
    },
    WsJwtGuard
  ],
  exports: [ChatRepository, ChatMessageRepository],
})
export class ChatModule {}
