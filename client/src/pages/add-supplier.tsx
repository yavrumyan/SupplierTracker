import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SupplierForm } from "@/components/supplier-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertSupplier, Supplier } from "@shared/schema";

export default function AddSupplier() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Get edit ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const isEditing = !!editId;

  // Fetch supplier data for editing
  const { data: existingSupplier, isLoading } = useQuery<Supplier>({
    queryKey: ["/api/suppliers", editId],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/${editId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch supplier");
      return response.json();
    },
    enabled: isEditing,
  });

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
      setLocation("/suppliers");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create supplier",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async (supplier: InsertSupplier) => {
      const response = await apiRequest("PUT", `/api/suppliers/${editId}`, supplier);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Supplier updated successfully",
        description: "The supplier has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setLocation("/suppliers");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update supplier",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertSupplier) => {
    if (isEditing) {
      updateSupplierMutation.mutate(data);
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    setLocation("/suppliers");
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
        </h1>
        <p className="text-muted-foreground">
          {isEditing 
            ? 'Update supplier information and capabilities' 
            : 'Add a new supplier to your database'
          }
        </p>
      </div>

      <SupplierForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        defaultValues={existingSupplier}
        isLoading={createSupplierMutation.isPending || updateSupplierMutation.isPending}
      />
    </div>
  );
}
