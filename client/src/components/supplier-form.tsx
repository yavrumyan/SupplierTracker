import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { insertSupplierSchema, type InsertSupplier } from "@shared/schema";
import { COUNTRIES, CATEGORIES, BRANDS, WORKING_STYLES } from "@/lib/types";

interface SupplierFormProps {
  onSubmit: (data: InsertSupplier) => void;
  onCancel: () => void;
  defaultValues?: Partial<InsertSupplier>;
  isLoading?: boolean;
}

export function SupplierForm({ onSubmit, onCancel, defaultValues, isLoading }: SupplierFormProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(defaultValues?.categories || []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(defaultValues?.brands || []);
  const [selectedWorkingStyles, setSelectedWorkingStyles] = useState<string[]>(defaultValues?.workingStyle || []);

  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: "",
      country: "",
      website: "",
      email: "",
      phone: "",
      whatsapp: "",
      reputation: undefined,
      workingStyle: [],
      categories: [],
      brands: [],
      comments: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: InsertSupplier) => {
    onSubmit({
      ...data,
      categories: selectedCategories,
      brands: selectedBrands,
      workingStyle: selectedWorkingStyles,
    });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setSelectedCategories(prev => 
      checked 
        ? [...prev, category]
        : prev.filter(c => c !== category)
    );
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    setSelectedBrands(prev => 
      checked 
        ? [...prev, brand]
        : prev.filter(b => b !== brand)
    );
  };

  const handleWorkingStyleChange = (style: string, checked: boolean) => {
    setSelectedWorkingStyles(prev => 
      checked 
        ? [...prev, style]
        : prev.filter(s => s !== style)
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={onCancel} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-semibold text-slate-800">
            {defaultValues ? "Edit Supplier" : "Add New Supplier"}
          </h2>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter supplier name"
                required
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="country">Country *</Label>
              <Select
                value={form.watch("country") || ""}
                onValueChange={(value) => form.setValue("country", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.country && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.country.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                type="url"
                {...form.register("website")}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="email">Primary Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="contact@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                type="tel"
                {...form.register("whatsapp")}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="reputation">Reputation Score</Label>
              <Select
                value={form.watch("reputation")?.toString() || ""}
                onValueChange={(value) => form.setValue("reputation", value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 - Excellent</SelectItem>
                  <SelectItem value="9">9 - Very Good</SelectItem>
                  <SelectItem value="8">8 - Good</SelectItem>
                  <SelectItem value="7">7 - Average</SelectItem>
                  <SelectItem value="6">6 - Fair</SelectItem>
                  <SelectItem value="5">5 - Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Working Style</Label>
              <div className="space-y-2 mt-2">
                {WORKING_STYLES.map((style) => (
                  <div key={style} className="flex items-center space-x-2">
                    <Checkbox
                      id={style}
                      checked={selectedWorkingStyles.includes(style)}
                      onCheckedChange={(checked) => handleWorkingStyleChange(style, checked as boolean)}
                    />
                    <Label htmlFor={style} className="text-sm">
                      {style}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Trading Categories</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
              {CATEGORIES.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                  />
                  <Label htmlFor={category} className="text-sm">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Trading Brands</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
              {BRANDS.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={brand}
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                  />
                  <Label htmlFor={brand} className="text-sm">
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              {...form.register("comments")}
              rows={3}
              placeholder="Additional notes about this supplier..."
            />
          </div>

          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {defaultValues ? "Update Supplier" : "Create Supplier"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
