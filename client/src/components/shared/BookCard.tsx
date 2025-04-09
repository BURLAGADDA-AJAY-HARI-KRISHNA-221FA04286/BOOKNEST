import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, Heart, Star, Eye } from "lucide-react";
import { Book as BookType } from "@/lib/types";

interface BookCardProps {
  book: BookType;
  onAddToReadingList?: (bookId: number) => void;
  onToggleLike?: (bookId: number, isLiked: boolean) => void;
  onViewDetails?: (bookId: number) => void;
  isLiked?: boolean;
  isCompact?: boolean;
  showActions?: boolean;
  progress?: number;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  onAddToReadingList,
  onToggleLike,
  onViewDetails,
  isLiked = false,
  isCompact = false,
  showActions = true,
  progress,
}) => {
  // Default cover image
  const defaultCover = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    book.title
  )}&background=1a5653&color=fff&size=280`;

  const coverImage = book.coverImage || defaultCover;

  // Render compact card (for grid views)
  if (isCompact) {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={coverImage}
            alt={`Cover of ${book.title}`}
            className="object-cover w-full h-full"
          />
          {showActions && onToggleLike && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white"
              onClick={() => onToggleLike(book.id, !isLiked)}
            >
              <Heart
                className={`h-4 w-4 ${
                  isLiked ? "fill-red-500 text-red-500" : "text-neutral-600"
                }`}
              />
            </Button>
          )}
        </div>

        <CardContent className="p-3">
          <h3 className="font-serif font-medium text-neutral-800 text-sm line-clamp-1">
            {book.title}
          </h3>
          <p className="text-neutral-600 text-xs mb-1">{book.author}</p>
          <div className="flex items-center mb-2">
            <div className="flex items-center text-yellow-400">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-xs text-neutral-500 ml-1">
                {book.averageRating ? book.averageRating.toFixed(1) : "N/A"}
              </span>
            </div>
            <span className="text-xs text-neutral-500 ml-1">
              ({book.totalReviews} {book.totalReviews === 1 ? "review" : "reviews"})
            </span>
          </div>
          
          {showActions && onViewDetails && (
            <Button 
              variant="outline" 
              size="sm"
              className="w-full text-xs h-8 mt-1"
              onClick={() => onViewDetails(book.id)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render full card
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
      <div className="relative h-56 overflow-hidden">
        <img
          src={coverImage}
          alt={`Cover of ${book.title}`}
          className="object-cover w-full h-full"
        />
        {typeof progress === "number" && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="text-white text-sm">{progress}% completed</div>
            <div className="w-full bg-white/30 rounded-full h-1.5 mt-1">
              <div className="bg-[#f8b400] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-serif font-semibold text-neutral-800 mb-1 line-clamp-1">
          {book.title}
        </h3>
        <p className="text-neutral-600 text-sm mb-3">{book.author}</p>
        
        {showActions && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button 
                variant="default" 
                className="w-full"
                onClick={onAddToReadingList ? () => onAddToReadingList(book.id) : undefined}
              >
                <Book className="h-4 w-4 mr-2" />
                {progress !== undefined ? "Resume Reading" : "Read Now"}
              </Button>
              
              {onToggleLike && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onToggleLike(book.id, !isLiked)}
                  className={isLiked ? "bg-red-50" : ""}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isLiked ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                </Button>
              )}
            </div>
            
            {onViewDetails && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onViewDetails(book.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookCard;
