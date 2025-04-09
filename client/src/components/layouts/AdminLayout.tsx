import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  UserCheck,
  BookText,
  Star,
  Heart,
  Bookmark,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Navigation items configuration
  const navItems = [
    {
      name: "Overview",
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Active Users",
      path: "/admin/active-users",
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      name: "Books",
      path: "/admin/books",
      icon: <BookText className="h-5 w-5" />,
    },
    {
      name: "Reviews",
      path: "/admin/reviews",
      icon: <Star className="h-5 w-5" />,
    },
    {
      name: "Liked Books",
      path: "/admin/liked-books",
      icon: <Heart className="h-5 w-5" />,
    },
    {
      name: "Reading Lists",
      path: "/admin/reading-lists",
      icon: <Bookmark className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Navbar */}
      <nav className="bg-primary text-white shadow-md z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="flex items-center">
                <BookOpen className="h-6 w-6 mr-2" />
                <span className="font-serif font-bold text-xl">BookNest Admin</span>
              </Link>
            </div>

            <div className="hidden md:block">
              <div className="ml-4 flex items-center space-x-4">
                <div className="text-sm flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{user?.name || "Admin User"}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-transparent"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4 mr-1" /> Logout
                </Button>
              </div>
            </div>

            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={toggleMobileMenu}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-primary-dark">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="text-sm flex items-center text-white px-3 py-2">
                <Users className="h-4 w-4 mr-1" />
                <span>{user?.name || "Admin User"}</span>
              </div>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 w-full justify-start"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="bg-white w-64 border-r border-neutral-200 hidden md:block overflow-y-auto">
          <div className="py-4">
            <div className="px-4 mb-6">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Dashboard
              </h2>
            </div>

            <nav className="space-y-1 px-2">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      location === item.path
                        ? "text-primary bg-primary-light/10"
                        : "text-neutral-600 hover:bg-primary-light/10 hover:text-primary"
                    }`}
                  >
                    {React.cloneElement(item.icon, {
                      className: `mr-3 ${
                        location === item.path
                          ? "text-primary"
                          : "text-neutral-400 group-hover:text-primary"
                      }`,
                    })}
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          <h1 className="text-2xl font-serif font-bold text-neutral-800 mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
