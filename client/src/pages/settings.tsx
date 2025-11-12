
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserCheck, Crown, Loader2, Download, Database } from "lucide-react";
import { useState } from "react";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });

  const handleExportDatabase = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export/database', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Database exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export database",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to approve user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Approved",
        description: "User has been granted access to SupHub",
      });
    },
  });

  const makeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/make-admin`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to make user admin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Admin Access Granted",
        description: "User is now an administrator",
      });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Your Account Information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">
                  {user?.firstName || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant={user?.isApproved ? "default" : "secondary"}>
                  {user?.isApproved ? "Approved" : "Pending"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings & User Management</h1>
        <p className="text-muted-foreground">
          Manage user access and permissions for SupHub
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Database Export
            </CardTitle>
            <CardDescription>
              Export all suppliers and their documents as a ZIP file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleExportDatabase}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Database
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Approve new users and manage administrator access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {users?.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {u.profileImageUrl && (
                      <img
                        src={u.profileImageUrl}
                        alt={u.firstName || u.email}
                        className="h-10 w-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">
                        {u.firstName || u.email}
                      </p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.isAdmin && (
                      <Badge variant="destructive">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {u.isApproved && !u.isAdmin && (
                      <Badge variant="default">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                    {!u.isApproved && (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                    {!u.isApproved && (
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(u.id)}
                        disabled={approveMutation.isPending}
                      >
                        Approve
                      </Button>
                    )}
                    {u.isApproved && !u.isAdmin && u.id !== user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => makeAdminMutation.mutate(u.id)}
                        disabled={makeAdminMutation.isPending}
                      >
                        Make Admin
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
