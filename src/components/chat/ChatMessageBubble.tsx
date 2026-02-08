import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/types/commerce";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

const ChatMessageBubble = ({ message }: ChatMessageBubbleProps) => {
  const isAgent = message.role === "agent";

  return (
    <div className={`flex gap-2.5 ${isAgent ? "" : "flex-row-reverse"}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded-xl flex items-center justify-center mt-0.5 ${
          isAgent
            ? "bg-primary/10 text-primary"
            : "bg-accent/10 text-accent"
        }`}
      >
        {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
          isAgent
            ? "bg-secondary/50 rounded-tl-lg text-foreground"
            : "bg-primary text-primary-foreground rounded-tr-lg shadow-sm"
        }`}
      >
        {isAgent ? (
          <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-foreground prose-p:text-foreground/80 prose-li:text-foreground/80">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <p>{message.content}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessageBubble;
