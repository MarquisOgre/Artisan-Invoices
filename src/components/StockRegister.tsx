import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Edit, Eye, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useUserRole } from "@/hooks/useUserRole";

const PRODUCTS = [
  "Dark Blue",
  "Ratan Blue",
  "White",
  "Black Plain",
  "Brown",
  "Jacuard White",
  "Jacuard Black",
  "White Dotted",
  "Blue Dotted",
];

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
  { value: 12, label: "December" },
];

interface ProductData {
  product: string;
  openingStock: number;
  purchases: number;
  sales: number;
  closingStock: number;
  id?: string;
}

interface EditFormData {
  openingStock: number;
  purchases: number;
  sales: number;
}

const StockRegister = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [products, setProducts] = useState<ProductData[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [stockEntries, setStockEntries] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    openingStock: 0,
    purchases: 0,
    sales: 0
  });

  const { toast } = useToast();
  const {
    fetchStockRegister,
    addStockEntry,
    updateStockEntry,
    deleteStockEntry,
  } = useSupabaseData();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    loadStockData();
  }, [selectedMonth, selectedYear]);

  const loadStockData = async () => {
    const entries = await fetchStockRegister(selectedMonth, selectedYear);
    setStockEntries(entries);

    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }
    const prevEntries = await fetchStockRegister(prevMonth, prevYear);

    const productData: ProductData[] = PRODUCTS.map((productName) => {
      const entry = entries.find(
        (e: any) => e.product_name === productName
      );
      const prev = prevEntries.find(
        (e: any) => e.product_name === productName
      );

      return {
        product: productName,
        openingStock: entry?.opening_stock ?? prev?.closing_stock ?? 0,
        purchases: entry?.purchases ?? 0,
        sales: entry?.sales ?? 0,
        closingStock: entry?.closing_stock ?? prev?.closing_stock ?? 0,
        id: entry?.id
      };
    });

    setProducts(productData);
  };

  const calculateClosingStock = (os: number, p: number, s: number) => os + p - s;

  const handlePrint = () => window.print();

  const handleView = (product: ProductData) => {
    setViewingProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (product: ProductData) => {
    setEditingProduct(product);
    setEditFormData({
      openingStock: product.openingStock,
      purchases: product.purchases,
      sales: product.sales
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (productName: string) => {
    if (!confirm(`Are you sure you want to delete stock entry for ${productName}?`)) {
      return;
    }

    const entry = stockEntries.find(
      (e: any) => e.product_name === productName
    );

    if (entry) {
      await deleteStockEntry(entry.id);
      toast({
        title: "Success",
        description: `Deleted stock entry for ${productName}`,
      });
      loadStockData();
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    const entry = stockEntries.find(
      (e: any) => e.product_name === editingProduct.product
    );

    const closingStock = calculateClosingStock(
      editFormData.openingStock || 0,
      editFormData.purchases || 0,
      editFormData.sales || 0
    );

    if (entry) {
      await updateStockEntry(entry.id, {
        opening_stock: editFormData.openingStock || 0,
        purchases: editFormData.purchases || 0,
        sales: editFormData.sales || 0,
        closing_stock: closingStock,
      });
    } else {
      await addStockEntry({
        product_name: editingProduct.product,
        month: selectedMonth,
        year: selectedYear,
        opening_stock: editFormData.openingStock || 0,
        purchases: editFormData.purchases || 0,
        sales: editFormData.sales || 0,
        closing_stock: closingStock,
      });
    }

    toast({
      title: "Success",
      description: `Updated stock for ${editingProduct.product}`,
    });

    setIsEditDialogOpen(false);
    loadStockData();
  };

  return (
    <div className="space-y-6">
      {/* PRINT CSS FIXES */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }

          body * {
            visibility: hidden;
          }
          #stock-register-print, #stock-register-print * {
            visibility: visible;
          }
          #stock-register-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          #stock-register-print .no-print,
          #stock-register-print .screen-only {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          th.no-print,
          td.no-print {
            display: none !important;
          }

          .print-title {
            display: block !important;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .print-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }

          #stock-register-print table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }

          #stock-register-print th,
          #stock-register-print td {
            border: 2px solid #000;
            padding: 4px;
          }
        }

        .print-title { display: none; }
      `}</style>

      {/* WRAPPER */}
      <Card className="w-full" id="stock-register-print">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between gap-4 no-print screen-only p-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Label>Month:</Label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem
                        key={month.value}
                        value={month.value.toString()}
                      >
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label>Year:</Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
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
              Stock Register -{" "}
              {MONTHS.find((m) => m.value === selectedMonth)?.label}{" "}
              {selectedYear}
            </CardTitle>

            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="print-title">
            Stock Register -{" "}
            {MONTHS.find((m) => m.value === selectedMonth)?.label}{" "}
            {selectedYear}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 font-semibold text-lg min-w-[150px]">
                    Product
                  </th>
                  <th className="text-center p-4 font-semibold text-lg min-w-[100px]">
                    Opening Stock
                  </th>
                  <th className="text-center p-4 font-semibold text-lg min-w-[100px]">
                    Purchases
                  </th>
                  <th className="text-center p-4 font-semibold text-lg min-w-[100px]">
                    Sales
                  </th>
                  <th className="text-center p-4 font-semibold text-lg min-w-[100px]">
                    Closing Stock
                  </th>
                  <th className="no-print text-center p-4 font-semibold min-w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const pageBreakClass =
                    product.product === "Jacuard Black" ? "print-page-break" : "";

                  return (
                    <tr
                      key={product.product}
                      className={`border-b ${pageBreakClass}`}
                    >
                      <td className="p-4 font-medium">{product.product}</td>
                      <td className="p-4 text-center">{product.openingStock}</td>
                      <td className="p-4 text-center">{product.purchases}</td>
                      <td className="p-4 text-center">{product.sales}</td>
                      <td className="p-4 text-center font-bold text-primary">
                        {calculateClosingStock(
                          product.openingStock,
                          product.purchases,
                          product.sales
                        )}
                      </td>
                      <td className="p-4 no-print">
                        <div className="flex justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(product.product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              View Stock - {viewingProduct?.product}
            </DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Opening Stock</Label>
                  <p className="text-lg font-semibold">{viewingProduct.openingStock}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Purchases</Label>
                  <p className="text-lg font-semibold">{viewingProduct.purchases}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sales</Label>
                  <p className="text-lg font-semibold">{viewingProduct.sales}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Closing Stock</Label>
                  <p className="text-lg font-bold text-primary">
                    {calculateClosingStock(
                      viewingProduct.openingStock,
                      viewingProduct.purchases,
                      viewingProduct.sales
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Stock - {editingProduct?.product}
            </DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openingStock">Opening Stock</Label>
                <Input
                  id="openingStock"
                  type="number"
                  value={editFormData.openingStock}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      openingStock: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchases">Purchases</Label>
                <Input
                  id="purchases"
                  type="number"
                  value={editFormData.purchases}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      purchases: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales">Sales</Label>
                <Input
                  id="sales"
                  type="number"
                  value={editFormData.sales}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      sales: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="pt-2">
                <Label className="text-muted-foreground">Calculated Closing Stock</Label>
                <p className="text-xl font-bold text-primary">
                  {calculateClosingStock(
                    editFormData.openingStock,
                    editFormData.purchases,
                    editFormData.sales
                  )}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockRegister;