"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cookie, LogOut, Package, Home, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AdminHeaderProps {
  userEmail?: string;
}

export default function AdminHeader({ userEmail }: AdminHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Link href="/admin" aria-label="Jen’s Gourmet Bites admin home" className="flex items-center gap-2 min-h-11 min-w-11">
              <Cookie className="w-8 h-8 text-primary" />
              <span className="font-display text-xl text-primary hidden sm:inline">
                Jen’s Gourmet Bites
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-2 sm:gap-6">
            <Link
              href="/"
              aria-label="View site"
              className="flex items-center justify-center min-h-11 min-w-11 gap-1 text-gray-600 hover:text-primary transition-colors text-sm"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">View Site</span>
            </Link>
            <Link
              href="/admin/products"
              aria-label="Products"
              className="flex items-center justify-center min-h-11 min-w-11 gap-1 text-gray-600 hover:text-primary transition-colors text-sm"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Products</span>
            </Link>
            <Link
              href="/admin/pricing"
              aria-label="Pricing"
              className="flex items-center justify-center min-h-11 min-w-11 gap-1 text-gray-600 hover:text-primary transition-colors text-sm"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Pricing</span>
            </Link>
          </nav>

          {/* User Info and Sign Out */}
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-gray-500 hidden md:inline">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex items-center justify-center min-h-11 min-w-11 gap-1 text-gray-600 hover:text-accent-700 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
