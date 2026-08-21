import { neon } from "@neondatabase/serverless";
import { DreamspeakUser, PublicUser, CreateUserInput, UpdateUserInput, Interaction, CreateInteractionInput, Stage } from "@/types";
import { hashPassword } from "@/lib/auth";
import nodeCrypto from "crypto";

const HEART_REGEN_MS = 24 * 60 * 60 * 1000;
const HEARTS_MAX_FREE = 5;
// Hash of the demo password "dreamspeak123" — seed accounts only, for trying out the CRM.
const DEMO_PASSWORD_HASH =
  "973fa1cf0b23ec086454868cd6f2b1f4:f3e8700aab128da8b9d8a92f45798274141e1ee1a1439cf8736e1b949eb968f2f8120c096b1a7adf23343803f95be9b46f2e70069a35f793a0a4c7e0685dcb68";

// The main admin's email — logging in with this address routes straight into the CRM dashboard.
export const ADMIN_EMAIL = "4artistent@gmail.com";

function sql(url: string) {
  return neon(url);
}
function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return sql(url);
}

/* ---------------- row <-> model mapping ---------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUser(row: any): DreamspeakUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    passwordHash: row.password_hash,
    plan: row.plan,
    hearts: row.hearts,
    heartsMax: row.hearts_max,
    lastHeartLostAt: row.last_heart_lost_at !== null ? Number(row.last_heart_lost_at) : null,
    xp: row.xp,
    gems: row.gems,
    streak: row.streak,
    lastPlayDate: row.last_play_date,
    language: row.language,
    level: row.level,
    stage: row.stage as Stage,
    stageProgress: row.stage_progress,
    lessonsCompleted: row.lessons_completed,
    perfectLessons: row.perfect_lessons,
    inventory: row.inventory,
    achievements: row.achievements,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    firstSeenAt: new Date(row.first_seen_at).toISOString(),
    lastActiveAt: new Date(row.last_active_at).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInteraction(row: any): Interaction {
  return {
    id: row.id,
    userId: row.user_id,
    channel: row.channel,
    direction: row.direction,
    subject: row.subject || "",
    body: row.body || "",
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function sanitizeUser(user: DreamspeakUser): PublicUser {
  const { passwordHash, ...rest } = user;
  void passwordHash;
  return rest;
}

export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

/* ---------------- seeding (idempotent, runs once) ---------------- */

let seedChecked = false;

async function ensureSeeded(): Promise<void> {
  if (seedChecked) return;
  const client = db();
  const existing = await client`SELECT count(*)::int AS count FROM users`;
  if (existing[0]?.count > 0) {
    seedChecked = true;
    return;
  }
  const now = new Date();
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
  const seed: Array<Partial<DreamspeakUser> & { name: string; email: string; phone: string }> = [
    { name: "Maria Gonzalez", email: "maria.g@example.com", phone: "555-201-3344", plan: "paid", hearts: 5, heartsMax: 5, xp: 1240, gems: 620, streak: 18, language: "spanish", level: "advanced", stage: "sentences", stageProgress: 1, lessonsCompleted: 42, achievements: ["first_lesson", "five_lessons", "twenty_lessons", "streak_7", "xp_1000", "alphabet_grad", "words_grad", "phrases_grad", "polyglot"] },
    { name: "Kenji Watanabe", email: "kenji.w@example.com", phone: "555-882-1290", plan: "free", hearts: 2, heartsMax: 5, xp: 340, gems: 180, streak: 4, language: "japanese", level: "intermediate", stage: "phrases", stageProgress: 2, lessonsCompleted: 11, achievements: ["first_lesson", "five_lessons", "streak_3", "xp_100", "alphabet_grad", "words_grad"] },
    { name: "Amelie Laurent", email: "amelie.l@example.com", phone: "555-773-0098", plan: "free", hearts: 5, heartsMax: 5, xp: 60, gems: 300, streak: 1, language: "french", level: "beginner", stage: "alphabet", stageProgress: 1, lessonsCompleted: 2, achievements: ["first_lesson"] },
    { name: "Somchai Boonmee", email: "somchai.b@example.com", phone: "555-441-7723", plan: "free", hearts: 0, heartsMax: 5, lastHeartLostAt: Date.now() - 3 * 60 * 60 * 1000, xp: 210, gems: 90, streak: 2, language: "thai", level: "beginner", stage: "words", stageProgress: 0, lessonsCompleted: 6, achievements: ["first_lesson", "five_lessons", "alphabet_grad"] },
    { name: "James Rivera", email: "james@dreamwealthsolutions.com", phone: "951-555-4009", plan: "paid", hearts: 5, heartsMax: 5, xp: 890, gems: 410, streak: 9, language: "spanish", level: "intermediate", stage: "phrases", stageProgress: 1, lessonsCompleted: 27, achievements: ["first_lesson", "five_lessons", "twenty_lessons", "streak_7", "xp_500", "alphabet_grad", "words_grad"] },
  ];

  for (let i = 0; i < seed.length; i++) {
    const u = seed[i];
    const id = `seed_${i + 1}`;
    const firstSeenAt = u.firstSeenAt ? new Date(u.firstSeenAt) : daysAgo([58, 21, 2, 9, 33][i] ?? 0);
    const lastActiveAt = now;
    await client`
      INSERT INTO users (id, name, email, phone, password_hash, plan, hearts, hearts_max, last_heart_lost_at, xp, gems, streak, last_play_date, language, level, stage, stage_progress, lessons_completed, perfect_lessons, inventory, achievements, created_at, updated_at, first_seen_at, last_active_at)
      VALUES (${id}, ${u.name}, ${u.email}, ${u.phone}, ${DEMO_PASSWORD_HASH}, ${u.plan || "free"}, ${u.hearts ?? HEARTS_MAX_FREE}, ${u.heartsMax ?? HEARTS_MAX_FREE}, ${u.lastHeartLostAt ?? null}, ${u.xp || 0}, ${u.gems || 0}, ${u.streak || 0}, ${null}, ${u.language || null}, ${u.level || null}, ${u.stage || "alphabet"}, ${u.stageProgress || 0}, ${u.lessonsCompleted || 0}, ${0}, ${JSON.stringify({ freeze: 0, hearts: 0, boost: 0 })}, ${JSON.stringify(u.achievements || [])}, ${now.toISOString()}, ${now.toISOString()}, ${firstSeenAt.toISOString()}, ${lastActiveAt.toISOString()})
      ON CONFLICT (email) DO NOTHING
    `;
  }

  // Seed a couple of sample interactions for Maria and James.
  const maria = await client`SELECT id FROM users WHERE email = 'maria.g@example.com'`;
  const james = await client`SELECT id FROM users WHERE email = 'james@dreamwealthsolutions.com'`;
  if (maria[0]) {
    await client`INSERT INTO interactions (id, user_id, channel, direction, subject, body, created_at) VALUES (${nodeCrypto.randomUUID()}, ${maria[0].id}, 'email', 'outbound', 'Welcome to Dreamspeak Plus!', 'Thanks for upgrading — let us know if you need anything.', ${new Date(Date.now() - 40 * 86400000).toISOString()})`;
    await client`INSERT INTO interactions (id, user_id, channel, direction, subject, body, created_at) VALUES (${nodeCrypto.randomUUID()}, ${maria[0].id}, 'note', 'outbound', 'Support note', 'Asked about pausing her subscription for a trip; advised streak freeze item instead.', ${new Date(Date.now() - 10 * 86400000).toISOString()})`;
  }
  if (james[0]) {
    await client`INSERT INTO interactions (id, user_id, channel, direction, subject, body, created_at) VALUES (${nodeCrypto.randomUUID()}, ${james[0].id}, 'call', 'inbound', 'Onboarding call', 'Walked through the app and answered questions about the Spanish track.', ${new Date(Date.now() - 30 * 86400000).toISOString()})`;
  }

  seedChecked = true;
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

async function persistHeartRegenIfChanged(original: DreamspeakUser, regenerated: DreamspeakUser): Promise<void> {
  if (original.hearts === regenerated.hearts && original.lastHeartLostAt === regenerated.lastHeartLostAt) return;
  const client = db();
  await client`UPDATE users SET hearts = ${regenerated.hearts}, last_heart_lost_at = ${regenerated.lastHeartLostAt} WHERE id = ${regenerated.id}`;
}

export async function getAllUsersRaw(): Promise<DreamspeakUser[]> {
  await ensureSeeded();
  const client = db();
  const rows = await client`SELECT * FROM users ORDER BY updated_at DESC`;
  const users = rows.map(rowToUser);
  const regenerated = await Promise.all(
    users.map(async (u) => {
      const r = applyHeartRegen(u);
      await persistHeartRegenIfChanged(u, r);
      return r;
    })
  );
  return regenerated;
}

export async function getAllUsers(): Promise<PublicUser[]> {
  const users = await getAllUsersRaw();
  return users.map(sanitizeUser);
}

export async function getUserRawById(id: string): Promise<DreamspeakUser | undefined> {
  await ensureSeeded();
  const client = db();
  const rows = await client`SELECT * FROM users WHERE id = ${id}`;
  if (!rows[0]) return undefined;
  const user = rowToUser(rows[0]);
  const regenerated = applyHeartRegen(user);
  await persistHeartRegenIfChanged(user, regenerated);
  return regenerated;
}

export async function getUserById(id: string): Promise<PublicUser | undefined> {
  const user = await getUserRawById(id);
  return user ? sanitizeUser(user) : undefined;
}

export async function getUserByEmailRaw(email: string): Promise<DreamspeakUser | undefined> {
  await ensureSeeded();
  const client = db();
  const rows = await client`SELECT * FROM users WHERE lower(email) = lower(${email})`;
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function createUser(input: CreateUserInput): Promise<{ user?: PublicUser; error?: string }> {
  await ensureSeeded();
  const existing = await getUserByEmailRaw(input.email);
  if (existing) {
    return { error: "An account with this email already exists. Try logging in instead." };
  }
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);
  const id = nodeCrypto.randomUUID();
  const client = db();
  await client`
    INSERT INTO users (id, name, email, phone, password_hash, plan, hearts, hearts_max, last_heart_lost_at, xp, gems, streak, last_play_date, language, level, stage, stage_progress, lessons_completed, perfect_lessons, inventory, achievements, created_at, updated_at, first_seen_at, last_active_at)
    VALUES (${id}, ${input.name}, ${input.email}, ${input.phone}, ${passwordHash}, 'free', ${HEARTS_MAX_FREE}, ${HEARTS_MAX_FREE}, ${null}, 0, 300, 0, ${null}, ${null}, ${null}, 'alphabet', 0, 0, 0, ${JSON.stringify({ freeze: 0, hearts: 0, boost: 0 })}, ${JSON.stringify([])}, ${now}, ${now}, ${now}, ${now})
  `;
  const user = await getUserRawById(id);
  return { user: user ? sanitizeUser(user) : undefined };
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<PublicUser | undefined> {
  const current = await getUserRawById(id);
  if (!current) return undefined;
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
  const client = db();
  await client`
    UPDATE users SET
      name = ${next.name}, email = ${next.email}, phone = ${next.phone}, plan = ${next.plan},
      hearts = ${next.hearts}, hearts_max = ${next.heartsMax}, last_heart_lost_at = ${next.lastHeartLostAt},
      xp = ${next.xp}, gems = ${next.gems}, streak = ${next.streak}, last_play_date = ${next.lastPlayDate},
      language = ${next.language}, level = ${next.level}, stage = ${next.stage}, stage_progress = ${next.stageProgress},
      lessons_completed = ${next.lessonsCompleted}, perfect_lessons = ${next.perfectLessons},
      inventory = ${JSON.stringify(next.inventory)}, achievements = ${JSON.stringify(next.achievements)},
      updated_at = ${next.updatedAt}, last_active_at = ${next.lastActiveAt}
    WHERE id = ${id}
  `;
  return sanitizeUser(next);
}

/** Admin-side edits (hearts override, plan change) should NOT count as "user activity". */
export async function adminUpdateUser(id: string, input: UpdateUserInput): Promise<PublicUser | undefined> {
  const current = await getUserRawById(id);
  if (!current) return undefined;
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
  const client = db();
  await client`
    UPDATE users SET
      name = ${next.name}, email = ${next.email}, phone = ${next.phone}, plan = ${next.plan},
      hearts = ${next.hearts}, hearts_max = ${next.heartsMax}, last_heart_lost_at = ${next.lastHeartLostAt},
      xp = ${next.xp}, gems = ${next.gems}, streak = ${next.streak}, last_play_date = ${next.lastPlayDate},
      language = ${next.language}, level = ${next.level}, stage = ${next.stage}, stage_progress = ${next.stageProgress},
      lessons_completed = ${next.lessonsCompleted}, perfect_lessons = ${next.perfectLessons},
      inventory = ${JSON.stringify(next.inventory)}, achievements = ${JSON.stringify(next.achievements)},
      updated_at = ${next.updatedAt}
    WHERE id = ${id}
  `;
  return sanitizeUser(next);
}

/** Admin: generate and set a fresh temporary password, returned once in plaintext. */
export async function adminResetPassword(id: string): Promise<string | undefined> {
  const current = await getUserRawById(id);
  if (!current) return undefined;
  const tempPassword = nodeCrypto.randomBytes(6).toString("base64url");
  const passwordHash = await hashPassword(tempPassword);
  const client = db();
  await client`UPDATE users SET password_hash = ${passwordHash}, updated_at = ${new Date().toISOString()} WHERE id = ${id}`;
  return tempPassword;
}

export async function deleteUser(id: string): Promise<boolean> {
  const client = db();
  const result = await client`DELETE FROM users WHERE id = ${id} RETURNING id`;
  return result.length > 0;
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

export async function getInteractionsForUser(userId: string): Promise<Interaction[]> {
  const client = db();
  const rows = await client`SELECT * FROM interactions WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows.map(rowToInteraction);
}

export async function getAllInteractions(): Promise<Interaction[]> {
  const client = db();
  const rows = await client`SELECT * FROM interactions ORDER BY created_at DESC`;
  return rows.map(rowToInteraction);
}

export async function createInteraction(input: CreateInteractionInput): Promise<Interaction> {
  const client = db();
  const id = nodeCrypto.randomUUID();
  const createdAt = new Date().toISOString();
  await client`INSERT INTO interactions (id, user_id, channel, direction, subject, body, created_at) VALUES (${id}, ${input.userId}, ${input.channel}, ${input.direction}, ${input.subject}, ${input.body}, ${createdAt})`;
  return { id, userId: input.userId, channel: input.channel, direction: input.direction, subject: input.subject, body: input.body, createdAt };
}

export async function deleteInteraction(id: string): Promise<boolean> {
  const client = db();
  const result = await client`DELETE FROM interactions WHERE id = ${id} RETURNING id`;
  return result.length > 0;
}
