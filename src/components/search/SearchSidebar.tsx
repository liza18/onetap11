import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Clock,
  TrendingUp,
  Filter,
  Loader2,
  Zap,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ProductCategory, CATEGORY_LABELS, SortOption } from "@/types/commerce";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchSidebarProps {
  searchHistory: string[];
  suggestedQueries: string[];
  isSearching: boolean;
  activeCategory: ProductCategory | "all";
  onCategoryChange: (cat: ProductCategory | "all") => void;
  availableCategories: (ProductCategory | "all")[];
  productCount: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onQuerySelect: (query: string) => void;
  cacheHitRate: number;
  recentCacheQueries: string[];
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: "best-match", label: "Best Match (A*)", icon: "🧠" },
  { value: "price-low", label: "Price: Low → High", icon: "💰" },
  { value: "price-high", label: "Price: High → Low", icon: "💎" },
  { value: "delivery", label: "Fastest Delivery", icon: "🚀" },
];

const SearchSidebar = ({
  searchHistory,
  suggestedQueries,
  isSearching,
  activeCategory,
  onCategoryChange,
  availableCategories,
  productCount,
  sortBy,
  onSortChange,
  onQuerySelect,
  cacheHitRate,
  recentCacheQueries,
}: SearchSidebarProps) => {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);

  return (
    <div className="w-full h-full bg-card/80 backdrop-blur-sm border-r border-border/40 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 sm:px-4 pt-4 sm:pt-5 pb-2 sm:pb-3 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Search className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="font-display font-bold text-sm tracking-tight">Search Engine</h2>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isSearching ? "bg-accent animate-pulse" : "bg-success"}`} />
            <span className="text-[10px] text-muted-foreground font-medium">
              {isSearching ? "Searching…" : "Ready"}
            </span>
          </div>
          {productCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">{productCount}</span> results
            </span>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 sm:p-3 space-y-1">
          {/* Search Status */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span className="text-xs font-medium text-primary">Intelligent Search Active</span>
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-1.5 w-full rounded-full" />
                    <p className="text-[10px] text-muted-foreground">
                      Crawling retailers • Extracting products • Ranking with A*
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cache Performance */}
          {recentCacheQueries.length > 0 && (
            <div className="bg-success/5 border border-success/10 rounded-xl p-3 mb-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="h-3 w-3 text-success" />
                <span className="text-[10px] font-semibold text-success">Cache Active</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {recentCacheQueries.length} queries cached • Instant retrieval
              </p>
            </div>
          )}

          {/* Filters Section */}
          <CollapsibleSection
            title="Filters & Sort"
            icon={<Filter className="h-3.5 w-3.5" />}
            open={filtersOpen}
            onToggle={() => setFiltersOpen(!filtersOpen)}
          >
            {/* Sort */}
            <div className="space-y-1 mb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sort by</p>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSortChange(opt.value)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    sortBy === opt.value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <span className="mr-1.5">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Categories */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Category</p>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {cat === "all" ? "All Categories" : CATEGORY_LABELS[cat as ProductCategory] || cat}
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Search History */}
          <CollapsibleSection
            title="Search History"
            icon={<Clock className="h-3.5 w-3.5" />}
            open={historyOpen}
            onToggle={() => setHistoryOpen(!historyOpen)}
            badge={searchHistory.length > 0 ? searchHistory.length : undefined}
          >
            {searchHistory.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic px-1">No searches yet</p>
            ) : (
              <div className="space-y-1">
                {searchHistory.map((query, i) => (
                  <button
                    key={`${query}-${i}`}
                    onClick={() => onQuerySelect(query)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all truncate"
                  >
                    <Clock className="h-3 w-3 inline mr-1.5 opacity-40" />
                    {query}
                  </button>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Suggested Queries */}
          <CollapsibleSection
            title="Suggestions"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            open={suggestionsOpen}
            onToggle={() => setSuggestionsOpen(!suggestionsOpen)}
          >
            <div className="space-y-1">
              {suggestedQueries.map((query, i) => (
                <button
                  key={`suggestion-${i}`}
                  onClick={() => onQuerySelect(query)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
                >
                  <TrendingUp className="h-3 w-3 inline mr-1.5 text-primary/40" />
                  {query}
                </button>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </ScrollArea>

      {/* Footer Performance */}
      <div className="px-3 sm:px-4 py-2 border-t border-border/30 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Algorithm</span>
          <span className="text-[9px] text-muted-foreground">A* + QuickSort</span>
        </div>
      </div>
    </div>
  );
};

/** Collapsible section component */
function CollapsibleSection({
  title,
  icon,
  open,
  onToggle,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/30 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-secondary/30 transition-colors"
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-semibold flex-1 text-left">{title}</span>
        {badge !== undefined && (
          <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
            {badge}
          </span>
        )}
        {open ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchSidebar;
