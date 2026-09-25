import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fid: string }> }
) {
  try {
    const { id, fid } = await params;
    const res = await fetch(`${API_BASE}/v1/reviews/${id}/findings/${fid}/apply`, {
      method: "POST",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ detail: "Proxy error" }, { status: 500 });
  }
}