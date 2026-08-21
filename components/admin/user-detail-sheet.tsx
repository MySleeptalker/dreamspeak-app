"use client";

import { useState, useEffect, useCallback } from "react";
import { DreamspeakUser, Interaction, InteractionChannel, InteractionDirection } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, MessageSquare, FileText, Loader2, Trash, Clock, Key, Copy } from "lucide-react";
import { formatDistanceToNow, differenceInDays, format } from "date-fns";

interface UserDetailSheetProps {
  user: DreamspeakUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHANNEL_ICON: Record<InteractionChannel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  note: FileText,
};

const CHANNEL_LABEL: Record<InteractionChannel, string> = {
  email: "Email",
  sms: "Text Message",
  call: "Phone Call",
  note: "Internal Note",
};

export function UserDetailSheet({ user, open, onOpenChange }: UserDetailSheetProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<InteractionChannel>("note");
  const [direction, setDirection] = useState<InteractionDirection>("outbound");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const fetchInteractions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/interactions?userId=${user.id}`);
      const data = await res.json();
      setInteractions(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      fetchInteractions();
      setTempPassword(null);
    }
  }, [open, user, fetchInteractions]);

  async function handleLog() {
    if (!user || !subject.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, channel, direction, subject, body }),
      });
      if (res.ok) {
        setSubject("");
        setBody("");
        await fetchInteractions();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteInteraction(id: string) {
    await fetch(`/api/interactions/${id}`, { method: "DELETE" });
    setInteractions((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleResetPassword() {
    if (!user) return;
    if (!confirm(`Reset ${user.name}'s password? They'll need the new temporary password to log in.`)) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _resetPassword: true }),
      });
      const data = await res.json();
      if (res.ok && data.tempPassword) {
        setTempPassword(data.tempPassword);
      }
    } finally {
      setResetting(false);
    }
  }

  if (!user) return null;

  const tenureDays = differenceInDays(new Date(), new Date(user.firstSeenAt));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{user.name}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex-1">Profile & Usage</TabsTrigger>
            <TabsTrigger value="interactions" className="flex-1">Interactions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Email</div>
                <div className="font-medium break-all">{user.email}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Phone</div>
                <div className="font-medium">{user.phone}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Plan</div>
                <Badge variant={user.plan === "paid" ? "default" : "secondary"}>{user.plan}</Badge>
              </div>
              <div>
                <div className="text-muted-foreground">Language / Level</div>
                <div className="font-medium">{user.language || "—"} {user.level ? `· ${user.level}` : ""}</div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4" /> Usage Analytics
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Member Since</div>
                  <div className="font-medium">{format(new Date(user.firstSeenAt), "MMM d, yyyy")}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Time on Dreamspeak</div>
                  <div className="font-medium">{tenureDays} day{tenureDays === 1 ? "" : "s"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Active</div>
                  <div className="font-medium">{formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Lessons Completed</div>
                  <div className="font-medium">{user.lessonsCompleted}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Current Streak</div>
                  <div className="font-medium">🔥 {user.streak} days</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Milestones Unlocked</div>
                  <div className="font-medium">{user.achievements.length} 🏅</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Key className="h-4 w-4" /> Account Access
              </div>
              <p className="text-xs text-muted-foreground">
                Passwords are hashed and never visible. If this user is locked out, generate a temporary password and share it with them securely.
              </p>
              <Button size="sm" variant="outline" onClick={handleResetPassword} disabled={resetting} className="w-full">
                {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                Generate Temporary Password
              </Button>
              {tempPassword && (
                <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm font-mono">
                  <span className="flex-1 break-all">{tempPassword}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    onClick={() => navigator.clipboard.writeText(tempPassword)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4 mt-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="text-sm font-semibold">Log a new interaction</div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={channel} onValueChange={(v) => setChannel(v as InteractionChannel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">Text Message</SelectItem>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="note">Internal Note</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={direction} onValueChange={(v) => setDirection(v as InteractionDirection)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">We contacted them</SelectItem>
                    <SelectItem value="inbound">They contacted us</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <Textarea placeholder="Details..." value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
              <Button onClick={handleLog} disabled={saving || !subject.trim()} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Interaction
              </Button>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
                </div>
              ) : interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No interactions logged yet.</p>
              ) : (
                interactions.map((i) => {
                  const Icon = CHANNEL_ICON[i.channel];
                  return (
                    <div key={i.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 font-medium">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {i.subject}
                          <Badge variant="outline" className="text-[10px]">
                            {CHANNEL_LABEL[i.channel]} · {i.direction === "inbound" ? "Inbound" : "Outbound"}
                          </Badge>
                        </div>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteInteraction(i.id)}>
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                      {i.body && <p className="text-muted-foreground mt-1">{i.body}</p>}
                      <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(i.createdAt), { addSuffix: true })}</p>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
