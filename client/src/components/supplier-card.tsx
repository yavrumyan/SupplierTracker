import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import type { Supplier } from "@shared/schema";

interface SupplierCardProps {
  supplier: Supplier;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  showMatches?: boolean;
}

export function SupplierCard({ 
  supplier, 
  isSelected = false, 
  onSelectionChange,
  showMatches = false 
}: SupplierCardProps) {
  const getCountryColor = (country: string) => {
    const colors: Record<string, string> = {
      UAE: "bg-blue-100 text-blue-800",
      USA: "bg-purple-100 text-purple-800",
      Germany: "bg-green-100 text-green-800",
      China: "bg-red-100 text-red-800",
      Taiwan: "bg-yellow-100 text-yellow-800",
    };
    return colors[country] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="hover:bg-slate-50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {onSelectionChange && (
            <Checkbox 
              checked={isSelected}
              onCheckedChange={onSelectionChange}
              className="mt-1"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <Link href={`/suppliers/${supplier.id}`}>
                <h4 className="text-lg font-medium text-slate-900 cursor-pointer hover:text-blue-600">
                  {supplier.name}
                </h4>
              </Link>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-slate-700 ml-1">
                    {supplier.reputation || "N/A"}
                  </span>
                </div>
                <Badge className={getCountryColor(supplier.country)}>
                  {supplier.country}
                </Badge>
              </div>
            </div>
            
            <div className="mt-2 space-y-1">
              <p className="text-sm text-slate-600">
                <strong>Categories:</strong> {supplier.categories?.join(", ") || "Not specified"}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Brands:</strong> {supplier.brands?.join(", ") || "Not specified"}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Working Style:</strong> {supplier.workingStyle?.join(", ") || "Not specified"}
              </p>
            </div>
            
            {showMatches && (
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-800">
                  <CheckCircle className="inline h-4 w-4 mr-2" />
                  <strong>Match Found:</strong> Search results match found in supplier data
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
