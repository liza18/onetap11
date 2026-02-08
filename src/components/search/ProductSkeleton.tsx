import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductSkeletonProps {
  count?: number;
}

const ProductSkeletonCard = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.08 }}
    className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-card"
  >
    {/* Image skeleton */}
    <Skeleton className="h-36 w-full rounded-none" />

    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>

      {/* Score bar */}
      <Skeleton className="h-1 w-full rounded-full" />

      {/* Price + delivery */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-0.5">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  </motion.div>
);

const ProductSkeleton = ({ count = 4 }: ProductSkeletonProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductSkeletonCard key={`skeleton-${i}`} index={i} />
    ))}
  </div>
);

export default ProductSkeleton;
