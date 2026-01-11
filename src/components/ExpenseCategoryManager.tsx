import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Folder, 
  ShoppingCart, 
  Truck, 
  Wrench, 
  Lightbulb, 
  Home, 
  Users, 
  Megaphone,
  Package,
  CreditCard,
  Wallet,
  Building,
  FileText,
  Phone,
  Globe,
  Coffee,
  Utensils
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const AVAILABLE_ICONS = [
  { name: "Folder", component: Folder },
  { name: "ShoppingCart", component: ShoppingCart },
  { name: "Truck", component: Truck },
  { name: "Wrench", component: Wrench },
  { name: "Lightbulb", component: Lightbulb },
  { name: "Home", component: Home },
  { name: "Users", component: Users },
  { name: "Megaphone", component: Megaphone },
  { name: "Package", component: Package },
  { name: "CreditCard", component: CreditCard },
  { name: "Wallet", component: Wallet },
  { name: "Building", component: Building },
  { name: "FileText", component: FileText },
  { name: "Phone", component: Phone },
  { name: "Globe", component: Globe },
  { name: "Coffee", component: Coffee },
  { name: "Utensils", component: Utensils },
];

export const getIconComponent = (iconName: string) => {
  const found = AVAILABLE_ICONS.find(i => i.name === iconName);
  return found ? found.component : Folder;
};

export const ExpenseCategoryManager = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Folder");
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setName("");
    setIcon("Folder");
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon);
    setIsDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const categoryData = {
        name: name.trim(),
        icon,
        user_id: user?.id
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('expense_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast({
          title: "Category updated",
          description: "Category has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('expense_categories')
          .insert([categoryData]);

        if (error) throw error;
        toast({
          title: "Category added",
          description: "Category has been added successfully.",
        });
      }

      setIsDialogOpen(false);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save category.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Category deleted",
        description: "Category has been removed.",
      });
      
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Folder className="mr-2 h-5 w-5" />
            Expense Categories
          </CardTitle>
          <Button onClick={handleAddCategory} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No categories yet. Add your first category to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>

            <div>
              <Label htmlFor="categoryIcon">Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger id="categoryIcon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((iconOption) => {
                    const IconComp = iconOption.component;
                    return (
                      <SelectItem key={iconOption.name} value={iconOption.name}>
                        <div className="flex items-center gap-2">
                          <IconComp className="h-4 w-4" />
                          <span>{iconOption.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory}>
                {editingCategory ? "Update" : "Add"} Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ExpenseCategoryManager;
