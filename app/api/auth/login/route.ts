import { NextResponse } from "next/server";
import { getUserByEmailRaw, sanitizeUser, isAdminEmail } from "@/lib/store";
import { verifyPassword, sessionCookieName } from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";

const ADMIN_COOKIE_NAME = "ds_admin_session";

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

  const user = await getUserByEmailRaw(email);
  if (!user) {
    return withCors(NextResponse.json({ error: "No account found with that email." }, { status: 401 }));
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return withCors(NextResponse.json({ error: "Incorrect password." }, { status: 401 }));
  }

  const isAdmin = isAdminEmail(user.email);
  const res = NextResponse.json({ ...sanitizeUser(user), isAdmin });
  res.cookies.set(sessionCookieName(), user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  // The main admin account gets straight into the CRM dashboard — no separate admin password needed.
  if (isAdmin) {
    res.cookies.set(ADMIN_COOKIE_NAME, "authenticated", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });
  }
  return withCors(res);
}
