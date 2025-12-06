import { CompanySettings } from "@/hooks/useSettings";

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convert = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  };

  return convert(Math.floor(num));
};

const getTaxRate = (taxType: string) => {
  if (taxType?.includes('18')) return 18;
  if (taxType?.includes('12')) return 12;
  if (taxType?.includes('5')) return 5;
  return 18;
};

const generateCommonHeader = (title: string, companySettings: CompanySettings, logoUrl: string) => `
  <div class="header">
    <div class="header-top">
      <img src="${logoUrl}" alt="Company Logo" class="logo" />
      <div class="title-block">
        <h1>${title}</h1>
        <h2>${companySettings.name || 'Artisan Apparels'}</h2>
        <p>${(companySettings.address || 'HIG 9A, APHB Colony, Adoni,<br>Kurnool District, Pincode - 518301')}</p>
        <p>GSTIN No - ${companySettings.taxNumber || '37AGDPR6197G1ZW'}</p>
      </div>
      <div class="spacer"></div>
    </div>
  </div>
`;

const generateStyles = () => `
  <style>
    /* GLOBAL RESET */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      font-size: 12px;
      line-height: 1.4;
    }

    /* HEADER */
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px; /* uniform spacing */
    }

    .logo {
      height: 60px;
      width: auto;
      object-fit: contain;
    }

    .title-block {
      flex: 1;
      text-align: center;
    }

    .title-block h1 {
      font-size: 22px;
      text-decoration: underline;
      padding-bottom: 5px;
    }

    .title-block h2 {
      font-size: 18px;
      margin: 6px 0;
    }

    .title-block p {
      margin: 3px 0;
    }

    .spacer {
      width: 60px;
    }

    /* BILLING / CUSTOMER SECTION */
    .invoice-info,
    .quotation-info {
      display: flex;
      justify-content: space-between;
      margin: 15px 0; /* uniform spacing */
      padding: 12px 0;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
    }

    /* TABLE */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0; /* uniform spacing */
    }

    th, td {
      border: 1px solid #000;
      padding: 6px;
      text-align: left;
    }

    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    /* TOTALS */
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 15px; /* uniform spacing */
    }

    .totals-table {
      width: auto;
      min-width: 250px;
      border-collapse: collapse;
      font-size: 11px;
    }

    .totals-table td {
      border: 1px solid #000;
      padding: 4px 6px;
    }

    /* AMOUNT IN WORDS / NOTES / TERMS */
    .amount-words {
      margin: 15px 0; /* uniform spacing */
      padding: 10px;
      border: 1px solid #000;
    }

    /* FOOTER */
    .footer-section {
      display: flex;
      justify-content: space-between;
      margin-top: 15px; /* uniform spacing */
    }

    .bank-details,
    .signature {
      width: 45%;
      border: 2px solid #000;
      padding: 12px;
    }

    .signature {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
    }

    @media print {
      body {
        padding: 10px;
      }
      @page {
        margin: 0.5cm;
      }
    }
  </style>
`;

export const generateInvoicePrintHTML = (invoice: any, companySettings: CompanySettings, termsAndConditions?: string): string => {
  const subtotal = invoice.subtotal || 0;
  const taxAmount = invoice.tax_amount || 0;
  const totalAmount = invoice.total_amount || invoice.amount || 0;
  const cgstAmount = taxAmount / 2;
  const sgstAmount = taxAmount / 2;
  const fullTaxRate = getTaxRate(invoice.tax_type || 'IGST_18');
  const halfTaxRate = fullTaxRate / 2;
  const isIGST = invoice.tax_type?.startsWith('IGST');
  const amountInWords = numberToWords(Math.floor(totalAmount));
  const logoUrl = companySettings.logo || `${window.location.origin}/Logo - IAM Ratan.png`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Invoice - ${invoice.invoice_number}</title>
    ${generateStyles()}
  </head>
  <body>
    ${generateCommonHeader('TAX INVOICE', companySettings, logoUrl)}

    <div class="invoice-info">
      <div class="bill-to">
        <p><strong>Bill to:</strong></p>
        <p><strong>${invoice.customer_name || invoice.customer?.name || 'Customer'}</strong></p>
        ${invoice.customer_company || invoice.customer?.company ? `<p>${invoice.customer_company || invoice.customer?.company}</p>` : ''}
        ${invoice.customer_email || invoice.customer?.email ? `<p>Email: ${invoice.customer_email || invoice.customer?.email}</p>` : ''}
        ${invoice.customer_phone || invoice.customer?.phone ? `<p>Contact: ${invoice.customer_phone || invoice.customer?.phone}</p>` : ''}
        ${invoice.customer_gst_no || invoice.customer?.gst_no ? `<p>GST No: ${invoice.customer_gst_no || invoice.customer?.gst_no}</p>` : ''}
        ${invoice.customer_address || invoice.customer?.address ? `<p>Address: ${invoice.customer_address || invoice.customer?.address}</p>` : ''}
        ${invoice.customer_city || invoice.customer_state || invoice.customer_pincode || invoice.customer?.city || invoice.customer?.state || invoice.customer?.pincode
          ? `<p>${[
              invoice.customer_city || invoice.customer?.city,
              invoice.customer_state || invoice.customer?.state,
              invoice.customer_pincode || invoice.customer?.pincode
            ].filter(Boolean).join(', ')}</p>`
          : ''}
      </div>

      <div>
        <p><strong>Invoice No:</strong> ${invoice.invoice_number}</p>
        <p><strong>Date:</strong> ${invoice.invoice_date || invoice.date}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 38%;">Particulars</th>
          <th class="text-center" style="width: 10%;">Size</th>
          <th class="text-center" style="width: 10%;">Qty</th>
          <th class="text-center" style="width: 10%;">Units</th>
          <th class="text-right" style="width: 16%;">Rate</th>
          <th class="text-right" style="width: 16%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${(invoice.items || []).map((item: any) => `
          <tr>
            <td>${item.description || ''}</td>
            <td class="text-center">${item.shirt_size || '-'}</td>
            <td class="text-center">${item.quantity || 0}</td>
            <td class="text-center">${item.unit || 'Pcs'}</td>
            <td class="text-right">${(item.rate || 0).toFixed(2)}</td>
            <td class="text-right">${(item.amount || 0).toFixed(2)}</td>
          </tr>`).join('')}
      </tbody>
    </table>

    <div class="totals-wrapper">
      <table class="totals-table">
        <tr><td colspan="4" class="text-right bold">Total:</td><td class="text-right bold">${subtotal.toFixed(2)}</td></tr>
        <tr><td colspan="4" class="text-right">Discount:</td><td class="text-right">0.00</td></tr>
        <tr><td colspan="4" class="text-right bold">Taxable Value:</td><td class="text-right bold">${subtotal.toFixed(2)}</td></tr>
        ${isIGST
          ? `<tr><td colspan="4" class="text-right">ADD IGST ${fullTaxRate}%:</td><td class="text-right">${taxAmount.toFixed(2)}</td></tr>`
          : `<tr><td colspan="4" class="text-right">ADD CGST ${halfTaxRate}%:</td><td class="text-right">${cgstAmount.toFixed(2)}</td></tr>
             <tr><td colspan="4" class="text-right">ADD SGST ${halfTaxRate}%:</td><td class="text-right">${sgstAmount.toFixed(2)}</td></tr>`}
        <tr><td colspan="4" class="text-right bold">Total:</td><td class="text-right bold">${totalAmount.toFixed(2)}</td></tr>
      </table>
    </div>

    <div class="amount-words"><strong>Amount Payable (in words):</strong> ${amountInWords} Rupees Only</div>

    ${invoice.notes ? `<div class="amount-words"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}

    ${termsAndConditions ? `<div class="amount-words"><strong>Terms and Conditions:</strong> ${termsAndConditions}</div>` : ''}

    <div class="footer-section">
      <div class="bank-details">
        <h3>Company Bank Details</h3>
        <p><strong>Account Name:</strong> ${companySettings.accountHolderName || companySettings.name}</p>
        <p><strong>Bank:</strong> ${companySettings.bankName || 'HDFC Bank'}</p>
        <p><strong>Account No:</strong> ${companySettings.accountNumber || ''}</p>
        <p><strong>Branch:</strong> ${companySettings.branchAddress || ''}</p>
        <p><strong>IFSC:</strong> ${companySettings.routingNumber || ''}</p>
      </div>

      <div class="signature">
        <p><strong>For ${companySettings.name || 'Artisan Apparels'}</strong></p>
        <p style="margin-top: 40px;"><strong>Authorised Signatory</strong></p>
      </div>
    </div>
  </body>
  </html>`;
};

export const generateQuotationPrintHTML = (quotation: any, companySettings: CompanySettings, termsAndConditions?: string, defaultNotes?: string): string => {
  const subtotal = quotation.subtotal || 0;
  const taxAmount = quotation.tax_amount || 0;
  const totalAmount = quotation.amount || 0;
  const cgstAmount = taxAmount / 2;
  const sgstAmount = taxAmount / 2;
  const fullTaxRate = getTaxRate(quotation.tax_type || 'IGST_18');
  const halfTaxRate = fullTaxRate / 2;
  const isIGST = quotation.tax_type?.startsWith('IGST');
  const amountInWords = numberToWords(Math.floor(totalAmount));
  const logoUrl = companySettings.logo || `${window.location.origin}/Logo - IAM Ratan.png`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Quotation - ${quotation.quotation_number}</title>
    ${generateStyles()}
  </head>
  <body>
    ${generateCommonHeader('QUOTATION', companySettings, logoUrl)}

    <div class="quotation-info">
      <div class="bill-to">
          <p><strong>To:</strong></p>
          <p><strong>${quotation.customer?.name || 'Customer'}</strong></p>
          ${quotation.customer?.company ? `<p>${quotation.customer.company}</p>` : ''}
          ${quotation.customer?.email ? `<p>Email: ${quotation.customer.email}</p>` : ''}
          ${quotation.customer?.phone ? `<p>Contact: ${quotation.customer.phone}</p>` : ''}
          ${quotation.customer?.gst_no ? `<p>GST No: ${quotation.customer.gst_no}</p>` : ''}
          ${quotation.customer?.address ? `<p>Address: ${quotation.customer.address}</p>` : ''}
          ${quotation.customer?.city || quotation.customer?.state || quotation.customer?.pincode ? `<p>${[quotation.customer?.city, quotation.customer?.state, quotation.customer?.pincode].filter(Boolean).join(', ')}</p>` : ''}
        </div>
      <div>
        <p><strong>Quotation No:</strong> ${quotation.quotation_number}</p>
        <p><strong>Date:</strong> ${quotation.date}</p>
        ${quotation.valid_until ? `
        <div class="validity">
          <strong>Valid Until:</strong> ${quotation.valid_until}
        </div>
      ` : ''}
      </div>
    </div>
    
      <table>
      <thead>
        <tr>
          <th style="width: 38%;">Particulars</th>
          <th class="text-center" style="width: 10%;">Size</th>
          <th class="text-center" style="width: 10%;">Qty</th>
          <th class="text-center" style="width: 10%;">Units</th>
          <th class="text-right" style="width: 16%;">Rate</th>
          <th class="text-right" style="width: 16%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${(quotation.items || []).map((item: any) => `
          <tr>
            <td>${item.description || ''}</td>
            <td class="text-center">${item.shirt_size || '-'}</td>
            <td class="text-center">${item.quantity || 0}</td>
            <td class="text-center">${item.unit || 'Pcs'}</td>
            <td class="text-right">${(item.rate || 0).toFixed(2)}</td>
            <td class="text-right">${(item.amount || 0).toFixed(2)}</td>
          </tr>`).join('')}
      </tbody>
    </table>

    <div class="totals-wrapper">
      <table class="totals-table">
        <tr><td colspan="4" class="text-right bold">Total:</td><td class="text-right bold">${subtotal.toFixed(2)}</td></tr>
        <tr><td colspan="4" class="text-right">Discount:</td><td class="text-right">0.00</td></tr>
        <tr><td colspan="4" class="text-right bold">Taxable Value:</td><td class="text-right bold">${subtotal.toFixed(2)}</td></tr>
        ${isIGST
          ? `<tr><td colspan="4" class="text-right">ADD IGST ${fullTaxRate}%:</td><td class="text-right">${taxAmount.toFixed(2)}</td></tr>`
          : `<tr><td colspan="4" class="text-right">ADD CGST ${halfTaxRate}%:</td><td class="text-right">${cgstAmount.toFixed(2)}</td></tr>
             <tr><td colspan="4" class="text-right">ADD SGST ${halfTaxRate}%:</td><td class="text-right">${sgstAmount.toFixed(2)}</td></tr>`}
        <tr><td colspan="4" class="text-right bold">Total:</td><td class="text-right bold">${totalAmount.toFixed(2)}</td></tr>
      </table>
    </div>

    <div class="amount-words"><strong>Amount Payable (in words):</strong> ${amountInWords} Rupees Only</div>

    ${quotation.notes ? `<div class="amount-words"><strong>Notes:</strong> ${quotation.notes}</div>` : ''}

    ${defaultNotes ? `<div class="amount-words"><strong>Default Notes:</strong> ${defaultNotes}</div>` : ''}

    ${termsAndConditions ? `<div class="amount-words"><strong>Terms and Conditions:</strong> ${termsAndConditions}</div>` : ''}

    <div class="footer-section">
      <div class="bank-details">
        <h3>Company Bank Details</h3>
        <p><strong>Account Name:</strong> ${companySettings.accountHolderName || companySettings.name}</p>
        <p><strong>Bank:</strong> ${companySettings.bankName || 'HDFC Bank'}</p>
        <p><strong>Account No:</strong> ${companySettings.accountNumber || ''}</p>
        <p><strong>Branch:</strong> ${companySettings.branchAddress || ''}</p>
        <p><strong>IFSC:</strong> ${companySettings.routingNumber || ''}</p>
      </div>

      <div class="signature">
        <p><strong>For ${companySettings.name || 'Artisan Apparels'}</strong></p>
        <p style="margin-top: 40px;"><strong>Authorised Signatory</strong></p>
      </div>
    </div>
  </body>
  </html>`;
};
