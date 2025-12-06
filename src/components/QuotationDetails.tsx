import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { generateQuotationPrintHTML } from "@/utils/printTemplate";

interface QuotationDetailsProps {
  quotation: any;
  isOpen: boolean;
  onClose: () => void;
}

const QuotationDetails = ({ quotation, isOpen, onClose }: QuotationDetailsProps) => {
  const { companySettings, invoiceSettings } = useSettings();
  if (!quotation) return null;

  const subtotal = quotation.subtotal || 0;
  const taxAmount = quotation.tax_amount || 0;
  const totalAmount = quotation.amount || 0;
  const cgstAmount = taxAmount / 2;
  const sgstAmount = taxAmount / 2;
  
  const getTaxRate = (taxType: string) => {
    if (taxType?.includes('18')) return 18;
    if (taxType?.includes('12')) return 12;
    if (taxType?.includes('5')) return 5;
    return 18;
  };
  
  const fullTaxRate = getTaxRate(quotation.tax_type || 'IGST_18');
  const halfTaxRate = fullTaxRate / 2;
  const isIGST = quotation.tax_type?.startsWith('IGST');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const quotationHtml = generateQuotationPrintHTML(quotation, companySettings, invoiceSettings.termsAndConditions, invoiceSettings.defaultNotes);
      printWindow.document.write(quotationHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      save: { variant: "secondary", label: "Save" },
      sent: { variant: "outline", label: "Sent" },
      accepted: { variant: "default", label: "Accepted", className: "bg-success text-success-foreground" },
      rejected: { variant: "destructive", label: "Rejected" },
      expired: { variant: "secondary", label: "Expired" }
    };

    const config = variants[status] || variants.save;
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
          <DialogTitle className="text-2xl font-semibold">QUOTATION</DialogTitle>
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

          {/* Quotation Info & Customer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-y-2 py-4">         
              <div>
              <p className="text-sm"><span className="font-semibold">To:</span></p>
              <p className="text-sm font-semibold">{quotation.customer?.name || "Customer"}</p>
              {quotation.customer?.company && <p className="text-sm">{quotation.customer.company}</p>}
              {quotation.customer?.email && <p className="text-sm">Email: {quotation.customer.email}</p>}
              {quotation.customer?.phone && <p className="text-sm">Contact: {quotation.customer.phone}</p>}
              {quotation.customer?.gst_no && <p className="text-sm">GST No: {quotation.customer.gst_no}</p>}
              {quotation.customer?.address && <p className="text-sm">Address: {quotation.customer.address}</p>}
              {(quotation.customer?.city || quotation.customer?.state || quotation.customer?.pincode) && (
                <p className="text-sm">
                  {[quotation.customer?.city, quotation.customer?.state, quotation.customer?.pincode].filter(Boolean).join(', ')}
                </p>
              )}
              </div>

              <div className="text-right space-y-2">
              <p className="text-sm">
                <span className="font-semibold">QUOTATION No:</span> {quotation.quotation_number}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Dated:</span> {quotation.date}
              </p>

              {quotation.valid_until && (
                <div className="text-sm">
                  <p className="text-sm">
                    <span className="font-semibold">Valid Until:</span> {quotation.valid_until}
                  </p>
                </div>
              )}
              <p className="text-sm">{getStatusBadge(quotation.status)}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 border" style={{ width: '52%' }}>Particulars</th>
                  <th className="text-center p-3 border" style={{ width: '12%' }}>Size</th>
                  <th className="text-center p-3 border" style={{ width: '12%' }}>QTY</th>
                  <th className="text-center p-3 border" style={{ width: '12%' }}>Units</th>
                  <th className="text-center p-3 border" style={{ width: '12%' }}>Rate</th>
                  <th className="text-center p-3 border" style={{ width: '12%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="p-3 border">{item.description}</td>
                    <td className="text-center p-3 border">{item.shirt_size ? + item.shirt_size : ''}</td>
                    <td className="text-center p-3 border">{item.quantity}</td>
                    <td className="text-center p-3 border">{item.unit || 'Pcs'}</td>
                    <td className="text-center p-3 border">₹{item.rate?.toFixed(2)}</td>
                    <td className="text-center p-3 border">₹{item.amount?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Bank Details - Left */}
            <div className="flex-1">
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
            </div>

            {/* Totals - Right */}
            <div className="flex-1 flex justify-end">
              <div className="border rounded-lg overflow-hidden w-full max-w-xs">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="text-right p-3 border font-semibold">Total:</td>
                      <td className="text-right p-3 border font-semibold">₹{subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="text-right p-3 border">Discount:</td>
                      <td className="text-right p-3 border">₹0.00</td>
                    </tr>
                    <tr>
                      <td className="text-right p-3 border font-semibold">Taxable Value:</td>
                      <td className="text-right p-3 border font-semibold">₹{subtotal.toFixed(2)}</td>
                    </tr>
                    {isIGST ? (
                      <tr>
                        <td className="text-right p-3 border">ADD IGST {fullTaxRate}%:</td>
                        <td className="text-right p-3 border">₹{taxAmount.toFixed(2)}</td>
                      </tr>
                    ) : (
                      <>
                        <tr>
                          <td className="text-right p-3 border">ADD CGST {halfTaxRate}%:</td>
                          <td className="text-right p-3 border">₹{cgstAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="text-right p-3 border">ADD SGST {halfTaxRate}%:</td>
                          <td className="text-right p-3 border">₹{sgstAmount.toFixed(2)}</td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td className="text-right p-3 border font-bold text-lg">Total:</td>
                      <td className="text-right p-3 border font-bold text-lg">₹{totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>         
          {/* Notes */}
          {quotation.notes && (
            <div className="bg-white border rounded-lg p-3 w-full flex flex-wrap items-start gap-2 shadow-sm">
              <span className="font-semibold">Notes:</span>
              <span className="text-sm whitespace-pre-wrap">{quotation.notes}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationDetails;