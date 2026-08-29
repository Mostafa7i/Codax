"use client";
import React from "react";
import { Phone, Info, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFacebook, FaWhatsapp } from "react-icons/fa";

const AppFooter = () => {
  const pathname = usePathname();

  // إخفاء الفوتر في لوحة الأدمن وصفحات المصادقة
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) {
    return null;
  }

  return (
  <footer className="bg-gray-900 border-t border-white/5 text-gray-400" dir="rtl">
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">

        {/* Brand */}
        <div>
          <h2 className="text-2xl font-black bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            CodaX Academy
          </h2>
          <p className="text-sm leading-relaxed text-gray-500">
            منصة تعليمية احترافية في تطوير الويب — من الصفر إلى سوق العمل.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">روابط سريعة</h3>
          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/" className="hover:text-indigo-400 transition flex items-center gap-2">
              <BookOpen size={14} /> الرئيسية
            </Link>
            <Link href="/About" className="hover:text-indigo-400 transition flex items-center gap-2">
              <Info size={14} /> من نحن
            </Link>

            <Link href="/pages/CodaxRules" className="hover:text-indigo-400 transition flex items-center gap-2">
              <BookOpen size={14} /> قواعد CodaX
            </Link>
          </nav>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">تواصل معنا</h3>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-indigo-400" />
              <span>01023669672</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <a
                href="https://www.facebook.com/share/1Cw4PkDrh7/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 transition"
                aria-label="Facebook"
              >
              <FaFacebook size={18} />
              </a>
              <a
                href="https://wa.me/201023669672"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 pt-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()}{" "}
        <span className="text-indigo-400 font-bold">CodaX Academy</span> — جميع الحقوق محفوظة
      </div>
    </div>
  </footer>
  );
};

export default React.memo(AppFooter);
