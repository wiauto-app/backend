export class ChatNotFoundException extends Error {
  constructor(chat_id: string) {
    super(`Chat con id ${chat_id} no encontrado`);
    this.name = "ChatNotFoundException";
  }
}
