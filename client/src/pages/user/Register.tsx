import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

const formSchema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

const Register: React.FC = () => {
  const { register, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      await register(data.name, data.email, data.password);
      // Redirect handled in auth.ts after successful registration
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary-light to-primary-dark">
      <Card className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/user/login")}>
              <ArrowLeft className="h-5 w-5 text-neutral-500 hover:text-primary" />
            </Button>
            <h2 className="text-2xl font-serif font-bold text-secondary-dark">Create Account</h2>
            <div className="w-8"></div> {/* spacer for alignment */}
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
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
                  {isLoading ? "Creating Account..." : "Register"}
                </Button>
              </div>
            </form>
          </Form>
          
          <div className="mt-5 text-center">
            <p className="text-neutral-600">
              Already have an account?
              <Button 
                variant="link" 
                className="text-primary-dark font-medium hover:underline ml-1 p-0"
                onClick={() => setLocation("/user/login")}
              >
                Login instead
              </Button>
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="px-8 py-4 bg-neutral-50 border-t border-neutral-100 text-center text-sm text-neutral-500">
          <p className="w-full">Join thousands of book lovers today!</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
