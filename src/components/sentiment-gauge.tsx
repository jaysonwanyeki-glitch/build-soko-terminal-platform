import type { Sentiment } from "@/lib/sentiment";
import { classNames } from "@/lib/format";

export function SentimentGauge({ data }: { data: Sentiment }) {
  const angle = (data.score / 100) * 180 - 90; // -90..+90
  const cx = 100,
    cy = 90,
    r = 80;

  // semicircle arc segments
  const seg = (start: number, end: number, color: string) => {
    const p = (deg: number) => {
      const rad = (deg - 180) * (Math.PI / 180);
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    };
    const [x1, y1] = p(start);
    const [x2, y2] = p(end);
    return <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} stroke={color} strokeWidth="16" fill="none" strokeLinecap="round" />;
  };

  const needleX = cx + (r - 14) * Math.cos((angle - 90) * (Math.PI / 180));
  const needleY = cy + (r - 14) * Math.sin((angle - 90) * (Math.PI / 180));

  return (
    <div className="flex flex-col items-center p-4">
      <svg width="200" height="110" viewBox="0 0 200 110">
        {seg(0, 36, "#ff5d75")}
        {seg(36, 72, "#bb6b00")}
        {seg(72, 108, "#7dffba")}
        {seg(108, 144, "#4ee8b0")}
        {seg(144, 180, "#00e676")}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#e7edf5" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill="#e7edf5" />
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="22" fontWeight="800" fill={data.color} className="mono" dy="0">
          {data.score}
        </text>
      </svg>
      <div className="-mt-2 text-sm font-black" style={{ color: data.color }}>
        {data.label}
      </div>
      <div className="mono mt-1 text-[10px] text-dim">Kenyan Market Sentiment</div>

      {/* factors */}
      <div className="mt-3 w-full space-y-2">
        {data.factors.map((f) => (
          <div key={f.label}>
            <div className="mb-0.5 flex items-center justify-between text-[10px]">
              <span className="text-muted">{f.label}</span>
              <span className="mono text-dim">{f.detail}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-term-800">
              <div className="h-full rounded-full" style={{ width: `${f.score}%`, background: data.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
