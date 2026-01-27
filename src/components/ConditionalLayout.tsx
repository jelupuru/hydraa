"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <div className="isolate min-h-screen relative">
      {/* Background gradient for non-dashboard pages */}
      {!isDashboard && (
        <div className="fixed inset-0 bg-linear-to-br from-blue-50/80 via-white to-purple-50/60 pointer-events-none" />
      )}
      
      {!isDashboard && (
        <div className="relative z-10">
          <Header />
        </div>
      )}

      <div className={isDashboard ? "" : "relative z-10"}>
        {children}
      </div>

      <ScrollToTop />
    </div>
  );
}