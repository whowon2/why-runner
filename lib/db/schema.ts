import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const contest = pgTable("contest", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ProblemDifficulty = pgEnum("problem_difficulty", [
  "easy",
  "medium",
  "hard",
]);

export const Language = pgEnum("language", [
  "c",
  "cpp",
  "java",
  "python",
  "rust",
]);

export const problem = pgTable("problem", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: ProblemDifficulty(),
  createdBy: text("created_by").notNull(),
  inputs: text("inputs").array().notNull(),
  outputs: text("outputs").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const submission = pgTable("submission", {
  id: serial("id").primaryKey(),
  status: text("status").default("pending").notNull(),
  code: text("code").notNull(),
  language: Language(),
  questionLetter: text("question_letter").notNull(),
  output: text("output"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  problemId: serial("problem_id")
    .notNull()
    .references(() => problem.id, { onDelete: "cascade" }),
  contestId: serial("contest_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const submissionRelations = relations(submission, ({ one }) => ({
  user: one(user, {
    fields: [submission.userId],
    references: [user.id],
  }),
  problem: one(problem, {
    fields: [submission.problemId],
    references: [problem.id],
  }),
}));

export const userOnContest = pgTable("user_on_contest", {
  userId: text("user_id").notNull(),
  contestId: serial("contest_id")
    .notNull()
    .references(() => contest.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  score: integer("score").notNull().default(0),
  answered: text("answered").array().notNull().default([]),
});

export const problemOnContest = pgTable("problem_on_contest", {
  problemId: serial("problem_id")
    .notNull()
    .references(() => problem.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  contestId: serial("contest_id")
    .notNull()
    .references(() => contest.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});

export const contestRelations = relations(contest, ({ many }) => ({
  users: many(userOnContest),
  problems: many(problemOnContest),
}));

export const problemRelations = relations(problem, ({ many, one }) => ({
  contests: many(problemOnContest),
  user: one(user, {
    fields: [problem.createdBy],
    references: [user.id],
  }),
}));

export const userOnContestRelations = relations(userOnContest, ({ one }) => ({
  user: one(user, {
    fields: [userOnContest.userId],
    references: [user.id],
  }),
  contest: one(contest, {
    fields: [userOnContest.contestId],
    references: [contest.id],
  }),
}));

export const problemOnContestRelations = relations(
  problemOnContest,
  ({ one }) => ({
    problem: one(problem, {
      fields: [problemOnContest.problemId],
      references: [problem.id],
    }),
    contest: one(contest, {
      fields: [problemOnContest.contestId],
      references: [contest.id],
    }),
  }),
);

export type Contest = typeof contest.$inferSelect;
export type Problem = typeof problem.$inferSelect;
export type Submission = typeof submission.$inferSelect;
export type ProblemDifficulty = (typeof ProblemDifficulty.enumValues)[number];
export type Language = (typeof Language.enumValues)[number];

export type UserOnContest = typeof userOnContest.$inferSelect;
export type ProblemOnContest = typeof problemOnContest.$inferSelect & {
  problem: Problem;
};

export type CreateProblemInput = typeof problem.$inferInsert;
export type CreateSubmissionInput = typeof submission.$inferInsert;
