import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64 transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
