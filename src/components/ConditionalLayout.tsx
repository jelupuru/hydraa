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
    <div className="isolate">
      {!isDashboard && <Header />}

      {children}

      <ScrollToTop />
    </div>
  );
}