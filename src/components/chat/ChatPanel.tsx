import { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FeaturePills from "@/components/home/FeaturePills";
import { ChatMessage } from "@/types/commerce";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessageBubble from "./ChatMessageBubble";
import onetapLogo from "@/assets/onetap-logo.png";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isStreaming?: boolean;
  isFullWidth?: boolean;
}

const ChatPanel = ({ messages, onSendMessage, isStreaming = false, isFullWidth = false }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickPrompts = [
    "I need a skiing outfit under $400 delivered in 5 days",
    "Buy snacks and supplies for a hackathon with 60 people",
    "Find the best mechanical keyboard under $200",
  ];

  const isInitial = messages.length <= 1;

  return (
    <div className="flex flex-col h-full">
      {isInitial && isFullWidth ? (
        /* ChatGPT-style centered initial view */
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6 sm:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center w-full max-w-xl mx-auto"
          >
            <div className="mb-5 sm:mb-7">
              <img
                src={onetapLogo}
                alt="OneTap logo"
                className="w-28 h-28 sm:w-36 sm:h-36 mx-auto object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="font-display font-bold tracking-tight mb-2 sm:mb-3 text-foreground">
              What do you need?
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed px-2">
              One tap is all it takes. Tell us what you need — we'll find it, compare it, and cart it.
            </p>

            {/* Central input */}
            <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto mb-4 sm:mb-6 px-1">
              <div className="bg-card rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-end gap-2 sm:gap-3 shadow-card border border-border/60 transition-shadow focus-within:shadow-elevated focus-within:border-primary/20">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Try: 'I need supplies for a hackathon with 60 people, $500 budget'"
                  disabled={isStreaming}
                  rows={1}
                  className="flex-1 bg-transparent text-sm leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/50 disabled:opacity-50 py-1 max-h-[120px]"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isStreaming}
                  className="rounded-xl h-8 w-8 sm:h-9 sm:w-9 shrink-0 mb-0.5 shadow-sm"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>

            {/* Quick prompts */}
            <div className="flex flex-col gap-2 max-w-lg mx-auto px-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSendMessage(prompt)}
                  disabled={isStreaming}
                  className="text-left text-xs sm:text-[13px] leading-snug px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-border/50 bg-card/80 hover:bg-secondary/50 hover:border-primary/20 text-muted-foreground hover:text-foreground transition-all duration-200 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Feature pills */}
            <FeaturePills />
          </motion.div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 px-3 sm:px-4 pt-4 sm:pt-6 pb-2" ref={scrollRef as any}>
            <div className={`space-y-3 sm:space-y-4 pb-4 ${isFullWidth ? "max-w-2xl" : "max-w-lg"} mx-auto`}>
            <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <ChatMessageBubble 
                      message={msg} 
                      onOptionClick={(option) => !isStreaming && onSendMessage(option)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {isStreaming && messages[messages.length - 1]?.content === "" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2.5 text-muted-foreground text-xs pl-10"
                >
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse [animation-delay:300ms]" />
                  </div>
                  <span className="text-muted-foreground/70">Thinking…</span>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="px-2 sm:px-3 pb-3 sm:pb-4 pt-2 safe-bottom">
            <div className={`${isFullWidth ? "max-w-2xl" : "max-w-lg"} mx-auto`}>
              <div className="bg-card rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-end gap-2 sm:gap-2.5 shadow-card border border-border/60 transition-shadow focus-within:shadow-elevated focus-within:border-primary/20">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isStreaming ? "Waiting for response…" : "Type your request…"}
                  disabled={isStreaming}
                  rows={1}
                  className="flex-1 bg-transparent text-sm leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/50 disabled:opacity-50 py-1 max-h-[120px]"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isStreaming}
                  className="rounded-xl h-8 w-8 shrink-0 mb-0.5 shadow-sm"
                >
                  {isStreaming ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatPanel;
