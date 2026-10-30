import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { lesson } from "./lessons";
import { user } from "./users";

export const classroom = pgTable("classroom", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").default("Untitled Class").notNull(),
  slug: text("slug").notNull().unique(),
  joinCode: text("join_code").notNull().unique(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type Classroom = typeof classroom.$inferSelect;
export type CreateClassroomInput = typeof classroom.$inferInsert;

export const classroomRelations = relations(classroom, ({ many }) => ({
  members: many(classroomMembership),
  lessons: many(lesson),
}));

/** A `teacher` member is a co-teacher: manages the class like the owner, minus deleting it and managing co-teachers. */
export const ClassroomRole = pgEnum("classroom_role", ["student", "teacher"]);
export type ClassroomRole = (typeof ClassroomRole.enumValues)[number];

export const classroomMembership = pgTable(
  "classroom_membership",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    classroomId: uuid("classroom_id")
      .notNull()
      .references(() => classroom.id, { onDelete: "cascade" }),
    role: ClassroomRole("role").default("student").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.classroomId] })],
);

export type ClassroomMembership = typeof classroomMembership.$inferSelect;

export const classroomMembershipRelations = relations(
  classroomMembership,
  ({ one }) => ({
    user: one(user, {
      fields: [classroomMembership.userId],
      references: [user.id],
    }),
    classroom: one(classroom, {
      fields: [classroomMembership.classroomId],
      references: [classroom.id],
    }),
  }),
);
