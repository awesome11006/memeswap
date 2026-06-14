"use client";

import { useEffect, useState } from "react";

type Tok = {
  address: string;
  symbol: string;
  name: string;
  priceUsd: string;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  ageHours: number | null;
};

export function Trending({ onPick }: { onPick?: (mint: string, symbol: string) => void }) {
  const [toks, setToks] = useState<Tok[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // Pull recently-boosted/active Solana tokens, then enrich with pair data
      const profRes = await fetch("https://api.dexscreener.com/token-boosts/latest/v1");
      const profiles = await profRes.json();
      const solMints: string[] = (Array.isArray(profiles) ? profiles : [])
        .filter((p: any) => p.chainId === "solana")
        .map((p: any) => p.tokenAddress)
        .slice(0, 30);

      if (solMints.length === 0) {
        setErr("No trending tokens returned right now.");
        setLoading(false);
        return;
      }

      // DexScreener tokens endpoint accepts comma-separated addresses
      const chunks: string[] = [];
      for (let i = 0; i < solMints.length; i += 30) {
        chunks.push(solMints.slice(i, i + 30).join(","));
      }
      const out: Tok[] = [];
      for (const c of chunks) {
        const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${c}`);
        const d = await r.json();
        const pairs = d.pairs || [];
        const seen = new Set<string>();
        for (const p of pairs) {
          const addr = p.baseToken?.address;
          if (!addr || seen.has(addr)) continue;
          seen.add(addr);
          out.push({
            address: addr,
            symbol: p.baseToken?.symbol || "?",
            name: p.baseToken?.name || "Unknown",
            priceUsd: p.priceUsd || "?",
            liquidity: p.liquidity?.usd || 0,
            volume24h: p.volume?.h24 || 0,
            priceChange24h: p.priceChange?.h24 || 0,
            ageHours: p.pairCreatedAt
              ? Math.floor((Date.now() - p.pairCreatedAt) / 3600000)
              : null,
          });
        }
      }
      // Sort by 24h volume (proxy for "popular right now")
      out.sort((a, b) => b.volume24h - a.volume24h);
      setToks(out.slice(0, 20));
    } catch (e: any) {
      setErr("Error loading trending: " + e.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // refresh every 60s
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ width: "100%", marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>🔥 Trending Solana Tokens</div>
        <button onClick={load} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid #333", background: "#161616", color: "#aaa", cursor: "pointer" }}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
      {err && <div style={{ fontSize: 13, color: "#ff6b6b" }}>{err}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {toks.map((t) => (
          <div
            key={t.address}
            onClick={() => onPick && onPick(t.address, t.symbol)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              borderRadius: 10, background: "#141414", border: "1px solid #1e1e1e",
              cursor: "pointer", fontSize: 13,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1c1c1c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#141414")}
          >
            <div style={{ fontWeight: 700, minWidth: 80 }}>{t.symbol}</div>
            <div style={{ opacity: 0.5, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
            <div style={{ minWidth: 90, textAlign: "right" }}>${t.priceUsd}</div>
            <div style={{ minWidth: 70, textAlign: "right", color: t.priceChange24h >= 0 ? "#00c853" : "#ff5252" }}>
              {t.priceChange24h >= 0 ? "+" : ""}{t.priceChange24h.toFixed(1)}%
            </div>
            <div style={{ minWidth: 90, textAlign: "right", opacity: 0.7 }}>${(t.volume24h / 1000).toFixed(0)}k vol</div>
            {t.ageHours !== null && t.ageHours < 48 && (
              <div style={{ minWidth: 48, textAlign: "right", color: "#ffaa00", fontSize: 11 }}>{t.ageHours}h</div>
            )}
          </div>
        ))}
        {!loading && toks.length === 0 && !err && (
          <div style={{ opacity: 0.5, fontSize: 13 }}>No tokens found.</div>
        )}
      </div>
    </div>
  );
}
