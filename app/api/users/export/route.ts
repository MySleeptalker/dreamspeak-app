import { NextResponse } from "next/server";
import { getAllUsers, usersToCsv } from "@/lib/store";
import { withCors, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const csv = usersToCsv(getAllUsers());
  const res = new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dreamspeak-users-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
  return withCors(res);
}
