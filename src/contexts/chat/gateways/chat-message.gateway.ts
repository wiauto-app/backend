import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { ExecutionContext, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Server, Socket } from "socket.io";

import { WsJwtGuard } from "@/src/contexts/auth/guards/ws-jwt.guard";
import { ChatService } from "@/src/contexts/chat/services/chat.service";
import { ChatMessageListItem } from "@/src/contexts/chat/types/chat-message-list-item";
import { ChatMessage } from "@/src/contexts/chat/types/chatMessage";
import { TypeOrmChatMessageRepository } from "@/src/contexts/chat/repositories/typeorm.chat-message-repository";
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

interface TypingPayload {
  chat_id: string;
}

interface PresenceSubscribePayload {
  user_ids: string[];
}

interface EmitMessageDeletedPayload {
  id: string;
  chat_id: string;
}

interface MessagesReadPayload {
  chat_id: string;
  reader_id: string;
  message_ids: string[];
}

interface UnreadUpdatedPayload {
  chat_id: string;
  user_id: string;
  unread_count: number;
}

type PresenceStatus = "online" | "offline";

@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: FRONTEND_ORIGINS.length > 0 ? FRONTEND_ORIGINS : true,
    credentials: true,
  },
})
export class ChatMessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly online_users = new Map<string, number>();
  private readonly presence_subscribers = new Map<string, Set<string>>();

  constructor(
    private readonly chat_service: ChatService,
    private readonly chat_access_service: ChatAccessService,
    private readonly chat_message_repository: TypeOrmChatMessageRepository,
    private readonly ws_jwt_guard: WsJwtGuard,
  ) { }

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket,): Promise<void> {
    try {
      const context = this.buildWsContext(client);
      const allowed = await this.ws_jwt_guard.canActivate(context);
      if (!allowed) {
        client.disconnect(true);
        return;
      }

      const user_id = this.tryGetUserIdFromClient(client);
      if (!user_id) {
        client.disconnect(true);
        return;
      }

      (client.data as { user_id?: string }).user_id = user_id;
      await client.join(this.getUserRoom(user_id));

      const current = this.online_users.get(user_id) ?? 0;
      this.online_users.set(user_id, current + 1);
      if (current === 0) {
        this.emitPresenceChanged(user_id, "online");
      }
    } catch (error) {
      console.error("Error in handleConnection", error);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user_id = this.tryGetUserIdFromClient(client);
    if (!user_id) return;

    const current = this.online_users.get(user_id) ?? 0;
    if (current <= 1) {
      this.online_users.delete(user_id);
      this.emitPresenceChanged(user_id, "offline", new Date());
    } else {
      this.online_users.set(user_id, current - 1);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(CHAT_SOCKET_EVENTS.JOIN_CHAT)
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinChatPayload,
  ) {
    const user_id = this.getUserIdFromClient(client);
    const chat = await this.chat_service.findOne({ id: payload.chat_id });
    this.chat_access_service.assertChatParticipant(chat, user_id);

    await client.join(this.getChatRoom(payload.chat_id));

    const delivered = await this.chat_message_repository.markMessagesAsDeliveredForRecipient(
      payload.chat_id,
      user_id,
    );
    for (const message of delivered) {
      this.emitMessageUpdated(this.serializeListItemFromMessage(message));
    }

    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(CHAT_SOCKET_EVENTS.LEAVE_CHAT)
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinChatPayload,
  ) {
    const user_id = this.getUserIdFromClient(client);
    const chat = await this.chat_service.findOne({ id: payload.chat_id });
    this.chat_access_service.assertChatParticipant(chat, user_id);
    await client.leave(this.getChatRoom(payload.chat_id));
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(CHAT_SOCKET_EVENTS.TYPING_START)
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const user_id = this.getUserIdFromClient(client);
    const chat = await this.chat_service.findOne({ id: payload.chat_id });
    this.chat_access_service.assertChatParticipant(chat, user_id);

    client.to(this.getChatRoom(payload.chat_id)).emit(CHAT_SOCKET_EVENTS.TYPING_START, {
      chat_id: payload.chat_id,
      user_id,
    });
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(CHAT_SOCKET_EVENTS.TYPING_STOP)
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const user_id = this.getUserIdFromClient(client);
    const chat = await this.chat_service.findOne({ id: payload.chat_id });
    this.chat_access_service.assertChatParticipant(chat, user_id);

    client.to(this.getChatRoom(payload.chat_id)).emit(CHAT_SOCKET_EVENTS.TYPING_STOP, {
      chat_id: payload.chat_id,
      user_id,
    });
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(CHAT_SOCKET_EVENTS.PRESENCE_SUBSCRIBE)
  handlePresenceSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PresenceSubscribePayload,
  ) {
    const subscriber_id = this.getUserIdFromClient(client);
    const subscribers = this.presence_subscribers.get(subscriber_id) ?? new Set();
    for (const user_id of payload.user_ids) {
      subscribers.add(user_id);
    }
    this.presence_subscribers.set(subscriber_id, subscribers);

    const snapshot = payload.user_ids.map((user_id) => ({
      user_id,
      status: this.isUserOnline(user_id) ? ("online" as const) : ("offline" as const),
      last_seen_at: this.isUserOnline(user_id) ? null : new Date(),
    }));

    return { users: snapshot };
  }

  async tryMarkDeliveredAndEmit(
    message: ChatMessage,
    participants: string[],
  ): Promise<ChatMessage[]> {
    const other_participants = participants.filter(
      (participant_id) => participant_id !== message.sender_id,
    );

    const chat_room = this.getChatRoom(message.chat.id);
    const room = this.server.in(chat_room);
    const sockets = await room.fetchSockets();
    const connected_user_ids = new Set<string>();
    for (const remote_socket of sockets) {
      const socket_data = remote_socket.data as { user_id?: string };
      if (socket_data.user_id) {
        connected_user_ids.add(socket_data.user_id);
      }
    }

    const someone_online = other_participants.some((id) => connected_user_ids.has(id));
    if (!someone_online) return [];

    const delivered: ChatMessage[] = [];
    for (const recipient_id of other_participants) {
      if (!connected_user_ids.has(recipient_id)) continue;
      const batch = await this.chat_message_repository.markMessagesAsDeliveredForRecipient(
        message.chat.id,
        recipient_id,
      );
      delivered.push(...batch);
    }
    return delivered;
  }

  emitMessageCreated(message: ChatMessageListItem): void {
    this.server
      .to(this.getChatRoom(message.chat_id))
      .emit(CHAT_SOCKET_EVENTS.MESSAGE_CREATED, message);
  }

  emitMessageUpdated(message: ChatMessageListItem): void {
    this.server
      .to(this.getChatRoom(message.chat_id))
      .emit(CHAT_SOCKET_EVENTS.MESSAGE_UPDATED, message);
  }

  emitMessageDeleted(payload: EmitMessageDeletedPayload): void {
    this.server
      .to(this.getChatRoom(payload.chat_id))
      .emit(CHAT_SOCKET_EVENTS.MESSAGE_DELETED, payload);
  }

  emitMessagesRead(payload: MessagesReadPayload): void {
    this.server
      .to(this.getChatRoom(payload.chat_id))
      .emit(CHAT_SOCKET_EVENTS.MESSAGES_READ, payload);
  }

  emitUnreadUpdated(payload: UnreadUpdatedPayload): void {
    this.server
      .to(this.getUserRoom(payload.user_id))
      .emit(CHAT_SOCKET_EVENTS.UNREAD_UPDATED, payload);
  }

  private emitPresenceChanged(
    user_id: string,
    status: PresenceStatus,
    last_seen_at: Date | null = null,
  ): void {
    for (const [subscriber_id, watched_ids] of this.presence_subscribers.entries()) {
      if (!watched_ids.has(user_id)) continue;
      this.server.to(this.getUserRoom(subscriber_id)).emit(CHAT_SOCKET_EVENTS.PRESENCE_CHANGED, {
        user_id,
        status,
        last_seen_at,
      });
    }
  }

  private isUserOnline(user_id: string): boolean {
    return (this.online_users.get(user_id) ?? 0) > 0;
  }

  private getChatRoom(chat_id: string): string {
    return `chat:${chat_id}`;
  }

  private getUserRoom(user_id: string): string {
    return `user:${user_id}`;
  }

  private tryGetUserIdFromClient(client: Socket): string | undefined {
    const data_user_id = (client.data as { user_id?: string }).user_id;
    if (data_user_id) return data_user_id;

    const request_user_unknown: unknown = (client.request as { user?: unknown }).user;
    const request_user =
      typeof request_user_unknown === "object" && request_user_unknown
        ? (request_user_unknown as { id?: unknown })
        : undefined;
    const user_id = typeof request_user?.id === "string" ? request_user.id : undefined;
    if (!user_id) return undefined;

    (client.data as { user_id?: string }).user_id = user_id;
    return user_id;
  }

  private getUserIdFromClient(client: Socket): string {
    const user_id = this.tryGetUserIdFromClient(client);
    if (!user_id) {
      throw new UnauthorizedException("Socket sin usuario autenticado.");
    }
    return user_id;
  }

  private serializeListItemFromMessage(message: ChatMessage): ChatMessageListItem {
    return {
      id: message.id,
      chat_id: message.chat.id,
      sender_id: message.sender_id,
      content: message.content,
      type: message.type,
      status: message.status,
      metadata: message.metadata,
      edited_at: message.edited_at,
      created_at: message.created_at,
      updated_at: message.updated_at,
      deleted_at: message.deleted_at,
      media_url: null,
    };
  }
  private buildWsContext(client: Socket): ExecutionContext {
    return {
      switchToWs: () => ({
        getClient: () => client,
      }),
  
      switchToHttp: () => ({
        getRequest: () => client.request,
        getResponse: () => null,
      }),
  
      getType: () => "ws",
  
      getClass: () => ChatMessageGateway,
  
      getHandler: () => this.handleConnection.bind(this),
    } as unknown as ExecutionContext;
  }
}
