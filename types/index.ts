export type Plan = "free" | "paid";
export type Level = "beginner" | "intermediate" | "advanced" | null;
export type Stage = "alphabet" | "words" | "phrases" | "sentences";
export type InteractionChannel = "email" | "sms" | "call" | "note";
export type InteractionDirection = "inbound" | "outbound";

export interface DreamspeakUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  plan: Plan;
  hearts: number;
  heartsMax: number;
  lastHeartLostAt: number | null;
  xp: number;
  gems: number;
  streak: number;
  lastPlayDate: string | null;
  language: string | null;
  level: Level;
  stage: Stage;
  stageProgress: number;
  lessonsCompleted: number;
  perfectLessons: number;
  inventory: { freeze: number; hearts: number; boost: number };
  achievements: string[];
  createdAt: string;
  updatedAt: string;
  firstSeenAt: string;
  lastActiveAt: string;
}

/** Shape returned to any client — never includes passwordHash. */
export type PublicUser = Omit<DreamspeakUser, "passwordHash">;

export interface CreateUserInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  plan?: Plan;
  hearts?: number;
  heartsMax?: number;
  xp?: number;
  gems?: number;
  streak?: number;
  lastPlayDate?: string | null;
  language?: string | null;
  level?: Level;
  stage?: Stage;
  stageProgress?: number;
  lessonsCompleted?: number;
  perfectLessons?: number;
  inventory?: { freeze: number; hearts: number; boost: number };
  achievements?: string[];
}

export interface Interaction {
  id: string;
  userId: string;
  channel: InteractionChannel;
  direction: InteractionDirection;
  subject: string;
  body: string;
  createdAt: string;
}

export interface CreateInteractionInput {
  userId: string;
  channel: InteractionChannel;
  direction: InteractionDirection;
  subject: string;
  body: string;
}
