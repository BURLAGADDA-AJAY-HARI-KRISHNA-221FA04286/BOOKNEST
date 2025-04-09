import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BookOpen, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof formSchema>;

const UserLogin: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      await login(data.email, data.password);
      // Redirect handled in auth.ts after successful login
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary-light to-primary-dark">
      <Card className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-5 w-5 text-neutral-500 hover:text-primary" />
            </Button>
            <h2 className="text-2xl font-serif font-bold text-secondary-dark">User Login</h2>
            <div className="w-8"></div> {/* spacer for alignment */}
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <div className="text-red-500 text-sm font-medium">{error}</div>
              )}
              
              <div className="pt-2">
                <Button type="submit" className="w-full py-6" disabled={isLoading} variant="secondary">
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Don't have an account?
              <Button 
                variant="link" 
                className="text-primary-dark font-medium hover:underline ml-1 p-0"
                onClick={() => setLocation("/user/register")}
              >
                Register now
              </Button>
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="px-8 py-4 bg-neutral-50 border-t border-neutral-100 text-center text-sm text-neutral-500">
          <p className="w-full">Read. Explore. Connect.</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserLogin;
