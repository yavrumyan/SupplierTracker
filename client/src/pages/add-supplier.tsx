import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SupplierForm } from "@/components/supplier-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertSupplier } from "@shared/schema";

export default function AddSupplier() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const createSupplierMutation = useMutation({
    mutationFn: async (supplier: InsertSupplier) => {
      const response = await apiRequest("POST", "/api/suppliers", supplier);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Supplier created successfully",
        description: "The supplier has been added to your database.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create supplier",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertSupplier) => {
    createSupplierMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation("/");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 -mx-6 -mt-6 px-6 py-4 mb-6">
        <h1 className="text-xl font-semibold text-slate-800 ml-[35px] mr-[35px]">Add New Supplier</h1>
      </div>
      <SupplierForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createSupplierMutation.isPending}
      />
    </div>
  );
}
