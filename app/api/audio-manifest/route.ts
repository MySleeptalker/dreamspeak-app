import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { withCors, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      return withCors(NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 500 }));
    }
    const sql = neon(url);
    const rows = await sql`SELECT data FROM audio_manifest WHERE id = 1 LIMIT 1;`;
    if (!rows.length) {
      return withCors(NextResponse.json({ error: "Audio manifest not found." }, { status: 404 }));
    }
    return withCors(
      NextResponse.json(rows[0].data, {
        headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
      })
    );
  } catch (err) {
    return withCors(
      NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load audio manifest." }, { status: 500 })
    );
  }
}
