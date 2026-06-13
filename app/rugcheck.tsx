"use client";

import { useState } from "react";

const HELIUS = "/api/rpc";

export function RugCheck() {
  const [mint, setMint] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function rpc(method: string, params: any[]) {
    const res = await fetch(HELIUS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const j = await res.json();
    return j.result;
  }

  async function check() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      // 1. On-chain mint info (authorities + supply)
      const mintInfo = await rpc("getAccountInfo", [
        mint,
        { encoding: "jsonParsed" },
      ]);

      let mintAuthority = null;
      let freezeAuthority = null;
      let supply = 0;
      let decimals = 0;

      if (mintInfo?.value?.data?.parsed?.info) {
        const info = mintInfo.value.data.parsed.info;
        mintAuthority = info.mintAuthority;
        freezeAuthority = info.freezeAuthority;
        supply = Number(info.supply);
        decimals = info.decimals;
      } else {
        setError("Not a valid SPL token mint address.");
        setLoading(false);
        return;
      }

      // 2. Top holders concentration
      const largest = await rpc("getTokenLargestAccounts", [mint]);
      let topHolderPct = 0;
      let top10Pct = 0;
      if (largest?.value && supply > 0) {
        const amounts = largest.value.map((a: any) => Number(a.amount));
        topHolderPct = (amounts[0] / supply) * 100;
        top10Pct =
          (amounts.slice(0, 10).reduce((s: number, n: number) => s + n, 0) /
            supply) *
          100;
      }

      // 3. DexScreener market data
      let liquidity = 0,
        volume24h = 0,
        priceUsd = "?",
        ageHours: number | null = null,
        name = "Unknown",
        symbol = "?";
      try {
        const dsRes = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${mint}`
        );
        const ds = await dsRes.json();
        const pair = ds.pairs?.[0];
        if (pair) {
          liquidity = pair.liquidity?.usd || 0;
          volume24h = pair.volume?.h24 || 0;
          priceUsd = pair.priceUsd || "?";
          name = pair.baseToken?.name || "Unknown";
          symbol = pair.baseToken?.symbol || "?";
          if (pair.pairCreatedAt)
            ageHours = Math.floor(
              (Date.now() - pair.pairCreatedAt) / 3600000
            );
        }
      } catch {}

      // 4. Risk scoring
      const flags: { label: string; level: string }[] = [];
      if (mintAuthority)
        flags.push({
          label: "Mint authority active — dev can print unlimited tokens",
          level: "high",
        });
      if (freezeAuthority)
        flags.push({
          label: "Freeze authority active — dev can freeze your wallet (honeypot risk)",
          level: "high",
        });
      if (topHolderPct > 50)
        flags.push({
          label: `Top wallet holds ${topHolderPct.toFixed(1)}% — extreme dump risk`,
          level: "high",
        });
      else if (topHolderPct > 20)
        flags.push({
          label: `Top wallet holds ${topHolderPct.toFixed(1)}%`,
          level: "med",
        });
      if (top10Pct > 80)
        flags.push({
          label: `Top 10 wallets hold ${top10Pct.toFixed(1)}% — very concentrated`,
          level: "high",
        });
      if (liquidity > 0 && liquidity < 5000)
        flags.push({ label: "Very low liquidity (<$5k)", level: "high" });
      else if (liquidity > 0 && liquidity < 20000)
        flags.push({ label: "Low liquidity (<$20k)", level: "med" });
      if (ageHours !== null && ageHours < 24)
        flags.push({ label: `Brand new (${ageHours}h old)`, level: "med" });

      const greens: string[] = [];
      if (!mintAuthority) greens.push("Mint authority revoked — supply is fixed");
      if (!freezeAuthority) greens.push("Freeze authority revoked — can't freeze your tokens");
      if (topHolderPct > 0 && topHolderPct < 20)
        greens.push(`Top wallet only holds ${topHolderPct.toFixed(1)}%`);

      setResult({
        name, symbol, priceUsd, liquidity, volume24h, ageHours,
        mintAuthority, freezeAuthority, topHolderPct, top10Pct,
        flags, greens,
      });
    } catch (e: any) {
      setError("Error: " + e.message);
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        marginTop: 24,
        padding: 24,
        borderRadius: 16,
        background: "#161616",
        width: 380,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 14, opacity: 0.6 }}>🔍 Rug Check</div>
      <input
        value={mint}
        onChange={(e) => setMint(e.target.value.trim())}
        placeholder="Paste token address..."
        style={{
          padding: 12, borderRadius: 8, border: "1px solid #333",
          background: "#0a0a0a", color: "#fff", fontSize: 14,
        }}
      />
      <button
        onClick={check}
        disabled={loading || !mint}
        style={{
          padding: 12, borderRadius: 8, border: "none",
          background: loading ? "#333" : "#512da8", color: "#fff",
          fontWeight: 600, cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Scanning chain..." : "Check Token"}
      </button>

      {error && <div style={{ fontSize: 13, color: "#ff6b6b" }}>{error}</div>}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {result.name} ({result.symbol})
          </div>
          {result.priceUsd !== "?" && <Row label="Price" value={`$${result.priceUsd}`} />}
          {result.liquidity > 0 && <Row label="Liquidity" value={`$${result.liquidity.toLocaleString()}`} />}
          {result.volume24h > 0 && <Row label="24h Volume" value={`$${result.volume24h.toLocaleString()}`} />}
          {result.ageHours !== null && <Row label="Pair Age" value={`${result.ageHours}h`} />}
          {result.topHolderPct > 0 && <Row label="Top Holder" value={`${result.topHolderPct.toFixed(1)}%`} />}

          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {result.flags.map((f: any, i: number) => (
              <div key={i} style={{ fontSize: 13, color: f.level === "high" ? "#ff4444" : "#ffaa00" }}>
                ⚠ {f.label}
              </div>
            ))}
            {result.greens.map((g: string, i: number) => (
              <div key={i} style={{ fontSize: 13, color: "#00c853" }}>
                ✓ {g}
              </div>
            ))}
            {result.flags.length === 0 && (
              <div style={{ color: "#00c853", fontSize: 14, fontWeight: 600 }}>
                Looks clean — but always DYOR
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
            Not financial advice. On-chain data via Helius + DexScreener.
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
