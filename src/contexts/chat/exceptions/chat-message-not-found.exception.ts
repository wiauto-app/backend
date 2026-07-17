export class ChatMessageNotFoundException extends Error {
  constructor(chat_message_id: string) {
    super(`Mensaje de chat con id ${chat_message_id} no encontrado`);
    this.name = "ChatMessageNotFoundException";
  }
}
