export const CHAT_SOCKET_EVENTS = {
  JOIN_CHAT: "join_chat",
  LEAVE_CHAT: "leave_chat",
  MESSAGE_CREATED: "message_created",
  MESSAGE_UPDATED: "message_updated",
  MESSAGE_DELETED: "message_deleted",
  MESSAGES_READ: "messages_read",
  UNREAD_UPDATED: "unread_updated",
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
  PRESENCE_SUBSCRIBE: "presence_subscribe",
  PRESENCE_CHANGED: "presence_changed",
} as const;
