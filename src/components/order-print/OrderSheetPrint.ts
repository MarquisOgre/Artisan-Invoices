import type { OrderSheet } from "../OrderSheetList";

export type OrderFabricCodes = { shirt: string[]; pant: string[] };

type CompanyLogoSettings = { favicon?: string | null; printLogo?: string | null; logo?: string | null };

const getCompanyLogoUrl = (settings?: CompanyLogoSettings) =>
  settings?.favicon || settings?.printLogo || settings?.logo || `${window.location.origin}/favicon.png`;

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-IN");
};

const formatDeliveryAddress = (order: Pick<OrderSheet, "delivery_address" | "delivery_city" | "delivery_state" | "delivery_pincode">) =>
  [order.delivery_address, order.delivery_city, order.delivery_state, order.delivery_pincode]
    .map(value => String(value || "").trim())
    .filter(Boolean)
    .join(", ") || "-";

const formatFabricCodes = (codes: string[] | undefined, fallback: string | null) => {
  const unique = [...new Set((codes || []).map(code => code.trim()).filter(Boolean))];
  if (!unique.length && fallback) unique.push(fallback);
  return unique.join("\n") || "-";
};

export const printOrderSheet = (order: OrderSheet, fabricCodes?: OrderFabricCodes, companySettings?: CompanyLogoSettings) => {
  const companyLogoUrl = getCompanyLogoUrl(companySettings);
  const shirtMeasurements = [
    ["Shoulder", order.shirt_measurements?.shoulder],
    ["Chest", order.shirt_measurements?.chest],
    ["Front Length", order.shirt_measurements?.frontLength],
    ["Sleeve Length", order.shirt_measurements?.sleeveLength],
    ["Neck", order.shirt_measurements?.neck],
    ["Waist", order.shirt_measurements?.waist],
    ["Bottom Hem", order.shirt_measurements?.bottomHem],
  ];
  const pantMeasurements = [
    ["Waist", order.pant_measurements?.waist],
    ["Hip", order.pant_measurements?.hip],
    ["Thigh", order.pant_measurements?.thigh],
    ["Length", order.pant_measurements?.length],
    ["Bottom", order.pant_measurements?.bottom],
    ["Rise", order.pant_measurements?.rise],
    ["Others", order.pant_measurements?.others],
  ];
  const esc = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const checked = (styles: string[] | undefined, value: string) => styles?.includes(value) ? "☑" : "☐";
  const styleText = (selected: string[] | undefined, other: string | undefined) =>
    [...(selected || []), other || ""].filter(Boolean).join(", ") || "-";
  const measureRows = (rows: string[][]) => rows.slice(0, 7).map(([label, value]) =>
    `<div class="measure-row"><span>${esc(label)}</span><b>:</b><span class="line-value">${esc(value || "")}</span></div>`
  ).join("");
  const shirtStyle = order.shirt_style?.selected || [];
  const pantStyle = order.pant_style?.selected || [];

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(order.order_no)} - Artisan Apparels Order Sheet</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  @media print {
    html, body { width: 297mm; height: 210mm; overflow: hidden; }
    .sheet { width: 297mm; height: 210mm; min-height: 210mm; max-height: 210mm; }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: Arial, Helvetica, sans-serif; color: #08265b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .sheet { width: 297mm; height: 210mm; min-height: 210mm; max-height: 210mm; padding: 3mm 3.5mm 3mm; margin: 0 auto; background: #fff; overflow: hidden; }
  .top { height: 28mm; display: grid; grid-template-columns: 36% 36% 28%; align-items: center; gap: 1mm; }
  .brand { display:flex; align-items:center; justify-content:center; height:100%; padding:1mm; }\n  .brand-logo { display:block; width:180px; min-width:180px; max-width:180px; height:100px; min-height:100px; max-height:100px; object-fit:contain; object-position:center; flex:0 0 180px; }
  .brand-mark { width:19mm; height:19mm; border-radius:50%; background:#0b2c58; position:relative; flex:0 0 auto; }
  .brand-mark:before { content:""; position:absolute; left:5.5mm; top:4.2mm; width:0; height:0; border-left:5.5mm solid transparent; border-right:5.5mm solid transparent; border-bottom:8mm solid white; }
  .brand-mark:after { content:""; position:absolute; left:8.3mm; top:10mm; width:5.4mm; height:6.7mm; background:white; clip-path:polygon(50% 0,100% 100%,0 100%); }
  .brand-name { font-family: Georgia, "Times New Roman", serif; font-size:10.5mm; line-height:.85; font-weight:700; letter-spacing:.8mm; color:#0a2b59; }
  .brand-sub { font-size:3.1mm; line-height:1.35; letter-spacing:1.1mm; font-weight:700; margin-top:2mm; }
  .divider { height:20mm; border-left:1px solid #5a5a5a; margin-left:2mm; padding-left:5mm; }
  .banner { height:26mm; background:#082f60; color:white; border-radius:0 0 5mm 5mm; clip-path:polygon(5% 0,95% 0,95% 100%,5% 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; margin:0; text-align:center; }
  .banner-title { font-size:8.2mm; font-weight:800; letter-spacing:.4mm; line-height:1; }
  .banner-sub { font-size:4mm; font-weight:700; letter-spacing:1.5mm; margin-top:3mm; }
  .meta { background:#e7f1fb; border-radius:3mm; padding:3mm 3.5mm; font-size:3.5mm; line-height:1.8; margin:0; min-width:0; width:100%; }
  .meta-row { display:grid; grid-template-columns:17mm 3mm minmax(0, 1fr); align-items:end; gap:1mm; }
  .meta-line { border-bottom:1px solid #0a376d; min-height:6mm; overflow-wrap:anywhere; line-height:1.2; }
  .customer-bar { height:11mm; background:#e7f1fb; border-radius:2.2mm; display:grid; grid-template-columns:27% 37% 36%; align-items:center; font-size:3.7mm; font-weight:700; padding:0 3.5mm; margin-bottom:2mm; }
  .customer-cell { height:9mm; display:flex; align-items:center; gap:2mm; border-right:1px solid #173e70; padding-right:5mm; }
  .customer-cell + .customer-cell { padding-left:5mm; }
  .customer-cell:last-child { border-right:0; }
  .fill-line { flex:1; border-bottom:1px solid #173e70; min-width:10mm; height:5mm; }
  .section { border:1px solid currentColor; border-radius:2.5mm; overflow:hidden; margin-bottom:1.5mm; }
  .section.shirt { color:#07508d; }
  .section.pant { color:#805c2d; }
  .section-head { height:10mm; color:#fff; display:grid; grid-template-columns:24% 76%; align-items:center; }
  .shirt .section-head { background:#0a4f88; }
  .pant .section-head { background:#80603a; }
  .garment-title { font-size:6mm; font-weight:800; padding-left:25mm; position:relative; }
  .garment-icon { position:absolute; left:6mm; top:-2mm; width:15mm; height:17mm; color:white; font-size:13mm; line-height:17mm; }
  .garment-icon.shirt-icon:before { content:"♧"; transform:rotate(180deg); display:block; font-size:15mm; }
  .garment-icon.pant-icon:before { content:"♜"; display:block; font-size:13mm; }
  .section-grid { display:grid; grid-template-columns:18% 11% 31% 14% 26%; background:#fff; min-height:58mm; max-height:58mm; }
  .cell { border-right:1px solid currentColor; }
  .cell:last-child { border-right:0; }
  .cell-head { height:7mm; background:linear-gradient(#e6f1fb,#d7e9f8); display:flex; align-items:center; justify-content:center; font-size:3.6mm; font-weight:800; text-align:center; color:#0b2d62; border-bottom:1px solid currentColor; }
  .pant .cell-head { background:linear-gradient(#fff2df,#f7e7d0); }
  .cell-body { padding:2mm 2.5mm 1.5mm; min-height:51mm; color:#08265b; }
  .fabric-body { display:flex; align-items:flex-start; justify-content:flex-start; padding:3mm 2mm; font-weight:700; font-size:3mm; line-height:1.45; overflow-wrap:anywhere; }
  .measurements { padding:1mm 3mm; min-height:0; overflow:visible; }
  .measure-row { height:6mm; min-height:6mm; display:grid; grid-template-columns:20mm 3mm minmax(0, 1fr); align-items:end; font-size:2.9mm; line-height:1.1; }
  .line-value { border-bottom:1px solid #123e73; min-width:10mm; height:4.5mm; padding-left:1mm; }
  .style-list { padding:2mm 3mm; font-size:3.5mm; }
  .style-row { height:7.5mm; display:flex; align-items:center; gap:2mm; white-space:nowrap; }
  .check { font-size:5.5mm; line-height:1; width:5mm; }
  .other-line { border-bottom:1px solid #123e73; display:inline-block; min-width:13mm; height:5mm; }
  .notes-body { padding:3mm; font-size:3.2mm; line-height:1.45; white-space:pre-wrap; overflow:hidden; }
  .footer { display:grid; grid-template-columns:58% 21% 21%; gap:2.5mm; }
  .footer-box { border:1px solid #9bbbdc; border-radius:2.5mm; min-height:24mm; padding:3mm 4mm; background:#eaf4fc; }
  .footer-box.delivery-date { background:#fff0df; border-color:#e9cda7; }
  .footer-box.signature { background:#fff; }
  .footer-title { font-size:3.7mm; font-weight:800; }
  .footer-content { margin-top:3mm; font-size:3.3mm; white-space:pre-wrap; line-height:1.7; }
  .signature-line, .date-line { border-bottom:1px solid #0a376d; height:7mm; margin-top:3mm; }
  .print-note { display:none; }
</style>
</head>
<body>
<div class="sheet">
  <div class="top">
    <div class="brand">
      <img class="brand-logo" src="${esc(companyLogoUrl)}" alt="Artisan Apparels" />
    </div>
    <div class="banner"><div class="banner-title">ORDER SHEET</div></div>
    <div class="meta">
      <div class="meta-row"><b>Order No.</b><b>:</b><div class="meta-line">${esc(order.order_no)}</div></div>
      <div class="meta-row"><b>Date</b><b>:</b><div class="meta-line">${esc(formatDate(order.order_date))}</div></div>
    </div>
  </div>

  <div class="customer-bar">
    <div class="customer-cell">Customer ID : <span class="fill-line">${esc(order.customer_code)}</span></div>
    <div class="customer-cell">Customer Name : <span class="fill-line">${esc(order.customer_name)}</span></div>
    <div class="customer-cell">Contact No. : <span class="fill-line">${esc(order.contact_no)}</span></div>
  </div>

  <div class="section shirt">
    <div class="section-head"><div class="garment-title"><span class="garment-icon shirt-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4 4 6 2 11l4 2 2-3v10h8V10l2 3 4-2-2-5-4-2c-.8 1.3-2 2-4 2s-3.2-.7-4-2Z"/></svg></span>SHIRT</div><div></div></div>
    <div class="section-grid">
      <div class="cell"><div class="cell-head">Fabric Code</div><div class="cell-body fabric-body" style="white-space:pre-line;align-items:flex-start;justify-content:flex-start;padding:3mm;font-size:3mm;line-height:1.5">${esc(formatFabricCodes(fabricCodes?.shirt, order.shirt_fabric_code))}</div></div>
      <div class="cell"><div class="cell-head">Standard Size</div><div class="cell-body fabric-body">${esc(order.shirt_standard_size)}</div></div>
      <div class="cell"><div class="cell-head">Measurements (inches)</div><div class="cell-body measurements">${measureRows(shirtMeasurements)}</div></div>
      <div class="cell"><div class="cell-head">Style</div><div class="cell-body style-list">
        <div class="style-row"><span class="check">${checked(shirtStyle,"Half")}</span>Half</div>
        <div class="style-row"><span class="check">${checked(shirtStyle,"Full")}</span>Full</div>
        <div class="style-row"><span class="check">${checked(shirtStyle,"Slim Fit")}</span>Slim Fit</div>
        <div class="style-row"><span class="check">${checked(shirtStyle,"Regular Fit")}</span>Regular Fit</div>
        <div class="style-row"><span class="check">${checked(shirtStyle,"Others")}</span>Others : <span class="other-line">${esc(order.shirt_style?.other)}</span></div>
      </div></div>
      <div class="cell"><div class="cell-head">Notes</div><div class="cell-body notes-body">${esc(order.shirt_notes)}</div></div>
    </div>
  </div>

  <div class="section pant">
    <div class="section-head"><div class="garment-title"><span class="garment-icon pant-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12l1 18h-5l-2-8-2 8H5L6 3Z"/><path d="M6 7h12M12 3v10"/></svg></span>PANT</div><div></div></div>
    <div class="section-grid">
      <div class="cell"><div class="cell-head">Fabric Code</div><div class="cell-body fabric-body" style="white-space:pre-line;align-items:flex-start;justify-content:flex-start;padding:3mm;font-size:3mm;line-height:1.5">${esc(formatFabricCodes(fabricCodes?.pant, order.pant_fabric_code))}</div></div>
      <div class="cell"><div class="cell-head">Standard Size</div><div class="cell-body fabric-body">${esc(order.pant_standard_size)}</div></div>
      <div class="cell"><div class="cell-head">Measurements (inches)</div><div class="cell-body measurements">${measureRows(pantMeasurements)}</div></div>
      <div class="cell"><div class="cell-head">Style</div><div class="cell-body style-list">
        <div class="style-row"><span class="check">${checked(pantStyle,"Regular Fit")}</span>Regular Fit</div>
        <div class="style-row"><span class="check">${checked(pantStyle,"Slim Fit")}</span>Slim Fit</div>
        <div class="style-row"><span class="check">${checked(pantStyle,"Straight Fit")}</span>Straight Fit</div>
        <div class="style-row"><span class="check">${checked(pantStyle,"Tapered Fit")}</span>Tapered Fit</div>
        <div class="style-row"><span class="check">${checked(pantStyle,"Others")}</span>Others : <span class="other-line">${esc(order.pant_style?.other)}</span></div>
      </div></div>
      <div class="cell"><div class="cell-head">Notes</div><div class="cell-body notes-body">${esc(order.pant_notes)}</div></div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-box"><div class="footer-title">Delivery Address :</div><div class="footer-content">${esc(formatDeliveryAddress(order))}</div></div>
    <div class="footer-box delivery-date"><div class="footer-title">Delivery Date :</div><div class="date-line">${esc(formatDate(order.delivery_date))}</div></div>
    <div class="footer-box signature"><div class="footer-title">Order Booked By :</div><div class="signature-line">${esc(order.order_booked_by)}</div></div>
  </div>
</div>
<script>window.onload=()=>setTimeout(()=>window.print(),250);</script>
</body></html>`;

  const printWindow = window.open("", "_blank", "width=1600,height=1100");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
};
