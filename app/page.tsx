"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Swap } from "./swap";
import { RugCheck } from "./rugcheck";
import { Chart } from "./chart";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export default function Home() {
  const [activeMint, setActiveMint] = useState("");
  const [activeSymbol, setActiveSymbol] = useState("");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        padding: "20px 28px 48px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "1px solid #1c1c1c",
        }}
      >
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Meme<span style={{ color: "#7c4dff" }}>Swap</span>
        </h1>
        <WalletMultiButton />
      </div>

      <div style={{ marginBottom: 24 }}>
        {activeMint ? (
          <Chart mint={activeMint} />
        ) : (
          <div
            style={{
              height: 440, borderRadius: 16, border: "1px solid #1c1c1c",
              background: "#101010", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#555", fontSize: 15,
            }}
          >
            Check a token below to load its chart ↓
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap",
        }}
      >
        <Swap tokenMint={activeMint} tokenSymbol={activeSymbol} />
        <RugCheck
          onChecked={(mint, symbol) => {
            setActiveMint(mint);
            setActiveSymbol(symbol);
          }}
        />
      </div>
    </main>
  );
}
