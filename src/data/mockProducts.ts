import { ChatMessage } from "@/types/commerce";

export const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "agent",
    content:
      "Hey! 👋 I'm **OneTap** — your AI shopping assistant.\n\nTell me what you need and I'll find the best deals across retailers in seconds.\n\nWhat are you looking for?",
    timestamp: new Date(),
  },
];
