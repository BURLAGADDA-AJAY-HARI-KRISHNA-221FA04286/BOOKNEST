import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, BookText, Heart } from "lucide-react";
import { format } from "date-fns";

interface UserLikedBooks {
  userId: number;
  userName: string;
  likedBooks: {
    id: number;
    userId: number;
    bookId: number;
    likedAt: string;
    book: {
      id: number;
      title: string;
      author: string;
      category: string;
      coverImage?: string;
    };
  }[];
}

const LikedBooks: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user liked books
  const { data: likedBooksData, isLoading, error } = useQuery<UserLikedBooks[]>({
    queryKey: ["/api/admin/user-liked-books"],
  });

  // Filter users based on search query
  const filteredUsers = likedBooksData
    ? likedBooksData.filter((userData) =>
        userData.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userData.likedBooks.some(item => 
          item.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.book.author.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : [];

  return (
    <AdminLayout title="User Liked Books">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search users or books..."
            className="pl-10 pr-4 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-neutral-500">Loading user liked books...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">Error loading user liked books</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="flex justify-center items-center h-64">
          <p className="text-neutral-500">No user liked books found</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredUsers.map((userData) => (
            <Card key={userData.userId} className="overflow-hidden">
              <div className="p-5 border-b border-neutral-200 bg-neutral-50 flex items-center">
                <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 mr-4">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{userData.userName}</h3>
                  <p className="text-sm text-neutral-500">
                    {userData.likedBooks.length} {userData.likedBooks.length === 1 ? "book" : "books"} liked
                  </p>
                </div>
              </div>

              {userData.likedBooks.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Liked Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userData.likedBooks.map((likedBook) => (
                        <TableRow key={likedBook.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="h-12 w-9 bg-neutral-200 rounded mr-3 flex items-center justify-center overflow-hidden">
                                {likedBook.book.coverImage ? (
                                  <img src={likedBook.book.coverImage} alt={likedBook.book.title} className="h-full w-full object-cover" />
                                ) : (
                                  <BookText className="h-5 w-5 text-neutral-500" />
                                )}
                              </div>
                              <span className="font-medium text-sm">{likedBook.book.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-neutral-600">{likedBook.book.author}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {likedBook.book.category.charAt(0).toUpperCase() + likedBook.book.category.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-neutral-600">
                            {format(new Date(likedBook.likedAt), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-6 text-center text-neutral-500">
                  No liked books found for this user
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Analytics Overview */}
      <div className="mt-8">
        <h2 className="text-xl font-serif font-bold text-neutral-800 mb-4">Analytics Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-neutral-500 mb-1">Total Liked Books</h3>
              <p className="text-2xl font-semibold">
                {likedBooksData?.reduce((total, user) => total + user.likedBooks.length, 0) || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-neutral-500 mb-1">Average Books Liked Per User</h3>
              <p className="text-2xl font-semibold">
                {likedBooksData && likedBooksData.length > 0
                  ? (likedBooksData.reduce((total, user) => total + user.likedBooks.length, 0) / likedBooksData.length).toFixed(1)
                  : "0"}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-neutral-500 mb-1">Most Liked Category</h3>
              <p className="text-2xl font-semibold">
                {likedBooksData && likedBooksData.length > 0
                  ? Object.entries(
                      likedBooksData.flatMap(user => user.likedBooks).reduce((acc, item) => {
                        const category = item.book.category;
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([category]) => category.charAt(0).toUpperCase() + category.slice(1))[0] || "None"
                  : "None"}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-neutral-500 mb-1">Most Active User</h3>
              <p className="text-2xl font-semibold">
                {likedBooksData && likedBooksData.length > 0
                  ? [...likedBooksData]
                      .sort((a, b) => b.likedBooks.length - a.likedBooks.length)[0]?.userName || "None"
                  : "None"}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Most Liked Books */}
      <div className="mt-8">
        <h2 className="text-xl font-serif font-bold text-neutral-800 mb-4">Most Liked Books</h2>
        <Card>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedBooksData && likedBooksData.length > 0 ? (
                Object.entries(
                  likedBooksData.flatMap(user => user.likedBooks).reduce((acc, item) => {
                    const bookId = item.book.id;
                    if (!acc[bookId]) {
                      acc[bookId] = { 
                        book: item.book, 
                        count: 0 
                      };
                    }
                    acc[bookId].count += 1;
                    return acc;
                  }, {} as Record<number, { book: any; count: number }>)
                )
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 6)
                  .map(([bookId, data]) => (
                    <div key={bookId} className="flex items-center">
                      <div className="h-16 w-12 bg-neutral-200 rounded mr-3 flex items-center justify-center overflow-hidden">
                        {data.book.coverImage ? (
                          <img src={data.book.coverImage} alt={data.book.title} className="h-full w-full object-cover" />
                        ) : (
                          <BookText className="h-6 w-6 text-neutral-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-800 line-clamp-1">{data.book.title}</h4>
                        <p className="text-sm text-neutral-600">{data.book.author}</p>
                        <div className="flex items-center mt-1 text-sm text-rose-500">
                          <Heart className="h-3 w-3 fill-current mr-1" /> {data.count}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="col-span-3 text-center text-neutral-500 py-10">
                  No liked books data available
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default LikedBooks;
