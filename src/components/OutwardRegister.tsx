import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OutwardEntry {
  id: string;
  product_name: string;
  size: string | null;
  quantity: number;
  to_party: string | null;
  entry_date: string;
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

const OutwardRegister = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [entries, setEntries] = useState<OutwardEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OutwardEntry | null>(null);
  const [productName, setProductName] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("");
  const [toParty, setToParty] = useState("");
  const [entryDate, setEntryDate] = useState(currentDate.toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadEntries();
  }, [selectedMonth, selectedYear]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('outward_register')
        .select('*')
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading outward entries:', error);
      toast({
        title: "Error",
        description: "Failed to load outward entries.",
        variant: "destructive",
      });
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setProductName("");
    setSize("");
    setQuantity("");
    setToParty("");
    setEntryDate(currentDate.toISOString().split('T')[0]);
    setNotes("");
    setIsDialogOpen(true);
  };

  const handleEditEntry = (entry: OutwardEntry) => {
    setEditingEntry(entry);
    setProductName(entry.product_name);
    setSize(entry.size || "");
    setQuantity(entry.quantity.toString());
    setToParty(entry.to_party || "");
    setEntryDate(entry.entry_date);
    setNotes(entry.notes || "");
    setIsDialogOpen(true);
  };

  const handleSaveEntry = async () => {
    if (!productName || !quantity) {
      toast({
        title: "Validation Error",
        description: "Product name and quantity are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const entryData = {
        product_name: productName,
        size: size || null,
        quantity: parseInt(quantity),
        to_party: toParty || null,
        entry_date: entryDate,
        month: selectedMonth,
        year: selectedYear,
        notes: notes || null,
        user_id: user?.id
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('outward_register')
          .update(entryData)
          .eq('id', editingEntry.id);

        if (error) throw error;
        toast({
          title: "Entry updated",
          description: "Outward entry has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('outward_register')
          .insert([entryData]);

        if (error) throw error;
        toast({
          title: "Entry added",
          description: "Outward entry has been added successfully.",
        });
      }

      setIsDialogOpen(false);
      loadEntries();
    } catch (error) {
      console.error('Error saving outward entry:', error);
      toast({
        title: "Error",
        description: "Failed to save outward entry.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('outward_register')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Entry deleted",
        description: "Outward entry has been removed.",
      });
      
      loadEntries();
    } catch (error) {
      console.error('Error deleting outward entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete outward entry.",
        variant: "destructive",
      });
    }
  };

  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: portrait; margin: 0.5cm; }
          body * { visibility: hidden; }
          #outward-register-print, #outward-register-print * { visibility: visible; }
          #outward-register-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-title { display: block !important; text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 16px; }
        }
        .print-title { display: none; }
      `}</style>
      
      <Card className="w-full" id="outward-register-print">
        <CardHeader>
          <div className="print-title">
            Outward Register - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </div>
          <div className="flex items-center justify-between gap-4 no-print">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="month-select">Month:</Label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="year-select">Year:</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026, 2027].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center flex-1">
              Outward Register - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddEntry} variant="default" size="sm" className="no-print">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Product</th>
                  <th className="text-left p-4 font-semibold">Size</th>
                  <th className="text-right p-4 font-semibold">Quantity</th>
                  <th className="text-left p-4 font-semibold">To Party</th>
                  <th className="text-left p-4 font-semibold">Notes</th>
                  <th className="text-center p-4 font-semibold no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-4">{new Date(entry.entry_date).toLocaleDateString()}</td>
                    <td className="p-4 font-medium">{entry.product_name}</td>
                    <td className="p-4">{entry.size || "-"}</td>
                    <td className="p-4 text-right">{entry.quantity}</td>
                    <td className="p-4">{entry.to_party || "-"}</td>
                    <td className="p-4">{entry.notes || "-"}</td>
                    <td className="p-4 no-print">
                      <div className="flex justify-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditEntry(entry)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No outward entries recorded for this month
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-bold">
                  <td colSpan={3} className="p-4 text-right">Total Quantity:</td>
                  <td className="p-4 text-right text-lg">{totalQuantity}</td>
                  <td colSpan={3} className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Entry" : "Add Outward Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="entry-date">Date *</Label>
              <Input
                id="entry-date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="product">Product *</Label>
              <Select value={productName} onValueChange={setProductName}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((product) => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="size">Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="to-party">To Party</Label>
              <Input
                id="to-party"
                value={toParty}
                onChange={(e) => setToParty(e.target.value)}
                placeholder="Enter party name"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEntry}>
                {editingEntry ? "Update" : "Add"} Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OutwardRegister;
