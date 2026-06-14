"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

const SOL = "So11111111111111111111111111111111111111112";
const REFERRAL_ACCOUNT = "9h7yzTc1BQzbQnMV4GkvC8somJQsQKY3aiqapGX7e5qh";
const FEE_BPS = 50;

export function Swap({ tokenMint, tokenSymbol }: { tokenMint?: string; tokenSymbol?: string }) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [amount, setAmount] = useState("0.1");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [status, setStatus] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const target = tokenMint || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const targetLabel = tokenSymbol || (tokenMint ? "token" : "USDC");
  const inputMint = side === "buy" ? SOL : target;
  const outputMint = side === "buy" ? target : SOL;
  const inputLabel = side === "buy" ? "SOL" : targetLabel;
  const outputLabel = side === "buy" ? targetLabel : "SOL";

  async function tokenDecimals(m: string) {
    try {
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1, method: "getAccountInfo",
          params: [m, { encoding: "jsonParsed" }],
        }),
      });
      const j = await res.json();
      return j?.result?.value?.data?.parsed?.info?.decimals ?? 6;
    } catch {
      return 6;
    }
  }

  async function getQuote() {
    setBusy(true);
    setStatus("Getting quote...");
    setQuote(null);
    try {
      const inDec = side === "buy" ? 9 : await tokenDecimals(target);
      const rawAmount = Math.floor(parseFloat(amount) * 10 ** inDec);
      const url =
        `https://lite-api.jup.ag/swap/v1/quote` +
        `?inputMint=${inputMint}` +
        `&outputMint=${outputMint}` +
        `&amount=${rawAmount}` +
        `&slippageBps=150` +
        `&platformFeeBps=${FEE_BPS}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        setStatus("No route: " + data.error);
        setBusy(false);
        return;
      }
      setQuote(data);
      const outDec = side === "buy" ? await tokenDecimals(target) : 9;
      const outAmt = (Number(data.outAmount) / 10 ** outDec).toLocaleString(
        undefined, { maximumFractionDigits: 6 }
      );
      setStatus(`≈ ${outAmt} ${outputLabel}`);
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
    setBusy(false);
  }

  async function doSwap() {
    if (!publicKey || !signTransaction || !quote) return;
    setBusy(true);
    setStatus("Building transaction...");
    try {
      const res = await fetch("https://lite-api.jup.ag/swap/v1/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toBase58(),
          wrapAndUnwrapSol: true,
          feeAccount: REFERRAL_ACCOUNT,
        }),
      });
      const { swapTransaction, error } = await res.json();
      if (error) {
        setStatus("Build error: " + error);
        setBusy(false);
        return;
      }
      const tx = VersionedTransaction.deserialize(
        Buffer.from(swapTransaction, "base64")
      );
      setStatus("Approve in wallet...");
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      setStatus("Confirming...");
      await connection.confirmTransaction(sig, "confirmed");
      setStatus("Done: " + sig.slice(0, 12) + "...");
      setQuote(null);
    } catch (e: any) {
      setStatus("Error: " + (e.message || "swap failed"));
    }
    setBusy(false);
  }

  return (
    <div style={{ padding: 24, borderRadius: 16, background: "#161616", width: 360, display: "flex", flexDirection: "column", gap: 12, border: "1px solid #222" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { setSide("buy"); setQuote(null); setStatus(""); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: side === "buy" ? "#00c853" : "#222", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Buy</button>
        <button onClick={() => { setSide("sell"); setQuote(null); setStatus(""); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: side === "sell" ? "#ff5252" : "#222", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Sell</button>
      </div>
      <div style={{ fontSize: 13, opacity: 0.6 }}>
        {side === "buy" ? `Buy ${targetLabel} with SOL` : `Sell ${targetLabel} for SOL`}
        {!tokenMint && <span style={{ color: "#7c4dff" }}> — check a token to trade it</span>}
      </div>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Amount of ${inputLabel}`} style={{ padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 18 }} />
      <button onClick={getQuote} disabled={busy || !amount} style={{ padding: 12, borderRadius: 8, border: "none", background: busy ? "#333" : "#512da8", color: "#fff", fontWeight: 600, cursor: busy ? "default" : "pointer" }}>{busy ? "..." : "Get Quote"}</button>
      {quote && <button onClick={doSwap} disabled={busy || !publicKey} style={{ padding: 12, borderRadius: 8, border: "none", background: side === "buy" ? "#00c853" : "#ff5252", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{!publicKey ? "Connect wallet" : side === "buy" ? "Buy" : "Sell"}</button>}
      {status && <div style={{ fontSize: 13, opacity: 0.85, wordBreak: "break-all" }}>{status}</div>}
    </div>
  );
}