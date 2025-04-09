import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Stats, Activity, Review, Book } from "@/lib/types";
import { UserCheck, User, BookText, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Dashboard: React.FC = () => {
  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch latest reviews for activity
  const { data: reviews, isLoading: isLoadingReviews } = useQuery<Review[]>({
    queryKey: ["/api/admin/reviews"],
  });

  // Fetch top books
  const { data: books, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Create recent activities from various sources
  const recentActivities: Activity[] = [];

  // Add review activities if available
  if (reviews) {
    reviews.slice(0, 3).forEach((review, index) => {
      recentActivities.push({
        id: index,
        type: "review_added",
        title: "New review submitted",
        description: `${review.user?.name || "User"} • ${formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}`,
        timestamp: review.createdAt,
        icon: "ri-star-line",
      });
    });
  }

  // Add more activity types here if needed

  // Sort activities by timestamp
  recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Get top books
  const topBooks = books
    ? [...books].sort((a, b) => b.averageRating - a.averageRating).slice(0, 5)
    : [];

  return (
    <AdminLayout title="Dashboard Overview">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Users Card */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-neutral-500 text-sm font-medium">Total Users</h3>
                <p className="text-2xl font-semibold text-neutral-800">
                  {isLoadingStats ? "..." : stats?.totalUsers || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-neutral-500 flex items-center">
              <span className="text-green-500 flex items-center">
                <i className="ri-arrow-up-line mr-1"></i>12.5%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Books Card */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <BookText className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-neutral-500 text-sm font-medium">Total Books</h3>
                <p className="text-2xl font-semibold text-neutral-800">
                  {isLoadingStats ? "..." : stats?.totalBooks || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-neutral-500 flex items-center">
              <span className="text-green-500 flex items-center">
                <i className="ri-arrow-up-line mr-1"></i>8.2%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Card */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Star className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-neutral-500 text-sm font-medium">Total Reviews</h3>
                <p className="text-2xl font-semibold text-neutral-800">
                  {isLoadingStats ? "..." : stats?.totalReviews || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-neutral-500 flex items-center">
              <span className="text-green-500 flex items-center">
                <i className="ri-arrow-up-line mr-1"></i>18.3%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Users Card */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-neutral-500 text-sm font-medium">Active Users</h3>
                <p className="text-2xl font-semibold text-neutral-800">
                  {isLoadingStats ? "..." : stats?.activeUsers || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-neutral-500 flex items-center">
              <span className="text-green-500 flex items-center">
                <i className="ri-arrow-up-line mr-1"></i>5.7%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <div className="p-5 border-b border-neutral-200">
            <h3 className="font-medium text-neutral-800">Recent Activity</h3>
          </div>
          <CardContent className="p-5">
            {isLoadingReviews ? (
              <div className="py-10 text-center text-neutral-500">Loading activity...</div>
            ) : recentActivities.length > 0 ? (
              <ul className="divide-y divide-neutral-200">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="py-3 flex">
                    <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mr-3">
                      <i className={activity.icon}></i>
                    </span>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{activity.title}</p>
                      <p className="text-xs text-neutral-500">{activity.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-10 text-center text-neutral-500">No recent activities</div>
            )}
          </CardContent>
        </Card>

        {/* Top Books */}
        <Card>
          <div className="p-5 border-b border-neutral-200">
            <h3 className="font-medium text-neutral-800">Top Rated Books</h3>
          </div>
          <CardContent className="p-5">
            {isLoadingBooks ? (
              <div className="py-10 text-center text-neutral-500">Loading books...</div>
            ) : topBooks.length > 0 ? (
              <ul className="divide-y divide-neutral-200">
                {topBooks.map((book) => (
                  <li key={book.id} className="py-3 flex">
                    <div className="h-14 w-10 bg-neutral-200 rounded mr-3 flex items-center justify-center overflow-hidden">
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
                      ) : (
                        <BookText className="h-5 w-5 text-neutral-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-800">{book.title}</p>
                      <p className="text-xs text-neutral-500">{book.author}</p>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`text-xs ${
                                i < Math.floor(book.averageRating)
                                  ? "ri-star-fill"
                                  : i < book.averageRating
                                  ? "ri-star-half-fill"
                                  : "ri-star-line"
                              }`}
                            ></i>
                          ))}
                        </div>
                        <span className="text-xs text-neutral-500 ml-1">
                          {book.averageRating.toFixed(1)} ({book.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-10 text-center text-neutral-500">No books available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
