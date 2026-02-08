import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/types/commerce";
import { Button } from "@/components/ui/button";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onOptionClick?: (option: string) => void;
}

/** Parse [OPTIONS]...[/OPTIONS] block from message content */
function parseOptionsFromContent(content: string): { text: string; options: string[] } {
  const optionsMatch = content.match(/\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/);
  if (!optionsMatch) {
    return { text: content, options: [] };
  }
  
  const textWithoutOptions = content.replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/, "").trim();
  const optionsBlock = optionsMatch[1].trim();
  const options = optionsBlock
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  
  return { text: textWithoutOptions, options };
}

const ChatMessageBubble = ({ message, onOptionClick }: ChatMessageBubbleProps) => {
  const isAgent = message.role === "agent";
  const { text, options } = isAgent ? parseOptionsFromContent(message.content) : { text: message.content, options: [] };

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
          <div className="space-y-3">
            {text && (
              <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-foreground prose-p:text-foreground/80 prose-li:text-foreground/80">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            )}
            {options.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                {options.map((option, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => onOptionClick?.(option)}
                    className="justify-start text-left h-auto py-2 px-3 text-[13px] font-normal hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p>{message.content}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessageBubble;
