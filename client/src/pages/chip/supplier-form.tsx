import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRoute, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertChipSupplierSchema, InsertChipSupplier, ChipSupplier } from "@shared/schema";
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
import { ArrowLeft, Save } from "lucide-react";

export default function ChipSupplierForm() {
  const [, params] = useRoute("/chip/suppliers/:id/edit");
  const [, newParams] = useRoute("/chip/suppliers/new");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const isEditMode = !!params;
  const supplierId = params?.id ? parseInt(params.id) : null;

  const { data: supplier, isLoading } = useQuery<ChipSupplier>({
    queryKey: ["/api/chip/suppliers", supplierId],
    enabled: isEditMode && !!supplierId,
  });

  const form = useForm<InsertChipSupplier>({
    resolver: zodResolver(insertChipSupplierSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      paymentTerms: 0,
      balance: "0",
      notes: "",
    },
  });

  if (supplier && !form.formState.isDirty) {
    form.reset({
      name: supplier.name,
      company: supplier.company || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      taxId: supplier.taxId || "",
      paymentTerms: supplier.paymentTerms || 0,
      balance: supplier.balance || "0",
      notes: supplier.notes || "",
    });
  }

  const createMutation = useMutation({
    mutationFn: async (data: InsertChipSupplier) => {
      return await apiRequest("POST", "/api/chip/suppliers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
      setLocation("/chip/suppliers");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create supplier",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertChipSupplier) => {
      return await apiRequest("PATCH", `/api/chip/suppliers/${supplierId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chip/suppliers", supplierId] });
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
      setLocation("/chip/suppliers");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update supplier",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertChipSupplier) => {
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
            onClick={() => setLocation("/chip/suppliers")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Suppliers
          </Button>
          <h1 className="text-2xl font-semibold text-slate-800">
            {isEditMode ? "Edit Supplier" : "Add New Supplier"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isEditMode
              ? "Update supplier information"
              : "Create a new supplier in your database"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
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
                          Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter supplier name"
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
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Company name"
                            {...field}
                            data-testid="input-company"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="supplier@example.com"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+374 XX XXX XXX"
                            {...field}
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Supplier address"
                          {...field}
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Tax identification number"
                            {...field}
                            data-testid="input-tax-id"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms (Days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            value={field.value || 0}
                            data-testid="input-payment-terms"
                          />
                        </FormControl>
                        <FormDescription>Number of days for payment</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about the supplier"
                          {...field}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="bg-[#2AA448] hover:bg-[#239639]"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? "Update Supplier" : "Create Supplier"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/chip/suppliers")}
                    data-testid="button-cancel"
                  >
                    Cancel
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
