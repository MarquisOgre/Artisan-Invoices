import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/useSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  FileText, 
  Trash2,
  Send,
  Printer
} from "lucide-react";

interface QuotationListProps {
  quotations: any[];
  onCreateNew: () => void;
  onViewQuotation: (id: string) => void;
  onEditQuotation: (quotation: any) => void;
  onQuotationToInvoice: (quotationId: string) => void;
  onUpdateStatus: (quotationId: string, status: string) => void;
  onDelete: (quotationId: string) => void;
  onSendToCustomer?: (id: string) => void;
}

const MONTHS = [
  { value: 0, label: "All Months" },
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

const QuotationList = ({ 
  quotations, 
  onCreateNew, 
  onViewQuotation, 
  onEditQuotation,
  onQuotationToInvoice, 
  onUpdateStatus, 
  onDelete,
  onSendToCustomer
}: QuotationListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const { companySettings, invoiceSettings } = useSettings();

  const displayQuotations = quotations.map(q => {
    const shirtSizes = (q.items || [])
      .map((item: any) => item.shirt_size)
      .filter((size: string) => size)
      .join(', ');
    
    return {
      id: q.id,
      quotationNumber: q.quotation_number,
      customer: q.customer?.name || q.customer_name || 'Unknown Customer',
      amount: q.total_amount || 0,
      status: q.status,
      date: q.quotation_date,
      validUntil: q.valid_until,
      shirtSizes: shirtSizes || '-',
      fullQuotation: q
    };
  });

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'sent';
    const variants: Record<string, any> = {
      sent: { variant: "outline", label: "Sent" },
      accepted: { variant: "default", label: "Accepted", className: "bg-success text-success-foreground" },
      rejected: { variant: "destructive", label: "Rejected" },
      expired: { variant: "secondary", label: "Expired", className: "bg-muted text-muted-foreground" },
      invoiced: { variant: "default", label: "Invoiced", className: "bg-primary text-primary-foreground" }
    };
    
    const config = variants[statusLower] || variants.sent;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredQuotations = displayQuotations.filter(quotation => {
    const matchesSearch = quotation.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedMonth === 0) return matchesSearch;
    
    const qDate = new Date(quotation.date);
    return matchesSearch && 
      qDate.getMonth() + 1 === selectedMonth && 
      qDate.getFullYear() === selectedYear;
  });

  return (
    <div className="space-y-6">
      {/* Header with Search and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label>Month:</Label>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-36">
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
            <Label>Year:</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-28">
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
        <Button onClick={onCreateNew}>
          <FileText className="mr-2 h-4 w-4" />
          New Quotation
        </Button>
      </div>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full min-w-0 rounded-md border overflow-x-auto overscroll-x-contain">
            <Table className="min-w-[860px] whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => (
                  <TableRow key={quotation.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{quotation.quotationNumber}</TableCell>
                    <TableCell>{quotation.customer}</TableCell>
                    <TableCell>{quotation.shirtSizes}</TableCell>
                    <TableCell>₹{quotation.amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                    <TableCell>{quotation.date}</TableCell>
                    <TableCell>{quotation.validUntil}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onViewQuotation(quotation.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditQuotation(quotation.fullQuotation)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            const { generateQuotationPrintHTML } = await import('@/utils/printTemplate');
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              const quotationHtml = generateQuotationPrintHTML(quotation.fullQuotation, companySettings, invoiceSettings.termsAndConditions);
                              printWindow.document.write(quotationHtml);
                              printWindow.document.close();

                              // Wait for the logo and other images before opening print preview.
                              const images = Array.from(printWindow.document.images);
                              await Promise.all(images.map((img) => new Promise<void>((resolve) => {
                                let settled = false;
                                const finish = () => {
                                  if (settled) return;
                                  settled = true;
                                  window.clearTimeout(timeout);
                                  img.removeEventListener("load", finish);
                                  img.removeEventListener("error", finish);
                                  resolve();
                                };
                                const timeout = window.setTimeout(finish, 5000);
                                img.addEventListener("load", finish, { once: true });
                                img.addEventListener("error", finish, { once: true });
                                if (img.complete) finish();
                              })));
                              await Promise.all(images.map((img) =>
                                img.complete && img.naturalWidth > 0 && typeof img.decode === "function"
                                  ? img.decode().catch(() => undefined)
                                  : Promise.resolve()
                              ));

                              printWindow.focus();
                              printWindow.print();
                            }
                          }}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </DropdownMenuItem>
                          {quotation.status !== "invoiced" && (
                            <DropdownMenuItem onClick={() => onQuotationToInvoice(quotation.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Quotation to Invoice
                            </DropdownMenuItem>
                          )}
                          {quotation.status === "sent" && (
                            <DropdownMenuItem onClick={() => onSendToCustomer?.(quotation.id)}>
                              <Send className="mr-2 h-4 w-4" />
                              Send to Customer
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => {
                              console.log("Delete quotation:", quotation.id);
                              onDelete(quotation.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-3 sm:hidden">
            {filteredQuotations.length === 0 ? (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No quotations found.</div>
            ) : filteredQuotations.map((quotation) => (
              <article key={quotation.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold">{quotation.quotationNumber || "Quotation"}</p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">{quotation.customer}</p>
                  </div>
                  {getStatusBadge(quotation.status)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Amount</p><p className="mt-1 font-semibold">₹{quotation.amount.toLocaleString("en-IN")}</p></div>
                  <div><p className="text-xs text-muted-foreground">Size</p><p className="mt-1 break-words">{quotation.shirtSizes}</p></div>
                  <div><p className="text-xs text-muted-foreground">Quotation Date</p><p className="mt-1">{quotation.date || "-"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Valid Until</p><p className="mt-1">{quotation.validUntil || "-"}</p></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => onViewQuotation(quotation.id)}><Eye className="mr-1 h-4 w-4" />View</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => onEditQuotation(quotation.fullQuotation)}><Edit className="mr-1 h-4 w-4" />Edit</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="sm" variant="secondary" aria-label={`More actions for ${quotation.quotationNumber}`}><MoreHorizontal className="h-4 w-4" />More</Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={async () => {
                        const { generateQuotationPrintHTML } = await import('@/utils/printTemplate');
                        const printWindow = window.open('', '_blank');
                        if (!printWindow) return;
                        printWindow.document.write(generateQuotationPrintHTML(quotation.fullQuotation, companySettings, invoiceSettings.termsAndConditions));
                        printWindow.document.close();
                        const images = Array.from(printWindow.document.images);
                        await Promise.all(images.map(img => new Promise<void>(resolve => {
                          if (img.complete) { resolve(); return; }
                          const finish = () => { img.removeEventListener("load", finish); img.removeEventListener("error", finish); resolve(); };
                          img.addEventListener("load", finish, { once: true }); img.addEventListener("error", finish, { once: true });
                          window.setTimeout(finish, 5000);
                        })));
                        printWindow.focus(); printWindow.print();
                      }}><Printer className="mr-2 h-4 w-4" />Print</DropdownMenuItem>
                      {quotation.status !== "invoiced" && <DropdownMenuItem onClick={() => onQuotationToInvoice(quotation.id)}><FileText className="mr-2 h-4 w-4" />Quotation to Invoice</DropdownMenuItem>}
                      {quotation.status === "sent" && <DropdownMenuItem onClick={() => onSendToCustomer?.(quotation.id)}><Send className="mr-2 h-4 w-4" />Send to Customer</DropdownMenuItem>}
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(quotation.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredQuotations.length}</div>
            <p className="text-xs text-muted-foreground">Total Quotations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
             <div className="text-2xl font-bold text-success">
               ₹{filteredQuotations
                 .filter(q => q.status === "accepted")
                 .reduce((sum, q) => sum + q.amount, 0)
                 .toLocaleString()}
             </div>
            <p className="text-xs text-muted-foreground">Accepted Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              ₹{filteredQuotations
                .filter(q => q.status === "invoiced")
                .reduce((sum, q) => sum + q.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Invoiced</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuotationList;