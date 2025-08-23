import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportPreview {
  headers: string[];
  rows: any[][];
  errors: string[];
  validRows: number;
  totalRows: number;
}

export default function ImportData() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('csv_file', file);
      
      const response = await fetch('/api/import/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to preview CSV file');
      }

      const previewData = await response.json();
      setPreview(previewData);
      
      if (previewData.errors.length > 0) {
        toast({
          title: "CSV Validation Warnings",
          description: `${previewData.errors.length} issues found. Please review before importing.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "CSV Preview Ready",
          description: `${previewData.validRows} suppliers ready to import.`,
        });
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview Failed",
        description: "There was an error processing the CSV file.",
        variant: "destructive",
      });
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.validRows === 0) return;

    setIsImporting(true);
    
    try {
      const formData = new FormData();
      const fileInput = fileInputRef.current;
      if (fileInput?.files?.[0]) {
        formData.append('csv_file', fileInput.files[0]);
      }
      
      const response = await fetch('/api/import/suppliers', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to import suppliers');
      }

      const result = await response.json();
      
      toast({
        title: "Import Successful",
        description: `${result.imported} suppliers imported successfully. ${result.skipped || 0} duplicates skipped.`,
      });
      
      // Clear the form
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "There was an error importing the suppliers.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'ID', 'Name', 'Country', 'City', 'Contact Person', 'Phone', 'Email', 'WhatsApp',
      'Website', 'Categories', 'Brands', 'Working Style', 'Reputation', 'Comments',
      'Created At', 'Updated At'
    ];
    
    const sampleRow = [
      '', 'Sample Supplier', 'United States', 'New York', 'John Doe', '+1-555-0123', 
      'john@example.com', '+1-555-0123', 'https://example.com', 
      'Laptops; Desktops', 'Dell; HP', 'Wholesale; Retail', '8', 
      'Reliable supplier with good prices', '', ''
    ];
    
    const csvContent = headers.join(',') + '\n' + sampleRow.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Import Data</h1>
        <p className="text-slate-600 mt-2">Import suppliers from CSV file to bulk add new suppliers to your database</p>
      </div>

      <div className="grid gap-6">
        {/* Template Download */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              CSV Template
            </CardTitle>
            <CardDescription>
              Download a template CSV file with the correct format and sample data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Suppliers
            </CardTitle>
            <CardDescription>
              Upload a CSV file with supplier data. New suppliers will be added, existing ones will be skipped.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isUploading || isImporting}
                className="mt-1"
              />
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Existing suppliers (with same name or email) will be skipped to prevent duplicates. Only new suppliers will be added.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Preview */}
        {preview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Import Preview
              </CardTitle>
              <CardDescription>
                Review the data before importing. {preview.validRows} of {preview.totalRows} rows are valid.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {preview.validRows} Valid
                </Badge>
                {preview.errors.length > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {preview.errors.length} Issues
                  </Badge>
                )}
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {preview.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-sm">{error}</div>
                      ))}
                      {preview.errors.length > 5 && (
                        <div className="text-sm font-medium">
                          ...and {preview.errors.length - 5} more issues
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {preview.headers.slice(0, 6).map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                      {preview.headers.length > 6 && (
                        <TableHead>...{preview.headers.length - 6} more columns</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.slice(0, 5).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.slice(0, 6).map((cell, cellIndex) => (
                          <TableCell key={cellIndex} className="max-w-32 truncate">
                            {cell || '-'}
                          </TableCell>
                        ))}
                        {row.length > 6 && (
                          <TableCell className="text-slate-500">...</TableCell>
                        )}
                      </TableRow>
                    ))}
                    {preview.rows.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-500">
                          ...and {preview.rows.length - 5} more rows
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Import Button */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleImport}
                  disabled={isImporting || preview.validRows === 0}
                  className="flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import {preview.validRows} Suppliers
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}