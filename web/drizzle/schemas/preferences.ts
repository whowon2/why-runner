import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { COLOR_MODES, LINE_NUMBERS } from "../../lib/preferences";
import type { StoredTheme } from "../../lib/themes/types";
import { user } from "./users";

export const ColorMode = pgEnum("color_mode", COLOR_MODES);
export type ColorMode = (typeof ColorMode.enumValues)[number];

export const EditorLineNumbers = pgEnum("editor_line_numbers", LINE_NUMBERS);
export type EditorLineNumbers = (typeof EditorLineNumbers.enumValues)[number];

// One row per user holding every setting that follows the account (the
// browser keeps a localStorage mirror). NULL = the setting's default, so new
// settings are new nullable columns without a backfill.
export const userPreference = pgTable("user_preference", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  colorMode: ColorMode("color_mode"),
  theme: jsonb("theme").$type<StoredTheme>(),
  editorFontSize: integer("editor_font_size"),
  editorAutoClose: boolean("editor_auto_close"),
  editorVim: boolean("editor_vim"),
  editorTabSize: integer("editor_tab_size"),
  editorWordWrap: boolean("editor_word_wrap"),
  editorLineNumbers: EditorLineNumbers("editor_line_numbers"),
  editorMinimap: boolean("editor_minimap"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type UserPreference = typeof userPreference.$inferSelect;

export const userPreferenceRelations = relations(userPreference, ({ one }) => ({
  user: one(user, {
    fields: [userPreference.userId],
    references: [user.id],
  }),
}));
