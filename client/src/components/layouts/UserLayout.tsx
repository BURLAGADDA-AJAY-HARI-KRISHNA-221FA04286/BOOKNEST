import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  Home,
  Compass,
  Bookmark,
  Heart,
  User,
  Settings,
  History,
  LogOut,
  ChevronDown,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserLayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children, onSearch }) => {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  // Navigation items
  const navItems = [
    {
      name: "Home",
      path: "/user/home",
      icon: <Home className="h-4 w-4" />,
    },
    {
      name: "Explore",
      path: "/user/explore",
      icon: <Compass className="h-4 w-4" />,
    },
    {
      name: "My Reading List",
      path: "/user/reading-list",
      icon: <Bookmark className="h-4 w-4" />,
    },
    {
      name: "Liked Books",
      path: "/user/liked-books",
      icon: <Heart className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/user/home" className="flex items-center">
                <BookOpen className="h-6 w-6 text-primary mr-2" />
                <span className="font-serif font-bold text-xl text-primary">BookNest</span>
              </Link>
              <div className="hidden md:flex items-center ml-8 space-x-4">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`px-3 py-2 ${
                        location === item.path
                          ? "text-primary border-b-2 border-primary"
                          : "text-neutral-600 hover:text-primary"
                      }`}
                    >
                      {item.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <form
                onSubmit={handleSearch}
                className="relative hidden md:block"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search books..."
                  className="w-64 pl-10 pr-4 py-2 bg-neutral-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 mr-1">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden md:inline text-sm font-medium text-neutral-700">
                      {user?.name || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-neutral-400 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2 text-neutral-500" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <History className="h-4 w-4 mr-2 text-neutral-500" />
                    Reading History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="h-4 w-4 mr-2 text-neutral-500" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleMobileMenu}
              >
                <Menu className="h-6 w-6 text-neutral-700" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-neutral-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      location === item.path
                        ? "text-primary bg-primary-light/10"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </Button>
                </Link>
              ))}
              <form
                onSubmit={handleSearch}
                className="relative mb-3 mt-3"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search books..."
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default UserLayout;
