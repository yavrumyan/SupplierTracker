import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Building, 
  Plus, 
  FolderInput, 
  BarChart, 
  Settings, 
  Menu, 
  X,
  Microchip
} from "lucide-react";
import { useState } from "react";
import supHubLogo from "@assets/SupHub_1751730375430.png";

const navigation = [
  { name: "Search & Filter", href: "/", icon: Search },
  { name: "All Suppliers", href: "/suppliers", icon: Building },
  { name: "Add Supplier", href: "/add-supplier", icon: Plus },
  { name: "Import Data", href: "/import", icon: FolderInput },
  { name: "Analytics", href: "/analytics", icon: BarChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-card rounded-lg shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-foreground" />
          ) : (
            <Menu className="h-5 w-5 text-foreground" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center">
            <img 
              src={supHubLogo} 
              alt="SupHub Logo" 
              className="w-8 h-8 rounded-lg"
            />
            <h1 className="ml-3 text-lg font-semibold text-foreground">SupHub</h1>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-primary-foreground bg-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
