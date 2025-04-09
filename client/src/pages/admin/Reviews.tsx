import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Star, Trash2, BookOpen, User } from "lucide-react";
import { Review } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const Reviews: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all reviews
  const { data: reviews, isLoading, error } = useQuery<Review[]>({
    queryKey: ["/api/admin/reviews"],
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => apiRequest("DELETE", `/api/reviews/${reviewId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({
        title: "Review deleted successfully",
        description: "The review has been removed from the system.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete review",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle delete review
  const handleDeleteReview = (reviewId: number) => {
    if (window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  // Filter and sort reviews
  let filteredReviews = reviews || [];
  
  // Apply search filter
  if (searchQuery) {
    filteredReviews = filteredReviews.filter(review => 
      review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.book?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Apply sorting
  if (sortBy === "rating-high") {
    filteredReviews = [...filteredReviews].sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "rating-low") {
    filteredReviews = [...filteredReviews].sort((a, b) => a.rating - b.rating);
  } else {
    // Default: sort by latest
    filteredReviews = [...filteredReviews].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);

  // Rating stars display
  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-400 fill-yellow-400" : "text-neutral-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm">{rating}/5</span>
      </div>
    );
  };

  return (
    <AdminLayout title="Book Reviews">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-auto md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search reviews..."
            className="pl-10 pr-4 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by: Latest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Sort by: Latest</SelectItem>
            <SelectItem value="rating-high">Sort by: Highest Rating</SelectItem>
            <SelectItem value="rating-low">Sort by: Lowest Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-neutral-500">Loading reviews...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">Error loading reviews</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral-50">
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentReviews.length > 0 ? (
                    currentReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <BookOpen className="h-5 w-5 text-primary mr-2" />
                            <span className="font-medium text-sm line-clamp-1">
                              {review.book?.title || `Book #${review.bookId}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-5 w-5 text-neutral-500 mr-2" />
                            <span className="text-sm">{review.user?.name || "Unknown User"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderRatingStars(review.rating)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-neutral-600 line-clamp-2">{review.content}</p>
                        </TableCell>
                        <TableCell className="text-sm text-neutral-500">
                          {format(new Date(review.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No reviews found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredReviews.length > 0 && (
              <div className="border-t border-neutral-200 px-5 py-3 flex items-center justify-between">
                <div className="text-sm text-neutral-500">
                  Showing <span className="font-medium">{indexOfFirstReview + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastReview, filteredReviews.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredReviews.length}</span> reviews
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center"
                  >
                    <i className="ri-arrow-left-s-line mr-1"></i> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="flex items-center"
                  >
                    Next <i className="ri-arrow-right-s-line ml-1"></i>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Review Statistics Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-2">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = filteredReviews.filter(review => review.rating === rating).length;
                const percentage = filteredReviews.length ? Math.round((count / filteredReviews.length) * 100) : 0;
                
                return (
                  <div key={rating} className="flex items-center">
                    <div className="flex items-center w-12">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 ml-1" />
                    </div>
                    <div className="flex-1 mx-2 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-neutral-500 w-12 text-right">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">Average Rating</h3>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">
                  {filteredReviews.length 
                    ? (filteredReviews.reduce((sum, review) => sum + review.rating, 0) / filteredReviews.length).toFixed(1)
                    : "N/A"}
                </div>
                <div className="flex justify-center mt-2">
                  {[...Array(5)].map((_, i) => {
                    const avgRating = filteredReviews.length 
                      ? filteredReviews.reduce((sum, review) => sum + review.rating, 0) / filteredReviews.length
                      : 0;
                    
                    return (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(avgRating) 
                            ? "text-yellow-400 fill-yellow-400" 
                            : i < avgRating
                            ? "text-yellow-400 fill-yellow-400 opacity-50"
                            : "text-neutral-300"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-neutral-500 mt-2">Based on {filteredReviews.length} reviews</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">Review Activity</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-500">Reviews this month</p>
                <p className="text-2xl font-semibold">
                  {filteredReviews.filter(review => 
                    new Date(review.createdAt).getMonth() === new Date().getMonth() &&
                    new Date(review.createdAt).getFullYear() === new Date().getFullYear()
                  ).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Most active reviewer</p>
                <p className="text-lg font-medium">
                  {filteredReviews.length ? 
                    (Object.entries(
                      filteredReviews.reduce((acc, review) => {
                        const name = review.user?.name || `User #${review.userId}`;
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).sort((a, b) => b[1] - a[1])[0]?.[0] || "None") : 
                    "None"
                  }
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Reviews;
