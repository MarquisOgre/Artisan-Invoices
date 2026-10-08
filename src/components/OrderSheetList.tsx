import { useEffect, useMemo, useState } from "react";
import { Eye, Printer, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type OrderSheet = {
  id: string;
  order_no: string;
  order_date: string;
  customer_id: string | null;
  customer_code: string | null;
  customer_name: string;
  contact_no: string | null;
  shirt_fabric_code: string | null;
  shirt_standard_size: string | null;
  shirt_measurements: Record<string, string>;
  shirt_style: { selected?: string[]; other?: string };
  shirt_notes: string | null;
  pant_fabric_code: string | null;
  pant_standard_size: string | null;
  pant_measurements: Record<string, string>;
  pant_style: { selected?: string[]; other?: string };
  pant_notes: string | null;
  delivery_address: string | null;
  delivery_date: string | null;
  customer_signature: string | null;
  created_at: string;
};

type Props = {
  onCreateNew: () => void;
};

const safeObject = (value: unknown): Record<string, string> =>
  value && typeof value === "object" ? Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")])) : {};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-IN");
};

const escapeHtml = (value: unknown) =>
  String(value ?? "-").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const printOrderSheet = (order: OrderSheet) => {
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
  const measureRows = (rows: string[][]) => rows.map(([label, value]) =>
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
  .top { height: 26mm; display: grid; grid-template-columns: 46% 35% 19%; align-items: center; }
  .brand { display:flex; align-items:center; height:100%; padding-left:6mm; gap:5mm; }
  .brand-mark { width:19mm; height:19mm; border-radius:50%; background:#0b2c58; position:relative; flex:0 0 auto; }
  .brand-mark:before { content:""; position:absolute; left:5.5mm; top:4.2mm; width:0; height:0; border-left:5.5mm solid transparent; border-right:5.5mm solid transparent; border-bottom:8mm solid white; }
  .brand-mark:after { content:""; position:absolute; left:8.3mm; top:10mm; width:5.4mm; height:6.7mm; background:white; clip-path:polygon(50% 0,100% 100%,0 100%); }
  .brand-name { font-family: Georgia, "Times New Roman", serif; font-size:10.5mm; line-height:.85; font-weight:700; letter-spacing:.8mm; color:#0a2b59; }
  .brand-sub { font-size:3.1mm; line-height:1.35; letter-spacing:1.1mm; font-weight:700; margin-top:2mm; }
  .divider { height:20mm; border-left:1px solid #5a5a5a; margin-left:2mm; padding-left:5mm; }
  .banner { height:24mm; background:#082f60; color:white; border-radius:0 0 5mm 5mm; clip-path:polygon(7% 0,100% 0,91% 100%,13% 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; margin-top:-1mm; }
  .banner-title { font-size:8.2mm; font-weight:800; letter-spacing:.4mm; line-height:1; }
  .banner-sub { font-size:4mm; font-weight:700; letter-spacing:1.5mm; margin-top:3mm; }
  .meta { background:#e7f1fb; border-radius:3mm; padding:3.5mm 4mm; font-size:3.8mm; line-height:1.9; margin-left:4mm; }
  .meta-row { display:grid; grid-template-columns:20mm 4mm 1fr; align-items:end; }
  .meta-line { border-bottom:1px solid #0a376d; height:5mm; }
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
  .section-grid { display:grid; grid-template-columns:14.5% 14.5% 32% 13.5% 25.5%; background:#fff; min-height:39mm; max-height:39mm; }
  .cell { border-right:1px solid currentColor; }
  .cell:last-child { border-right:0; }
  .cell-head { height:7mm; background:linear-gradient(#e6f1fb,#d7e9f8); display:flex; align-items:center; justify-content:center; font-size:3.6mm; font-weight:800; text-align:center; color:#0b2d62; border-bottom:1px solid currentColor; }
  .pant .cell-head { background:linear-gradient(#fff2df,#f7e7d0); }
  .cell-body { padding:2mm 2.5mm 1.5mm; min-height:32mm; color:#08265b; }
  .fabric-body { display:flex; align-items:flex-start; justify-content:center; padding-top:7mm; font-weight:700; font-size:3.4mm; }
  .measurements { padding:2mm 3mm; }
  .measure-row { height:6mm; display:grid; grid-template-columns:24mm 4mm 1fr; align-items:end; font-size:3.4mm; }
  .line-value { border-bottom:1px solid #123e73; min-width:10mm; height:5mm; padding-left:1mm; }
  .style-list { padding:2mm 3mm; font-size:3.5mm; }
  .style-row { height:6mm; display:flex; align-items:center; gap:3mm; white-space:nowrap; }
  .check { font-size:5.5mm; line-height:1; width:5mm; }
  .other-line { border-bottom:1px solid #123e73; display:inline-block; min-width:13mm; height:5mm; }
  .notes-body { padding:3mm; font-size:3.2mm; line-height:1.45; white-space:pre-wrap; overflow:hidden; }
  .footer { display:grid; grid-template-columns:58% 21% 21%; gap:2.5mm; }
  .footer-box { border:1px solid #9bbbdc; border-radius:2.5mm; min-height:19mm; padding:3mm 4mm; background:#eaf4fc; }
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
      <div class="brand-mark"></div>
      <div>
        <div class="brand-name">ARTISAN<br/><span>APPARELS</span></div>
      </div>
      <div class="divider"><div class="brand-sub">PREMIUM<br/>FABRICS<br/>BESPOKE<br/>SOLUTIONS</div></div>
    </div>
    <div class="banner"><div class="banner-title">ORDER SHEET</div><div class="banner-sub">SHIRT &amp; PANT</div></div>
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
    <div class="section-head"><div class="garment-title"><span class="garment-icon shirt-icon"></span>SHIRT</div><div></div></div>
    <div class="section-grid">
      <div class="cell"><div class="cell-head">Fabric Code</div><div class="cell-body fabric-body">${esc(order.shirt_fabric_code)}</div></div>
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
    <div class="section-head"><div class="garment-title"><span class="garment-icon pant-icon"></span>PANT</div><div></div></div>
    <div class="section-grid">
      <div class="cell"><div class="cell-head">Fabric Code</div><div class="cell-body fabric-body">${esc(order.pant_fabric_code)}</div></div>
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
    <div class="footer-box"><div class="footer-title">Delivery Address :</div><div class="footer-content">${esc(order.delivery_address)}</div></div>
    <div class="footer-box delivery-date"><div class="footer-title">Delivery Date :</div><div class="date-line">${esc(formatDate(order.delivery_date))}</div></div>
    <div class="footer-box signature"><div class="footer-title">Customer Signature :</div><div class="signature-line">${esc(order.customer_signature)}</div></div>
  </div>
</div>
<script>window.onload=()=>setTimeout(()=>window.print(),250);</script>
</body></html>`;

  const printWindow = window.open("", "_blank", "width=1600,height=1100");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
};

const OrderSheetList = ({ onCreateNew }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<OrderSheet | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (order: OrderSheet) => {
    const confirmed = window.confirm(
      `Delete Order Form ${order.order_no} for ${order.customer_name}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(order.id);
    try {
      const { error } = await (supabase as any)
        .from("order_sheets")
        .delete()
        .eq("id", order.id);
      if (error) throw error;

      setOrders(current => current.filter(item => item.id !== order.id));
      if (selected?.id === order.id) setSelected(null);
      toast({ title: "Order form deleted", description: `${order.order_no} was deleted successfully.` });
    } catch (error: any) {
      console.error("Error deleting order sheet:", error);
      toast({
        title: "Unable to delete order form",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("order_sheets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders((data || []).map((row: any) => ({
        ...row,
        shirt_measurements: safeObject(row.shirt_measurements),
        pant_measurements: safeObject(row.pant_measurements),
        shirt_style: row.shirt_style || {},
        pant_style: row.pant_style || {},
      })));
    } catch (error: any) {
      console.error("Error loading order sheets:", error);
      toast({ title: "Unable to load order forms", description: error?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(order =>
      [order.order_no, order.customer_code, order.customer_name, order.contact_no].some(value =>
        String(value || "").toLowerCase().includes(q)
      )
    );
  }, [orders, search]);

  const measurementRows = (measurements: Record<string, string>) =>
    Object.entries(measurements || {}).map(([key, value]) => (
      <div key={key} className="flex justify-between gap-4 border-b py-1 last:border-0">
        <span className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}</span>
        <span className="font-medium">{value || "-"}</span>
      </div>
    ));

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold text-primary">
          Existing Order Forms <span className="text-muted-foreground">({filtered.length})</span>
        </h1>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full sm:w-[430px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 pl-9"
              placeholder="Search Order ID, Customer ID or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={onCreateNew} className="h-11 shrink-0">
            <Plus className="mr-2 h-4 w-4" />New Order Sheet
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Order Form ID</TableHead><TableHead>Date</TableHead><TableHead>Customer ID</TableHead><TableHead>Customer</TableHead><TableHead>Delivery Date</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading order forms...</TableCell></TableRow> :
                filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No saved order forms found.</TableCell></TableRow> :
                filtered.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-semibold">{order.order_no}</TableCell>
                    <TableCell>{formatDate(order.order_date)}</TableCell>
                    <TableCell className="font-medium">{order.customer_code || "-"}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{formatDate(order.delivery_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(order)}><Eye className="mr-1 h-4 w-4" />View</Button>
                        <Button size="sm" variant="outline" onClick={() => printOrderSheet(order)}><Printer className="mr-1 h-4 w-4" />Print</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(order)}
                          disabled={deletingId === order.id}
                          title="Delete Order Form"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />{deletingId === order.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center justify-between gap-2">
              <span>{selected?.order_no} — {selected?.customer_name}</span>
              {selected && <Button variant="outline" onClick={() => printOrderSheet(selected)}><Printer className="mr-2 h-4 w-4" />Print</Button>}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-4">
                <Info label="Order Form ID" value={selected.order_no} />
                <Info label="Order Date" value={formatDate(selected.order_date)} />
                <Info label="Customer ID" value={selected.customer_code || "-"} />
                <Info label="Customer Name" value={selected.customer_name} />
                <Info label="Contact No." value={selected.contact_no || "-"} />
              </div>
              <DetailSection title="SHIRT" values={[
                ["Fabric Code", selected.shirt_fabric_code || "-"],
                ["Standard Size", selected.shirt_standard_size || "-"],
              ]}>
                {measurementRows(selected.shirt_measurements)}
                <div className="mt-3"><b>Style:</b> {[...(selected.shirt_style?.selected || []), selected.shirt_style?.other || ""].filter(Boolean).join(", ") || "-"}</div>
                <div className="mt-2"><b>Notes:</b> {selected.shirt_notes || "-"}</div>
              </DetailSection>
              <DetailSection title="PANT" values={[
                ["Fabric Code", selected.pant_fabric_code || "-"],
                ["Standard Size", selected.pant_standard_size || "-"],
              ]}>
                {measurementRows(selected.pant_measurements)}
                <div className="mt-3"><b>Style:</b> {[...(selected.pant_style?.selected || []), selected.pant_style?.other || ""].filter(Boolean).join(", ") || "-"}</div>
                <div className="mt-2"><b>Notes:</b> {selected.pant_notes || "-"}</div>
              </DetailSection>
              <div className="grid gap-4 md:grid-cols-3">
                <Info label="Delivery Address" value={selected.delivery_address || "-"} />
                <Info label="Delivery Date" value={formatDate(selected.delivery_date)} />
                <Info label="Customer Signature" value={selected.customer_signature || "-"} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div><div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div><div className="mt-1 whitespace-pre-wrap font-medium">{value}</div></div>
);

const DetailSection = ({ title, values, children }: { title: string; values: string[][]; children: React.ReactNode }) => (
  <Card><CardHeader className="py-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>
    <div className="grid gap-3 border-b pb-3 sm:grid-cols-3">{values.map(([label, value]) => <Info key={label} label={label} value={value} />)}</div>
    <div className="mt-3">{children}</div>
  </CardContent></Card>
);

export default OrderSheetList;
