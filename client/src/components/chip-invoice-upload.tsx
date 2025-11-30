import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileUp, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function ChipInvoiceUpload() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/chip/import-invoices", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setUploadResult(data);
      toast({
        title: "Upload successful",
        description: `Imported: ${data.imported}, Skipped: ${data.skipped}${data.errors.length > 0 ? `, Errors: ${data.errors.length}` : ""}`,
      });
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileUp className="h-5 w-5 text-[#2AA448]" />
          Import Tax Invoices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Upload CSV File</label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploadMutation.isPending}
              data-testid="input-invoice-file"
            />
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="bg-[#2AA448] hover:bg-[#239639] whitespace-nowrap"
              data-testid="button-upload-invoices"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Supports Armenian tax invoices (Received/Issued). Duplicates will be skipped automatically.
          </p>
        </div>

        {uploadResult && (
          <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-slate-800">
                {uploadResult.type === "purchase" ? "Purchase" : "Sales"} Invoices
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Imported</p>
                <p className="text-lg font-bold text-green-600">{uploadResult.imported}</p>
              </div>
              <div>
                <p className="text-slate-600">Skipped</p>
                <p className="text-lg font-bold text-amber-600">{uploadResult.skipped}</p>
              </div>
              <div>
                <p className="text-slate-600">Errors</p>
                <p className="text-lg font-bold text-red-600">{uploadResult.errors.length}</p>
              </div>
            </div>
            {uploadResult.errors.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded space-y-1">
                {uploadResult.errors.slice(0, 3).map((error: string, i: number) => (
                  <p key={i} className="text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {error}
                  </p>
                ))}
                {uploadResult.errors.length > 3 && (
                  <p className="text-xs text-red-600">+{uploadResult.errors.length - 3} more errors</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
