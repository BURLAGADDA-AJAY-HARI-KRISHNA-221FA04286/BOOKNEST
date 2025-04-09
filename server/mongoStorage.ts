import { MongoClient, ObjectId } from 'mongodb';
import { IStorage } from './storage';
import { 
  User, InsertUser, 
  Book, InsertBook, 
  VerificationQuestion, InsertVerificationQuestion, 
  Review, InsertReview,
  ReadingList, InsertReadingList,
  LikedBook, InsertLikedBook
} from '../shared/schema';

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private dbName = 'bookworld';
  private db: any = null;

  constructor(mongoUri: string) {
    this.client = new MongoClient(mongoUri);
    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
      console.log('Connected successfully to MongoDB');
      this.db = this.client.db(this.dbName);
      
      // Create indexes for faster queries
      this.db.collection('users').createIndex({ email: 1 }, { unique: true });
      this.db.collection('books').createIndex({ title: 'text', author: 'text', description: 'text' });
      this.db.collection('verificationQuestions').createIndex({ bookId: 1 });
      this.db.collection('reviews').createIndex({ bookId: 1 });
      this.db.collection('reviews').createIndex({ userId: 1 });
      this.db.collection('readingLists').createIndex({ userId: 1 });
      this.db.collection('likedBooks').createIndex({ userId: 1 });
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const user = await this.db?.collection('users').findOne({ id });
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.db?.collection('users').findOne({ email });
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Generate a numeric ID manually
    const lastUser = await this.db?.collection('users')
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    
    const newId = lastUser && lastUser.length > 0 ? lastUser[0].id + 1 : 1;
    
    const newUser: User = {
      ...user,
      id: newId,
      isAdmin: user.isAdmin || false,
      isActive: true,
      joinedAt: new Date()
    };
    
    await this.db?.collection('users').insertOne(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await this.db?.collection('users').findOneAndUpdate(
      { id },
      { $set: userData },
      { returnDocument: 'after' }
    );
    
    return result || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db?.collection('users').find().toArray() || [];
  }

  async getActiveUsers(): Promise<User[]> {
    return await this.db?.collection('users').find({ isActive: true }).toArray() || [];
  }

  // Book operations
  async getBook(id: number): Promise<Book | undefined> {
    const book = await this.db?.collection('books').findOne({ id });
    return book || undefined;
  }

  async createBook(book: InsertBook): Promise<Book> {
    // Generate a numeric ID manually
    const lastBook = await this.db?.collection('books')
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    
    const newId = lastBook && lastBook.length > 0 ? lastBook[0].id + 1 : 1;
    
    const newBook: Book = {
      id: newId,
      title: book.title,
      author: book.author,
      description: book.description,
      category: book.category,
      publisher: book.publisher || null,
      publishedDate: book.publishedDate || null,
      isbn: book.isbn || null,
      coverImage: book.coverImage || null,
      addedAt: new Date(),
      averageRating: 0,
      totalReviews: 0
    };
    
    await this.db?.collection('books').insertOne(newBook);
    return newBook;
  }

  async updateBook(id: number, bookData: Partial<Book>): Promise<Book | undefined> {
    const result = await this.db?.collection('books').findOneAndUpdate(
      { id },
      { $set: bookData },
      { returnDocument: 'after' }
    );
    
    return result || undefined;
  }

  async deleteBook(id: number): Promise<boolean> {
    const result = await this.db?.collection('books').deleteOne({ id });
    
    // Also delete related data
    await this.db?.collection('verificationQuestions').deleteMany({ bookId: id });
    await this.db?.collection('reviews').deleteMany({ bookId: id });
    await this.db?.collection('readingLists').deleteMany({ bookId: id });
    await this.db?.collection('likedBooks').deleteMany({ bookId: id });
    
    return result.deletedCount > 0;
  }

  async getAllBooks(): Promise<Book[]> {
    return await this.db?.collection('books').find().toArray() || [];
  }

  async getBooksByCategory(category: string): Promise<Book[]> {
    return await this.db?.collection('books').find({ category }).toArray() || [];
  }

  async searchBooks(query: string): Promise<Book[]> {
    return await this.db?.collection('books').find(
      { $text: { $search: query } }
    ).toArray() || [];
  }

  // Verification questions operations
  async getVerificationQuestions(bookId: number): Promise<VerificationQuestion[]> {
    return await this.db?.collection('verificationQuestions').find({ bookId }).toArray() || [];
  }

  async createVerificationQuestion(question: InsertVerificationQuestion): Promise<VerificationQuestion> {
    // Generate a numeric ID manually
    const lastQuestion = await this.db?.collection('verificationQuestions')
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    
    const newId = lastQuestion && lastQuestion.length > 0 ? lastQuestion[0].id + 1 : 1;
    
    const newQuestion: VerificationQuestion = { ...question, id: newId };
    
    await this.db?.collection('verificationQuestions').insertOne(newQuestion);
    return newQuestion;
  }

  async updateVerificationQuestion(id: number, questionData: Partial<VerificationQuestion>): Promise<VerificationQuestion | undefined> {
    const result = await this.db?.collection('verificationQuestions').findOneAndUpdate(
      { id },
      { $set: questionData },
      { returnDocument: 'after' }
    );
    
    return result || undefined;
  }

  async deleteVerificationQuestion(id: number): Promise<boolean> {
    const result = await this.db?.collection('verificationQuestions').deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    const review = await this.db?.collection('reviews').findOne({ id });
    return review || undefined;
  }

  async getReviewsByBook(bookId: number): Promise<Review[]> {
    const reviews = await this.db?.collection('reviews').find({ bookId }).toArray() || [];
    
    // Fetch user details for each review
    for (const review of reviews) {
      const user = await this.getUser(review.userId);
      if (user) {
        review.user = {
          id: user.id,
          name: user.name
        };
      }
    }
    
    return reviews;
  }

  async getReviewsByUser(userId: number): Promise<Review[]> {
    return await this.db?.collection('reviews').find({ userId }).toArray() || [];
  }

  async createReview(review: InsertReview): Promise<Review> {
    // Generate a numeric ID manually
    const lastReview = await this.db?.collection('reviews')
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    
    const newId = lastReview && lastReview.length > 0 ? lastReview[0].id + 1 : 1;
    
    const newReview: Review = { 
      ...review, 
      id: newId, 
      createdAt: new Date()
    };
    
    await this.db?.collection('reviews').insertOne(newReview);
    
    // Update book average rating and total reviews
    const book = await this.getBook(review.bookId);
    if (book) {
      const reviews = await this.getReviewsByBook(review.bookId);
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      await this.updateBook(book.id, { 
        averageRating, 
        totalReviews: reviews.length 
      });
    }
    
    return newReview;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review | undefined> {
    const result = await this.db?.collection('reviews').findOneAndUpdate(
      { id },
      { $set: reviewData },
      { returnDocument: 'after' }
    );
    
    if (result) {
      // Update book average rating if the rating changed
      const reviews = await this.getReviewsByBook(result.bookId);
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      await this.updateBook(result.bookId, { 
        averageRating, 
        totalReviews: reviews.length 
      });
    }
    
    return result || undefined;
  }

  async deleteReview(id: number): Promise<boolean> {
    const review = await this.getReview(id);
    if (!review) return false;
    
    const result = await this.db?.collection('reviews').deleteOne({ id });
    
    if (result.deletedCount > 0) {
      // Update book average rating and total reviews
      const book = await this.getBook(review.bookId);
      if (book) {
        const reviews = await this.getReviewsByBook(review.bookId);
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        
        await this.updateBook(book.id, { 
          averageRating, 
          totalReviews: reviews.length 
        });
      }
    }
    
    return result.deletedCount > 0;
  }

  // Reading list operations
  async getReadingList(userId: number): Promise<(ReadingList & { book: Book })[]> {
    const readingList = await this.db?.collection('readingLists').find({ userId }).toArray() || [];
    
    // Fetch book details for each reading list item
    for (const item of readingList) {
      const book = await this.getBook(item.bookId);
      if (book) {
        item.book = book;
      }
    }
    
    return readingList;
  }

  async addToReadingList(item: InsertReadingList): Promise<ReadingList> {
    // Generate a numeric ID manually
    const lastItem = await this.db?.collection('readingLists')
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    
    const newId = lastItem && lastItem.length > 0 ? lastItem[0].id + 1 : 1;
    
    const newItem: ReadingList = { 
      ...item, 
      id: newId, 
      addedAt: new Date(), 
      progress: 0 
    };
    
    await this.db?.collection('readingLists').insertOne(newItem);
    return newItem;
  }

  async updateReadingProgress(id: number, progress: number): Promise<ReadingList | undefined> {
    const result = await this.db?.collection('readingLists').findOneAndUpdate(
      { id },
      { $set: { progress } },
      { returnDocument: 'after' }
    );
    
    return result || undefined;
  }

  async removeFromReadingList(id: number): Promise<boolean> {
    const result = await this.db?.collection('readingLists').deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Liked books operations
  async getLikedBooks(userId: number): Promise<(LikedBook & { book: Book })[]> {
    const likedBooks = await this.db?.collection('likedBooks').find({ userId }).toArray() || [];
    
    // Fetch book details for each liked book
    for (const item of likedBooks) {
      const book = await this.getBook(item.bookId);
      if (book) {
        item.book = book;
      }
    }
    
    return likedBooks;
  }

  async addToLikedBooks(item: InsertLikedBook): Promise<LikedBook> {
    // Generate a numeric ID manually
    const lastItem = await this.db?.collection('likedBooks')
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    
    const newId = lastItem && lastItem.length > 0 ? lastItem[0].id + 1 : 1;
    
    const newItem: LikedBook = { 
      ...item, 
      id: newId, 
      likedAt: new Date()
    };
    
    await this.db?.collection('likedBooks').insertOne(newItem);
    return newItem;
  }

  async removeFromLikedBooks(id: number): Promise<boolean> {
    const result = await this.db?.collection('likedBooks').deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Statistics
  async getStats(): Promise<{ totalUsers: number; activeUsers: number; totalBooks: number; totalReviews: number; }> {
    const totalUsers = await this.db?.collection('users').countDocuments();
    const activeUsers = await this.db?.collection('users').countDocuments({ isActive: true });
    const totalBooks = await this.db?.collection('books').countDocuments();
    const totalReviews = await this.db?.collection('reviews').countDocuments();
    
    return {
      totalUsers,
      activeUsers,
      totalBooks,
      totalReviews
    };
  }
}