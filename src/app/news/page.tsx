import Link from "next/link";
import { Panel, SentimentDot, Tag } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import { getNews } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await getNews(60);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">NEWS WIRE <span className="text-amber">·</span> KENYAN MARKETS</h1>
        <p className="mono text-[11px] text-dim">Headlines across equities, bonds, FX and macro from the East African financial press.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {news.map((n) => (
          <Panel key={n.id} className="flex gap-3 p-4">
            <div className="pt-1">
              <SentimentDot sentiment={n.sentiment} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="amber">{n.category}</Tag>
                {n.relatedSymbol && (
                  <Link href={`/stocks/${n.relatedSymbol}`} className="mono rounded bg-term-700/60 px-1.5 py-0.5 text-[9px] text-muted hover:text-amber">
                    {n.relatedSymbol}
                  </Link>
                )}
                <span className="mono text-[10px] text-dim">· {timeAgo(n.publishedAt)}</span>
              </div>
              <h3 className="mt-1.5 text-sm font-semibold leading-snug text-fg">{n.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{n.summary}</p>
              <div className="mono mt-2 text-[10px] text-dim">{n.source}</div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
