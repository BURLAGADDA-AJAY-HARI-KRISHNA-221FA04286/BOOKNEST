import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import UserLayout from "@/components/layouts/UserLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Book, VerificationQuestion, Review, ReviewFormData, LikedBook } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import BookCard from "@/components/shared/BookCard";
import VerificationModal from "@/components/modals/VerificationModal";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Filter, Star, BookText, User } from "lucide-react";
import { format } from "date-fns";

// Define schema for review form
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().min(10, "Review must be at least 10 characters long"),
});

const Explore: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [openBookId, setOpenBookId] = useState<number | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Form for review
  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      content: "",
      verified: false,
    },
  });

  // Get all books
  const { data: books, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ["/api/books", { category: selectedCategory, search: searchQuery }],
  });

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

  // Get user's reading list
  const { data: readingList } = useQuery<{ bookId: number }[]>({
    queryKey: ["/api/reading-list"],
  });

  // Get user's liked books
  const { data: likedBooks } = useQuery<LikedBook[]>({
    queryKey: ["/api/liked-books"],
  });

  // Add to reading list mutation
  const addToReadingListMutation = useMutation({
    mutationFn: (bookId: number) => apiRequest("POST", "/api/reading-list", { bookId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reading-list"] });
      toast({
        title: "Added to reading list",
        description: "Book has been added to your reading list",
      });
    },
  });

  // Toggle like book mutation
  const toggleLikeBookMutation = useMutation({
    mutationFn: (params: { bookId: number; isLiked: boolean }) => {
      if (params.isLiked) {
        const likedItem = likedBooks?.find(item => item.bookId === params.bookId);
        if (!likedItem) return Promise.resolve(null);
        return apiRequest("DELETE", `/api/liked-books/${likedItem.id}`);
      } else {
        return apiRequest("POST", "/api/liked-books", { bookId: params.bookId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/liked-books"] });
    },
  });

  // Submit verification answers mutation
  const submitVerificationMutation = useMutation({
    mutationFn: async (answers: number[]) => {
      const response = await apiRequest("POST", `/api/books/${openBookId}/verify`, { answers });
      return response.json() as Promise<{ verified: boolean; message: string }>;
    }
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: (review: ReviewFormData) => 
      apiRequest("POST", `/api/books/${openBookId}/reviews`, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", openBookId, "reviews"] });
      toast({
        title: "Review submitted",
        description: "Your review has been posted successfully",
      });
      setIsReviewModalOpen(false);
      reviewForm.reset();
    },
  });

  // Filter books based on search query and category
  const filteredBooks = books
    ? books.filter((book) => {
        let matchesSearch = true;
        let matchesCategory = true;

        if (searchQuery) {
          matchesSearch =
            book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.description.toLowerCase().includes(searchQuery.toLowerCase());
        }

        if (selectedCategory && selectedCategory !== "all") {
          matchesCategory = book.category.toLowerCase() === selectedCategory.toLowerCase();
        }

        return matchesSearch && matchesCategory;
      })
    : [];

  // Categories for filter
  const categories = [
    "Fiction",
    "Non-Fiction",
    "Science",
    "Biography",
    "History",
    "Fantasy",
    "Romance",
    "Mystery",
    "Science Fiction",
    "Self-Help",
  ];

  // Check if book is in reading list
  const isBookInReadingList = (bookId: number) => {
    return readingList?.some(item => item.bookId === bookId) || false;
  };

  // Check if book is liked
  const isBookLiked = (bookId: number) => {
    return likedBooks?.some(item => item.bookId === bookId) || false;
  };

  // Handle add to reading list
  const handleAddToReadingList = (bookId: number) => {
    addToReadingListMutation.mutate(bookId);
  };

  // Handle toggle like
  const handleToggleLike = (bookId: number, isLiked: boolean) => {
    toggleLikeBookMutation.mutate({ bookId, isLiked });
  };

  // Handle verification submission
  const handleVerify = async (answers: number[]) => {
    try {
      const response = await submitVerificationMutation.mutateAsync(answers);
      if (response.verified) {
        setIsVerified(true);
        setIsVerificationModalOpen(false);
        setIsReviewModalOpen(true);
      }
      return response;
    } catch (error) {
      return { verified: false, message: "Verification failed. Please try again." };
    }
  };

  // Handle review submission
  const handleReviewSubmit = (data: ReviewFormData) => {
    submitReviewMutation.mutate({
      ...data,
      verified: isVerified,
    });
  };

  // Handle opening book details
  const handleOpenBookDetails = (bookId: number) => {
    setOpenBookId(bookId);
  };

  // Handle opening review modal (with verification first)
  const handleOpenReviewModal = () => {
    if (questions && questions.length > 0) {
      setIsVerificationModalOpen(true);
    } else {
      setIsVerified(true);
      setIsReviewModalOpen(true);
    }
  };

  // Handle search submission
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Find the selected book
  const selectedBook = openBookId ? books?.find(book => book.id === openBookId) : null;

  return (
    <UserLayout onSearch={handleSearch}>
      {/* Book Exploration */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-neutral-800 mb-4">Explore Books</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by title, author, or description..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoadingBooks ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="h-64 animate-pulse">
                <div className="h-full bg-neutral-100"></div>
              </Card>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center">
              <BookText className="h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No books found</h3>
              <p className="text-neutral-500 mb-4">
                {searchQuery || selectedCategory
                  ? "Try adjusting your search or filter criteria"
                  : "Books will appear here once added to the system"}
              </p>
              {(searchQuery || selectedCategory) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isCompact={true}
                isLiked={isBookLiked(book.id)}
                onToggleLike={(bookId, isLiked) => handleToggleLike(bookId, isLiked)}
                onAddToReadingList={() => {
                  handleOpenBookDetails(book.id);
                }}
              />
            ))}
          </div>
        )}
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
              ) : bookReviews && bookReviews.length > 0 ? (
                <div className="space-y-4">
                  {bookReviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600">
                              <User className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <p className="font-medium mr-2">{review.user?.name || "Anonymous"}</p>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 text-yellow-400 ${i < review.rating ? "fill-yellow-400" : ""}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-neutral-700 text-sm mb-2">{review.content}</p>
                            <p className="text-xs text-neutral-500">
                              {format(new Date(review.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-neutral-500 mb-4">No reviews yet. Be the first to review!</p>
                    <Button onClick={handleOpenReviewModal}>Write a Review</Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenBookId(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Verification Modal */}
      {openBookId && questions && (
        <VerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          onVerify={handleVerify}
          questions={questions}
          bookTitle={selectedBook?.title || ""}
        />
      )}

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your thoughts about {selectedBook?.title}
            </DialogDescription>
          </DialogHeader>

          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit(handleReviewSubmit)} className="space-y-4">
              <FormField
                control={reviewForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`p-0 w-10 h-10 ${field.value >= rating ? "text-yellow-400" : "text-neutral-300"}`}
                            onClick={() => field.onChange(rating)}
                          >
                            <Star className={`h-6 w-6 ${field.value >= rating ? "fill-yellow-400" : ""}`} />
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reviewForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Review</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your thoughts about this book..."
                        className="resize-none"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsReviewModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Review</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
};

export default Explore;
