// User types
export interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  joinedAt: string;
}

// Book types
export interface Book {
  id: number;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  description: string;
  category: string;
  isbn?: string;
  coverImage?: string;
  addedAt: string;
  averageRating: number;
  totalReviews: number;
}

export interface BookFormData {
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  description: string;
  category: string;
  isbn?: string;
  coverImage?: string;
}

// Verification question types
export interface VerificationQuestion {
  id: number;
  bookId: number;
  question: string;
  options: string[];
}

export interface VerificationQuestionFormData {
  question: string;
  options: string[];
  correctOptionIndex: number;
}

// Review types
export interface Review {
  id: number;
  bookId: number;
  userId: number;
  rating: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface ReviewFormData {
  rating: number;
  content: string;
  verified: boolean;
}

// Reading list types
export interface ReadingListItem {
  id: number;
  userId: number;
  bookId: number;
  addedAt: string;
  progress: number;
  book: Book;
}

// Liked book types
export interface LikedBook {
  id: number;
  userId: number;
  bookId: number;
  likedAt: string;
  book: Book;
}

// Stats types
export interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalBooks: number;
  totalReviews: number;
}

// Activity types for admin dashboard
export interface Activity {
  id: number;
  type: 'user_registered' | 'book_added' | 'review_added';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

// SearchParams type for filtering
export type SearchParams = {
  category?: string;
  search?: string;
};
