import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface FileUpload {
  name: string;
  description: string;
  file: File | null;
  uploaded: boolean;
  uploading: boolean;
}

export default function CompStyleUpload() {
  const [files, setFiles] = useState<FileUpload[]>([
    {
      name: "Total Stock",
      description: "Complete inventory with quantities, retail, dealer, and current cost prices",
      file: null,
      uploaded: false,
      uploading: false,
    },
    {
      name: "Kievyan 11 Stock",
      description: "Stock levels at Kievyan 11 retail location",
      file: null,
      uploaded: false,
      uploading: false,
    },
    {
      name: "Sevan 5 Stock",
      description: "Stock levels at Sevan 5 warehouse location",
      file: null,
      uploaded: false,
      uploading: false,
    },
    {
      name: "Goods in Transit",
      description: "Incoming inventory with quantities and purchase costs",
      file: null,
      uploaded: false,
      uploading: false,
    },
    {
      name: "Sales 1 Month",
      description: "Sales data for the last month",
      file: null,
      uploaded: false,
      uploading: false,
    },
    {
      name: "Sales 3 Months",
      description: "Sales data for the last 3 months",
      file: null,
      uploaded: false,
      uploading: false,
    },
    {
      name: "Sales 6 Months",
      description: "Sales data for the last 6 months",
      file: null,
      uploaded: false,
      uploading: false,
    },
    {
      name: "Sales 12 Months",
      description: "Sales data for the last 12 months (optional)",
      file: null,
      uploaded: false,
      uploading: false,
    },
    {
      name: "Purchases 1 Month",
      description: "Purchase data for the last month (optional)",
      file: null,
      uploaded: false,
      uploading: false,
    },
    {
      name: "Purchases 3 Months",
      description: "Purchase data for the last 3 months (optional)",
      file: null,
      uploaded: false,
      uploading: false,
    },
    {
      name: "Purchases 6 Months",
      description: "Purchase data for the last 6 months (optional)",
      file: null,
      uploaded: false,
      uploading: false,
    },
    {
      name: "Purchases 12 Months",
      description: "Purchase data for the last 12 months (optional)",
      file: null,
      uploaded: false,
      uploading: false,
    },
  ]);

  const handleFileSelect = (index: number, file: File) => {
    setFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, file } : item
    ));
  };

  const handleUpload = async (index: number) => {
    const file = files[index];
    if (!file.file) return;

    setFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, uploading: true } : item
    ));

    // Simulate upload
    setTimeout(() => {
      setFiles(prev => prev.map((item, i) => 
        i === index ? { ...item, uploading: false, uploaded: true } : item
      ));
    }, 2000);
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
            <strong>File Format Requirements:</strong> All files must be in CSV format with UTF-8 encoding. 
            Make sure column headers match the expected format. Optional files can be uploaded later.
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
                  {index >= 7 && (
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                      Optional
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {fileUpload.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`file-${index}`}>Select CSV File</Label>
                  <Input
                    id={`file-${index}`}
                    type="file"
                    accept=".csv"
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