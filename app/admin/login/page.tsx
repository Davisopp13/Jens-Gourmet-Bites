"use client";

import { safeInquiryReturn } from "@/lib/inquiries/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cookie, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push(
        safeInquiryReturn(
          new URLSearchParams(window.location.search).get("next"),
        ),
      );
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cat-wood px-4 text-cat-ink [background-image:repeating-linear-gradient(90deg,rgba(74,46,31,.08)_0_2px,transparent_2px_38px)]">
      <div className="w-full max-w-md">
        {/* Back to site link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[#FFF8E8] hover:text-cat-tape mb-8 text-sm min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to website
        </Link>

        {/* Login Card */}
        <div className="relative rounded-xl bg-cat-paper p-8 shadow-[0_14px_30px_rgba(40,22,10,.35)]">
          <div
            aria-hidden="true"
            className="absolute -top-3.5 left-1/2 -ml-12 h-[30px] w-24 -rotate-3 bg-cat-tape/85"
          />
          {/* Logo */}
          <div className="text-center mb-8 bg-cat-paper pb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cat-butter mb-4">
              <Cookie className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl text-cat-ink">Admin Login</h1>
            <p className="font-cat-hand text-2xl text-cat-rust mt-1">
              Sign in to open the recipe box
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-primary-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-primary-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
