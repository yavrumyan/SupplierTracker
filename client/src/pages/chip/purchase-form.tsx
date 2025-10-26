import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Plus, Trash2, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ChipProduct, ChipSupplier } from "@shared/schema";
import { useEffect } from "react";

const purchaseItemSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Price must be positive"),
  serialNumbers: z.string().optional(),
});

const purchaseFormSchema = z.object({
  supplierId: z.number().min(1, "Supplier is required"),
  purchaseDate: z.date(),
  currency: z.enum(["AMD", "USD", "RUB", "EUR"]),
  paymentStatus: z.enum(["unpaid", "partial", "paid"]),
  paidAmount: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

export default function ChipPurchaseForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: suppliers } = useQuery<ChipSupplier[]>({
    queryKey: ["/api/chip/suppliers"],
  });

  const { data: products } = useQuery<ChipProduct[]>({
    queryKey: ["/api/chip/products"],
  });

  const { data: currencyRates } = useQuery<Array<{ currency: string; rateToAMD: string }>>({
    queryKey: ["/api/chip/currency-rates"],
  });

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplierId: 0,
      purchaseDate: new Date(),
      currency: "AMD",
      paymentStatus: "unpaid",
      paidAmount: 0,
      paymentMethod: "",
      notes: "",
      items: [{ productId: 0, quantity: 1, unitPrice: 0, serialNumbers: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      const selectedCurrency = data.currency;
      const rate = currencyRates?.find((r) => r.currency === selectedCurrency)?.rateToAMD || "1";
      const exchangeRate = parseFloat(rate);

      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const totalAmountAMD = selectedCurrency === "AMD" ? totalAmount : totalAmount * exchangeRate;

      const purchaseNumber = `PO-${Date.now()}`;

      const purchase = {
        purchaseNumber,
        supplierId: data.supplierId,
        purchaseDate: data.purchaseDate.toISOString(),
        totalAmount: totalAmount.toFixed(2),
        currency: data.currency,
        totalAmountAMD: totalAmountAMD.toFixed(2),
        paymentStatus: data.paymentStatus,
        paidAmount: (data.paidAmount || 0).toFixed(2),
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || null,
      };

      const items = data.items.map((item) => {
        const unitPriceAMD = selectedCurrency === "AMD" ? item.unitPrice : item.unitPrice * exchangeRate;
        const serialNumbersArray = item.serialNumbers
          ? item.serialNumbers.split(",").map((s) => s.trim()).filter((s) => s)
          : [];

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          unitPriceAMD: unitPriceAMD.toFixed(2),
          serialNumbers: serialNumbersArray,
          totalPrice: (item.quantity * item.unitPrice).toFixed(2),
        };
      });

      await apiRequest("POST", "/api/chip/purchases", { purchase, items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chip/products"] });
      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });
      setLocation("/chip/purchases");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PurchaseFormData) => {
    createPurchaseMutation.mutate(data);
  };

  // Calculate totals
  const selectedCurrency = form.watch("currency");
  const items = form.watch("items");
  const rate = currencyRates?.find((r) => r.currency === selectedCurrency)?.rateToAMD || "1";
  const exchangeRate = parseFloat(rate);

  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);

  const totalAmountAMD = selectedCurrency === "AMD" ? totalAmount : totalAmount * exchangeRate;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-[#2AA448]" />
            <h1 className="text-2xl font-semibold text-slate-800">New Purchase Order</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">Create a new purchase order from supplier</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchase Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <Select
                        value={field.value ? field.value.toString() : ""}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-supplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers?.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              data-testid="button-date-picker"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AMD">AMD</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="RUB">RUB</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-paid-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Cash, Bank Transfer"
                          {...field}
                          data-testid="input-payment-method"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Line Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ productId: 0, quantity: 1, unitPrice: 0, serialNumbers: "" })}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="min-w-[200px]">Product</TableHead>
                        <TableHead className="min-w-[100px]">Quantity</TableHead>
                        <TableHead className="min-w-[120px]">Unit Price</TableHead>
                        <TableHead className="min-w-[200px]">Serial Numbers</TableHead>
                        <TableHead className="min-w-[120px]">Total</TableHead>
                        <TableHead className="w-[80px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => {
                        const product = products?.find((p) => p.id === form.watch(`items.${index}.productId`));
                        const itemTotal = (form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.unitPrice`) || 0);

                        return (
                          <TableRow key={field.id}>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.productId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <Select
                                      value={field.value ? field.value.toString() : ""}
                                      onValueChange={(value) => field.onChange(parseInt(value))}
                                    >
                                      <FormControl>
                                        <SelectTrigger data-testid={`select-product-${index}`}>
                                          <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {products?.map((product) => (
                                          <SelectItem key={product.id} value={product.id.toString()}>
                                            {product.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                        data-testid={`input-quantity-${index}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.unitPrice`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        data-testid={`input-unit-price-${index}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.serialNumbers`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder={product?.serialNumberTracking ? "SN1, SN2, SN3" : "N/A"}
                                        {...field}
                                        disabled={!product?.serialNumberTracking}
                                        data-testid={`input-serial-numbers-${index}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell className="font-medium" data-testid={`text-item-total-${index}`}>
                              {itemTotal.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                                data-testid={`button-remove-item-${index}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals */}
                <div className="mt-6 space-y-2 border-t pt-4">
                  <div className="flex justify-end items-center gap-4">
                    <span className="text-sm font-medium text-slate-600">
                      Total ({selectedCurrency}):
                    </span>
                    <span className="text-lg font-bold" data-testid="text-total-amount">
                      {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency}
                    </span>
                  </div>
                  {selectedCurrency !== "AMD" && (
                    <div className="flex justify-end items-center gap-4">
                      <span className="text-sm font-medium text-slate-600">Total (AMD):</span>
                      <span className="text-lg font-bold text-[#2AA448]" data-testid="text-total-amount-amd">
                        {totalAmountAMD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AMD
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes about this purchase..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/chip/purchases")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#2AA448] hover:bg-[#239639]"
                disabled={createPurchaseMutation.isPending}
                data-testid="button-save"
              >
                {createPurchaseMutation.isPending ? "Saving..." : "Save Purchase Order"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
