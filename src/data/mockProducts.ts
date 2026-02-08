import { ChatMessage } from "@/types/commerce";

export const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "agent",
    content:
      "Hey! 👋 I'm **AgentCart** — your AI shopping agent.\n\nTell me what you need and I'll find the best options across retailers, compare prices, and build your cart.\n\nWhat are you looking for?",
    timestamp: new Date(),
  },
];
