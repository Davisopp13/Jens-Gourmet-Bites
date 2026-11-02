import Link from "next/link";
import { Cookie, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-100 mb-6">
          <Cookie className="w-12 h-12 text-primary" />
        </div>
        <h1 className="font-display text-4xl text-primary mb-4">
          Page Not Found
        </h1>
        <p className="text-primary-600 mb-8 max-w-md">
          Oops! It looks like this cookie crumbled. The page you&apos;re looking
          for doesn&apos;t exist.
        </p>
        <Link href="/" className="btn-primary">
          <Home className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
