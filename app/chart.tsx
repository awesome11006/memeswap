"use client";

export function Chart({ mint }: { mint: string }) {
  if (!mint) return null;
  return (
    <div
      style={{
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 16,
        overflow: "hidden",
        background: "#161616",
        width: "100%",
        maxWidth: 900,
        height: 480,
        border: "1px solid #222",
      }}
    >
      <iframe
        src={`https://dexscreener.com/solana/${mint}?embed=1&loadChartSettings=0&theme=dark&chartTheme=dark&info=0&trades=0`}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="chart"
        allow="clipboard-write"
      />
    </div>
  );
}
