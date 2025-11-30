import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SupplierForm } from "@/components/supplier-form";
import { Building, Edit, Trash2, Star, Globe, Phone, Mail, MessageSquare, Send } from "lucide-react";
import { Link } from "wouter";
import type { Supplier, InsertSupplier } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { COUNTRIES } from "@/lib/types";

export default function AllSuppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<number>>(new Set());
  const [bulkInquiryMessage, setBulkInquiryMessage] = useState("");
  const [bulkSendViaWhatsApp, setBulkSendViaWhatsApp] = useState(true);
  const [bulkSendViaEmail, setBulkSendViaEmail] = useState(true);

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers", { credentials: "include" });
      if (!res.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      return await res.json();
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      return await apiRequest("DELETE", `/api/suppliers/${supplierId}`);
    },
    onSuccess: () => {
      toast({
        title: "Supplier deleted successfully",
        description: "The supplier has been removed from the database.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: () => {
      toast({
        title: "Failed to delete supplier",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertSupplier }) => {
      return await apiRequest("PUT", `/api/suppliers/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Supplier updated successfully",
        description: "The supplier information has been updated.",
      });
      setEditingSupplier(null);
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: () => {
      toast({
        title: "Failed to update supplier",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const sendBulkInquiryMutation = useMutation({
    mutationFn: async (data: { message: string; supplierIds: number[]; sendViaWhatsApp: boolean; sendViaEmail: boolean }) => {
      const response = await apiRequest("POST", "/api/inquiries", data);
      const jsonData = await response.json();
      return jsonData;
    },
    onSuccess: (response: { inquiry: any; sendingResults: Array<{ supplier: string; email?: string; whatsapp?: string; whatsappLink?: string; error?: string }> }) => {
      const results = response.sendingResults || [];
      
      results.forEach(result => {
        if (result.whatsappLink) {
          window.open(result.whatsappLink, '_blank');
        }
      });

      let description = "";
      results.forEach(result => {
        if (result.email === "sent") {
          description += `✓ Email sent to ${result.supplier}\n`;
        }
        if (result.whatsapp === "ready") {
          description += `✓ WhatsApp link opened for ${result.supplier}\n`;
        }
        if (result.error) {
          description += `✗ ${result.error}\n`;
        }
      });

      if (!description) {
        description = `Your inquiry has been sent to ${selectedSuppliers.size} supplier(s).`;
      }

      toast({
        title: "Inquiry processed",
        description: description.substring(0, 500),
      });
      setBulkInquiryMessage("");
      setSelectedSuppliers(new Set());
    },
    onError: () => {
      toast({
        title: "Failed to send inquiry",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
  };

  const handleDelete = (supplierId: number) => {
    deleteSupplierMutation.mutate(supplierId);
  };

  const handleUpdateSubmit = (data: InsertSupplier) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data });
    }
  };

  const handleSupplierCheck = (supplierId: number, checked: boolean) => {
    const newSelected = new Set(selectedSuppliers);
    if (checked) {
      newSelected.add(supplierId);
    } else {
      newSelected.delete(supplierId);
    }
    setSelectedSuppliers(newSelected);
  };

  const handleBulkSendInquiry = () => {
    if (!bulkInquiryMessage.trim()) {
      toast({
        title: "No message provided",
        description: "Please enter an inquiry message.",
        variant: "destructive",
      });
      return;
    }

    if (selectedSuppliers.size === 0) {
      toast({
        title: "No suppliers selected",
        description: "Please select at least one supplier.",
        variant: "destructive",
      });
      return;
    }

    if (!bulkSendViaWhatsApp && !bulkSendViaEmail) {
      toast({
        title: "No channel selected",
        description: "Please select at least one communication channel.",
        variant: "destructive",
      });
      return;
    }

    sendBulkInquiryMutation.mutate({
      message: bulkInquiryMessage,
      supplierIds: Array.from(selectedSuppliers),
      sendViaWhatsApp: bulkSendViaWhatsApp,
      sendViaEmail: bulkSendViaEmail,
    });
  };

  // If editing, show the supplier form
  if (editingSupplier) {
    return (
      <div className="p-6">
        <SupplierForm
          defaultValues={{
            name: editingSupplier.name,
            country: editingSupplier.country,
            website: editingSupplier.website || "",
            email: editingSupplier.email || "",
            phone: editingSupplier.phone || "",
            whatsapp: editingSupplier.whatsapp || "",
            reputation: editingSupplier.reputation || 0,
            categories: editingSupplier.categories || [],
            brands: editingSupplier.brands || [],
            workingStyle: editingSupplier.workingStyle || [],
            comments: editingSupplier.comments || "",
          }}
          onSubmit={handleUpdateSubmit}
          onCancel={() => setEditingSupplier(null)}
          isLoading={updateSupplierMutation.isPending}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 -mx-6 -mt-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Building className="h-6 w-6 text-primary mr-3" />
            <h1 className="text-xl font-semibold text-slate-800">All Suppliers</h1>
          </div>
          <div className="text-sm text-slate-500">
            {suppliers.length} suppliers total
          </div>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No suppliers found</h3>
            <p className="text-slate-500 mb-4">Get started by adding your first supplier.</p>
            <Link href="/add-supplier">
              <Button>Add First Supplier</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/suppliers/${supplier.id}`}>
                      <CardTitle className="text-lg hover:text-primary cursor-pointer transition-colors">
                        {supplier.name}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center mt-1 text-sm text-slate-500">
                      <span>{COUNTRIES.find(c => c === supplier.country) || supplier.country}</span>
                      {supplier.reputation && (
                        <>
                          <span className="mx-2">•</span>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 mr-1" />
                            <span>{supplier.reputation}/10</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{supplier.name}"? This action cannot be undone and will remove all associated data including price lists, offers, and orders.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(supplier.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Categories */}
                {supplier.categories && supplier.categories.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-500 mb-1">Categories</div>
                    <div className="flex flex-wrap gap-1">
                      {supplier.categories.slice(0, 3).map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                      {supplier.categories.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{supplier.categories.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Brands */}
                {supplier.brands && supplier.brands.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-500 mb-1">Brands</div>
                    <div className="flex flex-wrap gap-1">
                      {supplier.brands.slice(0, 3).map((brand) => (
                        <Badge key={brand} variant="outline" className="text-xs">
                          {brand}
                        </Badge>
                      ))}
                      {supplier.brands.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{supplier.brands.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Methods */}
                <div className="flex items-center space-x-3">
                  {supplier.website && (
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                  {supplier.email && (
                    <a href={`mailto:${supplier.email}`} className="text-slate-400 hover:text-primary transition-colors">
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {supplier.phone && (
                    <a href={`tel:${supplier.phone}`} className="text-slate-400 hover:text-primary transition-colors">
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  {supplier.whatsapp && (
                    <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                      <MessageSquare className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {/* Working Style */}
                {supplier.workingStyle && supplier.workingStyle.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1">
                      {supplier.workingStyle.map((style) => (
                        <Badge key={style} className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}