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
import supHubLogo from "@/assets/SupHub_1752355359935.png";
import chipLogo from "@assets/fbNew_1761515552324.png";

// Custom CompStyle Icon Component
function CompStyleIcon({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center rounded text-white text-xs font-bold h-4 w-4 mr-3 bg-[#e4791b]">CS
          </div>
  );
}

// Custom CHIP Icon Component
function ChipIcon({ className }: { className?: string }) {
  return (
    <img 
      src={chipLogo} 
      alt="CHIP"
      className={cn("h-5 w-5 mr-3 rounded", className)}
    />
  );
}

const navigation = [
  { name: "Search Suppliers", href: "/", icon: BarChart },
  { name: "Product Search", href: "/search", icon: Search },
  { name: "All Suppliers", href: "/suppliers", icon: Building },
  { name: "Add Supplier", href: "/add-supplier", icon: Plus },
  { name: "Import Data", href: "/import", icon: FolderInput },
  { name: "CompStyle", href: "/compstyle", icon: CompStyleIcon },
  { name: "CHIP", href: "/chip", icon: ChipIcon },
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
          className="p-2 bg-white rounded-lg shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-slate-700" />
          ) : (
            <Menu className="h-5 w-5 text-slate-700" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center">
            <img 
              src={supHubLogo} 
              alt="SupHub Logo" 
              className="w-8 h-8 rounded-lg"
            />
            <h1 className="ml-3 text-lg font-semibold text-slate-800">SupHub</h1>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5 text-slate-500" />
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
                    ? "text-white bg-orange-500"
                    : "text-slate-700 hover:bg-slate-100"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="px-4 py-6 border-t border-slate-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">GY</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-700">Greg</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
        </div>
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
