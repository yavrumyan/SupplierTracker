import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Edit, 
  Upload, 
  Plus, 
  Send, 
  Globe, 
  Phone, 
  Mail, 
  MessageSquare, 
  Star,
  FileText,
  Download,
  Eye,
  Trash2
} from "lucide-react";
import { Link } from "wouter";
import type { Supplier, PriceListFile, PriceListItem, Offer, Order } from "@shared/schema";
import { OrderTable } from "@/components/order-table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SupplierDetail() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/suppliers/:id");
  const supplierId = params?.id ? parseInt(params.id) : 0;

  const [inquiryMessage, setInquiryMessage] = useState("");
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(true);
  const [newOfferContent, setNewOfferContent] = useState("");
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<FileList | null>(null);

  const { data: supplier, isLoading } = useQuery<Supplier>({
    queryKey: [`/api/suppliers/${supplierId}`],
    enabled: !!supplierId,
  });

  const { data: priceListFiles = [] } = useQuery<PriceListFile[]>({
    queryKey: [`/api/suppliers/${supplierId}/price-lists`],
    enabled: !!supplierId,
  });

  const { data: priceListItems = [] } = useQuery<PriceListItem[]>({
    queryKey: [`/api/suppliers/${supplierId}/price-list-items`],
    enabled: !!supplierId,
  });

  const { data: offers = [] } = useQuery<Offer[]>({
    queryKey: [`/api/suppliers/${supplierId}/offers`],
    enabled: !!supplierId,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [`/api/suppliers/${supplierId}/orders`],
    enabled: !!supplierId,
  });

  const sendInquiryMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inquiry sent successfully",
        description: "Your inquiry has been sent to the supplier.",
      });
      setInquiryMessage("");
      setAttachmentFiles(null);
      // Reset the file input
      const fileInput = document.getElementById('attachment-files') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
    onError: () => {
      toast({
        title: "Failed to send inquiry",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const addOfferMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/suppliers/${supplierId}/offers`, {
        content,
        source: "manual",
      });
    },
    onSuccess: () => {
      toast({
        title: "Offer added successfully",
        description: "The offer has been added to the supplier.",
      });
      setNewOfferContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}/offers`] });
    },
    onError: () => {
      toast({
        title: "Failed to add offer",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (offerId: number) => {
      return await apiRequest("DELETE", `/api/offers/${offerId}`);
    },
    onSuccess: () => {
      toast({
        title: "Offer deleted successfully",
        description: "The offer has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}/offers`] });
    },
    onError: () => {
      toast({
        title: "Failed to delete offer",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSendInquiry = () => {
    if (!inquiryMessage.trim()) {
      toast({
        title: "No message provided",
        description: "Please enter an inquiry message.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('message', inquiryMessage);
    formData.append('supplierIds', JSON.stringify([supplierId]));
    
    // Add attachment files if any
    if (attachmentFiles) {
      for (let i = 0; i < attachmentFiles.length; i++) {
        formData.append('attachments', attachmentFiles[i]);
      }
    }

    sendInquiryMutation.mutate(formData);
  };

  const handleAddOffer = () => {
    if (!newOfferContent.trim()) {
      toast({
        title: "No content provided",
        description: "Please enter offer content.",
        variant: "destructive",
      });
      return;
    }

    addOfferMutation.mutate(newOfferContent);
  };

  const handleDeleteOffer = (offerId: number) => {
    if (window.confirm("Are you sure you want to delete this offer? This action cannot be undone.")) {
      deleteOfferMutation.mutate(offerId);
    }
  };

  const deletePriceListMutation = useMutation({
    mutationFn: async (priceListId: number) => {
      await apiRequest("DELETE", `/api/price-lists/${priceListId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Price list deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}/price-lists`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete price list",
        variant: "destructive",
      });
    },
  });

  const handleDeletePriceList = (priceListId: number) => {
    if (window.confirm("Are you sure you want to delete this price list?")) {
      deletePriceListMutation.mutate(priceListId);
    }
  };

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      await apiRequest("DELETE", `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}/orders`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    },
  });

  const handleDeleteOrder = (orderId: number) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const saveOrderMutation = useMutation({
    mutationFn: async (orderData: { items: any[] }) => {
      const orderNumber = `ORD-${Date.now()}`;
      const totalAmount = orderData.items.reduce((sum, item) => sum + (item.sum || 0), 0);
      const totalCost = orderData.items.reduce((sum, item) => sum + (item.approximateCost || 0), 0);
      
      const orderResponse = await apiRequest("POST", `/api/suppliers/${supplierId}/orders`, {
        orderNumber,
        totalAmount: totalAmount.toString(),
        totalCost: totalCost.toString(),
        status: "draft"
      });

      // Add order items
      for (const item of orderData.items) {
        await apiRequest("POST", `/api/orders/${orderResponse.id}/items`, {
          itemNumber: item.itemNumber,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price.toString(),
          sum: item.sum.toString(),
          approximateCost: (item.approximateCost || 0).toString()
        });
      }

      return orderResponse;
    },
    onSuccess: () => {
      toast({
        title: "Order saved successfully",
        description: "The order has been saved and is available in Documents.",
      });
      setOrderItems([]);
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}/orders`] });
    },
    onError: () => {
      toast({
        title: "Failed to save order",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSaveOrder = () => {
    if (orderItems.length === 0) {
      toast({
        title: "No items to save",
        description: "Please add items to the order before saving.",
        variant: "destructive",
      });
      return;
    }

    saveOrderMutation.mutate({ items: orderItems });
  };

  const handleExportOrder = () => {
    // Export functionality can be implemented later
    toast({
      title: "Export functionality",
      description: "Export feature will be implemented soon.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      
      // TODO: Implement file upload
      toast({
        title: "File upload",
        description: "File upload functionality will be implemented.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-slate-200 rounded mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-800">Supplier not found</h2>
          <p className="mt-2 text-slate-600">The supplier you're looking for doesn't exist.</p>
          <Link href="/">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" className="mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold text-slate-800">{supplier.name}</h1>
            </div>
            <Button asChild>
              <Link href={`/edit-supplier?id=${supplier.id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Supplier
              </Link>
            </Button>
          </div>

          {/* Supplier basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-slate-800">Contact Information</h4>
              <div className="space-y-2">
                {supplier.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 text-slate-400 mr-3" />
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:text-blue-800">
                      {supplier.website}
                    </a>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-slate-400 mr-3" />
                    <span className="text-slate-700">{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-slate-400 mr-3" />
                    <span className="text-slate-700">{supplier.email}</span>
                  </div>
                )}
                {supplier.whatsapp && (
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-slate-700">{supplier.whatsapp}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-medium text-slate-800">Business Details</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-2 fill-current" />
                  <span className="text-slate-700">Reputation: </span>
                  <span className="font-semibold text-slate-800 ml-1">
                    {supplier.reputation || "N/A"}/10
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-700">Working Style: </span>
                  <span className="font-semibold text-slate-800 ml-1">
                    {supplier.workingStyle?.join(", ") || "Not specified"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-700">Country: </span>
                  <span className="font-semibold text-slate-800 ml-1">{supplier.country}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-medium text-slate-800">Trading Focus</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-700">Categories:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {supplier.categories?.map((category) => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-700">Brands:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {supplier.brands?.map((brand) => (
                      <Badge key={brand} variant="outline" className="text-xs">
                        {brand}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="price-lists" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="price-lists">Price Lists</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="inquiry">Send Inquiry</TabsTrigger>
        </TabsList>

        <TabsContent value="price-lists" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Price Lists</CardTitle>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Price List
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {priceListFiles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No price lists uploaded yet.</p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="price-list-upload"
                  />
                  <label htmlFor="price-list-upload">
                    <Button className="mt-4" asChild>
                      <span>Upload First Price List</span>
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  {priceListFiles.map((file) => (
                    <div key={file.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-emerald-600 mr-3" />
                          <div>
                            <h4 className="font-medium text-slate-800">{file.originalName}</h4>
                            <p className="text-sm text-slate-500">
                              Uploaded {new Date(file.uploadedAt!).toLocaleDateString()} • 
                              {file.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(1)} MB` : "Unknown size"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeletePriceList(file.id)}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {priceListItems.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-slate-800 mb-4">Price List Items</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {priceListItems.slice(0, 10).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{item.brand}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>${item.price}</TableCell>
                            <TableCell>
                              <Badge variant={item.stock === "In Stock" ? "default" : "secondary"}>
                                {item.stock}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(item.updatedAt!).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Offers</CardTitle>
                <Button onClick={handleAddOffer} disabled={addOfferMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Offer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-offer">Add New Offer</Label>
                  <Textarea
                    id="new-offer"
                    value={newOfferContent}
                    onChange={(e) => setNewOfferContent(e.target.value)}
                    placeholder="Paste offer content here..."
                    rows={3}
                  />
                </div>

                {offers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No offers added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {offers.map((offer) => (
                      <div key={offer.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Badge variant="outline" className="text-xs">
                                {offer.source}
                              </Badge>
                              <span className="ml-2 text-sm text-slate-500">
                                {new Date(offer.receivedAt!).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-800 mb-3">{offer.content}</p>
                            {offer.tags && offer.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {offer.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteOffer(offer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <OrderTable
            orderItems={orderItems}
            onItemsChange={setOrderItems}
            onSave={handleSaveOrder}
            onExport={handleExportOrder}
            isLoading={saveOrderMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documents & Files</CardTitle>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Document categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-medium text-slate-800 mb-2">Invoices</h4>
                    <div className="space-y-2">
                      <div className="text-sm text-slate-500">No invoices uploaded</div>
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-medium text-slate-800 mb-2">Orders</h4>
                    <div className="space-y-2">
                      {orders.length === 0 ? (
                        <div className="text-sm text-slate-500">No saved orders</div>
                      ) : (
                        orders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between text-sm">
                            <span>{order.orderNumber}</span>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-medium text-slate-800 mb-2">Other Documents</h4>
                    <div className="space-y-2">
                      <div className="text-sm text-slate-500">No documents uploaded</div>
                    </div>
                  </div>
                </div>

                {/* Recent documents table */}
                <div className="border border-slate-200 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          No documents uploaded yet. Upload invoices, orders, and other files here.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inquiry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Inquiry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="inquiry-message">Inquiry Message</Label>
                  <Textarea
                    id="inquiry-message"
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    rows={6}
                    placeholder="Enter your inquiry details..."
                  />
                </div>

                <div>
                  <Label htmlFor="attachment-files">Attach Excel Files (Optional)</Label>
                  <div className="mt-2">
                    <input
                      id="attachment-files"
                      type="file"
                      multiple
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => setAttachmentFiles(e.target.files)}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-emerald-50 file:text-emerald-700
                        hover:file:bg-emerald-100"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Attach Excel files with your product requirements (max 10MB per file)
                    </p>
                    {attachmentFiles && attachmentFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {Array.from(attachmentFiles).map((file, index) => (
                          <div key={index} className="flex items-center text-sm text-slate-600">
                            <svg className="w-4 h-4 mr-2 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.413V13H5.5z"/>
                              <path d="M9 13h2v5a1 1 0 11-2 0v-5z"/>
                            </svg>
                            {file.name} ({Math.round(file.size / 1024)} KB)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={sendViaWhatsApp}
                        onCheckedChange={(checked) => setSendViaWhatsApp(checked === true)}
                      />
                      <span className="text-sm text-slate-700">Send via WhatsApp</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1">{supplier.whatsapp || "No WhatsApp number"}</p>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={sendViaEmail}
                        onCheckedChange={(checked) => setSendViaEmail(checked === true)}
                      />
                      <span className="text-sm text-slate-700">Send via Email</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1">{supplier.email || "No email address"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Message will be prefixed with: "Dear colleague, please quote us the following. Thanks in advance."
                  </p>
                  <Button 
                    onClick={handleSendInquiry}
                    disabled={sendInquiryMutation.isPending || !inquiryMessage.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Inquiry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
