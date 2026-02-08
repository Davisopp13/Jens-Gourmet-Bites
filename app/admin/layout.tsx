import { createClient } from "@/lib/supabase/server";
import AdminHeader from "@/components/admin/AdminHeader";

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
    <div className="min-h-screen bg-gray-50">
      {user && <AdminHeader userEmail={user.email} />}
      <main className={user ? "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" : ""}>
        {children}
      </main>
    </div>
  );
}
