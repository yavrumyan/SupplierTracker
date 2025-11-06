
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, Truck, AlertCircle, Upload, Download, Calendar, DollarSign, MapPin, User, FileText, Plus, X } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TransitItem {
  id: number;
  productName: string;
  qty: number;
  purchasePriceUsd: string | null;
  purchasePriceAmd: string | null;
  currentCost: string | null;
  purchaseOrderNumber: string | null;
  destinationLocation: string | null;
  supplier: string | null;
  orderDate: string | null;
  status?: string;
  priority?: string;
  notes?: string;
}

interface TransitOrder {
  orderNumber: string;
  supplier: string | null;
  items: TransitItem[];
  totalValue: number;
  totalQty: number;
  destination: string | null;
  status?: string;
  notes?: string;
  priority?: string;
  orderDate?: string;
  expectedArrival?: string;
  documents?: string[];
}

const STATUS_OPTIONS = [
  { value: "ordered", label: "Ordered", color: "bg-blue-100 text-blue-800" },
  { value: "shipped", label: "Shipped", color: "bg-yellow-100 text-yellow-800" },
  { value: "at_customs", label: "At Customs", color: "bg-orange-100 text-orange-800" },
];

const PRIORITY_OPTIONS = [
  { value: "normal", label: "Normal", color: "bg-slate-100 text-slate-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
];

export default function CompStyleTransitTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editedOrders, setEditedOrders] = useState<Record<string, any>>({});

  const { data: transitData, isLoading } = useQuery<TransitItem[]>({
    queryKey: ["/api/compstyle/transit"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await fetch(`/api/compstyle/transit/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update transit item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compstyle/transit"] });
      toast({
        title: "Success",
        description: "Transit order updated successfully",
      });
      setEditedOrders({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update transit order",
        variant: "destructive",
      });
    },
  });

  // Group transit items by order number
  const groupedOrders: TransitOrder[] = transitData
    ? Object.entries(
        transitData.reduce((acc, item) => {
          const orderNumber = item.purchaseOrderNumber || "NO_ORDER";
          if (!acc[orderNumber]) {
            acc[orderNumber] = [];
          }
          acc[orderNumber].push(item);
          return acc;
        }, {} as Record<string, TransitItem[]>)
      ).map(([orderNumber, items]) => {
        const totalValue = items.reduce(
          (sum, item) => sum + (parseFloat(item.purchasePriceUsd || "0") * item.qty),
          0
        );
        const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
        
        return {
          orderNumber,
          supplier: items[0]?.supplier || null,
          items,
          totalValue,
          totalQty,
          destination: items[0]?.destinationLocation || null,
          status: items[0]?.status || "ordered",
          priority: items[0]?.priority || "normal",
          notes: items[0]?.notes || "",
          orderDate: items[0]?.orderDate || null,
        };
      })
    : [];

  const toggleOrder = (orderNumber: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderNumber)) {
      newExpanded.delete(orderNumber);
    } else {
      newExpanded.add(orderNumber);
    }
    setExpandedOrders(newExpanded);
  };

  const filteredOrders = groupedOrders.filter(order => {
    if (filterStatus !== "all" && order.status !== filterStatus) return false;
    if (filterSupplier !== "all" && order.supplier !== filterSupplier) return false;
    if (searchQuery && !order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !order.supplier?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const uniqueSuppliers = [...new Set(groupedOrders.map(o => o.supplier).filter(Boolean))];

  const getStatusColor = (status?: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || "bg-slate-100 text-slate-800";
  };

  const getPriorityColor = (priority?: string) => {
    return PRIORITY_OPTIONS.find(p => p.value === priority)?.color || "bg-slate-100 text-slate-800";
  };

  const calculateDaysInTransit = (orderDate?: string) => {
    if (!orderDate) return null;
    const days = Math.floor((Date.now() - new Date(orderDate).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleFieldChange = (orderNumber: string, field: string, value: any) => {
    setEditedOrders(prev => ({
      ...prev,
      [orderNumber]: {
        ...(prev[orderNumber] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveChanges = async (order: TransitOrder) => {
    const changes = editedOrders[order.orderNumber];
    if (!changes) return;

    // Update all items in this order with the same changes
    for (const item of order.items) {
      await updateMutation.mutateAsync({
        id: item.id,
        updates: changes,
      });
    }
  };

  const handleCancelChanges = (orderNumber: string) => {
    setEditedOrders(prev => {
      const newEdited = { ...prev };
      delete newEdited[orderNumber];
      return newEdited;
    });
  };

  const getOrderValue = (order: TransitOrder, field: string) => {
    const edited = editedOrders[order.orderNumber];
    return edited && edited[field] !== undefined ? edited[field] : order[field as keyof TransitOrder];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-lg">Loading transit data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/compstyle">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CompStyle
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">🚚 Transit Tracking</h1>
          <p className="text-slate-600">
            Monitor and manage incoming shipments with real-time status updates
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{groupedOrders.length}</div>
              <p className="text-xs text-slate-600">Active shipments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {groupedOrders.reduce((sum, o) => sum + o.totalQty, 0)}
              </div>
              <p className="text-xs text-slate-600">Units in transit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${groupedOrders.reduce((sum, o) => sum + o.totalValue, 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-600">USD in transit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent Orders</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {groupedOrders.filter(o => o.priority === "urgent").length}
              </div>
              <p className="text-xs text-slate-600">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder="Search orders or suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {uniqueSuppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier!}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-500">
                No transit orders found matching your filters
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.orderNumber);
              const daysInTransit = calculateDaysInTransit(order.orderDate || undefined);
              const hasChanges = !!editedOrders[order.orderNumber];

              return (
                <Card key={order.orderNumber} className="overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleOrder(order.orderNumber)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">
                            Order #{order.orderNumber}
                          </CardTitle>
                          <Badge className={getStatusColor(getOrderValue(order, 'status'))}>
                            {STATUS_OPTIONS.find(s => s.value === getOrderValue(order, 'status'))?.label || "Ordered"}
                          </Badge>
                          <Badge className={getPriorityColor(getOrderValue(order, 'priority'))}>
                            {PRIORITY_OPTIONS.find(p => p.value === getOrderValue(order, 'priority'))?.label || "Normal"}
                          </Badge>
                          {hasChanges && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Unsaved Changes
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{order.supplier || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="h-4 w-4" />
                            <span>{order.destination || "Not specified"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Package className="h-4 w-4" />
                            <span>{order.totalQty} items</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <DollarSign className="h-4 w-4" />
                            <span>${order.totalValue.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">
                              {order.orderDate 
                                ? new Date(order.orderDate).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })
                                : "No date"}
                            </span>
                            {daysInTransit !== null && daysInTransit > 0 && (
                              <span className="text-xs text-slate-500">({daysInTransit}d)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        {isExpanded ? "Collapse" : "Expand"}
                      </Button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="border-t border-slate-200 bg-blue-50">
                      {/* Order Management Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-white rounded-lg">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            Status
                          </label>
                          <Select 
                            value={getOrderValue(order, 'status')} 
                            onValueChange={(value) => handleFieldChange(order.orderNumber, 'status', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(status => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            Priority
                          </label>
                          <Select 
                            value={getOrderValue(order, 'priority')} 
                            onValueChange={(value) => handleFieldChange(order.orderNumber, 'priority', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITY_OPTIONS.map(priority => (
                                <SelectItem key={priority.value} value={priority.value}>
                                  {priority.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            Order Date
                          </label>
                          <Input 
                            type="date" 
                            value={order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : ''} 
                            disabled
                            className="bg-slate-50"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            Expected Arrival
                          </label>
                          <Input type="date" defaultValue={order.expectedArrival} />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            To-Do / Notes
                          </label>
                          <Textarea
                            placeholder="Add action items, tracking notes, or important information..."
                            value={getOrderValue(order, 'notes') || ''}
                            onChange={(e) => handleFieldChange(order.orderNumber, 'notes', e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="overflow-x-auto bg-white rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 border-b border-slate-200">
                            <tr>
                              <th className="text-left p-3 font-semibold">Product Name</th>
                              <th className="text-center p-3 font-semibold">Quantity</th>
                              <th className="text-right p-3 font-semibold">Price (USD)</th>
                              <th className="text-right p-3 font-semibold">Price (AMD)</th>
                              <th className="text-right p-3 font-semibold">Total (USD)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => {
                              const priceUsd = parseFloat(item.purchasePriceUsd || "0");
                              const totalUsd = priceUsd * item.qty;
                              return (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="p-3">{item.productName}</td>
                                  <td className="p-3 text-center">{item.qty}</td>
                                  <td className="p-3 text-right">
                                    {priceUsd > 0 ? `$${priceUsd.toFixed(2)}` : "-"}
                                  </td>
                                  <td className="p-3 text-right">
                                    {item.purchasePriceAmd || "-"}
                                  </td>
                                  <td className="p-3 text-right font-semibold">
                                    ${totalUsd.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCancelChanges(order.orderNumber)}
                          disabled={!hasChanges}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleSaveChanges(order)}
                          disabled={!hasChanges || updateMutation.isPending}
                        >
                          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
