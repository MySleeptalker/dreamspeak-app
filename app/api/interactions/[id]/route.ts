import { NextResponse } from "next/server";
import { deleteInteraction } from "@/lib/store";
import { withCors, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const success = deleteInteraction(params.id);
  if (!success) return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }));
  return withCors(NextResponse.json({ success: true }));
}
