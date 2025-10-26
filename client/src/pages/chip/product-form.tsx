import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRoute, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertChipProductSchema, InsertChipProduct, ChipProduct } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { z } from "zod";

// Extended schema for form validation including initial stock for new products
const productFormSchema = insertChipProductSchema.extend({
  initialStock: z.coerce.number().min(0).optional(),
  defaultPrice: z.coerce.number().min(0).optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function ChipProductForm() {
  const [, params] = useRoute("/chip/products/:id/edit");
  const [, newParams] = useRoute("/chip/products/new");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const isEditMode = !!params;
  const isNewMode = !!newParams;
  const productId = params?.id ? parseInt(params.id) : null;

  // Fetch product data for edit mode
  const { data: product, isLoading } = useQuery<ChipProduct>({
    queryKey: ["/api/chip/products", productId],
    enabled: isEditMode && !!productId,
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      category: "",
      unit: "",
      lowStockAlert: 0,
      supplierReference: "",
      notes: "",
      serialNumberTracking: false,
      currentStock: 0,
      averageCost: "0",
      sellingPrice: "0",
      currency: "AMD",
      initialStock: 0,
      defaultPrice: 0,
    },
  });

  // Update form when product data is loaded
  if (product && !form.formState.isDirty) {
    form.reset({
      name: product.name,
      sku: product.sku || "",
      description: product.description || "",
      category: product.category || "",
      unit: product.unit || "",
      lowStockAlert: product.lowStockAlert || 0,
      supplierReference: product.supplierReference || "",
      notes: product.notes || "",
      serialNumberTracking: product.serialNumberTracking || false,
      currentStock: product.currentStock,
      averageCost: product.averageCost,
      sellingPrice: product.sellingPrice || "0",
      currency: product.currency || "AMD",
    });
  }

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { initialStock, defaultPrice, ...productData } = data;
      
      // For new products, set initial stock and price
      const payload = {
        ...productData,
        currentStock: initialStock || 0,
        averageCost: defaultPrice?.toString() || "0",
        sellingPrice: defaultPrice?.toString() || "0",
      };

      return await apiRequest("/api/chip/products", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/products"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      setLocation("/chip/products");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { initialStock, defaultPrice, ...productData } = data;
      
      return await apiRequest(`/api/chip/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(productData),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chip/products", productId] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setLocation("/chip/products");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/chip/products")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <h1 className="text-2xl font-semibold text-slate-800">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isEditMode
              ? "Update product information and settings"
              : "Create a new product in your inventory"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Product Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter product name"
                            {...field}
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Product SKU"
                            {...field}
                            data-testid="input-sku"
                          />
                        </FormControl>
                        <FormDescription>Stock Keeping Unit</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Product description"
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Electronics, Hardware"
                            {...field}
                            data-testid="input-category"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., pcs, box, kg"
                            {...field}
                            data-testid="input-unit"
                          />
                        </FormControl>
                        <FormDescription>Unit of measurement</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Stock Management */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Stock Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lowStockAlert"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Alert</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              data-testid="input-low-stock-alert"
                            />
                          </FormControl>
                          <FormDescription>
                            Alert when stock falls below this level
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isNewMode && (
                      <FormField
                        control={form.control}
                        name="initialStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Stock</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                {...field}
                                data-testid="input-initial-stock"
                              />
                            </FormControl>
                            <FormDescription>
                              Opening stock quantity
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            data-testid="select-currency"
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AMD">AMD</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="RUB">RUB</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isNewMode && (
                      <FormField
                        control={form.control}
                        name="defaultPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                data-testid="input-default-price"
                              />
                            </FormControl>
                            <FormDescription>
                              Initial cost and selling price
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {isEditMode && (
                      <>
                        <FormField
                          control={form.control}
                          name="sellingPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selling Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  data-testid="input-selling-price"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="supplierReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Reference</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Optional supplier reference code"
                            {...field}
                            data-testid="input-supplier-reference"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes or comments"
                            className="min-h-[80px]"
                            {...field}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/chip/products")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#2AA448] hover:bg-[#239639]"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : isEditMode
                      ? "Update Product"
                      : "Create Product"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
