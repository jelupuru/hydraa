"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  User,
  Database,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Complaints",
    href: "/dashboard/complaints",
    icon: FileText,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
    roles: ["SUPER_ADMIN"], // Only super admin can manage users
  },
  {
    title: "Master Data",
    href: "/dashboard/master-data",
    icon: Database,
    roles: ["SUPER_ADMIN", "COMMISSIONER"], // Admin and Commissioner
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN", "COMMISSIONER", "DCP", "ACP", "INVESTIGATION_OFFICER"], // Not for COMPLAINANT
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = session?.user;
  const userRole = (user as any)?.role || "COMPLAINANT";

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Enhanced background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100/70 via-purple-50/60 to-cyan-100/50 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-tr from-violet-50/40 via-transparent to-rose-50/30 pointer-events-none" />
      
      {/* Top Navigation Bar */}
      <nav className="relative z-20 bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
        <div className="mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src="/images/logo/hydraalogo.jpg" alt="Hydraa Logo" className="h-8 w-8 rounded-lg shadow-lg" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-lg" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hydraa
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {filteredMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-900 border border-blue-200 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-auto">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image || ""} />
                      <AvatarFallback>
                        {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start text-left">
                      <span className="text-sm font-medium">{user?.name || "User"}</span>
                      <span className="text-xs text-gray-500">
                        {userRole.replace("_", " ")}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="flex items-center gap-2 text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl">
              <div className="py-4 space-y-1">
                {filteredMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      pathname === item.href
                        ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 min-h-[calc(100vh-4rem)]">
        <div className="mx-auto px-6 py-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}