"use client";

import dynamic from "next/dynamic";
import { Swap } from "./swap";
import { RugCheck } from "./rugcheck";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export default function Home() {
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
        padding: "40px",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 8 }}>
        MemeSwap
      </h1>
      <WalletMultiButton />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        <Swap />
        <RugCheck />
      </div>
    </main>
  );
}
