import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Trash2, HelpCircle, BookText, Star } from "lucide-react";
import { Book, BookFormData, VerificationQuestionFormData } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddBookModal from "@/components/modals/AddBookModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const Books: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("latest");
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);
  const [isBookInfoModalOpen, setIsBookInfoModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingQuestions, setEditingQuestions] = useState<VerificationQuestionFormData[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "questions">("details");
  const booksPerPage = 10;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all books
  const { data: books, isLoading, error } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Add book mutation
  const addBookMutation = useMutation({
    mutationFn: async (data: { book: BookFormData; questions: VerificationQuestionFormData[] }) => {
      // First create the book
      const bookResponse = await apiRequest("POST", "/api/books", data.book);
      const newBook = await bookResponse.json();
      
      // Then add verification questions for the book
      const questionPromises = data.questions.map(question => 
        apiRequest("POST", `/api/books/${newBook.id}/questions`, {
          ...question,
          bookId: newBook.id
        })
      );
      
      await Promise.all(questionPromises);
      return newBook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Book added successfully",
        description: "The book and verification questions have been added to the system.",
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

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: (bookId: number) => apiRequest("DELETE", `/api/books/${bookId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Book deleted successfully",
        description: "The book has been removed from the system.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete book",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle add book form submission
  const handleAddBook = async (book: BookFormData, questions: VerificationQuestionFormData[]) => {
    await addBookMutation.mutateAsync({ book, questions });
    setIsAddBookModalOpen(false);
  };

  // Edit book mutation
  const editBookMutation = useMutation({
    mutationFn: async (book: Partial<Book>) => {
      const response = await apiRequest("PUT", `/api/books/${book.id}`, book);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Book updated successfully",
        description: "The book has been updated in the system.",
      });
      setIsEditBookModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update book",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Fetch book questions query
  const { data: bookQuestions, refetch: refetchBookQuestions } = useQuery<any[]>({
    queryKey: ["/api/books", selectedBook?.id, "questions"],
    enabled: !!selectedBook,
    queryFn: async () => {
      if (!selectedBook) return [];
      const res = await fetch(`/api/books/${selectedBook.id}/questions`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    }
  });

  // Update questions mutation
  const updateQuestionsMutation = useMutation({
    mutationFn: async ({
      bookId,
      questions
    }: {
      bookId: number;
      questions: VerificationQuestionFormData[];
    }) => {
      // First delete existing questions
      await apiRequest("DELETE", `/api/books/${bookId}/questions`);
      
      // Then add new questions
      const questionPromises = questions.map(question => 
        apiRequest("POST", `/api/books/${bookId}/questions`, {
          ...question,
          bookId
        })
      );
      
      return Promise.all(questionPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", selectedBook?.id, "questions"] });
      toast({
        title: "Questions updated successfully",
        description: "The verification questions have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update questions",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Effect to update editingQuestions when bookQuestions loads
  useEffect(() => {
    if (bookQuestions) {
      // Transform the API response into VerificationQuestionFormData format
      const formattedQuestions = bookQuestions.map(q => ({
        question: q.question,
        options: q.options || [],
        correctOptionIndex: q.correctOptionIndex || 0
      }));
      setEditingQuestions(formattedQuestions);
    } else {
      // Reset to empty array when no questions are available
      setEditingQuestions([]);
    }
  }, [bookQuestions]);

  // Handle edit book
  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setIsEditBookModalOpen(true);
    setActiveTab("details");
    
    // Initialize with empty array to prevent UI issues while questions load
    setEditingQuestions([]);
    
    // Manually trigger refetch of book questions
    // Wrap in setTimeout to ensure the query executes after state updates
    setTimeout(() => {
      refetchBookQuestions();
    }, 200);
  };
  
  // Handle edit book with questions
  const handleEditBookWithQuestions = () => {
    if (selectedBook) {
      // First update the book details
      editBookMutation.mutate({
        ...selectedBook
      });
      
      // Then update the questions if we have any
      if (editingQuestions.length > 0) {
        updateQuestionsMutation.mutate({
          bookId: selectedBook.id,
          questions: editingQuestions
        });
      }
    }
  };

  // Handle view book info
  const handleViewBookInfo = (book: Book) => {
    setSelectedBook(book);
    setIsBookInfoModalOpen(true);
  };

  // Handle edit book submit (older method, keeping for compatibility)
  const handleEditBookSubmit = (updatedBookData: Partial<Book>) => {
    if (selectedBook) {
      editBookMutation.mutate({
        id: selectedBook.id,
        ...updatedBookData
      });
    }
  };

  // Handle delete book
  const handleDeleteBook = (bookId: number) => {
    if (window.confirm("Are you sure you want to delete this book? This action cannot be undone.")) {
      deleteBookMutation.mutate(bookId);
    }
  };

  // Filter and sort books
  let filteredBooks = books || [];
  
  // Apply category filter
  if (selectedCategory && selectedCategory !== "all") {
    filteredBooks = filteredBooks.filter(book => 
      book.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }
  
  // Apply search filter
  if (searchQuery) {
    filteredBooks = filteredBooks.filter(book => 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Apply sorting
  if (sortBy === "title-asc") {
    filteredBooks = [...filteredBooks].sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "title-desc") {
    filteredBooks = [...filteredBooks].sort((a, b) => b.title.localeCompare(a.title));
  } else if (sortBy === "rating") {
    filteredBooks = [...filteredBooks].sort((a, b) => b.averageRating - a.averageRating);
  } else {
    // Default: sort by latest
    filteredBooks = [...filteredBooks].sort((a, b) => 
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);

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

  return (
    <AdminLayout title="Book Management">
      <div className="flex justify-between items-center mb-6">
        <Button 
          onClick={() => setIsAddBookModalOpen(true)} 
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Book
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-5 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search books..."
              className="pl-10 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by: Latest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Sort by: Latest</SelectItem>
                <SelectItem value="title-asc">Sort by: Title A-Z</SelectItem>
                <SelectItem value="title-desc">Sort by: Title Z-A</SelectItem>
                <SelectItem value="rating">Sort by: Highest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-neutral-500">Loading books...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">Error loading books</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral-50">
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Added Date</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBooks.length > 0 ? (
                    currentBooks.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-12 w-9 bg-neutral-200 rounded mr-3 flex items-center justify-center overflow-hidden">
                              {book.coverImage ? (
                                <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
                              ) : (
                                <BookText className="h-5 w-5 text-neutral-500" />
                              )}
                            </div>
                            <span className="font-medium text-sm">{book.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-neutral-600">{book.author}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {book.category.charAt(0).toUpperCase() + book.category.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-neutral-600">
                          {format(new Date(book.addedAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                            <span className="text-sm text-neutral-600">
                              {book.averageRating.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-blue-500 hover:text-blue-700 mr-1"
                            onClick={() => handleEditBook(book)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-green-500 hover:text-green-700 mr-1"
                            onClick={() => handleViewBookInfo(book)}
                          >
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteBook(book.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No books found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredBooks.length > 0 && (
              <div className="border-t border-neutral-200 px-5 py-3 flex items-center justify-between">
                <div className="text-sm text-neutral-500">
                  Showing <span className="font-medium">{indexOfFirstBook + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastBook, filteredBooks.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredBooks.length}</span> books
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

      {/* Add Book Modal */}
      <AddBookModal
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
        onSubmit={handleAddBook}
      />

      {/* Edit Book Modal */}
      {selectedBook && (
        <Dialog open={isEditBookModalOpen} onOpenChange={setIsEditBookModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Edit Book</DialogTitle>
              <DialogDescription>
                Make changes to the book information and verification questions below.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "details" | "questions")} className="mt-4">
              <TabsList className="grid w-full grid-cols-2 sticky top-0 z-10 bg-white">
                <TabsTrigger value="details">Book Details</TabsTrigger>
                <TabsTrigger value="questions">Verification Questions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="text-sm font-medium text-gray-700 block mb-1">Title</label>
                      <Input 
                        id="title" 
                        defaultValue={selectedBook.title}
                        onChange={(e) => setSelectedBook({...selectedBook, title: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="author" className="text-sm font-medium text-gray-700 block mb-1">Author</label>
                      <Input 
                        id="author" 
                        defaultValue={selectedBook.author}
                        onChange={(e) => setSelectedBook({...selectedBook, author: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="text-sm font-medium text-gray-700 block mb-1">Category</label>
                      <Select defaultValue={selectedBook.category} onValueChange={(value) => setSelectedBook({...selectedBook, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category.toLowerCase()}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label htmlFor="coverImage" className="text-sm font-medium text-gray-700 block mb-1">Cover Image URL</label>
                      <Input 
                        id="coverImage" 
                        defaultValue={selectedBook.coverImage || ''}
                        onChange={(e) => setSelectedBook({...selectedBook, coverImage: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="description" className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                      <textarea 
                        id="description" 
                        rows={5}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        defaultValue={selectedBook.description}
                        onChange={(e) => setSelectedBook({...selectedBook, description: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="publisher" className="text-sm font-medium text-gray-700 block mb-1">Publisher</label>
                      <Input 
                        id="publisher" 
                        defaultValue={selectedBook.publisher || ''}
                        onChange={(e) => setSelectedBook({...selectedBook, publisher: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="isbn" className="text-sm font-medium text-gray-700 block mb-1">ISBN</label>
                      <Input 
                        id="isbn" 
                        defaultValue={selectedBook.isbn || ''}
                        onChange={(e) => setSelectedBook({...selectedBook, isbn: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="questions" className="py-4">
                {/* Loading state or empty state for questions */}
                {!bookQuestions ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-neutral-500">Loading questions...</p>
                  </div>
                ) : editingQuestions.length === 0 ? (
                  <div className="flex items-center justify-center h-32 bg-gray-50 rounded-md mb-4">
                    <p className="text-gray-500">No verification questions for this book yet. Add questions below.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {editingQuestions.map((question, index) => (
                      <div key={index} className="p-4 border rounded-md shadow-sm">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                              Question {index + 1}
                            </label>
                            <Input
                              value={question.question}
                              onChange={(e) => {
                                const newQuestions = [...editingQuestions];
                                newQuestions[index] = {
                                  ...newQuestions[index],
                                  question: e.target.value
                                };
                                setEditingQuestions(newQuestions);
                              }}
                              placeholder="Enter question"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map((optionIndex) => (
                              <div key={optionIndex}>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Option {optionIndex + 1} {question.correctOptionIndex === optionIndex && 
                                    <span className="text-green-600">(Correct)</span>
                                  }
                                </label>
                                <div className="flex gap-2 items-center">
                                  <Input
                                    value={question.options[optionIndex] || ""}
                                    onChange={(e) => {
                                      const newQuestions = [...editingQuestions];
                                      newQuestions[index].options[optionIndex] = e.target.value;
                                      setEditingQuestions(newQuestions);
                                    }}
                                    placeholder={`Option ${optionIndex + 1}`}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={question.correctOptionIndex === optionIndex ? "default" : "outline"}
                                    onClick={() => {
                                      const newQuestions = [...editingQuestions];
                                      newQuestions[index] = {
                                        ...newQuestions[index],
                                        correctOptionIndex: optionIndex
                                      };
                                      setEditingQuestions(newQuestions);
                                    }}
                                    className={question.correctOptionIndex === optionIndex ? "bg-green-600 hover:bg-green-700" : ""}
                                  >
                                    Correct
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newQuestions = [...editingQuestions];
                              newQuestions.splice(index, 1);
                              setEditingQuestions(newQuestions);
                            }}
                            className="mt-2"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Remove Question
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add New Question Button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    const newQuestions = [...editingQuestions];
                    newQuestions.push({
                      question: "",
                      options: ["", "", "", ""],
                      correctOptionIndex: 0
                    });
                    setEditingQuestions(newQuestions);
                  }}
                  className="w-full mt-4"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Question
                </Button>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditBookModalOpen(false);
                  setEditingQuestions([]);
                  setActiveTab("details");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditBookWithQuestions} 
                disabled={editBookMutation.isPending || updateQuestionsMutation.isPending}
              >
                {editBookMutation.isPending || updateQuestionsMutation.isPending 
                  ? "Saving..." 
                  : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Book Info Modal */}
      {selectedBook && (
        <Dialog open={isBookInfoModalOpen} onOpenChange={setIsBookInfoModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif font-semibold">{selectedBook.title}</DialogTitle>
              <DialogDescription>
                Book details and information
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="col-span-1">
                <div className="bg-neutral-100 rounded-md aspect-[2/3] overflow-hidden mb-4">
                  {selectedBook.coverImage ? (
                    <img src={selectedBook.coverImage} alt={selectedBook.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                      <BookText className="h-12 w-12 text-neutral-400" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-2" />
                    <span className="font-medium">{selectedBook.averageRating.toFixed(1)}</span>
                    <span className="text-neutral-500 ml-1">({selectedBook.totalReviews} reviews)</span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium text-neutral-500">Category:</span>{" "}
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                      {selectedBook.category.charAt(0).toUpperCase() + selectedBook.category.slice(1)}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium text-neutral-500">Added:</span>{" "}
                    {format(new Date(selectedBook.addedAt), "MMMM d, yyyy")}
                  </div>
                  
                  {selectedBook.isbn && (
                    <div className="text-sm">
                      <span className="font-medium text-neutral-500">ISBN:</span>{" "}
                      {selectedBook.isbn}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="col-span-2 space-y-5">
                <div>
                  <h3 className="text-lg font-medium mb-1">By {selectedBook.author}</h3>
                  {selectedBook.publisher && (
                    <p className="text-sm text-neutral-500">
                      Published by {selectedBook.publisher}
                      {selectedBook.publishedDate && ` on ${selectedBook.publishedDate}`}
                    </p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-2">Description</h3>
                  <p className="text-neutral-700 leading-relaxed">{selectedBook.description}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
};

export default Books;
