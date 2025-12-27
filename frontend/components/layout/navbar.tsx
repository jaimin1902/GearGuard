"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wrench, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  // { href: "/requests", label: "Maintenance" },
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Maintenance Calendar" },
  { href: "/equipment", label: "Equipment" },
    // { href: "/work-centers", label: "Work Centers" },
  { href: "/reports", label: "Reporting" },
  { href: "/teams", label: "Teams" },
];

const publicRoutes = ["/login", "/register", "/forgot-password"];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        // Invalid user data
      }
    }
  }, []);

  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    return null;
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Wrench className="h-6 w-6" />
              GearGuard
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "default" : "ghost"}
                  asChild
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* {user && (
              <span className="text-sm text-muted-foreground">
                {user.name} ({user.role})
              </span>
            )} */}
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
