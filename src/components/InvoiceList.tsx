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
  Receipt, 
  Trash2,
  Send,
  CheckCircle,
  Clock,
  Banknote,
  Download
} from "lucide-react";

interface InvoiceListProps {
  invoices: any[];
  onCreateNew: () => void;
  onViewInvoice: (id: string) => void;
  onEditInvoice: (invoice: any) => void;
  onDelete: (invoiceId: string) => void;
  onMarkAsPaid?: (invoiceId: string) => void;
  onSendReminder?: (invoiceId: string) => void;
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

const InvoiceList = ({
  invoices,
  onCreateNew,
  onViewInvoice,
  onEditInvoice,
  onDelete,
  onMarkAsPaid,
  onSendReminder,
  onSendToCustomer
}: InvoiceListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const { companySettings, invoiceSettings } = useSettings();

  const displayInvoices = invoices.map(i => {
    const shirtSizes = i.items
      .map((item: any) => item.shirt_size)
      .filter((size: string) => size)
      .join(', ');
    
    return {
      id: i.id,
      invoiceNumber: i.invoice_number,
      customer: i.customer_name || "Unknown Customer",
      amount: i.total_amount || i.subtotal || 0,
      advanceAmount: i.advance_amount || 0,
      status: i.status,
      date: i.invoice_date,
      dueDate: i.due_date || "-",
      paidDate: i.paid_date || "-",
      shirtSizes: shirtSizes || '-',
      fullInvoice: i
    };
  });

  const getGstRate = (invoice: any) => {
    const taxType = String(invoice.tax_type || "").toUpperCase();
    if (taxType.includes("5")) return 5;
    if (taxType.includes("12")) return 12;
    if (taxType.includes("18")) return 18;
    const subtotal = Number(invoice.subtotal) || 0;
    const gstAmount = Number(invoice.gst_amount) || 0;
    if (subtotal <= 0 || gstAmount <= 0) return 0;
    return Number(((gstAmount / subtotal) * 100).toFixed(2));
  };

  const getExportRows = () => filteredInvoices.map(({ fullInvoice }) => ({
    invoiceNumber: fullInvoice.invoice_number || "",
    customer: fullInvoice.customer_name || "",
    gstin: fullInvoice.customer_gst_no || "",
    date: fullInvoice.invoice_date || "",
    dueDate: fullInvoice.due_date || "",
    subtotal: Number(fullInvoice.subtotal) || 0,
    discount: Number(fullInvoice.discount) || 0,
    gstRate: getGstRate(fullInvoice),
    igstAmount: String(fullInvoice.tax_type || "").toUpperCase().includes("IGST")
      ? Number(fullInvoice.gst_amount) || 0 : 0,
    cgstAmount: String(fullInvoice.tax_type || "").toUpperCase().includes("IGST")
      ? 0 : Math.round(((Number(fullInvoice.gst_amount) || 0) / 2) * 100) / 100,
    sgstAmount: String(fullInvoice.tax_type || "").toUpperCase().includes("IGST")
      ? 0 : (Number(fullInvoice.gst_amount) || 0) - Math.round(((Number(fullInvoice.gst_amount) || 0) / 2) * 100) / 100,
    total: Number(fullInvoice.total_amount) || 0,
    advance: Number(fullInvoice.advance_amount) || 0,
    status: fullInvoice.status || "",
    paidDate: fullInvoice.paid_date || ""
  }));

  const getExportFileName = () => {
    const monthLabel = selectedMonth === 0 ? "all-months" : MONTHS.find(month => month.value === selectedMonth)?.label.toLowerCase();
    return `artisan-invoices-${selectedYear}-${monthLabel}`;
  };

  const exportInvoiceCsv = () => {
    const columns = [
      "Invoice Number", "Customer Name", "Customer GSTIN", "Invoice Date", "Due Date",
      "Subtotal (INR)", "Discount (INR)", "GST %", "IGST (INR)", "CGST (INR)", "SGST (INR)",
      "Total Amount (INR)", "Advance Amount (INR)", "Status", "Paid Date"
    ];
    const escapeCsv = (value: unknown) => {
      const text = value == null ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = getExportRows().map(row => [
      row.invoiceNumber, row.customer, row.gstin, row.date, row.dueDate,
      row.subtotal, row.discount, row.gstRate, row.igstAmount, row.cgstAmount, row.sgstAmount, row.total,
      row.advance, row.status, row.paidDate
    ]);
    const csv = [columns, ...rows].map(row => row.map(escapeCsv).join(",")).join("\\r\\n");
    const blob = new Blob(["\\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${getExportFileName()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportInvoicePdf = () => {
    const rows = getExportRows();
    const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char] || char);
    const money = (value: number) => value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const logo = "/favicon.png";
    const tableRows = rows.map(row => `
      <tr>
        <td>${escapeHtml(row.invoiceNumber)}</td><td>${escapeHtml(row.customer)}</td>
        <td>${escapeHtml(row.gstin)}</td><td>${escapeHtml(row.date)}</td>
        <td class="num">${money(row.subtotal)}</td><td class="num">${row.gstRate}%</td>
        <td class="num">${money(row.igstAmount)}</td><td class="num">${money(row.cgstAmount)}</td>
        <td class="num">${money(row.sgstAmount)}</td><td class="num">${money(row.total)}</td>
        <td>${escapeHtml(row.status)}</td>
      </tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice Register</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        * { box-sizing: border-box; } body { font: 12px Arial, sans-serif; color: #222; }
        .header { display:flex; align-items:center; gap:18px; border-bottom:2px solid #222; padding-bottom:14px; margin-bottom:16px; }
        .logo { width:82px; height:82px; object-fit:contain; object-position:left center; }
        .company h1 { margin:0 0 5px; font-size:24px; } .company p { margin:3px 0; color:#555; font-size:12px; }
        h2 { font-size:19px; margin:16px 0 10px; }
        .meta { margin:0 0 12px; color:#555; font-size:12px; }
        table { width:100%; border-collapse:collapse; font-size:11px; }
        th { background:#eee; text-align:left; } th,td { border:1px solid #bbb; padding:8px 6px; }
        .num { text-align:right; white-space:nowrap; }
        tfoot td { font-weight:bold; background:#f4f4f4; }
        .footer { margin-top:14px; text-align:right; font-size:10px; color:#666; }
        @media screen { body { padding:16px; } }
      </style></head><body>
      <header class="header">
        <img class="logo" src="${escapeHtml(logo)}" alt="Artisan Apparels favicon">
        <div class="company"><h1>${escapeHtml(companySettings.name || "Artisan Apparels")}</h1>
          <p>${escapeHtml(companySettings.address || "")}</p>
          <p>${escapeHtml(companySettings.phone || "")} ${companySettings.email ? " | " + escapeHtml(companySettings.email) : ""}</p>
          ${companySettings.taxNumber ? `<p>GSTIN: ${escapeHtml(companySettings.taxNumber)}</p>` : ""}
        </div>
      </header>
      <h2>INVOICE REGISTER</h2>
      <p class="meta">Period: ${selectedMonth === 0 ? "All months" : MONTHS.find(month => month.value === selectedMonth)?.label} ${selectedYear} &nbsp; | &nbsp; Invoices: ${rows.length}</p>
      <table><thead><tr>
        <th>Invoice No.</th><th>Customer</th><th>Customer GSTIN</th><th>Date</th>
        <th class="num">Taxable Value (₹)</th><th class="num">GST %</th>
        <th class="num">IGST (₹)</th><th class="num">CGST (₹)</th><th class="num">SGST (₹)</th>
        <th class="num">Total (₹)</th><th>Status</th>
      </tr></thead><tbody>${tableRows || '<tr><td colspan="11">No invoices found.</td></tr>'}</tbody>
      <tfoot><tr><td colspan="4">TOTAL</td><td class="num">${money(rows.reduce((sum,row)=>sum+row.subtotal,0))}</td>
        <td></td><td class="num">${money(rows.reduce((sum,row)=>sum+row.igstAmount,0))}</td>
        <td class="num">${money(rows.reduce((sum,row)=>sum+row.cgstAmount,0))}</td>
        <td class="num">${money(rows.reduce((sum,row)=>sum+row.sgstAmount,0))}</td>
        <td class="num">${money(rows.reduce((sum,row)=>sum+row.total,0))}</td><td></td></tr></tfoot></table>
      <div class="footer">Generated on ${new Date().toLocaleString("en-IN")}</div>
      <script>window.addEventListener("load",()=>{const img=document.querySelector(".logo");const print=()=>setTimeout(()=>window.print(),250);if(img.complete)print();else{img.onload=print;img.onerror=print;setTimeout(print,3000);}}</script>
      </body></html>`;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'unpaid';
    const variants: Record<string, any> = {
      unpaid: { variant: "secondary", label: "Unpaid", icon: Clock },
      paid: { variant: "default", label: "Paid", className: "bg-success text-success-foreground", icon: CheckCircle },
      advance: { variant: "default", label: "Advance", className: "bg-warning text-warning-foreground", icon: Banknote }
    };

    const config = variants[statusLower] || variants.unpaid;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredInvoices = displayInvoices.filter(invoice => {
    const matchesSearch = invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const invDate = new Date(invoice.date);
    return matchesSearch &&
      invDate.getFullYear() === selectedYear &&
      (selectedMonth === 0 || invDate.getMonth() + 1 === selectedMonth);
  }).sort((a, b) => {
    const dateDifference = new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    if (dateDifference !== 0) return dateDifference;
    return new Date(b.fullInvoice?.created_at || 0).getTime() - new Date(a.fullInvoice?.created_at || 0).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header with Search and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
          <div className="relative w-full min-w-0 sm:min-w-[200px] sm:flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search invoices..."
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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto" disabled={filteredInvoices.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                EXPORT LIST
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportInvoiceCsv}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={exportInvoicePdf}>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="w-full sm:w-auto" onClick={onCreateNew}>
            <Receipt className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden w-full min-w-0 rounded-md border overflow-x-auto overscroll-x-contain sm:block">
            <Table className="w-full min-w-[980px] whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-6">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customer}</TableCell>
                      <TableCell>{invoice.shirtSizes}</TableCell>
                      <TableCell>₹{(invoice.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell className={invoice.status === "overdue" ? "text-destructive font-medium" : ""}>
                        {invoice.dueDate}
                      </TableCell>
                      <TableCell>{invoice.status?.toLowerCase() === 'paid' ? invoice.paidDate : '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => onViewInvoice(invoice.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditInvoice(invoice.fullInvoice)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => {
                              const { generateInvoicePrintHTML } = await import('@/utils/printTemplate');
                              const printWindow = window.open('', '_blank');
                              if (printWindow) {
                                const invoiceHtml = generateInvoicePrintHTML(invoice.fullInvoice, companySettings, invoiceSettings.termsAndConditions, invoiceSettings.showFabricFeatures !== false);
                                printWindow.document.write(invoiceHtml);
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
                              <Receipt className="mr-2 h-4 w-4" />
                              Print
                            </DropdownMenuItem>
                            {(invoice.status === "unpaid" || invoice.status === "sent") && (
                              <DropdownMenuItem onClick={() => onSendReminder?.(invoice.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Reminder
                              </DropdownMenuItem>
                            )}
                            {invoice.status !== "paid" && (
                              <DropdownMenuItem onClick={() => onMarkAsPaid?.(invoice.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => {
                                console.log("Delete invoice:", invoice.id);
                                onDelete(invoice.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-3 sm:hidden">
            {filteredInvoices.length === 0 ? (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No invoices found.</div>
            ) : filteredInvoices.map((invoice) => (
              <article key={invoice.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold">{invoice.invoiceNumber}</p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">{invoice.customer}</p>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Amount</p><p className="mt-1 font-semibold">₹{(invoice.amount || 0).toLocaleString("en-IN")}</p></div>
                  <div><p className="text-xs text-muted-foreground">Size</p><p className="mt-1 break-words">{invoice.shirtSizes}</p></div>
                  <div><p className="text-xs text-muted-foreground">Invoice Date</p><p className="mt-1">{invoice.date || "-"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Due Date</p><p className="mt-1">{invoice.dueDate || "-"}</p></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => onViewInvoice(invoice.id)}><Eye className="mr-1 h-4 w-4" />View</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => onEditInvoice(invoice.fullInvoice)}><Edit className="mr-1 h-4 w-4" />Edit</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="sm" variant="secondary" aria-label={`More actions for ${invoice.invoiceNumber}`}><MoreHorizontal className="h-4 w-4" />More</Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={async () => {
                        const { generateInvoicePrintHTML } = await import('@/utils/printTemplate');
                        const printWindow = window.open('', '_blank');
                        if (!printWindow) return;
                        printWindow.document.write(generateInvoicePrintHTML(invoice.fullInvoice, companySettings, invoiceSettings.termsAndConditions, invoiceSettings.showFabricFeatures !== false));
                        printWindow.document.close();
                        const images = Array.from(printWindow.document.images);
                        await Promise.all(images.map(img => new Promise<void>(resolve => {
                          if (img.complete) { resolve(); return; }
                          const finish = () => { img.removeEventListener("load", finish); img.removeEventListener("error", finish); resolve(); };
                          img.addEventListener("load", finish, { once: true }); img.addEventListener("error", finish, { once: true });
                          window.setTimeout(finish, 5000);
                        })));
                        printWindow.focus(); printWindow.print();
                      }}><Receipt className="mr-2 h-4 w-4" />Print</DropdownMenuItem>
                      {(invoice.status === "unpaid" || invoice.status === "sent") && <DropdownMenuItem onClick={() => onSendReminder?.(invoice.id)}><Send className="mr-2 h-4 w-4" />Send Reminder</DropdownMenuItem>}
                      {invoice.status !== "paid" && <DropdownMenuItem onClick={() => onMarkAsPaid?.(invoice.id)}><CheckCircle className="mr-2 h-4 w-4" />Mark as Paid</DropdownMenuItem>}
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(invoice.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
            <p className="text-xs text-muted-foreground">Total Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              ₹{filteredInvoices
                .filter(i => i.status?.toLowerCase() === "paid")
                .reduce((sum, i) => sum + (i.amount || 0), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Paid Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              ₹{filteredInvoices
                .filter(i => {
                  const status = i.status?.toLowerCase();
                  return status === "sent" || status === "unpaid";
                })
                .reduce((sum, i) => sum + (i.amount || 0), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Unpaid Amount</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceList;