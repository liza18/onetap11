import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ShoppingCart, Filter, Settings, Sparkles, LogOut } from "lucide-react";
import ChatPanel from "@/components/chat/ChatPanel";
import ProductPanel from "@/components/products/ProductPanel";
import ProductDetailModal from "@/components/products/ProductDetailModal";
import SearchSidebar from "@/components/search/SearchSidebar";
import { initialMessages } from "@/data/mockProducts";
import { ChatMessage, Product, SortOption, ProductCategory, CATEGORY_LABELS } from "@/types/commerce";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { streamChat } from "@/lib/streamChat";
import { searchProductsProgressive, extractSearchMarkers, stripSearchMarkers } from "@/lib/searchProducts";
import { productSearchCache, searchHistory } from "@/lib/searchCache";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface ConversationRecord {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const SUGGESTED_QUERIES = [
  "Best wireless headphones under $100",
  "Office supplies for remote work",
  "Gaming setup essentials",
  "Kitchen gadgets under $50",
  "Fitness tracker comparison",
];

const Chat = () => {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { settings } = useSettings();
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
  const [localSearchHistory, setLocalSearchHistory] = useState<string[]>([]);
  const [showMobileProducts, setShowMobileProducts] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Multi-group step navigation state
  const [searchGroups, setSearchGroups] = useState<string[]>([]);
  const [currentGroupStep, setCurrentGroupStep] = useState(0);

  const hasProducts = products.length > 0;
  const recentCacheQueries = useMemo(() => productSearchCache.getRecentQueries(5), [products]);
  const availableCategories: (ProductCategory | "all")[] = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(cats).sort()] as (ProductCategory | "all")[];
  }, [products]);

  // Load conversation history
  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  // Sync local search history
  useEffect(() => {
    setLocalSearchHistory(searchHistory.getRecent(8));
  }, [products]);

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    setConversations((data as ConversationRecord[]) || []);
  };

  const createConversation = async (title: string): Promise<string | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: title.slice(0, 100) })
      .select("id")
      .maybeSingle();
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
      content,
    });
  };

  const startNewConversation = () => {
    setMessages(initialMessages);
    setConversationId(null);
    setProducts([]);
    setActiveCategory("all");
    setSearchGroups([]);
    setCurrentGroupStep(0);
  };

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (isStreaming) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
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
        supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", activeConvId)
          .then(() => {});
      }

      const history = messages
        .filter((m) => m.role !== "agent" || m.content !== "")
        .map((m) => ({
          role: (m.role === "agent" ? "assistant" : "user") as "user" | "assistant",
          content: m.content,
        }));
      history.push({ role: "user", content });

      const agentMsgId = (Date.now() + 1).toString();
      let accumulated = "";
      setMessages((prev) => [
        ...prev,
        { id: agentMsgId, role: "agent", content: "", timestamp: new Date() },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;
      const currentConvId = activeConvId;

      await streamChat({
        messages: history,
        settings,
        signal: controller.signal,
        onDelta: (chunk) => {
          accumulated += chunk;
          const displayText = stripSearchMarkers(accumulated);
          setMessages((prev) =>
            prev.map((m) => (m.id === agentMsgId ? { ...m, content: displayText } : m))
          );
        },
        onDone: async () => {
          setIsStreaming(false);
          abortRef.current = null;

          const searchQueries = extractSearchMarkers(accumulated);
          const cleanText = stripSearchMarkers(accumulated);
          setMessages((prev) =>
            prev.map((m) => (m.id === agentMsgId ? { ...m, content: cleanText } : m))
          );

          if (currentConvId && cleanText) {
            saveMessage(currentConvId, "agent", cleanText);
          }

          if (searchQueries.length > 0) {
            setIsExtracting(true);

            // Set up search groups for step navigation
            if (searchQueries.length > 1) {
              setSearchGroups(searchQueries);
              setCurrentGroupStep(0);
            } else {
              setSearchGroups([]);
              setCurrentGroupStep(0);
            }

            // Clear previous products for new search session
            setProducts([]);

            const userContext =
              messages
                .filter((m) => m.role === "user")
                .map((m) => m.content)
                .join(" ") +
              " " +
              content;

            try {
              // Progressive search with cache + incremental loading
              await searchProductsProgressive(
                searchQueries,
                userContext,
                settings,
                (partialProducts, fromCache) => {
                  if (partialProducts.length > 0) {
                    setProducts((prev) => {
                      const existingNames = new Set(prev.map((p) => p.name.toLowerCase()));
                      const newProducts = partialProducts.filter(
                        (p) => !existingNames.has(p.name.toLowerCase())
                      );
                      return [...prev, ...newProducts];
                    });
                    setActiveCategory("all");

                    // Auto-switch to products tab on mobile
                    if (isMobile) {
                      setShowMobileProducts(true);
                    }

                    if (fromCache) {
                      console.log("⚡ Cache hit — instant results");
                    }
                  }
                }
              );
            } catch (err) {
              console.error("Product search failed:", err);
            } finally {
              setIsExtracting(false);
              setLocalSearchHistory(searchHistory.getRecent(8));
            }
          }
          loadConversations();
        },
        onError: (error) => {
          setIsStreaming(false);
          abortRef.current = null;
          setMessages((prev) => prev.filter((m) => m.id !== agentMsgId));
          toast({ title: "AI Error", description: error, variant: "destructive" });
        },
      });
    },
    [messages, isStreaming, conversationId, settings, isMobile]
  );

  const handleAddToCart = useCallback((productId: string) => {
    setCart((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const cartItems = useMemo(() => products.filter((p) => cart.has(p.id)), [products, cart]);

  const handleGoToCart = useCallback(() => {
    navigate("/cart", { state: { cartItems } });
  }, [cartItems, navigate]);

  const similarProducts = useMemo(
    () =>
      selectedProduct
        ? products.filter((p) => p.id !== selectedProduct.id && p.category === selectedProduct.category).slice(0, 4)
        : [],
    [selectedProduct, products]
  );

  /** Handle clicking a suggestion or history query from sidebar */
  const handleQueryFromSidebar = useCallback(
    (query: string) => {
      if (!isStreaming) {
        handleSendMessage(query);
        setSidebarOpen(false);
      }
    },
    [isStreaming, handleSendMessage]
  );

  const sidebarContent = (
    <SearchSidebar
      searchHistory={localSearchHistory}
      suggestedQueries={SUGGESTED_QUERIES}
      isSearching={isExtracting}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      availableCategories={availableCategories}
      productCount={products.length}
      sortBy={sortBy}
      onSortChange={setSortBy}
      onQuerySelect={handleQueryFromSidebar}
      cacheHitRate={0}
      recentCacheQueries={recentCacheQueries}
    />
  );

  return (
    <div className="h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10vw] -right-[10vw] w-[min(500px,60vw)] h-[min(500px,60vw)] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 -left-[5vw] w-[min(400px,50vw)] h-[min(400px,50vw)] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>

      {/* Top header bar */}
      <header className="glass-heavy flex items-center justify-between px-4 sm:px-6 h-12 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-hero flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-foreground">OneTap</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/settings")}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={signOut}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile tab bar for switching chat/products */}
      {isMobile && hasProducts && (
        <div className="flex items-center border-b border-border/30 bg-card/80 backdrop-blur-sm shrink-0 z-20 safe-top">
          <button
            onClick={() => setShowMobileProducts(false)}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors ${
              !showMobileProducts ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setShowMobileProducts(true)}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors ${
              showMobileProducts ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            Products ({products.length})
          </button>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button className="px-4 py-3 text-muted-foreground">
                <Filter className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-row overflow-hidden relative z-10">
        {/* Persistent sidebar — desktop only when products exist */}
        {!isMobile && hasProducts && (
          <div className="w-[clamp(220px,18vw,280px)] shrink-0">
            {sidebarContent}
          </div>
        )}

        {/* Chat panel */}
        <div
          className={`flex flex-col transition-all duration-500 ease-out ${
            hasProducts
              ? isMobile
                ? showMobileProducts ? "hidden" : "flex-1"
                : "w-[clamp(300px,28vw,420px)] shrink-0 border-r border-border/30"
              : "flex-1"
          }`}
        >
          <ChatPanel messages={messages} onSendMessage={handleSendMessage} isStreaming={isStreaming} isFullWidth={!hasProducts} />
        </div>

        {/* Product panel */}
        {hasProducts && (
          <div className={`flex-1 overflow-hidden ${isMobile ? (showMobileProducts ? "flex flex-col" : "hidden") : ""}`}>
            <ProductPanel
              products={products}
              sortBy={sortBy}
              onSortChange={setSortBy}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              cart={cart}
              onAddToCart={handleAddToCart}
              isExtracting={isExtracting}
              onSelectProduct={setSelectedProduct}
              searchGroups={searchGroups}
              currentGroupStep={currentGroupStep}
              onGroupStepChange={setCurrentGroupStep}
              onGoToCheckout={handleGoToCart}
            />
          </div>
        )}
      </div>

      {/* Floating Cart Button — only show when NOT using multi-group step nav */}
      {cartItems.length > 0 && searchGroups.length <= 1 && (
        <button
          onClick={handleGoToCart}
          className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom,1.5rem))] right-4 sm:right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 sm:px-5 py-3 rounded-2xl shadow-elevated hover:bg-primary/90 transition-all font-semibold text-sm"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Cart ({cartItems.length})</span>
        </button>
      )}

      <ProductDetailModal
        product={selectedProduct}
        similarProducts={similarProducts}
        onClose={() => setSelectedProduct(null)}
        inCart={selectedProduct ? cart.has(selectedProduct.id) : false}
        onAddToCart={() => selectedProduct && handleAddToCart(selectedProduct.id)}
      />
    </div>
  );
};

export default Chat;
