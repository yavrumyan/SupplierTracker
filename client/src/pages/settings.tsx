import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Database, FileArchive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Settings() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportDatabase = async () => {
    setIsExporting(true);
    try {
      // Trigger the export API
      const response = await fetch('/api/export/database', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const filename = `database-export-${new Date().toISOString().split('T')[0]}.zip`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Database has been exported successfully. Check your downloads folder.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your application settings and data export options</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Export
            </CardTitle>
            <CardDescription>
              Export all supplier information and files as a backup. This creates a complete backup 
              of your database with all supplier data in CSV format, plus all documents and order 
              files organized by supplier.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleExportDatabase}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export Database
                  </>
                )}
              </Button>
              <div className="text-sm text-slate-600">
                <div className="flex items-center gap-1 mb-1">
                  <FileArchive className="h-4 w-4" />
                  Includes: CSV file with all supplier data
                </div>
                <div className="flex items-center gap-1">
                  <FileArchive className="h-4 w-4" />
                  ZIP file with all documents and order files
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}