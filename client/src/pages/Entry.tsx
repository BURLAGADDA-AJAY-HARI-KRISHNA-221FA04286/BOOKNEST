import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { BookOpen, User, ShieldCheck } from "lucide-react";

const Entry: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1NiIgaGVpZ2h0PSIxMDAiPgo8cmVjdCB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiBmaWxsPSIjZmZmZmZmMTAiPjwvcmVjdD4KPHBhdGggZD0iTTI4IDY2TDAgNTBMMCAxNkwyOCAwTDU2IDE2TDU2IDUwTDI4IDY2TDI4IDEwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmMDgiIHN0cm9rZS13aWR0aD0iMiI+PC9wYXRoPgo8cGF0aCBkPSJNMjggMEwyOCA2NkwwIDUwTDAgMTZMMjggMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmMDgiIHN0cm9rZS13aWR0aD0iMiI+PC9wYXRoPgo8cGF0aCBkPSJNMjggMEw1NiAxNkw1NiA1MEwyOCA2NkwyOCAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYwOCIgc3Ryb2tlLXdpZHRoPSIyIj48L3BhdGg+Cjwvc3ZnPgo=')]"></div>
      
      <div className="relative mb-8 text-center">
        <h1 className="text-5xl font-bold font-serif bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 drop-shadow-lg flex justify-center items-center">
          <BookOpen className="mr-3 h-12 w-12 text-white" /> BookNest
        </h1>
        <p className="text-blue-100 mt-3 text-xl">Your Digital Reading Companion</p>
      </div>
      
      <Card className="max-w-md w-full bg-white/95 rounded-xl shadow-2xl backdrop-blur-sm border border-white/20 overflow-hidden relative z-10">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <CardContent className="p-8">
          <h2 className="text-2xl font-serif font-semibold text-center mb-8 text-gray-800">Select Access Type</h2>
          
          <div className="space-y-5">
            <Button 
              onClick={() => setLocation("/admin/login")}
              className="w-full py-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 flex items-center justify-center font-medium transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1"
            >
              <ShieldCheck className="mr-2 h-5 w-5" /> Admin Access
            </Button>
            
            <Button 
              onClick={() => setLocation("/user/login")}
              className="w-full py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center font-medium transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1"
            >
              <User className="mr-2 h-5 w-5" /> User Access
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="px-8 py-4 bg-gray-50/80 border-t border-gray-100 text-center text-sm text-gray-500">
          <p className="w-full">© {new Date().getFullYear()} BookNest. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Entry;
