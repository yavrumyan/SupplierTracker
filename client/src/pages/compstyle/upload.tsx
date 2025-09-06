import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface FileUpload {
  name: string;
  description: string;
  file: File | null;
  uploaded: boolean;
  uploading: boolean;
  fileType: string;
}

export default function CompStyleUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileUpload[]>([
    {
      name: "Total Stock Current",
      description: "Master inventory: product names, SKUs, quantities, USD/AMD prices, wholesale tiers, costs",
      file: null,
      uploaded: false,
      uploading: false,
      fileType: "total-stock",
    },
    {
      name: "Stock Kievyan Current",
      description: "Kievyan store stock: product names, quantities, retail prices in AMD",
      file: null,
      uploaded: false,
      uploading: false,
      fileType: "stock-kievyan",
    },
    {
      name: "Stock Sevan Current",
      description: "Sevan warehouse stock: product names, quantities, retail prices in AMD",
      file: null,
      uploaded: false,
      uploading: false,
      fileType: "stock-sevan",
    },
    {
      name: "In Transit Current",
      description: "Incoming inventory: products, quantities, purchase prices, suppliers, destinations",
      file: null,
      uploaded: false,
      uploading: false,
      fileType: "in-transit",
    },
    {
      name: "Sale by Sevan (Period)",
      description: "Sevan sales orders with line items, customers, dates, prices - organized by sales order blocks",
      file: null,
      uploaded: false,
      uploading: false,
      fileType: "sale-sevan",
    },
    {
      name: "Sale by Kievyan (Period)",
      description: "Kievyan sales orders with line items, customers, dates, prices - organized by sales order blocks",
      file: null,
      uploaded: false,
      uploading: false,
      fileType: "sale-kievyan",
    },
    {
      name: "Purchase by Sevan (Period)",
      description: "Sevan purchase orders with line items, suppliers, dates, prices - organized by purchase order blocks",
      file: null,
      uploaded: false,
      uploading: false,
      fileType: "purchase-sevan",
    },
    {
      name: "Purchase by Kievyan (Period)",
      description: "Kievyan purchase orders with line items, suppliers, dates, prices - organized by purchase order blocks",
      file: null,
      uploaded: false,
      uploading: false,
      fileType: "purchase-kievyan",
    },
    {
      name: "Total sales by goods (Period)",
      description: "Aggregated sales data by product across both locations with profit calculations",
      file: null,
      uploaded: false,
      uploading: false,
      fileType: "total-sales",
    },
    {
      name: "Total procurement by goods (Period)",
      description: "Aggregated purchase data by product across both locations",
      file: null,
      uploaded: false,
      uploading: false,
      fileType: "total-procurement",
    },
  ]);

  const handleFileSelect = (index: number, file: File) => {
    setFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, file } : item
    ));
  };

  const handleUpload = async (index: number) => {
    const fileUpload = files[index];
    if (!fileUpload.file) return;

    setFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, uploading: true } : item
    ));

    try {
      const formData = new FormData();
      formData.append('file', fileUpload.file);
      formData.append('fileType', fileUpload.fileType);

      const response = await fetch('/api/compstyle/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      setFiles(prev => prev.map((item, i) => 
        i === index ? { ...item, uploading: false, uploaded: true } : item
      ));

      // Invalidate all CompStyle data queries when files are uploaded
      queryClient.invalidateQueries({ queryKey: ['/api/compstyle'] });
      
      toast({
        title: "Upload Successful",
        description: `${fileUpload.name} processed successfully. ${result.recordsProcessed} records imported.`,
      });

    } catch (error) {
      setFiles(prev => prev.map((item, i) => 
        i === index ? { ...item, uploading: false } : item
      ));

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      });
    }
  };

  const uploadedCount = files.filter(f => f.uploaded).length;
  const totalFiles = files.length;
  const uploadProgress = (uploadedCount / totalFiles) * 100;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/compstyle">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CompStyle
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload CompStyle Data</h1>
          <p className="text-slate-600">
            Upload CSV files to enable business intelligence analysis
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
            <CardDescription>
              {uploadedCount} of {totalFiles} files uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-slate-600 mt-2">
              {uploadProgress.toFixed(0)}% complete
            </p>
          </CardContent>
        </Card>

        {/* Upload Instructions */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>File Format Requirements:</strong> All files must be Excel (.xlsx) format. 
            Period files (sales/purchases) should include date ranges in filename (e.g., "20-08-25 to 25-08-25"). 
            Stock and transit files are current snapshot data.
          </AlertDescription>
        </Alert>

        {/* File Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {files.map((fileUpload, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {fileUpload.uploaded ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-slate-600" />
                  )}
                  {fileUpload.name}
                  {index <= 3 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Core Data
                    </span>
                  )}
                  {index > 3 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Period Data
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {fileUpload.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`file-${index}`}>Select Excel File</Label>
                  <Input
                    id={`file-${index}`}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(index, file);
                    }}
                    disabled={fileUpload.uploaded}
                  />
                </div>

                {fileUpload.file && !fileUpload.uploaded && (
                  <div className="text-sm text-slate-600">
                    Selected: {fileUpload.file.name} ({(fileUpload.file.size / 1024).toFixed(1)} KB)
                  </div>
                )}

                <Button
                  onClick={() => handleUpload(index)}
                  disabled={!fileUpload.file || fileUpload.uploaded || fileUpload.uploading}
                  className="w-full"
                >
                  {fileUpload.uploading ? (
                    "Uploading..."
                  ) : fileUpload.uploaded ? (
                    "Uploaded ✓"
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Next Steps */}
        {uploadedCount > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                Files uploaded successfully. You can now access analytics features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/compstyle/data-overview">
                  <Button variant="outline" className="w-full">
                    View Data Overview
                  </Button>
                </Link>
                <Link href="/compstyle/inventory-movement">
                  <Button variant="outline" className="w-full">
                    Start Analysis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}