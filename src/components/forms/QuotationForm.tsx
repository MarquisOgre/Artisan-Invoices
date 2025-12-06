import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStockCheck } from "@/hooks/useStockCheck";

interface QuotationFormProps {
  customers: any[];
  onSubmit: (quotationData: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

interface QuotationItem {
  description: string;
  shirt_size: string;
  quantity: number;
  rate: number;
  amount: number;
  customDescription?: string;
}

const QuotationForm = ({ customers, onSubmit, onCancel, initialData, mode = 'create' }: QuotationFormProps) => {
  const [formData, setFormData] = useState({
    customerId: "",
    date: new Date().toISOString().split('T')[0],
    validUntil: "",
    notes: "",
    taxType: "IGST_18",
    status: "sent",
    complimentary: false,
    taxMode: "inclusive"
  });

  const [items, setItems] = useState<QuotationItem[]>([
    { description: "", shirt_size: "", quantity: 1, rate: 0, amount: 0 }
  ]);

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<string[]>([]);
  const { toast } = useToast();
  const { getAvailableStock, isStockAvailable } = useStockCheck();

  // Fetch unique products from stock register
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("stock_register")
        .select("product_name")
        .order("product_name");
      
      if (data) {
        const uniqueProducts = Array.from(new Set(data.map(p => p.product_name)));
        setProducts(uniqueProducts);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        customerId: initialData.customer_id || "",
        date: initialData.date || new Date().toISOString().split('T')[0],
        validUntil: initialData.valid_until || "",
        notes: initialData.notes || "",
        taxType: initialData.tax_type || "IGST_18",
        status: initialData.status || "sent",
        complimentary: initialData.complimentary || false,
        taxMode: initialData.tax_mode || "exclusive"
      });
      
      // Process items to handle products not in dropdown
      const processedItems = (initialData.items || []).map((item: QuotationItem) => {
        const isInProductList = products.includes(item.description);
        if (!isInProductList && item.description) {
          return {
            ...item,
            description: "__custom__",
            customDescription: item.description
          };
        }
        return item;
      });
      setItems(processedItems);
    }
  }, [initialData, mode, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId) {
      toast({
        title: "Validation Error",
        description: "Please select a customer.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.date) {
      toast({
        title: "Validation Error",
        description: "Please enter quotation date.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.validUntil) {
      toast({
        title: "Validation Error",
        description: "Please enter valid until date.",
        variant: "destructive"
      });
      return;
    }

    // Validate that ALL fields are filled for each item
    const validItems = items.filter(item => 
      item.description.trim() && item.shirt_size.trim() && item.quantity > 0 && item.rate > 0
    );
    
    if (validItems.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please fill all fields for at least one item (Description, Size, Quantity, and Rate).",
        variant: "destructive"
      });
      return;
    }

    if (validItems.length !== items.length) {
      toast({
        title: "Validation Error",
        description: "Please fill all mandatory fields (Description and Size) for all items.",
        variant: "destructive"
      });
      return;
    }

    // Process items to use custom description if applicable
    const processedItems = validItems.map(item => {
      if (item.description === "__custom__" && item.customDescription) {
        return { ...item, description: item.customDescription, customDescription: undefined };
      }
      return item;
    });

    // Calculate totals using processed items
    let subtotal = processedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const getTaxRate = (taxType: string) => {
      if (taxType.includes('18')) return 0.18;
      if (taxType.includes('12')) return 0.12;
      if (taxType.includes('5')) return 0.05;
      return 0.18;
    };
    const taxRate = getTaxRate(formData.taxType);
    let taxAmount = 0;
    let grandTotal = 0;

    if (formData.complimentary) {
      // If complimentary, all amounts are zero
      subtotal = 0;
      taxAmount = 0;
      grandTotal = 0;
    } else if (formData.taxMode === 'inclusive') {
      // Inclusive: grandTotal includes tax
      grandTotal = subtotal; // Current subtotal is actually the grand total
      subtotal = grandTotal / (1 + taxRate);
      taxAmount = grandTotal - subtotal;
    } else {
      // Exclusive: add tax to subtotal
      taxAmount = subtotal * taxRate;
      grandTotal = subtotal + taxAmount;
    }

    const quotationData = {
      customer_id: formData.customerId,
      date: formData.date,
      valid_until: formData.validUntil,
      notes: formData.notes,
      tax_type: formData.taxType,
      tax_mode: formData.taxMode,
      complimentary: formData.complimentary,
      items: processedItems,
      amount: grandTotal,
      subtotal: subtotal,
      tax_amount: taxAmount,
      status: formData.status
    };

    setLoading(true);
    try {
      await onSubmit(quotationData);
      onCancel();
    } catch (error) {
      console.error("Error creating quotation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill size when customer is selected
    if (field === "customerId") {
      const selectedCustomer = customers.find(c => c.id === value);
      if (selectedCustomer?.shirt_size && items.length > 0) {
        const newItems = [...items];
        newItems[0] = { ...newItems[0], shirt_size: selectedCustomer.shirt_size };
        setItems(newItems);
      }
    }
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newItems = [...items];
    
    // Stock check temporarily disabled - allow all items to be added
    
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", shirt_size: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Calculate totals for display
  const itemsTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const getTaxRate = (taxType: string) => {
    if (taxType.includes('18')) return 0.18;
    if (taxType.includes('12')) return 0.12;
    if (taxType.includes('5')) return 0.05;
    return 0.18;
  };
  const taxRate = getTaxRate(formData.taxType);
  
  let subtotal = itemsTotal;
  let taxAmount = 0;
  let grandTotal = 0;

  if (formData.complimentary) {
    // If complimentary, all amounts are zero
    subtotal = 0;
    taxAmount = 0;
    grandTotal = 0;
  } else if (formData.taxMode === 'inclusive') {
    // Inclusive: grandTotal includes tax
    grandTotal = itemsTotal;
    subtotal = grandTotal / (1 + taxRate);
    taxAmount = grandTotal - subtotal;
  } else {
    // Exclusive: add tax to subtotal
    taxAmount = subtotal * taxRate;
    grandTotal = subtotal + taxAmount;
  }

  return (
    <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex justify-center items-center">
          <CardTitle>
            {mode === 'edit' ? 'Edit Quotation' : 'Create New Quotation'}
          </CardTitle>
        </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer">Customer *</Label>
                <Select value={formData.customerId} onValueChange={(value) => handleChange("customerId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="validUntil">Valid Until *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => handleChange("validUntil", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="invoiced">Invoiced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label>Tax Mode</Label>
                <div className="mt-2 flex gap-4">
                  <Label className="flex items-center">
                    <input
                      type="radio"
                      name="taxMode"
                      value="inclusive"
                      checked={formData.taxMode === 'inclusive'}
                      onChange={(e) => handleChange('taxMode', e.target.value)}
                      className="mr-2"
                      disabled={formData.complimentary}
                    />
                    Inclusive Tax
                  </Label>
                  <Label className="flex items-center">
                    <input
                      type="radio"
                      name="taxMode"
                      value="exclusive"
                      checked={formData.taxMode === 'exclusive'}
                      onChange={(e) => handleChange('taxMode', e.target.value)}
                      className="mr-2"
                      disabled={formData.complimentary}
                    />
                    Exclusive Tax
                  </Label>
                </div>
              </div>

              <div>
                <Label>Tax Type</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <Label className="flex items-center">
                    <input
                      type="radio"
                      name="taxType"
                      value="IGST_18"
                      checked={formData.taxType === 'IGST_18'}
                      onChange={(e) => handleChange('taxType', e.target.value)}
                      className="mr-2"
                    />
                    IGST 18%
                  </Label>

                  <Label className="flex items-center">
                    <input
                      type="radio"
                      name="taxType"
                      value="CGST_SGST_18"
                      checked={formData.taxType === 'CGST_SGST_18'}
                      onChange={(e) => handleChange('taxType', e.target.value)}
                      className="mr-2"
                    />
                    CGST 9% & SGST 9%
                  </Label>

                  <Label className="flex items-center">
                    <input
                      type="radio"
                      name="taxType"
                      value="IGST_12"
                      checked={formData.taxType === 'IGST_12'}
                      onChange={(e) => handleChange('taxType', e.target.value)}
                      className="mr-2"
                    />
                    IGST 12%
                  </Label>

                  <Label className="flex items-center">
                    <input
                      type="radio"
                      name="taxType"
                      value="CGST_SGST_12"
                      checked={formData.taxType === 'CGST_SGST_12'}
                      onChange={(e) => handleChange('taxType', e.target.value)}
                      className="mr-2"
                    />
                    CGST 6% & SGST 6%
                  </Label>

                  <Label className="flex items-center">
                    <input
                      type="radio"
                      name="taxType"
                      value="IGST_5"
                      checked={formData.taxType === 'IGST_5'}
                      onChange={(e) => handleChange('taxType', e.target.value)}
                      className="mr-2"
                    />
                    IGST 5%
                  </Label>

                  <Label className="flex items-center">
                    <input
                      type="radio"
                      name="taxType"
                      value="CGST_SGST_5"
                      checked={formData.taxType === 'CGST_SGST_5'}
                      onChange={(e) => handleChange('taxType', e.target.value)}
                      className="mr-2"
                    />
                    CGST 2.5% & SGST 2.5%
                  </Label>
                </div>
              </div>

              <div className="pt-6">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.complimentary}
                    onChange={(e) => handleChange('complimentary', e.target.checked)}
                    className="h-4 w-4"
                  />
                  Complimentary
                </Label>
              </div>

            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-lg font-semibold">Items</Label>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  {index === 0 && (
                    <div className="col-span-5">
                      <Label htmlFor={`description-${index}`}>Description *</Label>
                      <Select 
                        value={item.description} 
                        onValueChange={(value) => handleItemChange(index, "description", value)}
                      >
                        <SelectTrigger id={`description-${index}`} className="bg-background">
                          <SelectValue placeholder="Select or type product" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="__custom__">Custom Description</SelectItem>
                          {products.map((product) => (
                            <SelectItem key={product} value={product}>
                              {product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {item.description === "__custom__" && (
                        <Input
                          className="mt-2"
                          value={item.customDescription || ""}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index] = { ...newItems[index], customDescription: e.target.value };
                            setItems(newItems);
                          }}
                          placeholder="Enter custom description"
                        />
                      )}
                    </div>
                  )}
                  {index > 0 && (
                    <div className="col-span-5">
                      <Select 
                        value={item.description} 
                        onValueChange={(value) => handleItemChange(index, "description", value)}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select or type product" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="__custom__">Custom Description</SelectItem>
                          {products.map((product) => (
                            <SelectItem key={product} value={product}>
                              {product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {item.description === "__custom__" && (
                        <Input
                          className="mt-2"
                          value={item.customDescription || ""}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index] = { ...newItems[index], customDescription: e.target.value };
                            setItems(newItems);
                          }}
                          placeholder="Enter custom description"
                        />
                      )}
                    </div>
                  )}
                  {index === 0 && (
                    <div className="col-span-1">
                      <Label htmlFor={`shirt_size-${index}`}>Size *</Label>
                      <Select 
                        value={item.shirt_size} 
                        onValueChange={(value) => handleItemChange(index, "shirt_size", value)}
                      >
                        <SelectTrigger id={`shirt_size-${index}`} className="bg-background">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="39">39</SelectItem>
                          <SelectItem value="40">40</SelectItem>
                          <SelectItem value="42">42</SelectItem>
                          <SelectItem value="44">44</SelectItem>
                          <SelectItem value="46">46</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {index > 0 && (
                    <div className="col-span-1">
                      <Select 
                        value={item.shirt_size} 
                        onValueChange={(value) => handleItemChange(index, "shirt_size", value)}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="39">39</SelectItem>
                          <SelectItem value="40">40</SelectItem>
                          <SelectItem value="42">42</SelectItem>
                          <SelectItem value="44">44</SelectItem>
                          <SelectItem value="46">46</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="col-span-1">
                    {index === 0 && <Label htmlFor={`quantity-${index}`}>Qty</Label>}
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label htmlFor={`rate-${index}`}>Rate</Label>}
                    <Input
                      id={`rate-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, "rate", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label>Amount</Label>}
                    <Input value={`₹${item.amount.toFixed(2)}`} disabled />
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-6">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {formData.taxType.startsWith('IGST') ? (
                  <div className="flex justify-between">
                    <span>IGST ({(taxRate * 100).toFixed(0)}%):</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>CGST ({(taxRate * 50).toFixed(1)}%):</span>
                      <span>₹{(taxAmount / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST ({(taxRate * 50).toFixed(1)}%):</span>
                      <span>₹{(taxAmount / 2).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (mode === 'edit' ? "Updating..." : "Creating...") : (mode === 'edit' ? "Update Quotation" : "Create Quotation")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuotationForm;