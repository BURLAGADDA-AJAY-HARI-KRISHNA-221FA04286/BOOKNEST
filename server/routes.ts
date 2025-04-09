import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./index"; // Import from index.ts instead of storage.ts
import express from "express";
import session from "express-session";
import { z } from "zod";
import "./types"; // Import session type definitions
import { 
  insertUserSchema, 
  insertBookSchema, 
  insertVerificationQuestionSchema,
  insertReviewSchema,
  insertReadingListSchema,
  insertLikedBookSchema
} from "@shared/schema";

// Password validation schema
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

// Enhanced user schema with password confirmation
const registerUserSchema = insertUserSchema.extend({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

// Verification answer schema
const verifyAnswersSchema = z.object({
  bookId: z.number(),
  answers: z.array(z.number())
});

// Review with verification schema
const reviewWithVerificationSchema = insertReviewSchema.extend({
  verified: z.boolean()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "booknest-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production" }
    })
  );
  
  // Session data is defined in server/types.ts
  
  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
  
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId || !req.session.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };
  
  // User routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Create new user (excluding confirmPassword)
      const { confirmPassword, ...userToCreate } = userData;
      const newUser = await storage.createUser(userToCreate);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      // Set session
      req.session.userId = newUser.id;
      req.session.isAdmin = newUser.isAdmin;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      console.log("Login attempt with email:", credentials.email);
      
      // Debug info to check admin user in storage
      if (credentials.email === "admin@gmail.com") {
        const adminUser = await storage.getUserByEmail("admin@gmail.com");
        console.log("Admin user found:", !!adminUser, adminUser ? `ID: ${adminUser.id}` : "");
      }
      
      // Get user by email
      const user = await storage.getUserByEmail(credentials.email);
      
      // Special hardcoded check for admin account - this will always work
      if (credentials.email === "admin@gmail.com" && credentials.password === "admin123") {
        if (!user) {
          // This should not happen, but if it does, create the admin user
          console.log("Admin user not found in DB, creating it now");
          const newAdmin = await storage.createUser({
            name: "Admin User",
            email: "admin@gmail.com",
            password: "admin123",
            isAdmin: true
          });
          
          // Set session
          req.session.userId = newAdmin.id;
          req.session.isAdmin = true;
          
          // Initialize verification status
          req.session.isVerified = {};
          
          // Return user without password
          const { password, ...adminWithoutPassword } = newAdmin;
          console.log("Admin login successful (new account)");
          return res.status(200).json(adminWithoutPassword);
        }
        
        // Admin user exists
        req.session.userId = user.id;
        req.session.isAdmin = true;
        
        // Initialize verification status
        if (!req.session.isVerified) {
          req.session.isVerified = {};
        }
        
        // Return user without password
        const { password, ...adminWithoutPassword } = user;
        console.log("Admin login successful");
        return res.status(200).json(adminWithoutPassword);
      }
      
      // Handle regular user login
      if (!user || user.password !== credentials.password) {
        console.log("Login failed: Invalid credentials");
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;
      
      // Initialize verification status if not exists
      if (!req.session.isVerified) {
        req.session.isVerified = {};
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to login" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user info" });
    }
  });
  
  // Book routes
  app.get("/api/books", async (req: Request, res: Response) => {
    try {
      let books;
      
      if (req.query.category) {
        books = await storage.getBooksByCategory(req.query.category as string);
      } else if (req.query.search) {
        books = await storage.searchBooks(req.query.search as string);
      } else {
        books = await storage.getAllBooks();
      }
      
      res.status(200).json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });
  
  app.get("/api/books/:id", async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.status(200).json(book);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });
  
  app.post("/api/books", requireAdmin, async (req: Request, res: Response) => {
    try {
      const bookData = insertBookSchema.parse(req.body);
      const newBook = await storage.createBook(bookData);
      
      res.status(201).json(newBook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create book" });
    }
  });
  
  app.put("/api/books/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      const bookData = insertBookSchema.partial().parse(req.body);
      
      const updatedBook = await storage.updateBook(bookId, bookData);
      
      if (!updatedBook) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.status(200).json(updatedBook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update book" });
    }
  });
  
  app.delete("/api/books/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      const deleted = await storage.deleteBook(bookId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.status(200).json({ message: "Book deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete book" });
    }
  });
  
  // Verification questions routes
  app.get("/api/books/:id/questions", async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      const questions = await storage.getVerificationQuestions(bookId);
      
      // Remove correct answer from client response
      const sanitizedQuestions = questions.map(({ correctOptionIndex, ...rest }) => rest);
      
      res.status(200).json(sanitizedQuestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verification questions" });
    }
  });
  
  app.post("/api/books/:id/questions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      
      // Validate book exists
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      const questionData = insertVerificationQuestionSchema.parse({
        ...req.body,
        bookId
      });
      
      const newQuestion = await storage.createVerificationQuestion(questionData);
      res.status(201).json(newQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create verification question" });
    }
  });
  
  // Delete all questions for a book
  app.delete("/api/books/:id/questions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      
      // Validate book exists
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      // Get all questions for this book
      const questions = await storage.getVerificationQuestions(bookId);
      
      // Delete each question
      for (const question of questions) {
        await storage.deleteVerificationQuestion(question.id);
      }
      
      res.status(200).json({ message: "All questions deleted for book" });
    } catch (error) {
      console.error("Error deleting questions:", error);
      res.status(500).json({ message: "Failed to delete verification questions" });
    }
  });
  
  app.post("/api/books/:id/verify", requireAuth, async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      const { answers } = verifyAnswersSchema.parse({ ...req.body, bookId });
      
      // Get questions for this book
      const questions = await storage.getVerificationQuestions(bookId);
      
      if (questions.length === 0) {
        return res.status(404).json({ message: "No verification questions found for this book" });
      }
      
      if (answers.length !== questions.length) {
        return res.status(400).json({ message: "Must answer all questions" });
      }
      
      // Check answers
      const allCorrect = questions.every((question, index) => 
        answers[index] === question.correctOptionIndex
      );
      
      if (allCorrect) {
        // Mark as verified in session
        if (!req.session.isVerified) {
          req.session.isVerified = {};
        }
        req.session.isVerified[bookId] = true;
        
        return res.status(200).json({ verified: true, message: "Answers verified successfully" });
      }
      
      res.status(200).json({ verified: false, message: "One or more answers are incorrect" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to verify answers" });
    }
  });
  
  // Review routes
  app.get("/api/books/:id/reviews", async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByBook(bookId);
      
      // Fetch user info for each review
      const reviewsWithUserInfo = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          return {
            ...review,
            user: user ? { id: user.id, name: user.name } : { id: 0, name: "Unknown User" }
          };
        })
      );
      
      res.status(200).json(reviewsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  
  app.post("/api/books/:id/reviews", requireAuth, async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if user is verified to review this book
      const isVerified = req.session.isVerified && req.session.isVerified[bookId];
      
      const { verified, ...reviewData } = reviewWithVerificationSchema.parse({
        ...req.body,
        bookId,
        userId
      });
      
      if (!verified && !isVerified) {
        return res.status(403).json({ 
          message: "You must correctly answer the verification questions before reviewing this book"
        });
      }
      
      const newReview = await storage.createReview(reviewData);
      
      // Get user info
      const user = await storage.getUser(userId);
      
      res.status(201).json({
        ...newReview,
        user: user ? { id: user.id, name: user.name } : { id: 0, name: "Unknown User" }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });
  
  // Reading list routes
  app.get("/api/reading-list", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const readingList = await storage.getReadingList(userId);
      
      res.status(200).json(readingList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reading list" });
    }
  });
  
  app.post("/api/reading-list", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      const itemData = insertReadingListSchema.parse({
        ...req.body,
        userId
      });
      
      const newItem = await storage.addToReadingList(itemData);
      
      // Get book info
      const book = await storage.getBook(newItem.bookId);
      
      res.status(201).json({ ...newItem, book });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to reading list" });
    }
  });
  
  app.put("/api/reading-list/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      const { progress } = req.body;
      
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ message: "Progress must be a number between 0 and 100" });
      }
      
      const updatedItem = await storage.updateReadingProgress(itemId, progress);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Reading list item not found" });
      }
      
      // Get book info
      const book = await storage.getBook(updatedItem.bookId);
      
      res.status(200).json({ ...updatedItem, book });
    } catch (error) {
      res.status(500).json({ message: "Failed to update reading progress" });
    }
  });
  
  app.delete("/api/reading-list/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      const deleted = await storage.removeFromReadingList(itemId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Reading list item not found" });
      }
      
      res.status(200).json({ message: "Removed from reading list successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from reading list" });
    }
  });
  
  // Liked books routes
  app.get("/api/liked-books", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const likedBooks = await storage.getLikedBooks(userId);
      
      res.status(200).json(likedBooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch liked books" });
    }
  });
  
  app.post("/api/liked-books", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      const itemData = insertLikedBookSchema.parse({
        ...req.body,
        userId
      });
      
      const newItem = await storage.addToLikedBooks(itemData);
      
      // Get book info
      const book = await storage.getBook(newItem.bookId);
      
      res.status(201).json({ ...newItem, book });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to liked books" });
    }
  });
  
  app.delete("/api/liked-books/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      const deleted = await storage.removeFromLikedBooks(itemId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Liked book not found" });
      }
      
      res.status(200).json({ message: "Removed from liked books successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from liked books" });
    }
  });
  
  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/admin/active-users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getActiveUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active users" });
    }
  });
  
  app.get("/api/admin/user-reading-lists", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      const readingListsByUser = await Promise.all(
        users.map(async (user) => {
          const readingList = await storage.getReadingList(user.id);
          return {
            userId: user.id,
            userName: user.name,
            readingList
          };
        })
      );
      
      res.status(200).json(readingListsByUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user reading lists" });
    }
  });
  
  app.get("/api/admin/user-liked-books", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      const likedBooksByUser = await Promise.all(
        users.map(async (user) => {
          const likedBooks = await storage.getLikedBooks(user.id);
          return {
            userId: user.id,
            userName: user.name,
            likedBooks
          };
        })
      );
      
      res.status(200).json(likedBooksByUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user liked books" });
    }
  });
  
  app.get("/api/admin/reviews", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get all books to get all reviews
      const books = await storage.getAllBooks();
      
      const reviewsWithDetails = await Promise.all(
        books.map(async (book) => {
          const bookReviews = await storage.getReviewsByBook(book.id);
          
          // Add book and user details to each review
          const reviewsWithBookAndUser = await Promise.all(
            bookReviews.map(async (review) => {
              const user = await storage.getUser(review.userId);
              return {
                ...review,
                book: { id: book.id, title: book.title },
                user: user ? { id: user.id, name: user.name } : { id: 0, name: "Unknown User" }
              };
            })
          );
          
          return reviewsWithBookAndUser;
        })
      );
      
      // Flatten array of arrays
      const allReviews = reviewsWithDetails.flat();
      
      // Sort by creation date (newest first)
      allReviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      res.status(200).json(allReviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  
  app.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
