"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

// SOL and USDC mints for the default pair
const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// TODO: paste your Jupiter referral account address here
const REFERRAL_ACCOUNT = "9h7yzTc1BQzbQnMV4GkvC8somJQsQKY3aiqapGX7e5qh";
const FEE_BPS = 50; // 0.5% (50 basis points)

export function Swap() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [amount, setAmount] = useState("0.1");
  const [status, setStatus] = useState("");
  const [quote, setQuote] = useState<any>(null);

  async function getQuote() {
    setStatus("Getting quote...");
    setQuote(null);
    try {
      const lamports = Math.floor(parseFloat(amount) * 1e9); // SOL has 9 decimals
       const url =
        `https://lite-api.jup.ag/swap/v1/quote` +
        `?inputMint=${SOL}` +
        `&outputMint=${USDC}` +
        `&amount=${lamports}` +
        `&slippageBps=100` +
        `&platformFeeBps=${FEE_BPS}`;
        ``;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        setStatus("Quote error: " + data.error);
        return;
      }
      setQuote(data);
      const outUsdc = (Number(data.outAmount) / 1e6).toFixed(2);
      setStatus(`You get ~${outUsdc} USDC for ${amount} SOL`);
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
  }

  async function doSwap() {
    if (!publicKey || !signTransaction || !quote) return;
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
        setStatus("Swap build error: " + error);
        return;
      }
      const tx = VersionedTransaction.deserialize(
        Buffer.from(swapTransaction, "base64")
      );
      setStatus("Sign in Phantom...");
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      setStatus("Sent! Confirming... " + sig.slice(0, 8));
      await connection.confirmTransaction(sig, "confirmed");
      setStatus("✅ Swap complete: " + sig);
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
  }

  if (!publicKey) return null;

  return (
    <div
      style={{
        marginTop: 32,
        padding: 24,
        borderRadius: 16,
        background: "#161616",
        width: 360,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 14, opacity: 0.6 }}>Swap SOL → USDC</div>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{
          padding: 12,
          borderRadius: 8,
          border: "1px solid #333",
          background: "#0a0a0a",
          color: "#fff",
          fontSize: 18,
        }}
      />
      <button
        onClick={getQuote}
        style={{
          padding: 12,
          borderRadius: 8,
          border: "none",
          background: "#512da8",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Get Quote
      </button>
      {quote && (
        <button
          onClick={doSwap}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: "#00c853",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Swap
        </button>
      )}
      {status && (
        <div style={{ fontSize: 13, opacity: 0.8, wordBreak: "break-all" }}>
          {status}
        </div>
      )}
    </div>
  );
}

