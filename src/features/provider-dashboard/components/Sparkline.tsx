interface SparklineProps {
  values: number[];
  highlightLast?: boolean;
}

export function Sparkline({ values, highlightLast = true }: SparklineProps) {
  return (
    <div className="dash-spark">
      {values.map((v, i) => (
        <span
          key={i}
          style={{ height: `${Math.max(8, Math.min(100, v))}%` }}
          className={highlightLast && i === values.length - 1 ? "peak" : ""}
        />
      ))}
    </div>
  );
}
