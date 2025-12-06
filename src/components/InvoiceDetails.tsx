import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { generateInvoicePrintHTML } from "@/utils/printTemplate";

interface InvoiceDetailsProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceDetails = ({ invoice, isOpen, onClose }: InvoiceDetailsProps) => {
  const { companySettings, invoiceSettings } = useSettings();
  if (!invoice) return null;

  const subtotal = invoice.subtotal || 0;
  const taxAmount = invoice.tax_amount || 0;
  const totalAmount = invoice.total_amount || invoice.amount || 0;
  const cgstAmount = taxAmount / 2;
  const sgstAmount = taxAmount / 2;
  
  const getTaxRate = (taxType: string) => {
    if (taxType?.includes('18')) return 18;
    if (taxType?.includes('12')) return 12;
    if (taxType?.includes('5')) return 5;
    return 18;
  };
  
  const fullTaxRate = getTaxRate(invoice.tax_type || 'IGST_18');
  const halfTaxRate = fullTaxRate / 2;
  const isIGST = invoice.tax_type?.startsWith('IGST');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceHtml = generateInvoicePrintHTML(invoice, companySettings, invoiceSettings.termsAndConditions);
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      sent: { variant: "outline", label: "Sent" },
      unpaid: { variant: "secondary", label: "Unpaid" },
      paid: { variant: "default", label: "Paid", className: "bg-success text-success-foreground" }
    };
    
    const config = variants[status] || variants.unpaid;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
        <div className="relative flex items-center justify-center">
          <DialogTitle className="text-2xl font-semibold">TAX INVOICE</DialogTitle>
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="absolute right-0"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>

        </DialogHeader>
        
        <div className="space-y-6">
          {/* Company Details */}
          <div className="text-center border-b-2 pb-4">
            <h2 className="text-2xl font-bold">{companySettings.name || 'ARTISAN APPARELS'}</h2>
            <p className="text-sm">{companySettings.address || 'HIG 9A, APHB Colony, Adoni'}</p>
            <p className="text-sm font-semibold">GSTIN No - {companySettings.taxNumber || '37AGDPR6197G1ZW'}</p>
          </div>
          {/* Invoice Info & Customer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-y-2 py-4">
            <div>
              <p className="text-sm"><span className="font-semibold">Bill to:</span><br />{invoice.customer_name || invoice.customer?.name || "Customer"}</p>
                <div className="space-y-1">
                  <p className="text-sm">{invoice.customer_phone || invoice.customer?.phone || invoice.customer?.mobile || invoice.customer?.contact?.phone || ""}</p>
                  <p className="text-sm">{invoice.customer_email || invoice.customer?.email || invoice.customer?.contact?.email || ""}</p>
                  <p className="text-sm">{invoice.customer_address || invoice.customer?.address || invoice.customer?.billing_address || invoice.customer?.contact?.address || ""}</p>
                  <p className="text-sm">{invoice.customer_gst || invoice.customer?.gst || invoice.customer?.gstin || invoice.customer?.tax_id || ""}</p>
                </div>
           </div>
            <div className="text-right">
              <p className="text-sm"><span className="font-semibold">INVOICE No:</span> {invoice.invoice_number}</p>
              <p className="text-sm"><span className="font-semibold">Dated:</span> {invoice.invoice_date || invoice.date}</p>
              <p className="text-sm mt-2">{getStatusBadge(invoice.status)}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 border" style={{ width: '52%' }}>Particulars</th>
                  <th className="text-center p-3 border" style={{ width: '12%' }}>QTY</th>
                  <th className="text-center p-3 border" style={{ width: '12%' }}>Units</th>
                  <th className="text-right p-3 border" style={{ width: '12%' }}>RATE</th>
                  <th className="text-right p-3 border" style={{ width: '12%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="p-3 border">{item.description}{item.shirt_size ? ' - ' + item.shirt_size : ''}</td>
                      <td className="text-center p-3 border">{item.quantity}</td>
                      <td className="text-center p-3 border">{item.unit || 'Pcs'}</td>
                      <td className="text-right p-3 border">₹{item.rate?.toFixed(2)}</td>
                      <td className="text-right p-3 border">₹{item.amount?.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-muted-foreground">No items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                <tr>
                  <td colSpan={4} className="text-right p-3 border font-semibold">Total:</td>
                  <td className="text-right p-3 border font-semibold">₹{subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-right p-3 border">Discount:</td>
                  <td className="text-right p-3 border">₹0.00</td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-right p-3 border font-semibold">Taxable Value:</td>
                  <td className="text-right p-3 border font-semibold">₹{subtotal.toFixed(2)}</td>
                </tr>
                {isIGST ? (
                  <tr>
                    <td colSpan={4} className="text-right p-3 border">ADD IGST {fullTaxRate}%:</td>
                    <td className="text-right p-3 border">₹{taxAmount.toFixed(2)}</td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td colSpan={4} className="text-right p-3 border">ADD CGST {halfTaxRate}%:</td>
                      <td className="text-right p-3 border">₹{cgstAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-right p-3 border">ADD SGST {halfTaxRate}%:</td>
                      <td className="text-right p-3 border">₹{sgstAmount.toFixed(2)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td colSpan={4} className="text-right p-3 border font-bold text-lg">Total:</td>
                  <td className="text-right p-3 border font-bold text-lg">₹{totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company's Bank Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-semibold">Holder A/c Name:</div>
                <div>{companySettings.accountHolderName || companySettings.name || 'ARTISAN APPARELS'}</div>
                <div className="font-semibold">BANK NAME:</div>
                <div>{companySettings.bankName || 'HDFC BANK'}</div>
                <div className="font-semibold">ACCOUNT No:</div>
                <div>{companySettings.accountNumber || '9998019993333'}</div>
                <div className="font-semibold">BRANCH:</div>
                <div>{companySettings.branchAddress || 'ADONI'}</div>
                <div className="font-semibold">IFSC CODE:</div>
                <div>{companySettings.routingNumber || 'HDFC0001933'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetails;