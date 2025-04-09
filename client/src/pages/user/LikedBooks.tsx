import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import UserLayout from "@/components/layouts/UserLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LikedBook } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BookCard from "@/components/shared/BookCard";
import { Heart, BookText, Bookmark } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const LikedBooks: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<LikedBook | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  // Fetch user's liked books
  const { data: likedBooks, isLoading } = useQuery<LikedBook[]>({
    queryKey: ["/api/liked-books"],
  });

  // Fetch user's reading list to check if books are already there
  const { data: readingList } = useQuery<{ bookId: number }[]>({
    queryKey: ["/api/reading-list"],
  });

  // Remove from liked books mutation
  const unlikeBookMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/liked-books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/liked-books"] });
      toast({
        title: "Book unliked",
        description: "The book has been removed from your liked books",
      });
      setIsRemoveDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to unlike book",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
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
    onError: (error) => {
      toast({
        title: "Failed to add book",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Filter liked books based on search query
  const filteredLikedBooks = likedBooks
    ? likedBooks.filter(
        (item) =>
          item.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.book.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Handle opening the remove confirmation dialog
  const handleOpenRemoveDialog = (book: LikedBook) => {
    setSelectedBook(book);
    setIsRemoveDialogOpen(true);
  };

  // Handle removing book from liked books
  const handleUnlikeBook = () => {
    if (selectedBook) {
      unlikeBookMutation.mutate(selectedBook.id);
    }
  };

  // Handle adding book to reading list
  const handleAddToReadingList = (bookId: number) => {
    addToReadingListMutation.mutate(bookId);
  };

  // Check if book is in reading list
  const isBookInReadingList = (bookId: number) => {
    return readingList?.some(item => item.bookId === bookId) || false;
  };

  // Group books by category for the categories section
  const booksByCategory = likedBooks
    ? likedBooks.reduce((acc, item) => {
        const category = item.book.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item.book);
        return acc;
      }, {} as Record<string, any[]>)
    : {};

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <UserLayout onSearch={handleSearch}>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-neutral-800 mb-4">My Liked Books</h1>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="h-48 animate-pulse">
                <div className="h-full bg-neutral-100"></div>
              </Card>
            ))}
          </div>
        ) : filteredLikedBooks.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center">
              <Heart className="h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">You haven't liked any books yet</h3>
              <p className="text-neutral-500 mb-4">
                {searchQuery
                  ? "No books found matching your search criteria"
                  : "Like books to add them to your collection"}
              </p>
              <Button variant="default" onClick={() => window.location.href = "/user/explore"}>
                Explore Books
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredLikedBooks.map((item) => (
              <div key={item.id} className="relative group">
                <BookCard
                  book={item.book}
                  isCompact={true}
                  isLiked={true}
                  showActions={false}
                />
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-black bg-opacity-50 rounded-lg flex flex-col items-center justify-center space-y-2 p-2">
                  {!isBookInReadingList(item.book.id) ? (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full bg-primary text-white text-xs"
                      onClick={() => handleAddToReadingList(item.book.id)}
                    >
                      <Bookmark className="h-3 w-3 mr-1" /> Add to Reading List
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full bg-neutral-500 text-white text-xs cursor-default"
                      disabled
                    >
                      <Bookmark className="h-3 w-3 mr-1" /> In Reading List
                    </Button>
                  )}
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white text-xs"
                    onClick={() => handleOpenRemoveDialog(item)}
                  >
                    <Heart className="h-3 w-3 mr-1 fill-white" /> Unlike
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Books by Category Section */}
      {Object.keys(booksByCategory).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-serif font-bold text-neutral-800 mb-6">Books by Category</h2>
          
          <div className="space-y-8">
            {Object.entries(booksByCategory)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, books]) => (
                <div key={category}>
                  <div className="flex items-center mb-4">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-medium py-1 px-3">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Badge>
                    <div className="ml-3 text-sm text-neutral-500">
                      {books.length} {books.length === 1 ? "book" : "books"}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {books.map((book) => (
                      <div key={book.id} className="flex items-start">
                        <div className="h-16 w-12 bg-neutral-200 rounded mr-3 flex items-center justify-center overflow-hidden">
                          {book.coverImage ? (
                            <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
                          ) : (
                            <BookText className="h-6 w-6 text-neutral-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-800 line-clamp-1">{book.title}</h4>
                          <p className="text-sm text-neutral-600">{book.author}</p>
                          <div className="flex items-center mt-1 text-sm">
                            <div className="flex items-center text-yellow-400">
                              <i className="ri-star-fill text-xs"></i>
                              <span className="text-xs text-neutral-500 ml-1">
                                {book.averageRating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recently Liked Section */}
      {(likedBooks?.length || 0) > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-serif font-bold text-neutral-800 mb-4">Recently Liked</h2>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {likedBooks
                  ?.sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime())
                  .slice(0, 5)
                  .map(item => (
                    <div key={item.id} className="flex items-center">
                      <div className="h-16 w-12 bg-neutral-200 rounded mr-3 flex items-center justify-center overflow-hidden">
                        {item.book.coverImage ? (
                          <img src={item.book.coverImage} alt={item.book.title} className="h-full w-full object-cover" />
                        ) : (
                          <BookText className="h-6 w-6 text-neutral-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-800">{item.book.title}</h4>
                        <p className="text-sm text-neutral-600">{item.book.author}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Liked on {format(new Date(item.likedAt), "MMMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {!isBookInReadingList(item.book.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddToReadingList(item.book.id)}
                          >
                            <Bookmark className="h-4 w-4 mr-2" /> Read
                          </Button>
                        ) : (
                          <Badge className="bg-neutral-100 text-neutral-800">In Reading List</Badge>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Remove Book Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlike Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlike "{selectedBook?.book.title}"?
              This will remove it from your liked books.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlikeBook}
              className="bg-rose-500 hover:bg-rose-600"
            >
              Unlike
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UserLayout>
  );
};

export default LikedBooks;
