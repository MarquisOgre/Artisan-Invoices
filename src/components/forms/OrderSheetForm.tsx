import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, MapPin, Plus, RotateCcw, Save, Scissors, Shirt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { type FabricOption } from "@/components/forms/FabricCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const SHIRT_MEASUREMENTS = [
  ["shoulder", "Shoulder"],
  ["chest", "Chest"],
  ["frontLength", "Front Length"],
  ["sleeveLength", "Sleeve Length"],
  ["neck", "Neck"],
  ["waist", "Waist"],
  ["bottomHem", "Bottom Hem"],
] as const;

const PANT_MEASUREMENTS = [
  ["waist", "Waist"],
  ["hip", "Hip"],
  ["thigh", "Thigh"],
  ["length", "Length"],
  ["bottom", "Bottom"],
  ["rise", "Rise"],
  ["others", "Others"],
] as const;

const SHIRT_STYLES = ["Half", "Full", "Slim Fit", "Regular Fit"];
const PANT_STYLES = ["Regular Fit", "Slim Fit", "Straight Fit", "Tapered Fit"];

type Customer = {
  id: string;
  customer_code?: string | null;
  name: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
};

type OrderSheetFormProps = {
  customers: Customer[];
  onSaved?: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);

const formatCustomerAddress = (customer: Customer) =>
  [customer.address, customer.city, customer.state, customer.pincode]
    .map(value => String(value || "").trim())
    .filter(Boolean)
    .join(", ");

const emptyMeasurements = (fields: readonly (readonly [string, string])[]) =>
  Object.fromEntries(fields.map(([key]) => [key, ""]));

const requestOrderNo = async (orderDate: string) => {
  const { data, error } = await (supabase as any).rpc("next_order_form_id", {
    p_order_date: orderDate,
  });
  if (error || !data) return "";
  return String(data);
};

const OrderSheetForm = ({ customers, onSaved }: OrderSheetFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const [orderDate, setOrderDate] = useState(today());
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [fabrics, setFabrics] = useState<FabricOption[]>([]);
  const [shirtFabrics, setShirtFabrics] = useState<FabricOption[]>([]);
  const [pantFabrics, setPantFabrics] = useState<FabricOption[]>([]);
  const [fabricPickerOpen, setFabricPickerOpen] = useState(false);
  const [fabricPickerGarment, setFabricPickerGarment] = useState<"shirt" | "pant">("shirt");
  const [fabricPickerValues, setFabricPickerValues] = useState<string[]>([]);

  const existingCustomer = useMemo(
    () => customers.find(customer => customer.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [customerSignature, setCustomerSignature] = useState("");

  const [shirtFabricCode, setShirtFabricCode] = useState("");
  const [shirtFabricId, setShirtFabricId] = useState("");
  const [shirtStandardSize, setShirtStandardSize] = useState("");
  const [shirtMeasurements, setShirtMeasurements] = useState<Record<string, string>>(
    emptyMeasurements(SHIRT_MEASUREMENTS)
  );
  const [shirtStyles, setShirtStyles] = useState<string[]>([]);
  const [shirtOtherStyle, setShirtOtherStyle] = useState("");
  const [shirtNotes, setShirtNotes] = useState("");

  const [pantFabricCode, setPantFabricCode] = useState("");
  const [pantFabricId, setPantFabricId] = useState("");
  const [pantStandardSize, setPantStandardSize] = useState("");
  const [pantMeasurements, setPantMeasurements] = useState<Record<string, string>>(
    emptyMeasurements(PANT_MEASUREMENTS)
  );
  const [pantStyles, setPantStyles] = useState<string[]>([]);
  const [pantOtherStyle, setPantOtherStyle] = useState("");
  const [pantNotes, setPantNotes] = useState("");

  const handleCustomerChange = (value: string) => {
    if (value === "new-customer") {
      setSelectedCustomerId("");
      setIsNewCustomer(true);
      setCustomerName("");
      setCustomerCode("");
      setContactNo("");
      setDeliveryAddress("");
      return;
    }

    const customer = customers.find(item => item.id === value);
    if (!customer) return;

    setIsNewCustomer(false);
    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerCode(customer.customer_code || "");
    setContactNo(customer.phone || "");
    setDeliveryAddress(formatCustomerAddress(customer));
  };

  const customerAddress = existingCustomer?.address?.trim() || "";
  const hasCustomerAddress = Boolean(customerAddress);

  useEffect(() => {
    setOrderNo("");
  }, [orderDate]);

  useEffect(() => {
    const loadFabrics = async () => {
      const { data, error } = await supabase
        .from("fabrics")
        .select("id, code, brand, article, design, finish, count_spec, composition, swatch_url, category, is_active")
        .eq("is_active", true)
        .order("code", { ascending: true });
      if (error) {
        console.error("Error loading fabrics:", error);
        toast({ title: "Unable to load fabrics", description: error.message, variant: "destructive" });
        return;
      }
      setFabrics((data || []) as FabricOption[]);
    };
    loadFabrics();
  }, [toast]);

  const toggleStyle = (
    value: string,
    selected: string[],
    setSelected: (value: string[]) => void
  ) => {
    setSelected(
      selected.includes(value)
        ? selected.filter(item => item !== value)
        : [...selected, value]
    );
  };

  const resetForm = () => {
    setOrderNo("");
    setOrderDate(today());
    setCustomerCode("");
    setCustomerName("");
    setContactNo("");
    setSelectedCustomerId("");
    setIsNewCustomer(false);
    setDeliveryAddress("");
    setDeliveryDate("");
    setCustomerSignature("");
    setShirtFabrics([]);
    setShirtFabricCode("");
    setShirtFabricId("");
    setShirtStandardSize("");
    setShirtMeasurements(emptyMeasurements(SHIRT_MEASUREMENTS));
    setShirtStyles([]);
    setShirtOtherStyle("");
    setShirtNotes("");
    setPantFabrics([]);
    setPantFabricCode("");
    setPantFabricId("");
    setPantStandardSize("");
    setPantMeasurements(emptyMeasurements(PANT_MEASUREMENTS));
    setPantStyles([]);
    setPantOtherStyle("");
    setPantNotes("");
  };

  const syncPrimaryFabric = (
    selected: FabricOption[],
    setSelected: React.Dispatch<React.SetStateAction<FabricOption[]>>,
    setId: (value: string) => void,
    setCode: (value: string) => void
  ) => {
    setSelected(selected);
    setId(selected[0]?.id || "");
    setCode(selected[0]?.code || "");
  };

  const openFabricPicker = (garment: "shirt" | "pant") => {
    const selected = garment === "shirt" ? shirtFabrics : pantFabrics;
    setFabricPickerGarment(garment);
    setFabricPickerValues(selected.map(fabric => fabric.id));
    setFabricPickerOpen(true);
  };

  const toggleFabricPicker = (fabricId: string) => {
    setFabricPickerValues(current =>
      current.includes(fabricId)
        ? current.filter(id => id !== fabricId)
        : [...current, fabricId]
    );
  };

  const applyFabricPicker = () => {
    const selected = fabricPickerValues
      .map(id => fabrics.find(fabric => fabric.id === id))
      .filter((fabric): fabric is FabricOption => Boolean(fabric));

    if (fabricPickerGarment === "shirt") {
      syncPrimaryFabric(selected, setShirtFabrics, setShirtFabricId, setShirtFabricCode);
    } else {
      syncPrimaryFabric(selected, setPantFabrics, setPantFabricId, setPantFabricCode);
    }

    setFabricPickerOpen(false);
  };

  const removeFabric = (garment: "shirt" | "pant", fabricId: string) => {
    if (garment === "shirt") {
      const next = shirtFabrics.filter(fabric => fabric.id !== fabricId);
      syncPrimaryFabric(next, setShirtFabrics, setShirtFabricId, setShirtFabricCode);
    } else {
      const next = pantFabrics.filter(fabric => fabric.id !== fabricId);
      syncPrimaryFabric(next, setPantFabrics, setPantFabricId, setPantFabricCode);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in before saving an order sheet.",
        variant: "destructive",
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please enter the Customer Name.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let customer = existingCustomer;

      if (!customer) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            user_id: user.id,
            name: customerName.trim(),
            phone: contactNo.trim() || null,
            address: deliveryAddress.trim() || null,
          })
          .select("*")
          .single();

        if (customerError) throw customerError;
        customer = newCustomer as Customer;
      }

      if (!customer) {
        throw new Error("Unable to create or load the customer record.");
      }

      const resolvedCustomerCode = customer.customer_code || null;
      const resolvedOrderNo = await requestOrderNo(orderDate);
      if (!resolvedOrderNo) {
        throw new Error("Unable to generate the Order Form ID. Please try again.");
      }

      setCustomerCode(resolvedCustomerCode || "");
      setOrderNo(resolvedOrderNo);

      const payload = {
        user_id: user.id,
        order_no: resolvedOrderNo,
        order_date: orderDate,
        customer_id: customer.id,
        customer_code: resolvedCustomerCode,
        customer_name: customer.name,
        contact_no: contactNo.trim() || customer.phone || null,
        shirt_fabric_id: shirtFabricId || null,
        shirt_fabric_code: shirtFabricCode.trim() || null,
        shirt_standard_size: shirtStandardSize.trim() || null,
        shirt_measurements: shirtMeasurements,
        shirt_style: { selected: shirtStyles, other: shirtOtherStyle.trim() },
        shirt_notes: shirtNotes.trim() || null,
        pant_fabric_id: pantFabricId || null,
        pant_fabric_code: pantFabricCode.trim() || null,
        pant_standard_size: pantStandardSize.trim() || null,
        pant_measurements: pantMeasurements,
        pant_style: { selected: pantStyles, other: pantOtherStyle.trim() },
        pant_notes: pantNotes.trim() || null,
        delivery_address: deliveryAddress.trim() || null,
        delivery_date: deliveryDate || null,
        customer_signature: customerSignature.trim() || null,
      };

      const { data: savedOrder, error } = await (supabase as any)
        .from("order_sheets")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;

      const fabricRows = [
        ...shirtFabrics.map((fabric, index) => ({
          order_sheet_id: savedOrder.id,
          garment_type: "shirt",
          fabric_id: fabric.id,
          sort_order: index,
        })),
        ...pantFabrics.map((fabric, index) => ({
          order_sheet_id: savedOrder.id,
          garment_type: "pant",
          fabric_id: fabric.id,
          sort_order: index,
        })),
      ];

      if (fabricRows.length) {
        const { error: fabricError } = await (supabase as any)
          .from("order_sheet_fabrics")
          .insert(fabricRows);
        if (fabricError) throw fabricError;
      }

      toast({
        title: "Order sheet saved",
        description: `Order ${resolvedOrderNo} for customer ${resolvedCustomerCode || customer.name} has been saved successfully.`,
      });
      onSaved?.();
    } catch (error: any) {
      console.error("Error saving order sheet:", error);
      toast({
        title: "Unable to save order sheet",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-white px-5 py-5 sm:px-8 sm:py-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-blue-50" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0c315c] text-3xl font-black text-white shadow-sm">
                A
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-[#123766] sm:text-3xl">
                    ARTISAN
                  </h1>
                  <span className="hidden h-8 w-px bg-slate-300 sm:block" />
                  <div className="hidden text-[10px] font-semibold uppercase leading-4 tracking-[0.28em] text-[#123766] sm:block">
                    Premium Fabrics
                    <br />
                    Bespoke Solutions
                  </div>
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.28em] text-slate-500">
                  Apparel Measurement & Order Management
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-xl bg-[#eaf2fb] px-5 py-3 text-[#123766]">
                <div className="text-2xl font-black uppercase leading-none sm:text-3xl">
                  Order Sheet
                </div>
                <div className="mt-1 text-center text-xs font-bold uppercase tracking-[0.3em]">
                  Shirt & Pant
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving} className="h-11 px-4">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving} className="h-11 bg-[#2378dc] px-5 hover:bg-[#1c68c2]">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Order"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-y border-slate-200 bg-[#edf5fc] px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <HeaderField label="Customer Name" required>
              <Select
                value={selectedCustomerId || (isNewCustomer ? "new-customer" : "")}
                onValueChange={handleCustomerChange}
              >
                <SelectTrigger className="h-11 border-[#c9dced] bg-white">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-customer">+ Add New Customer</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.customer_code ? ` — ${customer.customer_code}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isNewCustomer && (
                <Input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Enter new customer name"
                  className="mt-2 h-10 bg-white"
                />
              )}
            </HeaderField>

            <HeaderField label="Contact No.">
              <Input
                value={contactNo}
                onChange={e => setContactNo(e.target.value)}
                inputMode="tel"
                placeholder={existingCustomer ? "Auto populated — editable" : "Enter manually"}
                className="h-11 border-[#c9dced] bg-white"
              />
            </HeaderField>

            <HeaderField label="Customer ID">
              <Input
                value={existingCustomer?.customer_code || customerCode}
                readOnly
                className="h-11 border-[#c9dced] bg-white font-semibold text-[#123766]"
                placeholder="Generated automatically"
              />
            </HeaderField>

            <HeaderField label="Order Form ID">
              <Input
                value={orderNo}
                readOnly
                className="h-11 border-[#c9dced] bg-white font-semibold text-[#123766]"
                placeholder="Generated on save"
              />
            </HeaderField>

            <HeaderField label="Date">
              <Input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="h-11 border-[#c9dced] bg-white"
              />
            </HeaderField>
          </div>
        </div>

        <div className="space-y-4 bg-slate-50/70 p-3 sm:p-5">
          <GarmentSection
            title="SHIRT"
            tone="blue"
            icon={<Shirt className="h-10 w-10" strokeWidth={1.6} />}
            selectedFabrics={shirtFabrics}
            onAddFabric={() => openFabricPicker("shirt")}
            onRemoveFabric={fabricId => removeFabric("shirt", fabricId)}
            fabrics={fabrics}
            standardSize={shirtStandardSize}
            setStandardSize={setShirtStandardSize}
            measurements={shirtMeasurements}
            setMeasurements={setShirtMeasurements}
            measurementFields={SHIRT_MEASUREMENTS}
            styles={SHIRT_STYLES}
            selectedStyles={shirtStyles}
            setSelectedStyles={setShirtStyles}
            otherStyle={shirtOtherStyle}
            setOtherStyle={setShirtOtherStyle}
            notes={shirtNotes}
            setNotes={setShirtNotes}
          />

          <GarmentSection
            title="PANT"
            tone="brown"
            icon={<Scissors className="h-10 w-10" strokeWidth={1.6} />}
            selectedFabrics={pantFabrics}
            onAddFabric={() => openFabricPicker("pant")}
            onRemoveFabric={fabricId => removeFabric("pant", fabricId)}
            fabrics={fabrics}
            standardSize={pantStandardSize}
            setStandardSize={setPantStandardSize}
            measurements={pantMeasurements}
            setMeasurements={setPantMeasurements}
            measurementFields={PANT_MEASUREMENTS}
            styles={PANT_STYLES}
            selectedStyles={pantStyles}
            setSelectedStyles={setPantStyles}
            otherStyle={pantOtherStyle}
            setOtherStyle={setPantOtherStyle}
            notes={pantNotes}
            setNotes={setPantNotes}
            updatePattern={updatePattern}
          />

          <div className="grid gap-4 lg:grid-cols-[2.1fr_1fr_1fr]">
            <div className="rounded-xl border border-[#c8dced] bg-[#eef6fd] p-4 sm:p-5">
              <SectionLabel label="Delivery Address" />
              <Textarea
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder={
                  hasCustomerAddress
                    ? "Customer address loaded automatically. You can edit it for this order."
                    : "Enter delivery address..."
                }
                className="min-h-[108px] resize-y border-[#c8dced] bg-white"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  {hasCustomerAddress
                    ? "Address loaded from Customer record."
                    : selectedCustomerId
                      ? "No address saved for this customer — enter it manually."
                      : "For a new customer, enter the delivery address manually."}
                </p>
                {hasCustomerAddress && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setDeliveryAddress(customerAddress)}
                    className="bg-white"
                  >
                    <MapPin className="mr-1.5 h-3.5 w-3.5" />
                    Use Customer Address
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#ead7bf] bg-[#fff6eb] p-4 sm:p-5">
              <SectionLabel label="Delivery Date" />
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-[#7b542c]" />
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="h-11 border-[#ead7bf] bg-white pl-10"
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">Expected customer delivery date.</p>
            </div>

            <div className="rounded-xl border border-[#c8dced] bg-white p-4 sm:p-5">
              <SectionLabel label="Customer Signature" />
              <Input
                value={customerSignature}
                onChange={e => setCustomerSignature(e.target.value)}
                placeholder="Customer name / signature"
                className="h-11 border-[#c8dced] bg-white"
              />
              <div className="mt-8 border-b border-[#123766]" />
            </div>
          </div>
        </div>
          <Dialog open={fabricPickerOpen} onOpenChange={setFabricPickerOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Choose {fabricPickerGarment === "shirt" ? "Shirt" : "Pant"} Fabrics
                </DialogTitle>
              </DialogHeader>

              <div className="rounded-lg border border-slate-200">
                <Command>
                  <CommandInput placeholder="Search fabric code, article, design..." />
                  <CommandList className="max-h-[360px]">
                    <CommandEmpty>No fabric found.</CommandEmpty>
                    <CommandGroup>
                      {fabrics
                        .filter(fabric =>
                          fabric.category === (fabricPickerGarment === "shirt" ? "Shirting" : "Suiting")
                        )
                        .map(fabric => {
                        const selected = fabricPickerValues.includes(fabric.id);
                        return (
                          <CommandItem
                            key={fabric.id}
                            value={`${fabric.code} ${fabric.brand} ${fabric.article} ${fabric.design} ${fabric.finish || ""} ${fabric.composition || ""}`}
                            onSelect={() => toggleFabricPicker(fabric.id)}
                            className="items-start gap-3 px-3 py-2.5"
                          >
                            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "opacity-100" : "opacity-0"}`} />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-[#123766]">{fabric.code}</div>
                              <div className="truncate text-xs text-muted-foreground">
                                {fabric.article} · {fabric.design}
                                {fabric.composition ? ` · ${fabric.composition}` : ""}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>

              <div className="flex flex-wrap gap-2">
                {fabricPickerValues.map(id => {
                  const fabric = fabrics.find(item => item.id === id);
                  if (!fabric) return null;
                  return (
                    <div
                      key={fabric.id}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#c8dced] bg-[#eef6fd] px-3 py-1.5 text-xs font-semibold text-[#123766]"
                    >
                      <span className="truncate">{fabric.code}</span>
                      <button
                        type="button"
                        className="shrink-0 rounded-full p-0.5 hover:bg-white"
                        onClick={() => toggleFabricPicker(fabric.id)}
                        aria-label={`Remove ${fabric.code}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFabricPickerOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={applyFabricPicker}>
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
    </div>
  );
};

const HeaderField = ({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div>
    <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#123766]">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
  </div>
);

const SectionLabel = ({ label }: { label: string }) => (
  <Label className="mb-2 block text-base font-bold text-[#123766]">{label}</Label>
);

type GarmentSectionProps = {
  title: string;
  tone: "blue" | "brown";
  icon: React.ReactNode;
  selectedFabrics: FabricOption[];
  onAddFabric: () => void;
  onRemoveFabric: (fabricId: string) => void;
  fabrics: FabricOption[];
  standardSize: string;
  setStandardSize: (value: string) => void;
  measurements: Record<string, string>;
  setMeasurements: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  measurementFields: readonly (readonly [string, string])[];
  styles: string[];
  selectedStyles: string[];
  setSelectedStyles: (value: string[]) => void;
  otherStyle: string;
  setOtherStyle: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
};

const GarmentSection = ({
  title,
  tone,
  icon,
  selectedFabrics,
  onAddFabric,
  onRemoveFabric,
  fabrics,
  standardSize,
  setStandardSize,
  measurements,
  setMeasurements,
  measurementFields,
  styles,
  selectedStyles,
  setSelectedStyles,
  otherStyle,
  setOtherStyle,
  notes,
  setNotes,
  updatePattern,
}: GarmentSectionProps) => {
  const blue = tone === "blue";

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className={
          blue
            ? "flex items-center gap-4 bg-gradient-to-r from-[#0c315c] via-[#164d80] to-[#0f4779] px-5 py-4 text-white"
            : "flex items-center gap-4 bg-gradient-to-r from-[#6d4a27] via-[#8a6138] to-[#72502d] px-5 py-4 text-white"
        }
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/30 bg-white/10">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-wide">{title}</h2>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">
            {blue ? "Shirt measurements & fitting" : "Trouser measurements & fitting"}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[0.95fr_1.55fr_1.1fr_1.45fr]">
        <GarmentInfo title="Fabric Code — Multiple Options">
          <div className="space-y-2">
            {selectedFabrics.map((fabric, index) => (
              <div
                key={fabric.id}
                className="flex items-center gap-2 rounded-lg border border-[#c8dced] bg-[#f7fbff] px-2.5 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#123766]">
                  {fabric.code}
                </span>
                {index === 0 && (
                  <span className="shrink-0 rounded-full bg-[#123766] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveFabric(fabric.id)}
                  className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-white hover:text-red-600"
                  aria-label={`Remove ${fabric.code}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddFabric}
              disabled={!fabrics.length}
              className="h-9 w-full border-dashed"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {selectedFabrics.length ? "Add Another Fabric" : "Choose Fabric"}
            </Button>
          </div>
          {!selectedFabrics.length && (
            <p className="mt-2 text-xs text-slate-400">Choose one or more fabrics from the Fabric Master.</p>
          )}
        </GarmentInfo>

        <GarmentInfo title="Measurements (inches)">
          <div className="grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
            {measurementFields.map(([key, label]) => (
              <div key={key} className="grid grid-cols-[1fr_10px_1fr] items-center gap-1">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <span className="text-sm text-slate-400">:</span>
                <Input
                  value={measurements[key] || ""}
                  onChange={e =>
                    setMeasurements(current => ({
                      ...current,
                      [key]: e.target.value,
                    }))
                  }
                  inputMode="decimal"
                  className="h-9 bg-white text-sm"
                  aria-label={`${title} ${label}`}
                />
              </div>
            ))}
          </div>
        </GarmentInfo>

        <GarmentInfo title="Style / Fit">
          <StyleChecklist
            options={styles}
            selected={selectedStyles}
            setSelected={setSelectedStyles}
            otherValue={otherStyle}
            setOtherValue={setOtherStyle}
            compact
          />
        </GarmentInfo>

        <GarmentInfo title="Standard Size">
          <Input
            value={standardSize}
            onChange={e => setStandardSize(e.target.value)}
            placeholder={blue ? "e.g. 40 / L" : "e.g. 34 / M"}
            className="h-11 bg-white"
          />

          <div className="mt-5 border-t pt-4">
            <Label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Notes
            </Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={blue ? "Shirt notes..." : "Pant notes..."}
              className="min-h-[190px] resize-y bg-white"
            />
          </div>
        </GarmentInfo>
      </div>
    </section>
  );
};

const GarmentInfo = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="border-b border-slate-200 p-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 sm:p-5">
    <Label className="mb-3 block text-sm font-bold text-[#123766]">{title}</Label>
    {children}
  </div>
);

const StyleChecklist = ({
  options,
  selected,
  setSelected,
  otherValue,
  setOtherValue,
  compact = false,
}: {
  options: string[];
  selected: string[];
  setSelected: (value: string[]) => void;
  otherValue: string;
  setOtherValue: (value: string) => void;
  compact?: boolean;
}) => (
  <div className={compact ? "space-y-2.5" : "space-y-3"}>
    {options.map(option => (
      <label key={option} className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700">
        <Checkbox
          checked={selected.includes(option)}
          onCheckedChange={() => {
            setSelected(
              selected.includes(option)
                ? selected.filter(item => item !== option)
                : [...selected, option]
            );
          }}
        />
        <span>{option}</span>
      </label>
    ))}

    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <Checkbox
        checked={Boolean(otherValue)}
        onCheckedChange={checked => {
          if (!checked) setOtherValue("");
        }}
      />
      <span>Others:</span>
      <Input
        value={otherValue}
        onChange={e => setOtherValue(e.target.value)}
        className="h-8 min-w-0 flex-1 bg-white"
        aria-label="Other style"
      />
    </div>
  </div>
);

export default OrderSheetForm;
