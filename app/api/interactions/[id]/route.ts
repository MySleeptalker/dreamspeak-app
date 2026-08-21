import { NextResponse } from "next/server";
import { deleteInteraction } from "@/lib/store";
import { withCors, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const success = await deleteInteraction(id);
  if (!success) return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }));
  return withCors(NextResponse.json({ success: true }));
}
