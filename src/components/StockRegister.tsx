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

const SIZES = ["39", "40", "42", "44", "46"];
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

const StockRegister = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [stockEntries, setStockEntries] = useState([]);
  const [editFormData, setEditFormData] = useState({});

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

    const productData = PRODUCTS.map((productName) => {
      const sizes = {};
      SIZES.forEach((size) => {
        const entry = entries.find(
          (e) => e.product_name === productName && e.size === size
        );
        const prev = prevEntries.find(
          (e) => e.product_name === productName && e.size === size
        );

        sizes[size] = {
          openingStock: entry?.opening_stock ?? prev?.closing_stock ?? 0,
          production: entry?.production ?? 0,
          sales: entry?.sales ?? 0,
          closingStock: entry?.closing_stock ?? prev?.closing_stock ?? 0,
        };
      });

      return { product: productName, sizes };
    });

    setProducts(productData);
  };

  const calculateClosingStock = (os, p, s) => os + p - s;

  const handlePrint = () => window.print();

  const handleView = (product) => {
    setViewingProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    const formData = {};
    SIZES.forEach((size) => {
      formData[size] = product.sizes[size];
    });
    setEditFormData(formData);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (productName) => {
    if (!confirm(`Are you sure you want to delete all stock entries for ${productName}?`)) {
      return;
    }

    const entriesToDelete = stockEntries.filter(
      (e) => e.product_name === productName
    );

    for (const entry of entriesToDelete) {
      await deleteStockEntry(entry.id);
    }

    toast({
      title: "Success",
      description: `Deleted all stock entries for ${productName}`,
    });

    loadStockData();
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    for (const size of SIZES) {
      const data = editFormData[size];
      const entry = stockEntries.find(
        (e) =>
          e.product_name === editingProduct.product && e.size === size
      );

      const closingStock = calculateClosingStock(
        data.openingStock,
        data.production,
        data.sales
      );

      if (entry) {
        await updateStockEntry(entry.id, {
          opening_stock: data.openingStock,
          production: data.production,
          sales: data.sales,
          closing_stock: closingStock,
        });
      } else {
        await addStockEntry({
          product_name: editingProduct.product,
          size: size,
          month: selectedMonth,
          year: selectedYear,
          opening_stock: data.openingStock,
          production: data.production,
          sales: data.sales,
          closing_stock: closingStock,
        });
      }
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

          /* First hide everything, then show just the print wrapper */
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

          /* Ensure header controls (selectors, print button, large header) are hidden in print */
          /* target elements with these helper classes: no-print and screen-only */
          #stock-register-print .no-print,
          #stock-register-print .screen-only {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide the actions column in print */
          th.no-print,
          td.no-print {
            display: none !important;
          }

          /* Print-only centered title (we show it only once on page 1) */
          .print-title {
            display: block !important;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          /* Page break before Jacuard Black */
          .print-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }

          /* Table print styling */
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

        /* Hide the print-title on screen; visible only in print */
        .print-title { display: none; }
      `}</style>

      {/* WRAPPER */}
      <Card className="w-full" id="stock-register-print">
        <CardHeader className="p-0">
          {/* on-screen controls — we mark them with no-print + screen-only so CSS hides them while printing */}
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

            {/* center header visible on screen; hidden in print due to .screen-only wrapper above */}
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
          {/* PRINT TITLE (print-only, appears centered at top of printed page 1) */}
          <div className="print-title">
            Stock Register -{" "}
            {MONTHS.find((m) => m.value === selectedMonth)?.label}{" "}
            {selectedYear}
          </div>

          {/* SINGLE TABLE (screen + print). Print rules will hide actions and break at Jacuard Black */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 font-semibold text-lg min-w-[120px]">
                    Product
                  </th>
                  {SIZES.map((size) => (
                    <th
                      key={size}
                      className="text-center p-4 font-semibold text-lg min-w-[140px]"
                    >
                      Size {size}
                    </th>
                  ))}
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

                      {SIZES.map((size) => {
                        const d = product.sizes[size];
                        return (
                          <td key={size} className="p-4 text-center">
                            <div className="text-sm space-y-1">
                              <div className="font-medium">
                                OS: {d.openingStock}
                              </div>
                              <div className="font-medium">P: {d.production}</div>
                              <div className="font-medium">S: {d.sales}</div>
                              <div className="font-bold text-primary text-base">
                                CS:{" "}
                                {calculateClosingStock(
                                  d.openingStock,
                                  d.production,
                                  d.sales
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}

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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              View Stock - {viewingProduct?.product}
            </DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Size</th>
                    <th className="text-center p-3">Opening Stock</th>
                    <th className="text-center p-3">Production</th>
                    <th className="text-center p-3">Sales</th>
                    <th className="text-center p-3">Closing Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZES.map((size) => {
                    const d = viewingProduct.sizes[size];
                    return (
                      <tr key={size} className="border-b">
                        <td className="p-3 font-medium">{size}</td>
                        <td className="text-center p-3">{d.openingStock}</td>
                        <td className="text-center p-3">{d.production}</td>
                        <td className="text-center p-3">{d.sales}</td>
                        <td className="text-center p-3 font-bold text-primary">
                          {calculateClosingStock(
                            d.openingStock,
                            d.production,
                            d.sales
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Stock - {editingProduct?.product}
            </DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Size</th>
                    <th className="text-center p-3">Opening Stock</th>
                    <th className="text-center p-3">Production</th>
                    <th className="text-center p-3">Sales</th>
                    <th className="text-center p-3">Closing Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZES.map((size) => {
                    const d = editFormData[size] || {};
                    return (
                      <tr key={size} className="border-b">
                        <td className="p-3 font-medium">{size}</td>
                        <td className="text-center p-3">
                          <Input
                            type="number"
                            value={d.openingStock || 0}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                [size]: {
                                  ...d,
                                  openingStock: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-20 text-center"
                          />
                        </td>
                        <td className="text-center p-3">
                          <Input
                            type="number"
                            value={d.production || 0}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                [size]: {
                                  ...d,
                                  production: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-20 text-center"
                          />
                        </td>
                        <td className="text-center p-3">
                          <Input
                            type="number"
                            value={d.sales || 0}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                [size]: {
                                  ...d,
                                  sales: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-20 text-center"
                          />
                        </td>
                        <td className="text-center p-3 font-bold text-primary">
                          {calculateClosingStock(
                            d.openingStock || 0,
                            d.production || 0,
                            d.sales || 0
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
