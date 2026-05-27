import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
export const CHAT_TYPE = {
  PRIVATE: "individual",
  GROUP: "group",
} as const;

export type ChatType = (typeof CHAT_TYPE)[keyof typeof CHAT_TYPE];


export class Chat {
  id: string;
  participants: string[];
  chat_type: ChatType;
  vehicle_id: string;
  created_at: Date;
  updated_at: Date;

  static create(payload: {
    participants: string[];
    chat_type: ChatType;
    vehicle_id: string;
  }): Chat {
    const chat = new Chat()
    chat.id = uuidv4();
    chat.participants = payload.participants;
    chat.chat_type = payload.chat_type;
    chat.vehicle_id = payload.vehicle_id;
    chat.created_at = new Date();
    chat.updated_at = new Date();
    return chat;
  }
}
