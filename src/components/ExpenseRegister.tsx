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

interface ExpenseEntry {
  id: string;
  month: number;
  year: number;
  category: string;
  description: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
  user_id: string | null;
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

const EXPENSE_CATEGORIES = [
  "Raw Materials",
  "Labor",
  "Utilities",
  "Rent",
  "Transportation",
  "Maintenance",
  "Office Supplies",
  "Marketing",
  "Other"
];

const ExpenseRegister = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadExpenses();
  }, [selectedMonth, selectedYear]);

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_register')
        .select('*')
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses.",
        variant: "destructive",
      });
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setCategory("");
    setDescription("");
    setAmount("");
    setIsDialogOpen(true);
  };

  const handleEditExpense = (expense: ExpenseEntry) => {
    setEditingExpense(expense);
    setCategory(expense.category);
    setDescription(expense.description || "");
    setAmount(expense.amount.toString());
    setIsDialogOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!category || !amount) {
      toast({
        title: "Validation Error",
        description: "Category and amount are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const expenseData = {
        month: selectedMonth,
        year: selectedYear,
        category,
        description: description || null,
        amount: parseFloat(amount),
        user_id: user?.id
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('expense_register')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        toast({
          title: "Expense updated",
          description: "Expense has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('expense_register')
          .insert([expenseData]);

        if (error) throw error;
        toast({
          title: "Expense added",
          description: "Expense has been added successfully.",
        });
      }

      setIsDialogOpen(false);
      loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "Error",
        description: "Failed to save expense.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expense_register')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Expense deleted",
        description: "Expense has been removed.",
      });
      
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense.",
        variant: "destructive",
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 0.5cm;
          }
          body * {
            visibility: hidden;
          }
          #expense-register-print, #expense-register-print * {
            visibility: visible;
          }
          #expense-register-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-title {
            display: block !important;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 16px;
          }
        }
        .print-title {
          display: none;
        }
      `}</style>
      
      <Card className="w-full" id="expense-register-print">
        <CardHeader>
          <div className="print-title">
            Expense Register - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
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
              Expense Register - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddExpense} variant="default" size="sm" className="no-print">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
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
                  <th className="text-left p-4 font-semibold">Category</th>
                  <th className="text-left p-4 font-semibold">Description</th>
                  <th className="text-right p-4 font-semibold">Amount (₹)</th>
                  <th className="text-center p-4 font-semibold no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 font-medium">{expense.category}</td>
                    <td className="p-4">{expense.description || "-"}</td>
                    <td className="p-4 text-right">₹{expense.amount.toLocaleString()}</td>
                    <td className="p-4 no-print">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditExpense(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No expenses recorded for this month
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-bold">
                  <td colSpan={2} className="p-4 text-right">Total Expenses:</td>
                  <td className="p-4 text-right text-lg">₹{totalExpenses.toLocaleString()}</td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description (optional)"
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveExpense}>
                {editingExpense ? "Update" : "Add"} Expense
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseRegister;
