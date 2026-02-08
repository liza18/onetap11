import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { MessageSquare, Plus, LogOut, Clock, User, Loader2, Settings } from "lucide-react";
import ChatPanel from "@/components/chat/ChatPanel";
import ProductPanel from "@/components/products/ProductPanel";
import ProductDetailModal from "@/components/products/ProductDetailModal";
import CartDrawer from "@/components/cart/CartDrawer";
import { initialMessages } from "@/data/mockProducts";
import { ChatMessage, Product, SortOption, ProductCategory } from "@/types/commerce";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { streamChat } from "@/lib/streamChat";
import { searchProducts, extractSearchMarkers, stripSearchMarkers } from "@/lib/searchProducts";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
interface ConversationRecord {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}
const Chat = () => {
  const isMobile = useIsMobile();
  const {
    user,
    signOut
  } = useAuth();
  const {
    settings
  } = useSettings();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("best-match");
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "all">("all");
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hasProducts = products.length > 0;

  // Load conversation history
  useEffect(() => {
    if (user) loadConversations();
  }, [user]);
  const loadConversations = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from("conversations").select("*").eq("user_id", user.id).order("updated_at", {
      ascending: false
    }).limit(50);
    setConversations(data as ConversationRecord[] || []);
  };
  const createConversation = async (title: string): Promise<string | null> => {
    if (!user) return null;
    const {
      data
    } = await supabase.from("conversations").insert({
      user_id: user.id,
      title: title.slice(0, 100)
    }).select("id").maybeSingle();
    if (data) {
      loadConversations();
      return data.id;
    }
    return null;
  };
  const saveMessage = async (convId: string, role: string, content: string) => {
    await supabase.from("conversation_messages").insert({
      conversation_id: convId,
      role,
      content
    });
  };
  const loadConversation = async (convId: string) => {
    const {
      data
    } = await supabase.from("conversation_messages").select("*").eq("conversation_id", convId).order("created_at", {
      ascending: true
    });
    if (data && data.length > 0) {
      setMessages(data.map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "agent",
        content: m.content,
        timestamp: new Date(m.created_at)
      })));
      setConversationId(convId);
      setProducts([]);
      setActiveCategory("all");
    }
    setShowHistory(false);
  };
  const startNewConversation = () => {
    setMessages(initialMessages);
    setConversationId(null);
    setProducts([]);
    setActiveCategory("all");
    setShowHistory(false);
  };
  const handleSendMessage = useCallback(async (content: string) => {
    if (isStreaming) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    // Create conversation if first user message
    let activeConvId = conversationId;
    if (!activeConvId) {
      activeConvId = await createConversation(content);
      setConversationId(activeConvId);
    }

    // Save user message
    if (activeConvId) {
      saveMessage(activeConvId, "user", content);
      // Update conversation title + timestamp
      supabase.from("conversations").update({
        updated_at: new Date().toISOString()
      }).eq("id", activeConvId).then(() => {});
    }
    const history = messages.filter(m => m.role !== "agent" || m.content !== "").map(m => ({
      role: (m.role === "agent" ? "assistant" : "user") as "user" | "assistant",
      content: m.content
    }));
    history.push({
      role: "user",
      content
    });
    const agentMsgId = (Date.now() + 1).toString();
    let accumulated = "";
    setMessages(prev => [...prev, {
      id: agentMsgId,
      role: "agent",
      content: "",
      timestamp: new Date()
    }]);
    const controller = new AbortController();
    abortRef.current = controller;
    const currentConvId = activeConvId;
    await streamChat({
      messages: history,
      settings,
      signal: controller.signal,
      onDelta: chunk => {
        accumulated += chunk;
        const displayText = stripSearchMarkers(accumulated);
        setMessages(prev => prev.map(m => m.id === agentMsgId ? {
          ...m,
          content: displayText
        } : m));
      },
      onDone: async () => {
        setIsStreaming(false);
        abortRef.current = null;
        const searchQueries = extractSearchMarkers(accumulated);
        const cleanText = stripSearchMarkers(accumulated);
        setMessages(prev => prev.map(m => m.id === agentMsgId ? {
          ...m,
          content: cleanText
        } : m));

        // Save agent message
        if (currentConvId && cleanText) {
          saveMessage(currentConvId, "agent", cleanText);
        }
        if (searchQueries.length > 0) {
          setIsExtracting(true);
          const userContext = messages.filter(m => m.role === "user").map(m => m.content).join(" ") + " " + content;
          try {
            const found = await searchProducts(searchQueries, userContext, settings);
            if (found.length > 0) {
              setProducts(prev => {
                const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
                const newProducts = found.filter(p => !existingNames.has(p.name.toLowerCase()));
                return [...newProducts, ...prev];
              });
              setActiveCategory("all");
            }
          } catch (err) {
            console.error("Product search failed:", err);
          } finally {
            setIsExtracting(false);
          }
        }
        loadConversations();
      },
      onError: error => {
        setIsStreaming(false);
        abortRef.current = null;
        setMessages(prev => prev.filter(m => m.id !== agentMsgId));
        toast({
          title: "AI Error",
          description: error,
          variant: "destructive"
        });
      }
    });
  }, [messages, isStreaming, conversationId, settings]);
  const handleAddToCart = useCallback((productId: string) => {
    setCart(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);else next.add(productId);
      return next;
    });
  }, []);
  const handleRemoveFromCart = useCallback((productId: string) => {
    setCart(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }, []);
  const handleClearCart = useCallback(() => setCart(new Set()), []);
  const cartItems = useMemo(() => products.filter(p => cart.has(p.id)), [products, cart]);
  const similarProducts = useMemo(() => selectedProduct ? products.filter(p => p.id !== selectedProduct.id && p.category === selectedProduct.category).slice(0, 4) : [], [selectedProduct, products]);
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };
  return <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>

      {/* Header */}
      

      {/* Main content */}
      <div className={`flex-1 flex ${isMobile ? "flex-col" : "flex-row"} overflow-hidden relative z-10`}>
        <div className={`flex flex-col transition-all duration-500 ease-out ${hasProducts ? isMobile ? "h-1/2 border-b border-border/30" : "w-[440px] min-w-[380px] border-r border-border/30" : "flex-1"}`}>
          <ChatPanel messages={messages} onSendMessage={handleSendMessage} isStreaming={isStreaming} isFullWidth={!hasProducts} />
        </div>

        {hasProducts && <div className="flex-1 overflow-hidden">
            <ProductPanel products={products} sortBy={sortBy} onSortChange={setSortBy} activeCategory={activeCategory} onCategoryChange={setActiveCategory} cart={cart} onAddToCart={handleAddToCart} isExtracting={isExtracting} onSelectProduct={setSelectedProduct} />
          </div>}
      </div>

      <ProductDetailModal product={selectedProduct} similarProducts={similarProducts} onClose={() => setSelectedProduct(null)} inCart={selectedProduct ? cart.has(selectedProduct.id) : false} onAddToCart={() => selectedProduct && handleAddToCart(selectedProduct.id)} />
    </div>;
};
export default Chat;