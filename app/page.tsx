import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900 px-4">
      <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur text-center">
        <CardHeader>
          <CardTitle className="text-white text-2xl">🐑 Dreamspeak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-white/70 text-sm">
            One app, two doors: the learner-facing Dreamspeak app, and the admin CRM that powers it.
          </p>
          <Link href="/app">
            <Button className="w-full bg-fuchsia-600 hover:bg-fuchsia-500">Open Dreamspeak App</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
              Go to Admin Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
