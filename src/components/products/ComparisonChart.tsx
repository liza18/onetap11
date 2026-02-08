import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { Product } from "@/types/commerce";

interface ComparisonChartProps {
  products: Product[];
  highlightId: string;
}

const ComparisonChart = ({ products, highlightId }: ComparisonChartProps) => {
  const priceData = products.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 13) + "…" : p.name,
    price: p.price,
    id: p.id,
  }));

  const scoreData = products.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 13) + "…" : p.name,
    score: p.matchScore,
    id: p.id,
  }));

  const radarData = [
    { metric: "Match", value: products.find(p => p.id === highlightId)?.matchScore || 0 },
    { metric: "Value", value: getValueScore(products, highlightId) },
    { metric: "Speed", value: getDeliveryScore(products, highlightId) },
  ];

  const tooltipStyle = {
    backgroundColor: "hsl(0, 0%, 100%)",
    border: "1px solid hsl(230, 12%, 91%)",
    borderRadius: "12px",
    padding: "8px 12px",
    fontSize: "11px",
    color: "hsl(230, 25%, 10%)",
    boxShadow: "0 4px 12px -2px hsl(230 25% 10% / 0.08)",
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">Price Comparison</p>
        <ResponsiveContainer width="100%" height={Math.max(100, products.length * 28 + 20)}>
          <BarChart data={priceData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fontSize: 10, fill: "hsl(230, 8%, 46%)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              cursor={{ fill: "hsl(230, 12%, 95%)" }}
            />
            <Bar dataKey="price" radius={[0, 6, 6, 0]} barSize={14}>
              {priceData.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={entry.id === highlightId ? "hsl(246, 80%, 60%)" : "hsl(230, 12%, 88%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">Match Score</p>
        <ResponsiveContainer width="100%" height={Math.max(100, products.length * 28 + 20)}>
          <BarChart data={scoreData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fontSize: 10, fill: "hsl(230, 8%, 46%)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [`${value}%`, "Score"]}
              cursor={{ fill: "hsl(230, 12%, 95%)" }}
            />
            <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={14}>
              {scoreData.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={entry.id === highlightId ? "hsl(152, 60%, 42%)" : "hsl(230, 12%, 88%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">Overall Assessment</p>
        <ResponsiveContainer width="100%" height={160}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
            <PolarGrid stroke="hsl(230, 12%, 91%)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fontSize: 10, fill: "hsl(230, 8%, 46%)" }}
            />
            <Radar
              dataKey="value"
              stroke="hsl(246, 80%, 60%)"
              fill="hsl(246, 80%, 60%)"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

function getValueScore(products: Product[], highlightId: string): number {
  const product = products.find((p) => p.id === highlightId);
  if (!product) return 50;
  const maxPrice = Math.max(...products.map((p) => p.price));
  if (maxPrice === 0) return 80;
  return Math.round((1 - product.price / maxPrice) * 80 + 20);
}

function getDeliveryScore(products: Product[], highlightId: string): number {
  const product = products.find((p) => p.id === highlightId);
  if (!product) return 50;
  const estimate = product.deliveryEstimate.toLowerCase();
  if (estimate.includes("1 day") || estimate.includes("same day") || estimate.includes("next day")) return 95;
  if (estimate.includes("1-2") || estimate.includes("2 day")) return 85;
  if (estimate.includes("2-3") || estimate.includes("3 day")) return 75;
  if (estimate.includes("3-5") || estimate.includes("5 day")) return 60;
  return 50;
}

export default ComparisonChart;
