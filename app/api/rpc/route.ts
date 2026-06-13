import { NextRequest, NextResponse } from "next/server";

const HELIUS = "https://mainnet.helius-rpc.com/?api-key=" + process.env.HELIUS_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(HELIUS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
