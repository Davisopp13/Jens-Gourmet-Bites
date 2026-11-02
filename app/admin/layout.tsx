import { createClient } from "@/lib/supabase/server";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPwa from "@/components/admin/AdminPwa";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Jen's Gourmet Bites Admin",
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "Jen's Admin", statusBarStyle: "default" },
  icons: { apple: "/admin-icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#4a2e1f" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow access to login page without auth
  // The login page itself will handle redirecting authenticated users

  return (
    <div className="min-h-screen bg-cat-wood text-cat-ink [background-image:repeating-linear-gradient(90deg,rgba(74,46,31,.08)_0_2px,transparent_2px_38px)]">
      <AdminPwa />
      {user && <AdminHeader userEmail={user.email} />}
      {user ? (
        <main className="max-w-7xl mx-auto pb-10 px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-cat-paper p-4 shadow-[0_14px_30px_rgba(40,22,10,.35)] sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      ) : (
        <main>{children}</main>
      )}
    </div>
  );
}
