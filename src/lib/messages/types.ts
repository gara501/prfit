export type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  sentAt: string;
  readAt: string | null;
};

export type ConversationContact = {
  id: string;
  name: string;
};
