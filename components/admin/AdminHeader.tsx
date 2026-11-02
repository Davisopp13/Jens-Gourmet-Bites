"use client";

import Link from "next/link";
import InquiryNav from "./InquiryNav";
import { useAdminSignOut } from "./useAdminSignOut";
import {
  Cookie,
  LogOut,
  Package,
  Home,
  DollarSign,
  StickyNote,
} from "lucide-react";

interface AdminHeaderProps {
  userEmail?: string;
}

export default function AdminHeader({ userEmail }: AdminHeaderProps) {
  const { signOut, signingOut } = useAdminSignOut();

  return (
    <header className="sticky top-0 z-50 bg-cat-ink text-[#FFF8E8] shadow-[0_4px_0_rgba(74,46,31,.25)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between min-h-16 mb-6 py-2">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              aria-label="Jen’s Gourmet Bites admin home"
              className="flex items-center gap-2 min-h-11 min-w-11"
            >
              <Cookie className="w-8 h-8 text-cat-tape" />
              <span className="font-display text-xl text-[#FFF8E8] hidden xl:inline">
                Jen’s Gourmet Bites
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden items-center justify-center gap-3 lg:flex">
            <Link
              href="/"
              aria-label="View site"
              className="flex items-center justify-center min-h-11 min-w-11 gap-1 rounded-lg px-2 text-[#FFF8E8] hover:bg-white/10 hover:text-cat-tape transition-colors text-sm"
            >
              <Home className="w-4 h-4" />
              <span className="hidden lg:inline">View Site</span>
            </Link>
            <Link
              href="/admin/products"
              aria-label="Products"
              className="flex items-center justify-center min-h-11 min-w-11 gap-1 rounded-lg px-2 text-[#FFF8E8] hover:bg-white/10 hover:text-cat-tape transition-colors text-sm"
            >
              <Package className="w-4 h-4" />
              <span className="hidden lg:inline">Products</span>
            </Link>
            <Link
              href="/admin/content"
              aria-label="Website Content"
              className="flex items-center justify-center min-h-11 min-w-11 gap-1 rounded-lg px-2 text-[#FFF8E8] hover:bg-white/10 hover:text-cat-tape transition-colors text-sm"
            >
              <StickyNote className="w-4 h-4" />
              <span className="hidden lg:inline">Website Content</span>
            </Link>
            <Link
              href="/admin/pricing"
              aria-label="Pricing"
              className="flex items-center justify-center min-h-11 min-w-11 gap-1 rounded-lg px-2 text-[#FFF8E8] hover:bg-white/10 hover:text-cat-tape transition-colors text-sm"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden lg:inline">Pricing</span>
            </Link>
            <InquiryNav />
          </nav>

          {/* User Info and Sign Out */}
          <div className="hidden items-center gap-4 lg:flex">
            {userEmail && (
              <span className="font-cat-hand text-xl text-cat-tape hidden 2xl:inline">
                {userEmail}
              </span>
            )}
            <button
              onClick={signOut}
              disabled={signingOut}
              aria-label="Sign out"
              className="flex items-center justify-center min-h-11 min-w-11 gap-1 rounded-lg px-2 text-[#FFF8E8] hover:bg-white/10 hover:text-cat-tape transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
