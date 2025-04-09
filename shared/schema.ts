import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  isAdmin: true,
});

// Book model
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  publisher: text("publisher"),
  publishedDate: text("published_date"),
  description: text("description").notNull(),
  category: text("category").notNull(),
  isbn: text("isbn"),
  coverImage: text("cover_image"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  averageRating: integer("average_rating").default(0),
  totalReviews: integer("total_reviews").default(0),
});

export const insertBookSchema = createInsertSchema(books).pick({
  title: true,
  author: true,
  publisher: true,
  publishedDate: true,
  description: true,
  category: true,
  isbn: true,
  coverImage: true,
});

// Verification questions model
export const verificationQuestions = pgTable("verification_questions", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(),
  correctOptionIndex: integer("correct_option_index").notNull(),
});

export const insertVerificationQuestionSchema = createInsertSchema(verificationQuestions).pick({
  bookId: true,
  question: true,
  options: true,
  correctOptionIndex: true,
});

// Reviews model
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  bookId: true,
  userId: true,
  rating: true,
  content: true,
});

// Reading list model
export const readingLists = pgTable("reading_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  progress: integer("progress").default(0),
});

export const insertReadingListSchema = createInsertSchema(readingLists).pick({
  userId: true,
  bookId: true,
  progress: true,
});

// Liked books model
export const likedBooks = pgTable("liked_books", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  likedAt: timestamp("liked_at").defaultNow().notNull(),
});

export const insertLikedBookSchema = createInsertSchema(likedBooks).pick({
  userId: true,
  bookId: true,
});

// Export all types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;

export type VerificationQuestion = typeof verificationQuestions.$inferSelect;
export type InsertVerificationQuestion = z.infer<typeof insertVerificationQuestionSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ReadingList = typeof readingLists.$inferSelect;
export type InsertReadingList = z.infer<typeof insertReadingListSchema>;

export type LikedBook = typeof likedBooks.$inferSelect;
export type InsertLikedBook = z.infer<typeof insertLikedBookSchema>;
