import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
  className?: string;
}

function buildPath(data: number[], w: number, h: number): string {
  if (data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: h - ((v - min) / range) * (h * 0.8) - h * 0.1,
  }));

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + stepX * 0.4;
    const cpx2 = curr.x - stepX * 0.4;
    d += ` C ${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
  }
  return d;
}

export function MiniChart({
  data,
  width = 80,
  height = 32,
  color = "#8B5CF6",
  filled = true,
  className,
}: MiniChartProps) {
  const linePath = useMemo(() => buildPath(data, width, height), [data, width, height]);

  const areaPath = useMemo(() => {
    if (!linePath) return "";
    return `${linePath} L ${width},${height} L 0,${height} Z`;
  }, [linePath, width, height]);

  const gradientId = useMemo(() => `mc-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      fill="none"
    >
      {filled && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      {filled && areaPath && (
        <path d={areaPath} fill={`url(#${gradientId})`} />
      )}
      {linePath && (
        <path d={linePath} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      )}
    </svg>
  );
}
