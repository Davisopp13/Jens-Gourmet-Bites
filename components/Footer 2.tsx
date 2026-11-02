import { Cookie, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-primary text-cream py-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Cookie className="w-8 h-8 text-cream-200" />
              <span className="font-display text-2xl text-cream">
                Jen&apos;s Gourmet Bites
              </span>
            </Link>
            <p className="text-cream-200 text-sm leading-relaxed">
              Handcrafted gourmet cookies made with love. Available as fresh-baked
              or frozen dough.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-display text-lg text-cream mb-4">Contact Us</h3>
            <ul className="space-y-3 text-cream-200 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Johns Creek, GA - Serving Metro Atlanta</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a
                  href="mailto:jensgourmetbites@gmail.com"
                  className="hover:text-cream transition-colors"
                >
                  jensgourmetbites@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg text-cream mb-4">Quick Links</h3>
            <ul className="space-y-2 text-cream-200 text-sm">
              <li>
                <a href="#products" className="hover:text-cream transition-colors">
                  Our Cookies
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-cream transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-cream transition-colors">
                  Place an Order
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-primary-400 flex flex-col md:flex-row justify-between items-center gap-4 text-cream-300 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Jen&apos;s Gourmet Bites. All rights
            reserved.
          </p>
          <p>
            Website by{" "}
            <a
              href="https://docodelab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream hover:text-cream-200 underline"
            >
              DO Code Lab
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
