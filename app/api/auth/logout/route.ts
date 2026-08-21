import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(sessionCookieName(), "", { path: "/", maxAge: 0 });
  return withCors(res);
}
