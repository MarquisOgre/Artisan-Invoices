import { useEffect, useMemo, useState } from "react";
import { Eye, Printer, Plus, Search, ArrowLeft } from "lucide-react";
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
  shirt_patterns: string[];
  shirt_standard_size: string | null;
  shirt_measurements: Record<string, string>;
  shirt_style: { selected?: string[]; other?: string };
  shirt_notes: string | null;
  pant_fabric_code: string | null;
  pant_patterns: string[];
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

const safeArray = (value: unknown): string[] => Array.isArray(value) ? value.filter(Boolean).map(String) : [];
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
  const shirtMeasurements = Object.entries(order.shirt_measurements || {})
    .map(([key, value]) => `<tr><td>${escapeHtml(key.replace(/([A-Z])/g, " $1"))}</td><td>${escapeHtml(value || "-")}</td></tr>`).join("");
  const pantMeasurements = Object.entries(order.pant_measurements || {})
    .map(([key, value]) => `<tr><td>${escapeHtml(key.replace(/([A-Z])/g, " $1"))}</td><td>${escapeHtml(value || "-")}</td></tr>`).join("");

  const html = `<!doctype html>
<html><head><title>${escapeHtml(order.order_no)}</title>
<style>
@page { size: A4 portrait; margin: 10mm; }
* { box-sizing: border-box; }
body { font-family: Arial, sans-serif; color: #111; margin: 0; font-size: 11px; }
.header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #111; padding-bottom:10px; margin-bottom:12px; }
.brand { font-size:24px; font-weight:800; letter-spacing:2px; }
.title { font-size:18px; font-weight:700; margin-top:3px; }
.meta { text-align:right; line-height:1.6; }
.info { display:grid; grid-template-columns:1fr 1fr 1fr; border:1px solid #222; margin-bottom:12px; }
.info div { padding:7px; border-right:1px solid #222; }
.info div:last-child { border-right:0; }
.section { border:1px solid #222; margin-bottom:12px; break-inside:avoid; }
.section-title { background:#111; color:#fff; font-weight:700; padding:7px 9px; font-size:13px; }
.grid { display:grid; grid-template-columns:1fr 1.2fr 1fr 1.3fr 1fr; }
.cell { padding:7px; border-right:1px solid #222; border-top:1px solid #222; min-height:32px; }
.cell:nth-child(5n) { border-right:0; }
.label { font-weight:700; font-size:9px; text-transform:uppercase; color:#555; margin-bottom:3px; }
table { width:100%; border-collapse:collapse; }
td { border-top:1px solid #ddd; padding:4px 5px; }
td:first-child { font-weight:600; width:58%; }
.notes { min-height:55px; }
.footer { display:grid; grid-template-columns:2fr 1fr; gap:12px; margin-top:12px; }
.box { border:1px solid #222; padding:8px; min-height:70px; }
@media print { button { display:none !important; } }
</style></head><body>
<div class="header"><div><div class="brand">ARTISAN APPARELS</div><div class="title">SHIRT &amp; PANT ORDER FORM</div></div>
<div class="meta"><b>Order Form ID:</b> ${escapeHtml(order.order_no)}<br><b>Date:</b> ${escapeHtml(formatDate(order.order_date))}</div></div>
<div class="info">
<div><b>Customer ID</b><br>${escapeHtml(order.customer_code)}</div>
<div><b>Customer Name</b><br>${escapeHtml(order.customer_name)}</div>
<div><b>Contact No.</b><br>${escapeHtml(order.contact_no)}</div>
</div>
<div class="section"><div class="section-title">SHIRT</div><div class="grid">
<div class="cell"><div class="label">Fabric Code</div>${escapeHtml(order.shirt_fabric_code)}</div>
<div class="cell"><div class="label">Pattern / Design</div>${escapeHtml(order.shirt_patterns.join(", ") || "-")}</div>
<div class="cell"><div class="label">Standard Size</div>${escapeHtml(order.shirt_standard_size)}</div>
<div class="cell"><div class="label">Measurements</div><table>${shirtMeasurements || "<tr><td>-</td><td>-</td></tr>"}</table></div>
<div class="cell"><div class="label">Style</div>${escapeHtml([...(order.shirt_style?.selected || []), order.shirt_style?.other || ""].filter(Boolean).join(", ") || "-")}</div>
</div><div class="cell notes"><div class="label">Notes</div>${escapeHtml(order.shirt_notes)}</div></div>
<div class="section"><div class="section-title">PANT</div><div class="grid">
<div class="cell"><div class="label">Fabric Code</div>${escapeHtml(order.pant_fabric_code)}</div>
<div class="cell"><div class="label">Pattern / Design</div>${escapeHtml(order.pant_patterns.join(", ") || "-")}</div>
<div class="cell"><div class="label">Standard Size</div>${escapeHtml(order.pant_standard_size)}</div>
<div class="cell"><div class="label">Measurements</div><table>${pantMeasurements || "<tr><td>-</td><td>-</td></tr>"}</table></div>
<div class="cell"><div class="label">Style</div>${escapeHtml([...(order.pant_style?.selected || []), order.pant_style?.other || ""].filter(Boolean).join(", ") || "-")}</div>
</div><div class="cell notes"><div class="label">Notes</div>${escapeHtml(order.pant_notes)}</div></div>
<div class="footer"><div class="box"><b>Delivery Address</b><br><br>${escapeHtml(order.delivery_address)}</div>
<div class="box"><b>Delivery Date</b><br><br>${escapeHtml(formatDate(order.delivery_date))}<br><br><b>Customer Signature</b><br>${escapeHtml(order.customer_signature)}</div></div>
<script>window.onload=()=>window.print();</script></body></html>`;

  const printWindow = window.open("", "_blank", "width=1000,height=800");
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
        shirt_patterns: safeArray(row.shirt_patterns),
        pant_patterns: safeArray(row.pant_patterns),
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
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Artisan Apparels</p>
          <h1 className="text-2xl font-bold text-primary">Existing Order Forms</h1>
          <p className="text-sm text-muted-foreground">View and print saved Shirt &amp; Pant order forms.</p>
        </div>
        <Button onClick={onCreateNew}><Plus className="mr-2 h-4 w-4" />New Order Sheet</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Order Forms ({filtered.length})</CardTitle>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search Order ID, Customer ID or name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
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
                ["Pattern / Design", selected.shirt_patterns.join(", ") || "-"],
                ["Standard Size", selected.shirt_standard_size || "-"],
              ]}>
                {measurementRows(selected.shirt_measurements)}
                <div className="mt-3"><b>Style:</b> {[...(selected.shirt_style?.selected || []), selected.shirt_style?.other || ""].filter(Boolean).join(", ") || "-"}</div>
                <div className="mt-2"><b>Notes:</b> {selected.shirt_notes || "-"}</div>
              </DetailSection>
              <DetailSection title="PANT" values={[
                ["Fabric Code", selected.pant_fabric_code || "-"],
                ["Pattern / Design", selected.pant_patterns.join(", ") || "-"],
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
