import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/hooks/useSettings";
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
  Clock
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
      status: i.status,
      date: i.invoice_date,
      dueDate: i.due_date || "-",
      paidDate: i.paid_date || "-",
      shirtSizes: shirtSizes || '-',
      fullInvoice: i
    };
  });

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'unpaid';
    const variants: Record<string, any> = {
      sent: { variant: "outline", label: "Sent", icon: Send },
      unpaid: { variant: "secondary", label: "Unpaid", icon: Clock },
      paid: { variant: "default", label: "Paid", className: "bg-success text-success-foreground", icon: CheckCircle }
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

  const filteredInvoices = displayInvoices.filter(invoice =>
    invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreateNew}>
          <Receipt className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
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
                                const invoiceHtml = generateInvoicePrintHTML(invoice.fullInvoice, companySettings, invoiceSettings.termsAndConditions);
                                printWindow.document.write(invoiceHtml);
                                printWindow.document.close();
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