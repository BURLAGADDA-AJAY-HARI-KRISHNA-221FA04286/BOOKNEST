import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookFormData, VerificationQuestionFormData } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  publisher: z.string().optional(),
  publishedDate: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  isbn: z.string().optional(),
  coverImage: z.string().optional(),
});

// Questions schema
const questionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).min(4, "Four options are required"),
  correctOptionIndex: z.number().min(0).max(3),
});

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookData: BookFormData, questions: VerificationQuestionFormData[]) => Promise<void>;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState("book-details");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  // Store the three verification questions
  const [questions, setQuestions] = useState<VerificationQuestionFormData[]>([
    { question: "", options: ["", "", "", ""], correctOptionIndex: 0 },
    { question: "", options: ["", "", "", ""], correctOptionIndex: 0 },
    { question: "", options: ["", "", "", ""], correctOptionIndex: 0 },
  ]);
  
  const bookForm = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      publisher: "",
      publishedDate: "",
      description: "",
      category: "",
      isbn: "",
      coverImage: "",
    },
  });

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

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to a server and get back a URL
      // For demo purposes, we'll use a data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setCoverPreview(dataUrl);
          bookForm.setValue("coverImage", dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  type QuestionFieldType = {
  question: string;
  options: [number, string]; // [optionIndex, value]
  correctOptionIndex: number;
};

// Use a better typed function signature
const handleQuestionChange = <K extends keyof QuestionFieldType>(
  index: number, 
  field: K, 
  value: QuestionFieldType[K]
) => {
    const updatedQuestions = [...questions];
    
    if (field === "options") {
      // Handle options array updates
      const [optionIndex, optionValue] = value as [number, string];
      updatedQuestions[index].options[optionIndex] = optionValue;
    } else if (field === 'question') {
      // Handle question field
      updatedQuestions[index].question = value as string;
    } else if (field === 'correctOptionIndex') {
      // Handle correctOptionIndex field
      updatedQuestions[index].correctOptionIndex = value as number;
    }
    
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (data: BookFormData) => {
    // Validate that all questions are filled out
    const isQuestionsValid = questions.every(
      (q) => q.question.trim() !== "" && q.options.every((o) => o.trim() !== "")
    );

    if (!isQuestionsValid) {
      alert("Please fill out all verification questions and options");
      setActiveTab("verification-questions");
      return;
    }

    try {
      await onSubmit(data, questions);
      // Reset the form
      bookForm.reset();
      setCoverPreview(null);
      setQuestions([
        { question: "", options: ["", "", "", ""], correctOptionIndex: 0 },
        { question: "", options: ["", "", "", ""], correctOptionIndex: 0 },
        { question: "", options: ["", "", "", ""], correctOptionIndex: 0 },
      ]);
      onClose();
    } catch (error) {
      console.error("Error adding book:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif font-bold text-neutral-800">Add New Book</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="book-details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4 sticky top-0 z-10 bg-white">
            <TabsTrigger value="book-details">Book Details</TabsTrigger>
            <TabsTrigger value="verification-questions">Verification Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="book-details">
            <Form {...bookForm}>
              <form className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <div className="space-y-4">
                      <FormField
                        control={bookForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Book Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter book title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bookForm.control}
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Author</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter author name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={bookForm.control}
                          name="publisher"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Publisher</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter publisher" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={bookForm.control}
                          name="publishedDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Publication Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={bookForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category.toLowerCase()}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bookForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter book description"
                                className="resize-none"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <FormLabel>Book Cover</FormLabel>
                    <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 h-64 flex flex-col items-center justify-center bg-neutral-50 text-center">
                      {coverPreview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={coverPreview}
                            alt="Book cover preview"
                            className="w-full h-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 rounded-full"
                            onClick={() => {
                              setCoverPreview(null);
                              bookForm.setValue("coverImage", "");
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <ImagePlus className="text-neutral-400 h-8 w-8 mb-2" />
                          <p className="text-sm text-neutral-600 mb-1">
                            Drag & drop or click to upload
                          </p>
                          <p className="text-xs text-neutral-500">
                            PNG, JPG or JPEG (max. 2MB)
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        id="bookCover"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverImageChange}
                      />
                      {!coverPreview && (
                        <Button
                          type="button"
                          className="mt-3"
                          onClick={() => document.getElementById("bookCover")?.click()}
                        >
                          Choose File
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={bookForm.control}
                      name="isbn"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>ISBN</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 978-3-16-148410-0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setActiveTab("verification-questions")}
                >
                  Continue to Verification Questions
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="verification-questions">
            <div className="space-y-5">
              <div>
                <h4 className="font-medium text-neutral-800 mb-3">Verification Questions</h4>
                <p className="text-sm text-neutral-600 mb-4">
                  Add three questions that readers must answer correctly before reviewing this book.
                </p>
              </div>

              {questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="bg-neutral-50 p-4 rounded-lg border border-neutral-200"
                >
                  <div className="mb-3">
                    <label className="text-sm font-medium leading-none mb-2 block">
                      Question {questionIndex + 1}
                    </label>
                    <Input
                      value={question.question}
                      onChange={(e) =>
                        handleQuestionChange(questionIndex, "question", e.target.value)
                      }
                      placeholder={`Enter your question ${questionIndex + 1}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="mb-2">
                        <label className="text-sm font-medium leading-none mb-2 block">
                          Option {optionIndex + 1}
                          {optionIndex === question.correctOptionIndex && (
                            <span className="text-green-600 ml-1">(Correct)</span>
                          )}
                        </label>
                        <Input
                          value={option}
                          onChange={(e) =>
                            handleQuestionChange(
                              questionIndex,
                              "options",
                              [optionIndex, e.target.value]
                            )
                          }
                          placeholder={`Option ${optionIndex + 1}`}
                          className={
                            optionIndex === question.correctOptionIndex
                              ? "border-green-300 bg-green-50 focus-visible:ring-green-500"
                              : ""
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <label className="text-sm font-medium leading-none mb-2 block">
                      Correct Answer
                    </label>
                    <Select
                      value={question.correctOptionIndex.toString()}
                      onValueChange={(value) =>
                        handleQuestionChange(
                          questionIndex,
                          "correctOptionIndex",
                          parseInt(value)
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct option" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3].map((index) => (
                          <SelectItem key={index} value={index.toString()}>
                            Option {index + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between border-t border-neutral-200 pt-4 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex space-x-2">
            {activeTab === "verification-questions" && (
              <Button variant="outline" onClick={() => setActiveTab("book-details")}>
                Back
              </Button>
            )}
            {activeTab === "verification-questions" && (
              <Button onClick={bookForm.handleSubmit(handleSubmit)}>
                Add Book
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookModal;
