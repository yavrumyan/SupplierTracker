import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Save, Download, Trash2 } from "lucide-react";
import type { OrderItem } from "@shared/schema";

interface OrderTableProps {
  orderItems: OrderItem[];
  onItemsChange: (items: OrderItem[]) => void;
  onSave: () => void;
  onExport: () => void;
  isLoading?: boolean;
}

interface OrderItemRow {
  id?: number;
  itemNumber: number;
  productName: string;
  quantity: number;
  price: number;
  sum: number;
  approximateCost: number;
}

export function OrderTable({ orderItems, onItemsChange, onSave, onExport, isLoading }: OrderTableProps) {
  const [items, setItems] = useState<OrderItemRow[]>(
    orderItems.length > 0 
      ? orderItems.map(item => ({
          ...item,
          sum: Number(item.sum),
          approximateCost: Number(item.approximateCost),
          price: Number(item.price),
        }))
      : [{ itemNumber: 1, productName: "", quantity: 1, price: 0, sum: 0, approximateCost: 0 }]
  );

  const calculateSum = (quantity: number, price: number) => {
    return quantity * price;
  };

  const calculateApproximateCost = (price: number) => {
    // Simple cost calculation - 8% discount for now
    // In a real app, this would use the uploaded CSV file logic
    return price * 0.92;
  };

  const updateItem = (index: number, field: keyof OrderItemRow, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate sum and approximate cost
    if (field === "quantity" || field === "price") {
      const quantity = field === "quantity" ? Number(value) : newItems[index].quantity;
      const price = field === "price" ? Number(value) : newItems[index].price;
      newItems[index].sum = calculateSum(quantity, price);
      newItems[index].approximateCost = calculateApproximateCost(newItems[index].sum);
    }

    setItems(newItems);
    onItemsChange(newItems);
  };

  const addItem = () => {
    const newItem: OrderItemRow = {
      itemNumber: items.length + 1,
      productName: "",
      quantity: 1,
      price: 0,
      sum: 0,
      approximateCost: 0,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    onItemsChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Renumber items
    newItems.forEach((item, i) => {
      item.itemNumber = i + 1;
    });
    setItems(newItems);
    onItemsChange(newItems);
  };

  const totalSum = items.reduce((total, item) => total + item.sum, 0);
  const totalCost = items.reduce((total, item) => total + item.approximateCost, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Order Draft</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSave}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Quantity</TableHead>
                <TableHead className="w-24">Price</TableHead>
                <TableHead className="w-24">Sum</TableHead>
                <TableHead className="w-24">App. Cost</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.itemNumber}
                      onChange={(e) => updateItem(index, "itemNumber", Number(e.target.value))}
                      className="w-12 text-center"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.productName}
                      onChange={(e) => updateItem(index, "productName", e.target.value)}
                      placeholder="Product name"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      className="w-20"
                      min="1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                      className="w-20"
                      min="0"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-800">
                      ${item.sum.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-emerald-600">
                      ${item.approximateCost.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Add new item row */}
              <TableRow className="bg-slate-50">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addItem}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell colSpan={6} className="text-sm text-slate-500">
                  Click + to add new item
                </TableCell>
              </TableRow>
            </TableBody>
            
            {/* Totals footer */}
            <TableBody>
              <TableRow className="bg-slate-50 font-medium">
                <TableCell colSpan={4} className="text-right">
                  Total:
                </TableCell>
                <TableCell className="font-semibold text-slate-800">
                  ${totalSum.toFixed(2)}
                </TableCell>
                <TableCell className="font-semibold text-emerald-600">
                  ${totalCost.toFixed(2)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
