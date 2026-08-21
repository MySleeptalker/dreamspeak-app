import { NextResponse } from "next/server";
import { getAllInteractions, getInteractionsForUser, createInteraction } from "@/lib/store";
import { withCors, corsPreflight } from "@/lib/cors";
import { CreateInteractionInput } from "@/types";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const items = userId ? await getInteractionsForUser(userId) : await getAllInteractions();
  return withCors(NextResponse.json(items));
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateInteractionInput>;
  if (!body.userId || !body.channel || !body.direction || !body.subject) {
    return withCors(NextResponse.json({ error: "userId, channel, direction, and subject are required" }, { status: 400 }));
  }
  const item = await createInteraction({
    userId: body.userId,
    channel: body.channel,
    direction: body.direction,
    subject: body.subject,
    body: body.body || "",
  });
  return withCors(NextResponse.json(item, { status: 201 }));
}
