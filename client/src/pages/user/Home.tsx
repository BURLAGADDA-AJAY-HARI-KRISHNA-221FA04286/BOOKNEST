import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import UserLayout from "@/components/layouts/UserLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { Book, ReadingListItem, LikedBook, Review, VerificationQuestion } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BookCard from "@/components/shared/BookCard";
import VerificationModal from "@/components/modals/VerificationModal";
import { Bookmark, Compass, Star, BookText, User } from "lucide-react";
import ReviewModal from "@/components/modals/ReviewModal";
import { format } from "date-fns";

const Home: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [openBookId, setOpenBookId] = useState<number | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Fetch books
  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Fetch user's reading list
  const { data: readingList } = useQuery<ReadingListItem[]>({
    queryKey: ["/api/reading-list"],
  });

  // Fetch user's liked books
  const { data: likedBooks } = useQuery<LikedBook[]>({
    queryKey: ["/api/liked-books"],
  });

  // Fetch latest reviews
  const { data: reviews } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
  });

  // Add to reading list mutation
  const addToReadingListMutation = useMutation({
    mutationFn: (bookId: number) => 
      apiRequest("POST", "/api/reading-list", { bookId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reading-list"] });
      toast({
        title: "Added to reading list",
        description: "Book has been added to your reading list",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add book",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Toggle like book mutation
  const toggleLikeBookMutation = useMutation({
    mutationFn: (params: { bookId: number; isLiked: boolean }) => {
      if (params.isLiked) {
        return apiRequest("DELETE", `/api/liked-books/${
          likedBooks?.find(item => item.bookId === params.bookId)?.id
        }`);
      } else {
        return apiRequest("POST", "/api/liked-books", { bookId: params.bookId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/liked-books"] });
    },
    onError: (error) => {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle add to reading list
  const handleAddToReadingList = (bookId: number) => {
    addToReadingListMutation.mutate(bookId);
  };

  // Handle toggle like
  const handleToggleLike = (bookId: number, isLiked: boolean) => {
    toggleLikeBookMutation.mutate({ bookId, isLiked });
  };

  // Check if book is in reading list
  const isBookInReadingList = (bookId: number) => {
    return readingList?.some(item => item.bookId === bookId) || false;
  };

  // Check if book is liked
  const isBookLiked = (bookId: number) => {
    return likedBooks?.some(item => item.bookId === bookId) || false;
  };

  // Filter books in reading list to show "Continue Reading" section
  const continueReadingBooks = readingList?.filter(item => item.progress > 0 && item.progress < 100) || [];

  // Get recommended books (books not in reading list)
  const recommendedBooks = books
    ? books.filter(book => !isBookInReadingList(book.id)).sort(() => 0.5 - Math.random()).slice(0, 6)
    : [];

  // Get verification questions for the selected book
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<VerificationQuestion[]>({
    queryKey: ["/api/books", openBookId, "questions"],
    enabled: openBookId !== null,
  });

  // Get reviews for the selected book
  const { data: bookReviews, isLoading: isLoadingReviews } = useQuery<Review[]>({
    queryKey: ["/api/books", openBookId, "reviews"],
    enabled: openBookId !== null,
  });

  // Handle opening book details
  const handleOpenBookDetails = (bookId: number) => {
    setOpenBookId(bookId);
  };

  // Handle opening review modal (with verification first)
  const handleOpenReviewModal = () => {
    if (questions && questions.length > 0 && !isVerified) {
      setIsVerificationModalOpen(true);
    } else {
      setIsReviewModalOpen(true);
    }
  };
  
  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; content: string }) => {
      if (!openBookId) return;
      return apiRequest("POST", `/api/books/${openBookId}/reviews`, {
        rating: data.rating,
        content: data.content,
        verified: isVerified,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", openBookId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      setIsReviewModalOpen(false);
      toast({
        title: "Review submitted",
        description: "Your review has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Handle submit review
  const handleSubmitReview = async (rating: number, content: string) => {
    await submitReviewMutation.mutateAsync({ rating, content });
  };

  // Handle verification submission
  const submitVerificationMutation = useMutation({
    mutationFn: async (answers: number[]) => {
      const response = await apiRequest("POST", `/api/books/${openBookId}/verify`, { answers });
      return response.json() as Promise<{ verified: boolean; message: string }>;
    }
  });

  // Handle verify
  const handleVerify = async (answers: number[]) => {
    try {
      const response = await submitVerificationMutation.mutateAsync(answers);
      if (response.verified) {
        setIsVerified(true);
        setIsVerificationModalOpen(false);
      }
      return response;
    } catch (error) {
      return { verified: false, message: "Verification failed. Please try again." };
    }
  };

  // Find the selected book
  const selectedBook = openBookId ? books?.find(book => book.id === openBookId) : null;

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real app, would perform search or redirect to search page
  };

  return (
    <UserLayout onSearch={handleSearch}>
      {/* Hero Section */}
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary-light mb-8 text-white p-8 md:p-10 lg:p-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-3">
            Welcome back, {user?.name.split(' ')[0] || "Reader"}!
          </h1>
          <p className="text-white/80 text-lg mb-6">
            Continue your reading journey with our curated collection of books.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-white text-primary hover:bg-neutral-100 font-medium"
              onClick={() => window.location.href = "/user/explore"}
            >
              <Compass className="mr-2 h-4 w-4" /> Discover New Books
            </Button>
          </div>
        </div>
      </div>

      {/* Recommended Books Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-serif font-bold text-neutral-800">Recommended for You</h2>
          <Button variant="link" onClick={() => window.location.href = "/user/explore"}>
            View All <i className="ri-arrow-right-s-line ml-1"></i>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {recommendedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onToggleLike={(bookId, isLiked) => handleToggleLike(bookId, isLiked)}
              onViewDetails={(bookId) => handleOpenBookDetails(bookId)}
              onAddToReadingList={(bookId) => handleAddToReadingList(bookId)}
              isLiked={isBookLiked(book.id)}
              isCompact={true}
            />
          ))}
        </div>
      </div>

      {/* Latest Reviews Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-serif font-bold text-neutral-800">Latest Reviews</h2>
          <Button variant="link" onClick={() => window.location.href = "/user/explore"}>
            View All <i className="ri-arrow-right-s-line ml-1"></i>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviews?.slice(0, 4).map((review) => {
            const reviewBook = books?.find(book => book.id === review.bookId);
            
            return (
              <Card key={review.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => reviewBook && handleOpenBookDetails(reviewBook.id)}>
                <CardContent className="p-5">
                  <div className="flex items-start">
                    <div className="w-14 h-20 bg-neutral-200 rounded mr-4 flex-shrink-0 overflow-hidden">
                      {reviewBook?.coverImage ? (
                        <img
                          src={reviewBook.coverImage}
                          alt={`Cover of ${reviewBook.title}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookText className="h-6 w-6 text-neutral-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif font-semibold text-neutral-800 mb-1">
                        {reviewBook ? reviewBook.title : `Book #${review.bookId}`}
                      </h3>
                      <div className="flex items-center mb-3">
                        <div className="flex items-center text-yellow-400 mr-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400" : ""}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-neutral-600">
                          by {review.user?.name || "Anonymous"}
                        </span>
                      </div>
                      <p className="text-neutral-700 text-sm line-clamp-3">{review.content}</p>
                      <div className="mt-3 text-xs text-neutral-500">
                        Posted {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Book Details Modal */}
      <Dialog open={openBookId !== null} onOpenChange={(open) => !open && setOpenBookId(null)}>
        {selectedBook && (
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">{selectedBook.title}</DialogTitle>
              <DialogDescription className="text-neutral-500 font-medium">
                By {selectedBook.author}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="flex justify-center md:justify-start">
                <div className="h-64 w-48 bg-neutral-200 rounded overflow-hidden">
                  {selectedBook.coverImage ? (
                    <img
                      src={selectedBook.coverImage}
                      alt={selectedBook.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <BookText className="h-12 w-12 text-neutral-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Category</h3>
                    <p className="font-medium">
                      <span className="px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {selectedBook.category.charAt(0).toUpperCase() + selectedBook.category.slice(1)}
                      </span>
                    </p>
                  </div>

                  {selectedBook.publisher && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Publisher</h3>
                      <p>{selectedBook.publisher}</p>
                    </div>
                  )}

                  {selectedBook.publishedDate && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Published Date</h3>
                      <p>{selectedBook.publishedDate}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Rating</h3>
                    <div className="flex items-center">
                      <div className="flex items-center text-yellow-400 mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < selectedBook.averageRating ? "fill-yellow-400" : ""}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-neutral-600">
                        {selectedBook.averageRating.toFixed(1)} ({selectedBook.totalReviews}{" "}
                        {selectedBook.totalReviews === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Description</h3>
                    <p className="text-neutral-700">{selectedBook.description}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => handleAddToReadingList(selectedBook.id)}
                    disabled={isBookInReadingList(selectedBook.id)}
                  >
                    {isBookInReadingList(selectedBook.id) ? "Already in Reading List" : "Add to Reading List"}
                  </Button>
                  <Button
                    variant={isBookLiked(selectedBook.id) ? "default" : "outline"}
                    className={isBookLiked(selectedBook.id) ? "bg-rose-500 hover:bg-rose-600" : ""}
                    onClick={() => handleToggleLike(selectedBook.id, isBookLiked(selectedBook.id))}
                  >
                    {isBookLiked(selectedBook.id) ? "Liked" : "Like"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenReviewModal}
                  >
                    Write Review
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-serif font-bold text-lg mb-4">Reviews</h3>
              
              {isLoadingReviews ? (
                <div className="flex justify-center py-8">
                  <p className="text-neutral-500">Loading reviews...</p>
                </div>
              ) : bookReviews?.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-neutral-50">
                  <p className="text-neutral-500">No reviews yet. Be the first to review this book!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookReviews?.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-neutral-100 h-10 w-10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-neutral-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-800">{review.user?.name || "Anonymous"}</h4>
                            <div className="flex items-center my-1">
                              <div className="flex items-center text-yellow-400 mr-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400" : ""}`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-neutral-500">
                                {format(new Date(review.createdAt), "MMM d, yyyy")}
                              </span>
                            </div>
                            <p className="text-neutral-700 text-sm mt-2">{review.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Verification Modal */}
      {questions && selectedBook && (
        <VerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          questions={questions}
          onVerify={handleVerify}
          bookTitle={selectedBook.title}
        />
      )}

      {/* Review Modal */}
      {selectedBook && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSubmit={handleSubmitReview}
          bookTitle={selectedBook.title}
        />
      )}
    </UserLayout>
  );
};

export default Home;
