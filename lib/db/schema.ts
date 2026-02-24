import { pgTable, text, timestamp, integer, boolean, primaryKey } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  phone: text("phone").notNull(),
  phoneVerified: boolean("phone_verified").default(false),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  isAdmin: boolean("is_admin").default(false),
  banned: boolean("banned").default(false),
  bannedUntil: timestamp("banned_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "email" | "phone"
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

export const menuSections = pgTable("menu_sections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  parentId: text("parent_id"),
  sortOrder: integer("sort_order").default(0),
  menuSection: text("menu_section").default("discussion"), // "discussion" | "image" for parent categories
  rulesGuidelines: text("rules_guidelines"),
  defaultTab: text("default_tab").default("recent"), // "recent" | "top" for category page default tab
});

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").notNull(),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  featuredImageUrl: text("featured_image_url"),
  linkCount: integer("link_count").default(0),
  score: integer("score").default(0),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moderators = pgTable(
  "moderators",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.categoryId] }) })
);

export const announcements = pgTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdById: text("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const votes = pgTable(
  "votes",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: integer("value").notNull(), // 1 = upvote, -1 = downvote
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.postId, t.userId] }) })
);

export const categoryFollows = pgTable(
  "category_follows",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.categoryId] }) })
);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const savedPosts = pgTable(
  "saved_posts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at").defaultNow().notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.postId] }) })
);

export const userConnections = pgTable(
  "user_connections",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    connectedUserId: text("connected_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.connectedUserId] }) })
);
