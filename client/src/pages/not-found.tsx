import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookX } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="w-full max-w-md mx-4 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>
        
        <CardContent className="pt-8 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 text-red-500 mb-6 mx-auto">
            <BookX className="h-10 w-10" />
          </div>
          
          <h1 className="text-7xl font-bold font-serif mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">404</h1>
          
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Page Not Found</h2>
          
          <p className="mt-4 mb-6 text-gray-600">
            The book you're looking for doesn't exist in our library or has been moved to another shelf.
          </p>
          
          <Button 
            onClick={() => setLocation("/")} 
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            Return to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
