import { useState, useRef } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  Eye
} from "lucide-react";
import { Link } from "wouter";
import type { Supplier, PriceListFile, PriceListItem, Offer } from "@shared/schema";
import { OrderTable } from "@/components/order-table";
import { SupplierForm } from "@/components/supplier-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertSupplier } from "@shared/schema";

export default function SupplierDetail() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/suppliers/:id");
  const supplierId = params?.id ? parseInt(params.id) : 0;

  const [inquiryMessage, setInquiryMessage] = useState("");
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(true);
  const [newOfferContent, setNewOfferContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{type: 'logic' | 'price', progress: number} | null>(null);
  const [previewData, setPreviewData] = useState<{html: string, rowCount: number, columns: string[]} | null>(null);
  
  const logicFileRef = useRef<HTMLInputElement>(null);
  const priceFileRef = useRef<HTMLInputElement>(null);

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

  const sendInquiryMutation = useMutation({
    mutationFn: async (data: { message: string; supplierIds: number[] }) => {
      return await apiRequest("POST", "/api/inquiries", data);
    },
    onSuccess: () => {
      toast({
        title: "Inquiry sent successfully",
        description: "Your inquiry has been sent to the supplier.",
      });
      setInquiryMessage("");
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

  const updateSupplierMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      return await apiRequest("PUT", `/api/suppliers/${supplierId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Supplier updated successfully",
        description: "The supplier information has been updated.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}`] });
    },
    onError: () => {
      toast({
        title: "Failed to update supplier",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const uploadLogicMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logic_file', file);
      
      const response = await fetch(`/api/suppliers/${supplierId}/upload-logic`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logic file uploaded successfully",
        description: "Conversion logic is now available for processing price lists.",
      });
      setUploadProgress(null);
      if (logicFileRef.current) {
        logicFileRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload logic file",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(null);
    },
  });

  const uploadPriceMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('price_file', file);
      
      const response = await fetch(`/api/suppliers/${supplierId}/upload-price`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Price list processed successfully",
        description: `Processed ${data.row_count} rows with ${data.column_count} columns.`,
      });
      setUploadProgress(null);
      setPreviewData({
        html: data.preview_html,
        rowCount: data.row_count,
        columns: data.columns
      });
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}/price-lists`] });
      if (priceFileRef.current) {
        priceFileRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process price list",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(null);
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

    sendInquiryMutation.mutate({
      message: inquiryMessage,
      supplierIds: [supplierId],
    });
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

  const handleLogicFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['.py', '.txt'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a .py or .txt file.",
          variant: "destructive",
        });
        return;
      }
      
      setUploadProgress({type: 'logic', progress: 0});
      uploadLogicMutation.mutate(file);
    }
  };

  const handlePriceFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['.xlsx', '.xls', '.csv'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel (.xlsx, .xls) or CSV file.",
          variant: "destructive",
        });
        return;
      }
      
      setUploadProgress({type: 'price', progress: 0});
      uploadPriceMutation.mutate(file);
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

  // If editing, show the supplier form
  if (isEditing && supplier) {
    return (
      <div className="p-6">
        <SupplierForm
          defaultValues={{
            name: supplier.name,
            country: supplier.country,
            website: supplier.website || "",
            email: supplier.email || "",
            phone: supplier.phone || "",
            whatsapp: supplier.whatsapp || "",
            reputation: supplier.reputation || 0,
            categories: supplier.categories || [],
            brands: supplier.brands || [],
            workingStyle: supplier.workingStyle || [],
            comments: supplier.comments || "",
          }}
          onSubmit={(data) => updateSupplierMutation.mutate(data)}
          onCancel={() => setIsEditing(false)}
          isLoading={updateSupplierMutation.isPending}
        />
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
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Supplier
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="price-lists">Price Lists</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="inquiry">Send Inquiry</TabsTrigger>
        </TabsList>

        <TabsContent value="price-lists" className="space-y-4">
          {/* Upload Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Conversion Logic Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversion Logic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Upload a Python (.py) or text (.txt) file containing the logic to convert price lists to a standardized format.
                </p>
                <div>
                  <Label htmlFor="logic-file-upload">Select Logic File</Label>
                  <Input
                    id="logic-file-upload"
                    type="file"
                    accept=".py,.txt"
                    ref={logicFileRef}
                    onChange={handleLogicFileUpload}
                    disabled={uploadLogicMutation.isPending}
                    className="mt-1"
                  />
                </div>
                {uploadProgress?.type === 'logic' && (
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{width: '50%'}}></div>
                  </div>
                )}
                <Button 
                  onClick={() => logicFileRef.current?.click()} 
                  disabled={uploadLogicMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadLogicMutation.isPending ? 'Uploading...' : 'Upload Logic'}
                </Button>
              </CardContent>
            </Card>

            {/* Price List Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Price List File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Upload an Excel (.xlsx, .xls) or CSV file containing the raw price list data.
                </p>
                <div>
                  <Label htmlFor="price-file-upload">Select Price List File</Label>
                  <Input
                    id="price-file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    ref={priceFileRef}
                    onChange={handlePriceFileUpload}
                    disabled={uploadPriceMutation.isPending}
                    className="mt-1"
                  />
                </div>
                {uploadProgress?.type === 'price' && (
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{width: '50%'}}></div>
                  </div>
                )}
                <Button 
                  onClick={() => priceFileRef.current?.click()} 
                  disabled={uploadPriceMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadPriceMutation.isPending ? 'Processing...' : 'Upload & Process'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview - Processed Data</CardTitle>
                <p className="text-sm text-slate-600">
                  Showing first 10 rows of {previewData.rowCount} total rows • {previewData.columns.length} columns
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Price Lists */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Uploaded Price Lists</CardTitle>
                <Badge variant="secondary">{priceListFiles.length} files</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {priceListFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No price lists uploaded yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Upload conversion logic first, then upload price list files for processing.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {priceListFiles.map((file) => (
                    <div key={file.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-emerald-600 mr-3" />
                          <div>
                            <h4 className="font-medium text-slate-800">{file.filename}</h4>
                            <p className="text-sm text-slate-500">
                              Uploaded {new Date(file.uploadedAt!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/api/suppliers/${supplierId}/download-price/${file.id}`, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
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
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
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
            orderItems={[]}
            onItemsChange={() => {}}
            onSave={() => {}}
            onExport={() => {}}
          />
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
