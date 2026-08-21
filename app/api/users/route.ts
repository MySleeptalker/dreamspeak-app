import { NextResponse } from "next/server";
import { getAllUsers, createUser } from "@/lib/store";
import { withCors, corsPreflight } from "@/lib/cors";
import { CreateUserInput } from "@/types";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  return withCors(NextResponse.json(getAllUsers()));
}

/** Admin/integration user creation. The game app should use /api/auth/signup instead
 *  so a session cookie gets set for the new account. */
export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateUserInput>;
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const phone = (body.phone || "").trim();
  const password = (body.password || "").trim();

  if (!name || !email || !phone || !password) {
    return withCors(NextResponse.json({ error: "name, email, phone, and password are all required" }, { status: 400 }));
  }

  const { user, error } = await createUser({ name, email, phone, password });
  if (error || !user) {
    return withCors(NextResponse.json({ error }, { status: 409 }));
  }
  return withCors(NextResponse.json(user, { status: 201 }));
}
