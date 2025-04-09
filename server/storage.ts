import { 
  users, User, InsertUser, 
  books, Book, InsertBook,
  verificationQuestions, VerificationQuestion, InsertVerificationQuestion,
  reviews, Review, InsertReview,
  readingLists, ReadingList, InsertReadingList,
  likedBooks, LikedBook, InsertLikedBook
} from "@shared/schema";

// Storage interface with all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getActiveUsers(): Promise<User[]>;
  
  // Book operations
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<Book>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<boolean>;
  getAllBooks(): Promise<Book[]>;
  getBooksByCategory(category: string): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;
  
  // Verification questions operations
  getVerificationQuestions(bookId: number): Promise<VerificationQuestion[]>;
  createVerificationQuestion(question: InsertVerificationQuestion): Promise<VerificationQuestion>;
  updateVerificationQuestion(id: number, question: Partial<VerificationQuestion>): Promise<VerificationQuestion | undefined>;
  deleteVerificationQuestion(id: number): Promise<boolean>;
  
  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByBook(bookId: number): Promise<Review[]>;
  getReviewsByUser(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  
  // Reading list operations
  getReadingList(userId: number): Promise<(ReadingList & { book: Book })[]>;
  addToReadingList(item: InsertReadingList): Promise<ReadingList>;
  updateReadingProgress(id: number, progress: number): Promise<ReadingList | undefined>;
  removeFromReadingList(id: number): Promise<boolean>;
  
  // Liked books operations
  getLikedBooks(userId: number): Promise<(LikedBook & { book: Book })[]>;
  addToLikedBooks(item: InsertLikedBook): Promise<LikedBook>;
  removeFromLikedBooks(id: number): Promise<boolean>;
  
  // Statistics
  getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalBooks: number;
    totalReviews: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private verificationQuestions: Map<number, VerificationQuestion>;
  private reviews: Map<number, Review>;
  private readingLists: Map<number, ReadingList>;
  private likedBooks: Map<number, LikedBook>;
  
  private userIdCounter: number;
  private bookIdCounter: number;
  private questionIdCounter: number;
  private reviewIdCounter: number;
  private readingListIdCounter: number;
  private likedBookIdCounter: number;

  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.verificationQuestions = new Map();
    this.reviews = new Map();
    this.readingLists = new Map();
    this.likedBooks = new Map();
    
    this.userIdCounter = 1;
    this.bookIdCounter = 1;
    this.questionIdCounter = 1;
    this.reviewIdCounter = 1;
    this.readingListIdCounter = 1;
    this.likedBookIdCounter = 1;
    
    // Add default admin user
    this.createUser({
      name: "Admin User",
      email: "admin@booknest.com",
      password: "admin123",
      isAdmin: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isActive: true,
      joinedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getActiveUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isActive);
  }

  // Book operations
  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.bookIdCounter++;
    const now = new Date();
    const book: Book = {
      ...insertBook,
      id,
      addedAt: now,
      averageRating: 0,
      totalReviews: 0
    };
    this.books.set(id, book);
    return book;
  }

  async updateBook(id: number, bookData: Partial<Book>): Promise<Book | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;
    
    const updatedBook = { ...book, ...bookData };
    this.books.set(id, updatedBook);
    return updatedBook;
  }

  async deleteBook(id: number): Promise<boolean> {
    const deleted = this.books.delete(id);
    
    if (deleted) {
      // Delete related data
      // 1. Delete all verification questions for this book
      for (const [questionId, question] of this.verificationQuestions.entries()) {
        if (question.bookId === id) {
          this.verificationQuestions.delete(questionId);
        }
      }
      
      // 2. Delete all reviews for this book
      for (const [reviewId, review] of this.reviews.entries()) {
        if (review.bookId === id) {
          this.reviews.delete(reviewId);
        }
      }
      
      // 3. Delete all reading list entries for this book
      for (const [readingListId, entry] of this.readingLists.entries()) {
        if (entry.bookId === id) {
          this.readingLists.delete(readingListId);
        }
      }
      
      // 4. Delete all liked book entries for this book
      for (const [likedBookId, entry] of this.likedBooks.entries()) {
        if (entry.bookId === id) {
          this.likedBooks.delete(likedBookId);
        }
      }
    }
    
    return deleted;
  }

  async getAllBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBooksByCategory(category: string): Promise<Book[]> {
    return Array.from(this.books.values()).filter(
      book => book.category.toLowerCase() === category.toLowerCase()
    );
  }

  async searchBooks(query: string): Promise<Book[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.books.values()).filter(
      book => 
        book.title.toLowerCase().includes(lowercaseQuery) ||
        book.author.toLowerCase().includes(lowercaseQuery) ||
        (book.description && book.description.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Verification questions operations
  async getVerificationQuestions(bookId: number): Promise<VerificationQuestion[]> {
    return Array.from(this.verificationQuestions.values()).filter(
      question => question.bookId === bookId
    );
  }

  async createVerificationQuestion(insertQuestion: InsertVerificationQuestion): Promise<VerificationQuestion> {
    const id = this.questionIdCounter++;
    const question: VerificationQuestion = { ...insertQuestion, id };
    this.verificationQuestions.set(id, question);
    return question;
  }

  async updateVerificationQuestion(id: number, questionData: Partial<VerificationQuestion>): Promise<VerificationQuestion | undefined> {
    const question = this.verificationQuestions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = { ...question, ...questionData };
    this.verificationQuestions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteVerificationQuestion(id: number): Promise<boolean> {
    return this.verificationQuestions.delete(id);
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsByBook(bookId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      review => review.bookId === bookId
    );
  }

  async getReviewsByUser(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      review => review.userId === userId
    );
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const now = new Date();
    const review: Review = { ...insertReview, id, createdAt: now };
    this.reviews.set(id, review);
    
    // Update book rating
    const book = await this.getBook(insertReview.bookId);
    if (book) {
      const bookReviews = await this.getReviewsByBook(book.id);
      const totalRating = bookReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = Math.round(totalRating / bookReviews.length);
      
      await this.updateBook(book.id, {
        averageRating,
        totalReviews: bookReviews.length
      });
    }
    
    return review;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;
    
    const updatedReview = { ...review, ...reviewData };
    this.reviews.set(id, updatedReview);
    
    // Update book rating if rating changed
    if (reviewData.rating && reviewData.rating !== review.rating) {
      const book = await this.getBook(review.bookId);
      if (book) {
        const bookReviews = await this.getReviewsByBook(book.id);
        const totalRating = bookReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = Math.round(totalRating / bookReviews.length);
        
        await this.updateBook(book.id, {
          averageRating,
          totalReviews: bookReviews.length
        });
      }
    }
    
    return updatedReview;
  }

  async deleteReview(id: number): Promise<boolean> {
    const review = this.reviews.get(id);
    if (!review) return false;
    
    const deleted = this.reviews.delete(id);
    
    // Update book rating after deletion
    if (deleted) {
      const book = await this.getBook(review.bookId);
      if (book) {
        const bookReviews = await this.getReviewsByBook(book.id);
        const totalRating = bookReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = bookReviews.length ? Math.round(totalRating / bookReviews.length) : 0;
        
        await this.updateBook(book.id, {
          averageRating,
          totalReviews: bookReviews.length
        });
      }
    }
    
    return deleted;
  }

  // Reading list operations
  async getReadingList(userId: number): Promise<(ReadingList & { book: Book })[]> {
    const items = Array.from(this.readingLists.values()).filter(
      item => item.userId === userId
    );
    
    return items.map(item => {
      const book = this.books.get(item.bookId);
      if (!book) throw new Error(`Book with id ${item.bookId} not found`);
      return { ...item, book };
    });
  }

  async addToReadingList(insertItem: InsertReadingList): Promise<ReadingList> {
    // Check if item already exists
    const existing = Array.from(this.readingLists.values()).find(
      item => item.userId === insertItem.userId && item.bookId === insertItem.bookId
    );
    
    if (existing) return existing;
    
    const id = this.readingListIdCounter++;
    const now = new Date();
    const item: ReadingList = { 
      ...insertItem, 
      id, 
      addedAt: now,
      progress: insertItem.progress || 0
    };
    this.readingLists.set(id, item);
    return item;
  }

  async updateReadingProgress(id: number, progress: number): Promise<ReadingList | undefined> {
    const item = this.readingLists.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, progress };
    this.readingLists.set(id, updatedItem);
    return updatedItem;
  }

  async removeFromReadingList(id: number): Promise<boolean> {
    return this.readingLists.delete(id);
  }

  // Liked books operations
  async getLikedBooks(userId: number): Promise<(LikedBook & { book: Book })[]> {
    const items = Array.from(this.likedBooks.values()).filter(
      item => item.userId === userId
    );
    
    return items.map(item => {
      const book = this.books.get(item.bookId);
      if (!book) throw new Error(`Book with id ${item.bookId} not found`);
      return { ...item, book };
    });
  }

  async addToLikedBooks(insertItem: InsertLikedBook): Promise<LikedBook> {
    // Check if item already exists
    const existing = Array.from(this.likedBooks.values()).find(
      item => item.userId === insertItem.userId && item.bookId === insertItem.bookId
    );
    
    if (existing) return existing;
    
    const id = this.likedBookIdCounter++;
    const now = new Date();
    const item: LikedBook = { ...insertItem, id, likedAt: now };
    this.likedBooks.set(id, item);
    return item;
  }

  async removeFromLikedBooks(id: number): Promise<boolean> {
    return this.likedBooks.delete(id);
  }

  // Statistics
  async getStats(): Promise<{ totalUsers: number; activeUsers: number; totalBooks: number; totalReviews: number }> {
    const allUsers = await this.getAllUsers();
    const activeUsers = await this.getActiveUsers();
    
    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      totalBooks: this.books.size,
      totalReviews: this.reviews.size
    };
  }
}

export const storage = new MemStorage();
