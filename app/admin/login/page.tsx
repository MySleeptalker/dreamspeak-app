"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900 px-4">
      <Card className="w-full max-w-sm border-white/10 bg-white/5 backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fuchsia-500/20">
            <Lock className="h-6 w-6 text-fuchsia-300" />
          </div>
          <CardTitle className="text-white text-xl">Dreamspeak Admin</CardTitle>
          <p className="text-sm text-white/60">Sign in to manage users and hearts</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">
                Admin Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                required
              />
            </div>
            {error && <p className="text-sm text-rose-300 font-medium">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
            <p className="text-xs text-white/40 text-center">
              Default password: <code className="text-white/60">dreamspeak2026</code> — change via the ADMIN_PASSWORD env var.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
