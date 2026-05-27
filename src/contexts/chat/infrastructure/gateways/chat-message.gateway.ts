import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { UseGuards } from "@nestjs/common";
import type { Server } from "socket.io";

import { WsJwtGuard } from "@/src/contexts/auth/guards/ws-jwt.guard";
import { FindChatUseCase } from "@/src/contexts/chat/application/chat-use-cases/find-chat-use-case/find-chat.use-case";
import { ChatMessage } from "@/src/contexts/chat/domain/entities/chatMessage";
import { ChatAccessService } from "../services/chat-access.service";
import { CHAT_SOCKET_EVENTS } from "./chat-socket.events";

const FRONTEND_ORIGINS = (
  process.env.FRONTEND_ORIGINS ?? "http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

  
interface JoinChatPayload {
  chat_id: string;
}

interface EmitMessageDeletedPayload {
  id: string;
  chat_id: string;
}

interface SocketLike {
  request: { user?: unknown };
  join: (room: string) => Promise<void> | void;
  leave: (room: string) => Promise<void> | void;
}

interface SocketIoServerLike {
  to: (room: string) => { emit: (event: string, payload: unknown) => void };
}

@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: FRONTEND_ORIGINS.length > 0 ? FRONTEND_ORIGINS : true,
    credentials: true,
  },
})
export class ChatMessageGateway {
  constructor(
    private readonly find_chat_use_case: FindChatUseCase,
    private readonly chat_access_service: ChatAccessService,
  ) {}

  @WebSocketServer()
  server!: Server;

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(CHAT_SOCKET_EVENTS.JOIN_CHAT)
  async handleJoinChat(
    @ConnectedSocket() client: unknown,
    @MessageBody() payload: JoinChatPayload,
  ) {
    const socket = client as SocketLike;
    const user_id = this.getUserIdFromClient(socket);
    const chat = await this.find_chat_use_case.execute({ id: payload.chat_id });
    this.chat_access_service.assertChatParticipant(chat, user_id);

    await socket.join(this.getChatRoom(payload.chat_id));
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(CHAT_SOCKET_EVENTS.LEAVE_CHAT)
  async handleLeaveChat(
    @ConnectedSocket() client: unknown,
    @MessageBody() payload: JoinChatPayload,
  ) {
    const socket = client as SocketLike;
    const user_id = this.getUserIdFromClient(socket);
    const chat = await this.find_chat_use_case.execute({ id: payload.chat_id });
    this.chat_access_service.assertChatParticipant(chat, user_id);

    await socket.leave(this.getChatRoom(payload.chat_id));
    return { ok: true };
  }

  emitMessageCreated(message: ChatMessage): void {
    (this.server as unknown as SocketIoServerLike)
      .to(this.getChatRoom(message.chat.id))
      .emit(CHAT_SOCKET_EVENTS.MESSAGE_CREATED, this.serializeMessage(message));
  }

  emitMessageUpdated(message: ChatMessage): void {
    (this.server as unknown as SocketIoServerLike)
      .to(this.getChatRoom(message.chat.id))
      .emit(CHAT_SOCKET_EVENTS.MESSAGE_UPDATED, this.serializeMessage(message));
  }

  emitMessageDeleted(payload: EmitMessageDeletedPayload): void {
    (this.server as unknown as SocketIoServerLike)
      .to(this.getChatRoom(payload.chat_id))
      .emit(CHAT_SOCKET_EVENTS.MESSAGE_DELETED, payload);
  }

  private getChatRoom(chat_id: string): string {
    return `chat:${chat_id}`;
  }

  private getUserIdFromClient(client: SocketLike): string {
    const request_user_unknown: unknown = client.request.user;
    const request_user =
      typeof request_user_unknown === "object" && request_user_unknown
        ? (request_user_unknown as { id?: unknown })
        : undefined;
    const user_id = typeof request_user?.id === "string" ? request_user.id : undefined;
    if (!user_id) {
      throw new Error("Socket sin usuario autenticado.");
    }
    return user_id;
  }

  private serializeMessage(message: ChatMessage) {
    return {
      id: message.id,
      chat_id: message.chat.id,
      sender_id: message.sender_id,
      content: message.content,
      type: message.type,
      status: message.status,
      created_at: message.created_at,
      updated_at: message.updated_at,
      deleted_at: message.deleted_at,
    };
  }
}
