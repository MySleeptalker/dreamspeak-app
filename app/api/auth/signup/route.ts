import { NextResponse } from "next/server";
import { createUser, isAdminEmail } from "@/lib/store";
import { sessionCookieName } from "@/lib/auth";
import { withCors, corsPreflight } from "@/lib/cors";
import { CreateUserInput } from "@/types";

const ADMIN_COOKIE_NAME = "ds_admin_session";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateUserInput>;
  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const phone = (body.phone || "").trim();
  const password = (body.password || "").trim();

  if (!name || !email || !phone || !password) {
    return withCors(NextResponse.json({ error: "Name, email, phone, and password are all required." }, { status: 400 }));
  }
  if (password.length < 6) {
    return withCors(NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 }));
  }

  const { user, error } = await createUser({ name, email, phone, password });
  if (error || !user) {
    return withCors(NextResponse.json({ error }, { status: 409 }));
  }

  const isAdmin = isAdminEmail(user.email);
  const res = NextResponse.json({ ...user, isAdmin }, { status: 201 });
  res.cookies.set(sessionCookieName(), user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 days — "log in automatically" going forward
  });
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
