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

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        padding: "32px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1180,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>MemeSwap</h1>
        <WalletMultiButton />
      </div>

      <Chart mint={activeMint} />

      <div
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Swap />
        <RugCheck onChecked={setActiveMint} />
      </div>
    </main>
  );
}
