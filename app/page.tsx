"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Swap } from "./swap";
import { RugCheck } from "./rugcheck";
import { Chart } from "./chart";
import { Trending } from "./trending";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

type Tab = "trending" | "trade" | "rug";

export default function Home() {
  const [activeMint, setActiveMint] = useState("");
  const [activeSymbol, setActiveSymbol] = useState("");
  const [tab, setTab] = useState<Tab>("trending");

  function pick(mint: string, symbol: string) {
    setActiveMint(mint);
    setActiveSymbol(symbol);
    setTab("trade"); // clicking a token jumps to the trade view
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "trending", label: "🔥 Trending" },
    { id: "trade", label: "💱 Trade" },
    { id: "rug", label: "🔍 Rug Check" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", borderBottom: "1px solid #1c1c1c", position: "sticky", top: 0, background: "#0a0a0a", zIndex: 10 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Meme<span style={{ color: "#7c4dff" }}>Swap</span>
        </h1>
        {activeSymbol && (
          <div style={{ fontSize: 13, opacity: 0.6 }}>
            Active: <span style={{ color: "#7c4dff", fontWeight: 700 }}>{activeSymbol}</span>
          </div>
        )}
        <WalletMultiButton />
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, padding: "12px 28px 0", borderBottom: "1px solid #1c1c1c" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 20px",
              border: "none",
              borderBottom: tab === t.id ? "2px solid #7c4dff" : "2px solid transparent",
              background: "transparent",
              color: tab === t.id ? "#fff" : "#777",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "28px", maxWidth: 1100, margin: "0 auto" }}>
        {tab === "trending" && <Trending onPick={pick} />}

        {tab === "trade" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {activeMint ? (
              <Chart mint={activeMint} />
            ) : (
              <div style={{ height: 440, borderRadius: 16, border: "1px solid #1c1c1c", background: "#101010", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 15 }}>
                Pick a token from Trending, or paste one in Rug Check, to trade it
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Swap tokenMint={activeMint} tokenSymbol={activeSymbol} />
            </div>
          </div>
        )}

        {tab === "rug" && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <RugCheck onChecked={pick} />
          </div>
        )}
      </div>
    </main>
  );
}
