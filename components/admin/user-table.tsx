"use client";

import { useState } from "react";
import { DreamspeakUser, Plan } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash, Plus, Minus, Check, Loader2, Eye } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";

interface UserTableProps {
  users: DreamspeakUser[];
  onUpdate: (id: string, patch: Partial<DreamspeakUser>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onView: (user: DreamspeakUser) => void;
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "🌱 Beginner",
  intermediate: "🚀 Intermediate",
  advanced: "🎓 Advanced",
};

const LANG_FLAG: Record<string, string> = {
  spanish: "🇪🇸 Spanish",
  french: "🇫🇷 French",
  italian: "🇮🇹 Italian",
  japanese: "🇯🇵 Japanese",
  mandarin: "🇨🇳 Mandarin",
  korean: "🇰🇷 Korean",
  thai: "🇹🇭 Thai",
  hindi: "🇮🇳 Hindi",
  urdu: "🇵🇰 Urdu",
  arabic: "🇸🇦 Arabic",
  hebrew: "🇮🇱 Hebrew",
  greek: "🇬🇷 Greek",
};

export function UserTable({ users, onUpdate, onDelete, onView }: UserTableProps) {
  const [heartsDraft, setHeartsDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  function getHeartsValue(u: DreamspeakUser): string {
    return heartsDraft[u.id] ?? String(u.hearts);
  }

  async function saveHearts(u: DreamspeakUser) {
    const raw = getHeartsValue(u);
    const parsed = Math.max(0, Math.min(u.heartsMax, parseInt(raw, 10) || 0));
    setSavingId(u.id);
    await onUpdate(u.id, { hearts: parsed });
    setSavingId(null);
  }

  async function bumpHearts(u: DreamspeakUser, delta: number) {
    const next = Math.max(0, Math.min(u.heartsMax, u.hearts + delta));
    setSavingId(u.id);
    await onUpdate(u.id, { hearts: next });
    setSavingId(null);
  }

  async function changePlan(u: DreamspeakUser, plan: Plan) {
    setSavingId(u.id);
    await onUpdate(u.id, plan === "paid" ? { plan, hearts: u.heartsMax } : { plan });
    setSavingId(null);
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        No users yet. Once someone signs up in the Dreamspeak app, they&apos;ll show up here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Hearts</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>XP</TableHead>
            <TableHead>Streak</TableHead>
            <TableHead>Milestones</TableHead>
            <TableHead>Time on App</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium whitespace-nowrap">{u.name}</TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                <div>{u.email}</div>
                <div className="text-muted-foreground">{u.phone}</div>
              </TableCell>
              <TableCell>
                <Select value={u.plan} onValueChange={(v) => changePlan(u, v as Plan)}>
                  <SelectTrigger className="w-[110px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {u.plan === "paid" ? (
                  <Badge variant="secondary">∞ Unlimited</Badge>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => bumpHearts(u, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      max={u.heartsMax}
                      value={getHeartsValue(u)}
                      onChange={(e) => setHeartsDraft((d) => ({ ...d, [u.id]: e.target.value }))}
                      className="h-7 w-14 text-center px-1"
                    />
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => bumpHearts(u, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="icon" className="h-7 w-7" onClick={() => saveHearts(u)} disabled={savingId === u.id}>
                      {savingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    </Button>
                    <span className="text-xs text-muted-foreground">/ {u.heartsMax}</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {u.language ? (
                  <>
                    <div>{LANG_FLAG[u.language] || u.language}</div>
                    <div className="text-muted-foreground">{u.level ? LEVEL_LABEL[u.level] : "—"}</div>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not started</span>
                )}
              </TableCell>
              <TableCell>{u.xp.toLocaleString()}</TableCell>
              <TableCell>🔥 {u.streak}</TableCell>
              <TableCell>
                <Badge variant="outline">{u.achievements.length} 🏅</Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {differenceInDays(new Date(), new Date(u.firstSeenAt))} days
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(u.lastActiveAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onView(u)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Remove ${u.name} from Dreamspeak?`)) onDelete(u.id);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
