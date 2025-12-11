import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, Printer, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface InwardItem {
  product_name: string;
  size: string;
  quantity: number;
}

interface InwardEntry {
  id: string;
  inward_number: string;
  entry_date: string;
  from_party: string | null;
  items: InwardItem[];
  total_quantity: number;
  month: number;
  year: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

const PRODUCTS = [
  "Dark Blue", "Light Blue", "Black", "White", "Navy Blue",
  "Grey", "Maroon", "Green", "Red", "Yellow"
];

const SIZES = ["39", "40", "42", "44", "46"];

const InwardRegister = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [entries, setEntries] = useState<InwardEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<InwardEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<InwardEntry | null>(null);
  
  // Form state
  const [fromParty, setFromParty] = useState("");
  const [entryDate, setEntryDate] = useState(currentDate.toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InwardItem[]>([{ product_name: "", size: "", quantity: 0 }]);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadEntries();
  }, [selectedMonth, selectedYear]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('inward_register')
        .select('*')
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      const typedData = (data || []).map(entry => ({
        ...entry,
        items: (entry.items as unknown as InwardItem[]) || []
      }));
      setEntries(typedData);
    } catch (error) {
      console.error('Error loading inward entries:', error);
      toast({
        title: "Error",
        description: "Failed to load inward entries.",
        variant: "destructive",
      });
    }
  };

  const generateInwardNumber = async () => {
    const { data } = await supabase
      .from('inward_register')
      .select('inward_number')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].inward_number.replace('IN-', '')) || 0;
      return `IN-${String(lastNumber + 1).padStart(4, '0')}`;
    }
    return 'IN-0001';
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setFromParty("");
    setEntryDate(currentDate.toISOString().split('T')[0]);
    setNotes("");
    setItems([{ product_name: "", size: "", quantity: 0 }]);
    setIsDialogOpen(true);
  };

  const handleEditEntry = (entry: InwardEntry) => {
    setEditingEntry(entry);
    setFromParty(entry.from_party || "");
    setEntryDate(entry.entry_date);
    setNotes(entry.notes || "");
    setItems(entry.items.length > 0 ? entry.items : [{ product_name: "", size: "", quantity: 0 }]);
    setIsDialogOpen(true);
  };

  const handleViewEntry = (entry: InwardEntry) => {
    setViewingEntry(entry);
    setIsViewDialogOpen(true);
  };

  const handleAddItem = () => {
    setItems([...items, { product_name: "", size: "", quantity: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof InwardItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSaveEntry = async () => {
    const validItems = items.filter(item => item.product_name && item.quantity > 0);
    
    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Add at least one item with product and quantity.",
        variant: "destructive",
      });
      return;
    }

    try {
      const totalQuantity = validItems.reduce((sum, item) => sum + item.quantity, 0);
      const entryMonth = new Date(entryDate).getMonth() + 1;
      const entryYear = new Date(entryDate).getFullYear();

      if (editingEntry) {
        const { error } = await supabase
          .from('inward_register')
          .update({
            from_party: fromParty || null,
            entry_date: entryDate,
            items: validItems as unknown as any,
            total_quantity: totalQuantity,
            month: entryMonth,
            year: entryYear,
            notes: notes || null,
          })
          .eq('id', editingEntry.id);

        if (error) throw error;
        toast({ title: "Entry updated", description: "Inward entry has been updated successfully." });
      } else {
        const inwardNumber = await generateInwardNumber();
        const { error } = await supabase
          .from('inward_register')
          .insert([{
            inward_number: inwardNumber,
            from_party: fromParty || null,
            entry_date: entryDate,
            items: validItems as unknown as any,
            total_quantity: totalQuantity,
            month: entryMonth,
            year: entryYear,
            notes: notes || null,
            user_id: user?.id
          }]);

        if (error) throw error;
        toast({ title: "Entry added", description: `Inward ${inwardNumber} has been created.` });
      }

      setIsDialogOpen(false);
      loadEntries();
    } catch (error) {
      console.error('Error saving inward entry:', error);
      toast({ title: "Error", description: "Failed to save inward entry.", variant: "destructive" });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('inward_register').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Entry deleted", description: "Inward entry has been removed." });
      loadEntries();
    } catch (error) {
      console.error('Error deleting inward entry:', error);
      toast({ title: "Error", description: "Failed to delete inward entry.", variant: "destructive" });
    }
  };

  const totalQuantity = entries.reduce((sum, entry) => sum + entry.total_quantity, 0);

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: portrait; margin: 0.5cm; }
          body * { visibility: hidden; }
          #inward-register-print, #inward-register-print * { visibility: visible; }
          #inward-register-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-title { display: block !important; text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 16px; }
        }
        .print-title { display: none; }
      `}</style>
      
      <Card className="w-full" id="inward-register-print">
        <CardHeader>
          <div className="print-title">Inward Register - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</div>
          <div className="flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Label>Month:</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label>Year:</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026, 2027].map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-center flex-1">Inward Register</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddEntry} size="sm"><Plus className="h-4 w-4 mr-2" />New Inward</Button>
              <Button onClick={() => window.print()} variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Print</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-3 font-semibold">Inward No.</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">From Party</th>
                  <th className="text-center p-3 font-semibold">Items</th>
                  <th className="text-right p-3 font-semibold">Total Qty</th>
                  <th className="text-center p-3 font-semibold no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">{entry.inward_number}</td>
                    <td className="p-3">{new Date(entry.entry_date).toLocaleDateString()}</td>
                    <td className="p-3">{entry.from_party || "-"}</td>
                    <td className="p-3 text-center">{entry.items.length}</td>
                    <td className="p-3 text-right">{entry.total_quantity}</td>
                    <td className="p-3 no-print">
                      <div className="flex justify-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewEntry(entry)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditEntry(entry)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteEntry(entry.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No inward entries for this month</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-bold">
                  <td colSpan={4} className="p-3 text-right">Total:</td>
                  <td className="p-3 text-right text-lg">{totalQuantity}</td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntry ? `Edit ${editingEntry.inward_number}` : "New Inward Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
              </div>
              <div>
                <Label>From Party</Label>
                <Input value={fromParty} onChange={(e) => setFromParty(e.target.value)} placeholder="Enter party name" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-lg font-semibold">Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
              </div>
              <div className="space-y-2 border rounded-lg p-4">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-3">Size</div>
                  <div className="col-span-3">Quantity</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Select value={item.product_name} onValueChange={(v) => handleItemChange(index, 'product_name', v)}>
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>{PRODUCTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Select value={item.size} onValueChange={(v) => handleItemChange(index, 'size', v)}>
                        <SelectTrigger><SelectValue placeholder="Size" /></SelectTrigger>
                        <SelectContent>{SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input type="number" value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} placeholder="Qty" min="1" />
                    </div>
                    <div className="col-span-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(index)} disabled={items.length === 1}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEntry}>{editingEntry ? "Update" : "Save"} Entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingEntry?.inward_number} Details</DialogTitle>
          </DialogHeader>
          {viewingEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Date:</span> {new Date(viewingEntry.entry_date).toLocaleDateString()}</div>
                <div><span className="text-muted-foreground">From Party:</span> {viewingEntry.from_party || "-"}</div>
              </div>
              <div>
                <Label className="font-semibold">Items</Label>
                <table className="w-full mt-2 border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Size</th>
                      <th className="text-right p-2">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingEntry.items.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{item.product_name}</td>
                        <td className="p-2">{item.size || "-"}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan={2} className="p-2 text-right">Total:</td>
                      <td className="p-2 text-right">{viewingEntry.total_quantity}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {viewingEntry.notes && <div><span className="text-muted-foreground">Notes:</span> {viewingEntry.notes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InwardRegister;
