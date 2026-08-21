import { NextResponse } from "next/server";
import { getUserByEmailRaw, sanitizeUser } from "@/lib/store";
import { verifyPassword, sessionCookieName } from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = (body.email || "").trim().toLowerCase();
  const password = (body.password || "").trim();

  if (!email || !password) {
    return withCors(NextResponse.json({ error: "Email and password are required." }, { status: 400 }));
  }

  const user = getUserByEmailRaw(email);
  if (!user) {
    return withCors(NextResponse.json({ error: "No account found with that email." }, { status: 401 }));
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return withCors(NextResponse.json({ error: "Incorrect password." }, { status: 401 }));
  }

  const res = NextResponse.json(sanitizeUser(user));
  res.cookies.set(sessionCookieName(), user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return withCors(res);
}
