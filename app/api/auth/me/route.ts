import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserById } from "@/lib/store";
import { sessionCookieName } from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName())?.value;
  if (!userId) {
    return withCors(NextResponse.json({ error: "Not logged in" }, { status: 401 }));
  }
  const user = getUserById(userId);
  if (!user) {
    return withCors(NextResponse.json({ error: "Session no longer valid" }, { status: 401 }));
  }
  return withCors(NextResponse.json(user));
}
