import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import UserLayout from "@/components/layouts/UserLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ReadingListItem } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BookCard from "@/components/shared/BookCard";
import { Bookmark, BookText, Trash2 } from "lucide-react";
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
import {
  Slider
} from "@/components/ui/slider";

const ReadingList: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ReadingListItem | null>(null);
  const [isUpdateProgressOpen, setIsUpdateProgressOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [progressValue, setProgressValue] = useState<number>(0);

  // Fetch user's reading list
  const { data: readingList, isLoading } = useQuery<ReadingListItem[]>({
    queryKey: ["/api/reading-list"],
  });

  // Update reading progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: (params: { id: number; progress: number }) =>
      apiRequest("PUT", `/api/reading-list/${params.id}`, { progress: params.progress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reading-list"] });
      toast({
        title: "Progress updated",
        description: "Your reading progress has been updated successfully",
      });
      setIsUpdateProgressOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update progress",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Remove from reading list mutation
  const removeFromReadingListMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/reading-list/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reading-list"] });
      toast({
        title: "Book removed",
        description: "The book has been removed from your reading list",
      });
      setIsRemoveDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to remove book",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Filter reading list based on search query
  const filteredReadingList = readingList
    ? readingList.filter(
        (item) =>
          item.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.book.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Handle opening the update progress dialog
  const handleOpenUpdateProgress = (item: ReadingListItem) => {
    setSelectedItem(item);
    setProgressValue(item.progress);
    setIsUpdateProgressOpen(true);
  };

  // Handle opening the remove confirmation dialog
  const handleOpenRemoveDialog = (item: ReadingListItem) => {
    setSelectedItem(item);
    setIsRemoveDialogOpen(true);
  };

  // Handle updating progress
  const handleUpdateProgress = () => {
    if (selectedItem) {
      updateProgressMutation.mutate({
        id: selectedItem.id,
        progress: progressValue,
      });
    }
  };

  // Handle removing book from reading list
  const handleRemoveFromReadingList = () => {
    if (selectedItem) {
      removeFromReadingListMutation.mutate(selectedItem.id);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <UserLayout onSearch={handleSearch}>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-neutral-800 mb-4">My Reading List</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-64 animate-pulse">
                <div className="h-full bg-neutral-100"></div>
              </Card>
            ))}
          </div>
        ) : filteredReadingList.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center">
              <Bookmark className="h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Your reading list is empty</h3>
              <p className="text-neutral-500 mb-4">
                {searchQuery
                  ? "No books found matching your search criteria"
                  : "Add books to your reading list to keep track of what you want to read"}
              </p>
              <Button variant="default" onClick={() => window.location.href = "/user/explore"}>
                Explore Books
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredReadingList.map((item) => (
              <div key={item.id} className="relative group">
                <BookCard
                  book={item.book}
                  progress={item.progress}
                  showActions={false}
                />
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center space-x-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-primary text-white"
                    onClick={() => handleOpenUpdateProgress(item)}
                  >
                    Update Progress
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => handleOpenRemoveDialog(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reading Progress Sections */}
      {(readingList?.length || 0) > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-serif font-bold text-neutral-800 mb-4">Reading Progress</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* In Progress Books */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-lg mb-4">In Progress</h3>
                
                {readingList?.filter(item => item.progress > 0 && item.progress < 100).length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <BookText className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
                    <p>No books in progress</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {readingList
                      ?.filter(item => item.progress > 0 && item.progress < 100)
                      .sort((a, b) => b.progress - a.progress)
                      .slice(0, 3)
                      .map(item => (
                        <div key={item.id} className="flex items-center">
                          <div className="h-12 w-9 bg-neutral-200 rounded mr-3 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.book.coverImage ? (
                              <img src={item.book.coverImage} alt={item.book.title} className="h-full w-full object-cover" />
                            ) : (
                              <BookText className="h-5 w-5 text-neutral-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <p className="text-sm font-medium line-clamp-1">{item.book.title}</p>
                              <span className="text-xs font-medium">{item.progress}%</span>
                            </div>
                            <Progress value={item.progress} className="h-2" />
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Books */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-lg mb-4">Completed</h3>
                
                {readingList?.filter(item => item.progress === 100).length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <BookText className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
                    <p>No completed books yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {readingList
                      ?.filter(item => item.progress === 100)
                      .slice(0, 4)
                      .map(item => (
                        <div key={item.id} className="flex items-center">
                          <div className="h-12 w-9 bg-neutral-200 rounded mr-3 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.book.coverImage ? (
                              <img src={item.book.coverImage} alt={item.book.title} className="h-full w-full object-cover" />
                            ) : (
                              <BookText className="h-5 w-5 text-neutral-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{item.book.title}</p>
                            <p className="text-xs text-neutral-500">{item.book.author}</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Update Progress Dialog */}
      <AlertDialog open={isUpdateProgressOpen} onOpenChange={setIsUpdateProgressOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Reading Progress</AlertDialogTitle>
            <AlertDialogDescription>
              Track your progress for "{selectedItem?.book.title}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{progressValue}% Complete</span>
                {progressValue === 100 && (
                  <span className="text-sm text-green-600 font-medium">Completed!</span>
                )}
              </div>
              
              <Slider
                value={[progressValue]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setProgressValue(value[0])}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-neutral-500">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateProgress}>
              Save Progress
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Book Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Reading List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{selectedItem?.book.title}" from your reading list?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromReadingList}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UserLayout>
  );
};

export default ReadingList;
