import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, BookText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

interface UserReadingList {
  userId: number;
  userName: string;
  readingList: {
    id: number;
    userId: number;
    bookId: number;
    addedAt: string;
    progress: number;
    book: {
      id: number;
      title: string;
      author: string;
      category: string;
      coverImage?: string;
    };
  }[];
}

const ReadingLists: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user reading lists
  const { data: readingListsData, isLoading, error } = useQuery<UserReadingList[]>({
    queryKey: ["/api/admin/user-reading-lists"],
  });

  // Filter users based on search query
  const filteredUsers = readingListsData
    ? readingListsData.filter((userData) =>
        userData.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userData.readingList.some(item => 
          item.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.book.author.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : [];

  return (
    <AdminLayout title="User Reading Lists">
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
          <p className="text-neutral-500">Loading user reading lists...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">Error loading user reading lists</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="flex justify-center items-center h-64">
          <p className="text-neutral-500">No user reading lists found</p>
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
                    {userData.readingList.length} {userData.readingList.length === 1 ? "book" : "books"} in reading list
                  </p>
                </div>
              </div>

              {userData.readingList.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Added Date</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userData.readingList.map((readingItem) => (
                        <TableRow key={readingItem.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="h-12 w-9 bg-neutral-200 rounded mr-3 flex items-center justify-center overflow-hidden">
                                {readingItem.book.coverImage ? (
                                  <img src={readingItem.book.coverImage} alt={readingItem.book.title} className="h-full w-full object-cover" />
                                ) : (
                                  <BookText className="h-5 w-5 text-neutral-500" />
                                )}
                              </div>
                              <span className="font-medium text-sm">{readingItem.book.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-neutral-600">{readingItem.book.author}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {readingItem.book.category.charAt(0).toUpperCase() + readingItem.book.category.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-neutral-600">
                            {format(new Date(readingItem.addedAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="w-40">
                              <div className="flex justify-between mb-1">
                                <span className="text-xs font-medium text-neutral-600">{readingItem.progress}% complete</span>
                              </div>
                              <Progress value={readingItem.progress} className="h-2" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-6 text-center text-neutral-500">
                  No reading list items found for this user
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default ReadingLists;
