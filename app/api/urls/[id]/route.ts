import { NextRequest, NextResponse } from "next/server";
import { getUrlWithScores } from "@/lib/store";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const data = await getUrlWithScores(id);

  if (!data) {
    return NextResponse.json({ error: "URL result not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}
