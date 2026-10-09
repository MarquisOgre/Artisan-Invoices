import { useEffect, useMemo, useState } from "react";
import { Eye, FilePlus2, Pencil, Printer, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { printOrderSheet } from "@/components/order-print/OrderSheetPrint";

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
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_pincode: string | null;
  delivery_date: string | null;
  status?: string;
  order_booked_by: string | null;
  created_at: string;
};

type Props = {
  onCreateNew: () => void;
  onEdit: (order: OrderSheet) => void;
  onConvertToInvoice: (order: OrderSheet) => void;
};

const safeObject = (value: unknown): Record<string, string> =>
  value && typeof value === "object" ? Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")])) : {};

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

const escapeHtml = (value: unknown) =>
  String(value ?? "-").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type OrderFabricCodes = { shirt: string[]; pant: string[] };

const formatFabricCodes = (codes: string[] | undefined, fallback: string | null) => {
  const unique = [...new Set((codes || []).map(code => code.trim()).filter(Boolean))];
  if (!unique.length && fallback) unique.push(fallback);
  return unique.join("\n") || "-";
};

const OrderSheetList = ({ onCreateNew, onEdit, onConvertToInvoice }: Props) => {
  const { user } = useAuth();
  const { companySettings } = useSettings();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<OrderSheet | null>(null);
  const [fabricCodesByOrder, setFabricCodesByOrder] = useState<Record<string, OrderFabricCodes>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const ORDER_STATUSES = ["Pending", "In Progress", "Ready", "Delivered", "Cancelled"] as const;

  const handleStatusChange = async (order: OrderSheet, status: string) => {
    if ((order.status || "Pending") === status) return;
    setUpdatingStatusId(order.id);
    try {
      const { error } = await (supabase as any)
        .from("order_sheets")
        .update({ status })
        .eq("id", order.id);
      if (error) throw error;
      setOrders(current => current.map(item => item.id === order.id ? { ...item, status } : item));
      if (selected?.id === order.id) setSelected(current => current ? { ...current, status } : current);
      toast({ title: "Order status updated", description: `${order.order_no}: ${status}` });
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast({ title: "Unable to update status", description: error?.message || "Please try again.", variant: "destructive" });
    } finally {
      setUpdatingStatusId(null);
    }
  };

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
      const normalizedOrders = (data || []).map((row: any) => ({
        ...row,
        shirt_measurements: safeObject(row.shirt_measurements),
        pant_measurements: safeObject(row.pant_measurements),
        shirt_style: row.shirt_style || {},
        pant_style: row.pant_style || {},
      }));
      setOrders(normalizedOrders);
      const grouped: Record<string, OrderFabricCodes> = {};
      const orderIds = normalizedOrders.map((row: any) => row.id);

      if (orderIds.length) {
        // Fetch the junction rows and fabric records separately. This avoids
        // depending on PostgREST nested-relationship response shape.
        const { data: fabricRows, error: fabricError } = await (supabase as any)
          .from("order_sheet_fabrics")
          .select("order_sheet_id, garment_type, sort_order, fabric_id")
          .in("order_sheet_id", orderIds)
          .order("sort_order", { ascending: true });

        if (fabricError) throw fabricError;

        const fabricIds = [...new Set((fabricRows || []).map((row: any) => row.fabric_id).filter(Boolean))];
        const { data: fabricRecords, error: fabricsError } = fabricIds.length
          ? await (supabase as any).from("fabrics").select("id, code").in("id", fabricIds)
          : { data: [], error: null };

        if (fabricsError) throw fabricsError;

        const codeByFabricId = new Map((fabricRecords || []).map((fabric: any) => [String(fabric.id), String(fabric.code || "").trim()]));
        for (const row of fabricRows || []) {
          const orderId = String(row.order_sheet_id);
          if (!grouped[orderId]) grouped[orderId] = { shirt: [], pant: [] };
          const code = codeByFabricId.get(String(row.fabric_id)) || "";
          const garment = row.garment_type === "shirt" ? "shirt" : row.garment_type === "pant" ? "pant" : null;
          if (garment && code && !grouped[orderId][garment].includes(code)) grouped[orderId][garment].push(code);
        }
      }
      for (const order of normalizedOrders) {
        if (!grouped[order.id]) grouped[order.id] = { shirt: [], pant: [] };
        if (!grouped[order.id].shirt.length && order.shirt_fabric_code) grouped[order.id].shirt.push(order.shirt_fabric_code);
        if (!grouped[order.id].pant.length && order.pant_fabric_code) grouped[order.id].pant.push(order.pant_fabric_code);
      }
      setFabricCodesByOrder(grouped);
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
                <TableHead>Order Form ID</TableHead><TableHead>Date</TableHead><TableHead>Customer ID</TableHead><TableHead>Customer</TableHead><TableHead>Delivery Date</TableHead><TableHead>Order Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading order forms...</TableCell></TableRow> :
                filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No saved order forms found.</TableCell></TableRow> :
                filtered.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-semibold">{order.order_no}</TableCell>
                    <TableCell>{formatDate(order.order_date)}</TableCell>
                    <TableCell className="font-medium">{order.customer_code || "-"}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{formatDate(order.delivery_date)}</TableCell>
                    <TableCell>
                      <select
                        aria-label={`Order status for ${order.order_no}`}
                        value={order.status || "Pending"}
                        onChange={event => handleStatusChange(order, event.target.value)}
                        disabled={updatingStatusId === order.id}
                        className="h-9 min-w-[135px] rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-wait disabled:opacity-60"
                      >
                        {ORDER_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(order)}><Eye className="mr-1 h-4 w-4" />View</Button>
                        <Button size="sm" variant="outline" className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => onConvertToInvoice(order)} title="Create an invoice from this order form"><FilePlus2 className="mr-1 h-4 w-4" />Convert to Invoice</Button>
                        <Button size="sm" variant="outline" className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => onEdit(order)} title="Edit this existing order form"><Pencil className="mr-1 h-4 w-4" />Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => printOrderSheet(order, fabricCodesByOrder[order.id], companySettings)}><Printer className="mr-1 h-4 w-4" />Print</Button>
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
              {selected && <Button variant="outline" onClick={() => printOrderSheet(selected, fabricCodesByOrder[selected.id], companySettings)}><Printer className="mr-2 h-4 w-4" />Print</Button>}
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
                ["Fabric Code", formatFabricCodes(fabricCodesByOrder[selected.id]?.shirt, selected.shirt_fabric_code)],
                ["Standard Size", selected.shirt_standard_size || "-"],
              ]}>
                {measurementRows(selected.shirt_measurements)}
                <div className="mt-3"><b>Style:</b> {[...(selected.shirt_style?.selected || []), selected.shirt_style?.other || ""].filter(Boolean).join(", ") || "-"}</div>
                <div className="mt-2"><b>Notes:</b> {selected.shirt_notes || "-"}</div>
              </DetailSection>
              <DetailSection title="PANT" values={[
                ["Fabric Code", formatFabricCodes(fabricCodesByOrder[selected.id]?.pant, selected.pant_fabric_code)],
                ["Standard Size", selected.pant_standard_size || "-"],
              ]}>
                {measurementRows(selected.pant_measurements)}
                <div className="mt-3"><b>Style:</b> {[...(selected.pant_style?.selected || []), selected.pant_style?.other || ""].filter(Boolean).join(", ") || "-"}</div>
                <div className="mt-2"><b>Notes:</b> {selected.pant_notes || "-"}</div>
              </DetailSection>
              <div className="grid gap-4 md:grid-cols-3">
                <Info label="Delivery Address" value={formatDeliveryAddress(selected)} />
                <Info label="Delivery Date" value={formatDate(selected.delivery_date)} />
                <Info label="Order Booked By" value={selected.order_booked_by || "-"} />
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
