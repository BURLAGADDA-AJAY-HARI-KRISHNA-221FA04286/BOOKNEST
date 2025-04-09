import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Entry from "@/pages/Entry";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import UsersPage from "@/pages/admin/UsersPage";
import ActiveUsers from "@/pages/admin/ActiveUsers";
import Books from "@/pages/admin/Books";
import Reviews from "@/pages/admin/Reviews";
import LikedBooks from "@/pages/admin/LikedBooks";
import ReadingLists from "@/pages/admin/ReadingLists";
import UserLogin from "@/pages/user/Login";
import Register from "@/pages/user/Register";
import Home from "@/pages/user/Home";
import Explore from "@/pages/user/Explore";
import UserReadingList from "@/pages/user/ReadingList";
import UserLikedBooks from "@/pages/user/LikedBooks";
import { AuthProvider, useAuth } from "./lib/auth.tsx";
import { Loader2 } from "lucide-react";

// Protected route wrapper for routes requiring authentication
const ProtectedRoute = ({ 
  component: Component, 
  adminOnly = false,
  ...rest 
}: { 
  component: React.ComponentType;
  adminOnly?: boolean;
  path: string;
}) => {
  const { user, isLoading, isAdmin } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600">
        <div className="bg-white/95 p-8 rounded-xl shadow-lg flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If user is not authenticated, redirect to login
  if (!user) {
    return <Redirect to="/" />;
  }
  
  // If admin-only route and user is not admin, redirect to user home
  if (adminOnly && !isAdmin) {
    return <Redirect to="/user/home" />;
  }
  
  return <Component />;
};

function Router() {
  return (
    <Switch>
      {/* Entry and Auth Routes */}
      <Route path="/" component={Entry} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/user/login" component={UserLogin} />
      <Route path="/user/register" component={Register} />
      
      {/* Admin Routes - Protected and Admin-only */}
      <Route path="/admin/dashboard">
        <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminOnly={true} />
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute path="/admin/users" component={UsersPage} adminOnly={true} />
      </Route>
      <Route path="/admin/active-users">
        <ProtectedRoute path="/admin/active-users" component={ActiveUsers} adminOnly={true} />
      </Route>
      <Route path="/admin/books">
        <ProtectedRoute path="/admin/books" component={Books} adminOnly={true} />
      </Route>
      <Route path="/admin/reviews">
        <ProtectedRoute path="/admin/reviews" component={Reviews} adminOnly={true} />
      </Route>
      <Route path="/admin/liked-books">
        <ProtectedRoute path="/admin/liked-books" component={LikedBooks} adminOnly={true} />
      </Route>
      <Route path="/admin/reading-lists">
        <ProtectedRoute path="/admin/reading-lists" component={ReadingLists} adminOnly={true} />
      </Route>
      
      {/* User Routes - Protected */}
      <Route path="/user/home">
        <ProtectedRoute path="/user/home" component={Home} />
      </Route>
      <Route path="/user/explore">
        <ProtectedRoute path="/user/explore" component={Explore} />
      </Route>
      <Route path="/user/reading-list">
        <ProtectedRoute path="/user/reading-list" component={UserReadingList} />
      </Route>
      <Route path="/user/liked-books">
        <ProtectedRoute path="/user/liked-books" component={UserLikedBooks} />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
