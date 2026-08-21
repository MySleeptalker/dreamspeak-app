import { NextResponse } from "next/server";
import { getUserById, updateUser, adminUpdateUser, deleteUser, adminResetPassword } from "@/lib/store";
import { withCors, corsPreflight } from "@/lib/cors";
import { UpdateUserInput } from "@/types";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }));
  return withCors(NextResponse.json(user));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as UpdateUserInput & { _source?: string; _resetPassword?: boolean };
  const { _source, _resetPassword, ...patch } = body;

  if (_resetPassword) {
    const tempPassword = await adminResetPassword(id);
    if (!tempPassword) return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }));
    return withCors(NextResponse.json({ tempPassword }));
  }

  // Admin dashboard edits (hearts override, plan toggle) should not count as "last active" usage.
  const updated = _source === "admin" ? await adminUpdateUser(id, patch) : await updateUser(id, patch);
  if (!updated) return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }));
  return withCors(NextResponse.json(updated));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const success = await deleteUser(id);
  if (!success) return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }));
  return withCors(NextResponse.json({ success: true }));
}
