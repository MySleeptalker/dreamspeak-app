import fs from "fs";
import path from "path";
import { DreamspeakUser, PublicUser, CreateUserInput, UpdateUserInput, Interaction, CreateInteractionInput, Stage } from "@/types";
import { hashPassword } from "@/lib/auth";
import nodeCrypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");
const INTERACTIONS_FILE = path.join(DATA_DIR, "interactions.json");
const HEART_REGEN_MS = 24 * 60 * 60 * 1000;
const HEARTS_MAX_FREE = 5;
// Hash of the demo password "dreamspeak123" — seed accounts only, for trying out the CRM.
const DEMO_PASSWORD_HASH = "973fa1cf0b23ec086454868cd6f2b1f4:f3e8700aab128da8b9d8a92f45798274141e1ee1a1439cf8736e1b949eb968f2f8120c096b1a7adf23343803f95be9b46f2e70069a35f793a0a4c7e0685dcb68";

export function sanitizeUser(user: DreamspeakUser): PublicUser {
  const { passwordHash, ...rest } = user;
  void passwordHash;
  return rest;
}

function seedUsers(): DreamspeakUser[] {
  const now = new Date().toISOString();
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
  const seed: Array<Partial<DreamspeakUser>> = [
    { name: "Maria Gonzalez", email: "maria.g@example.com", phone: "555-201-3344", plan: "paid", hearts: 5, heartsMax: 5, xp: 1240, gems: 620, streak: 18, language: "spanish", level: "advanced", stage: "sentences", stageProgress: 1, lessonsCompleted: 42, achievements: ["first_lesson", "five_lessons", "twenty_lessons", "streak_7", "xp_1000", "alphabet_grad", "words_grad", "phrases_grad", "polyglot"], firstSeenAt: daysAgo(58), lastActiveAt: daysAgo(0) },
    { name: "Kenji Watanabe", email: "kenji.w@example.com", phone: "555-882-1290", plan: "free", hearts: 2, heartsMax: 5, xp: 340, gems: 180, streak: 4, language: "japanese", level: "intermediate", stage: "phrases", stageProgress: 2, lessonsCompleted: 11, achievements: ["first_lesson", "five_lessons", "streak_3", "xp_100", "alphabet_grad", "words_grad"], firstSeenAt: daysAgo(21), lastActiveAt: daysAgo(1) },
    { name: "Amelie Laurent", email: "amelie.l@example.com", phone: "555-773-0098", plan: "free", hearts: 5, heartsMax: 5, xp: 60, gems: 300, streak: 1, language: "french", level: "beginner", stage: "alphabet", stageProgress: 1, lessonsCompleted: 2, achievements: ["first_lesson"], firstSeenAt: daysAgo(2), lastActiveAt: daysAgo(0) },
    { name: "Somchai Boonmee", email: "somchai.b@example.com", phone: "555-441-7723", plan: "free", hearts: 0, heartsMax: 5, lastHeartLostAt: Date.now() - 3 * 60 * 60 * 1000, xp: 210, gems: 90, streak: 2, language: "thai", level: "beginner", stage: "words", stageProgress: 0, lessonsCompleted: 6, achievements: ["first_lesson", "five_lessons", "alphabet_grad"], firstSeenAt: daysAgo(9), lastActiveAt: daysAgo(0) },
    { name: "James Rivera", email: "james@dreamwealthsolutions.com", phone: "951-555-4009", plan: "paid", hearts: 5, heartsMax: 5, xp: 890, gems: 410, streak: 9, language: "spanish", level: "intermediate", stage: "phrases", stageProgress: 1, lessonsCompleted: 27, achievements: ["first_lesson", "five_lessons", "twenty_lessons", "streak_7", "xp_500", "alphabet_grad", "words_grad"], firstSeenAt: daysAgo(33), lastActiveAt: daysAgo(0) },
  ];
  return seed.map((u, i) => ({
    id: `seed_${i + 1}`,
    name: u.name || "",
    email: u.email || "",
    phone: u.phone || "",
    passwordHash: DEMO_PASSWORD_HASH,
    plan: u.plan || "free",
    hearts: u.hearts ?? HEARTS_MAX_FREE,
    heartsMax: u.heartsMax ?? HEARTS_MAX_FREE,
    lastHeartLostAt: u.lastHeartLostAt ?? null,
    xp: u.xp || 0,
    gems: u.gems || 0,
    streak: u.streak || 0,
    lastPlayDate: null,
    language: u.language || null,
    level: (u.level as DreamspeakUser["level"]) || null,
    stage: (u.stage as Stage) || "alphabet",
    stageProgress: u.stageProgress || 0,
    lessonsCompleted: u.lessonsCompleted || 0,
    perfectLessons: 0,
    inventory: { freeze: 0, hearts: 0, boost: 0 },
    achievements: u.achievements || [],
    createdAt: now,
    updatedAt: now,
    firstSeenAt: u.firstSeenAt || now,
    lastActiveAt: u.lastActiveAt || now,
  }));
}

function seedInteractions(users: DreamspeakUser[]): Interaction[] {
  const byEmail = (email: string) => users.find((u) => u.email === email);
  const maria = byEmail("maria.g@example.com");
  const james = byEmail("james@dreamwealthsolutions.com");
  const now = Date.now();
  const items: Interaction[] = [];
  if (maria) {
    items.push({ id: crypto.randomUUID(), userId: maria.id, channel: "email", direction: "outbound", subject: "Welcome to Dreamspeak Plus!", body: "Thanks for upgrading — let us know if you need anything.", createdAt: new Date(now - 40 * 86400000).toISOString() });
    items.push({ id: crypto.randomUUID(), userId: maria.id, channel: "note", direction: "outbound", subject: "Support note", body: "Asked about pausing her subscription for a trip; advised streak freeze item instead.", createdAt: new Date(now - 10 * 86400000).toISOString() });
  }
  if (james) {
    items.push({ id: crypto.randomUUID(), userId: james.id, channel: "call", direction: "inbound", subject: "Onboarding call", body: "Walked through the app and answered questions about the Spanish track.", createdAt: new Date(now - 30 * 86400000).toISOString() });
  }
  return items;
}

function ensureFiles(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedUsers(), null, 2));
  }
  if (!fs.existsSync(INTERACTIONS_FILE)) {
    const users = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as DreamspeakUser[];
    fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify(seedInteractions(users), null, 2));
  }
}

function readAll(): DreamspeakUser[] {
  ensureFiles();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  try {
    return JSON.parse(raw) as DreamspeakUser[];
  } catch {
    return [];
  }
}

function writeAll(users: DreamspeakUser[]): void {
  ensureFiles();
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

function readInteractions(): Interaction[] {
  ensureFiles();
  try {
    return JSON.parse(fs.readFileSync(INTERACTIONS_FILE, "utf-8")) as Interaction[];
  } catch {
    return [];
  }
}

function writeInteractions(items: Interaction[]): void {
  ensureFiles();
  fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify(items, null, 2));
}

/** Free-plan hearts silently regenerate to max once 24h have passed since the last loss. */
function applyHeartRegen(user: DreamspeakUser): DreamspeakUser {
  if (user.plan === "paid") return user;
  if (user.hearts >= user.heartsMax) return user;
  if (!user.lastHeartLostAt) return user;
  const elapsed = Date.now() - user.lastHeartLostAt;
  if (elapsed >= HEART_REGEN_MS) {
    return { ...user, hearts: user.heartsMax, lastHeartLostAt: null };
  }
  return user;
}

export function getAllUsersRaw(): DreamspeakUser[] {
  const users = readAll().map(applyHeartRegen);
  writeAll(users);
  return users.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
}

export function getAllUsers(): PublicUser[] {
  return getAllUsersRaw().map(sanitizeUser);
}

export function getUserRawById(id: string): DreamspeakUser | undefined {
  const users = readAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  const regenerated = applyHeartRegen(users[idx]);
  users[idx] = regenerated;
  writeAll(users);
  return regenerated;
}

export function getUserById(id: string): PublicUser | undefined {
  const user = getUserRawById(id);
  return user ? sanitizeUser(user) : undefined;
}

export function getUserByEmailRaw(email: string): DreamspeakUser | undefined {
  return readAll().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(input: CreateUserInput): Promise<{ user?: PublicUser; error?: string }> {
  const existing = getUserByEmailRaw(input.email);
  if (existing) {
    return { error: "An account with this email already exists. Try logging in instead." };
  }
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);
  const user: DreamspeakUser = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    plan: "free",
    hearts: HEARTS_MAX_FREE,
    heartsMax: HEARTS_MAX_FREE,
    lastHeartLostAt: null,
    xp: 0,
    gems: 300,
    streak: 0,
    lastPlayDate: null,
    language: null,
    level: null,
    stage: "alphabet",
    stageProgress: 0,
    lessonsCompleted: 0,
    perfectLessons: 0,
    inventory: { freeze: 0, hearts: 0, boost: 0 },
    achievements: [],
    createdAt: now,
    updatedAt: now,
    firstSeenAt: now,
    lastActiveAt: now,
  };
  const users = readAll();
  users.push(user);
  writeAll(users);
  return { user: sanitizeUser(user) };
}

export function updateUser(id: string, input: UpdateUserInput): PublicUser | undefined {
  const users = readAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  const current = users[idx];
  const next: DreamspeakUser = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
  if (typeof input.hearts === "number" && input.hearts >= next.heartsMax) {
    next.lastHeartLostAt = null;
  }
  if (typeof input.hearts === "number" && input.hearts < next.heartsMax && !next.lastHeartLostAt) {
    next.lastHeartLostAt = Date.now();
  }
  users[idx] = next;
  writeAll(users);
  return sanitizeUser(next);
}

/** Admin-side edits (hearts override, plan change) should NOT count as "user activity". */
export function adminUpdateUser(id: string, input: UpdateUserInput): PublicUser | undefined {
  const users = readAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  const current = users[idx];
  const next: DreamspeakUser = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  if (typeof input.hearts === "number" && input.hearts >= next.heartsMax) {
    next.lastHeartLostAt = null;
  }
  if (typeof input.hearts === "number" && input.hearts < next.heartsMax && !next.lastHeartLostAt) {
    next.lastHeartLostAt = Date.now();
  }
  users[idx] = next;
  writeAll(users);
  return sanitizeUser(next);
}

/** Admin: generate and set a fresh temporary password, returned once in plaintext. */
export async function adminResetPassword(id: string): Promise<string | undefined> {
  const users = readAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  const tempPassword = nodeCrypto.randomBytes(6).toString("base64url");
  users[idx].passwordHash = await hashPassword(tempPassword);
  users[idx].updatedAt = new Date().toISOString();
  writeAll(users);
  return tempPassword;
}

export function deleteUser(id: string): boolean {
  const users = readAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  writeAll(users);
  const interactions = readInteractions().filter((i) => i.userId !== id);
  writeInteractions(interactions);
  return true;
}

export function usersToCsv(users: PublicUser[]): string {
  const headers = ["Name", "Email", "Phone", "Plan", "Language", "Level", "XP", "Gems", "Streak", "Hearts", "Lessons Completed", "Milestones", "First Seen", "Last Active"];
  const rows = users.map((u) => [
    u.name,
    u.email,
    u.phone,
    u.plan,
    u.language || "",
    u.level || "",
    String(u.xp),
    String(u.gems),
    String(u.streak),
    u.plan === "paid" ? "unlimited" : String(u.hearts),
    String(u.lessonsCompleted),
    String(u.achievements.length),
    u.firstSeenAt,
    u.lastActiveAt,
  ]);
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

/* ---------------- Interactions (messages / emails / calls / notes) ---------------- */

export function getInteractionsForUser(userId: string): Interaction[] {
  return readInteractions()
    .filter((i) => i.userId === userId)
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export function getAllInteractions(): Interaction[] {
  return readInteractions().sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export function createInteraction(input: CreateInteractionInput): Interaction {
  const item: Interaction = {
    id: crypto.randomUUID(),
    userId: input.userId,
    channel: input.channel,
    direction: input.direction,
    subject: input.subject,
    body: input.body,
    createdAt: new Date().toISOString(),
  };
  const items = readInteractions();
  items.push(item);
  writeInteractions(items);
  return item;
}

export function deleteInteraction(id: string): boolean {
  const items = readInteractions();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  writeInteractions(items);
  return true;
}
