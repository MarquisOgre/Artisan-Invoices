import { useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type OrderSheetFormProps = {
  onSaved?: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);
const createOrderNo = () => {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  return `ORD-${stamp}`;
};

const emptyMeasurements = (fields: readonly (readonly [string, string])[]) =>
  Object.fromEntries(fields.map(([key]) => [key, ""]));

const OrderSheetForm = ({ onSaved }: OrderSheetFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const initialOrderNo = useMemo(createOrderNo, []);

  const [saving, setSaving] = useState(false);
  const [orderNo, setOrderNo] = useState(initialOrderNo);
  const [orderDate, setOrderDate] = useState(today());
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [customerSignature, setCustomerSignature] = useState("");

  const [shirtFabricCode, setShirtFabricCode] = useState("");
  const [shirtPatterns, setShirtPatterns] = useState<string[]>(["", "", "", "", ""]);
  const [shirtStandardSize, setShirtStandardSize] = useState("");
  const [shirtMeasurements, setShirtMeasurements] = useState<Record<string, string>>(
    emptyMeasurements(SHIRT_MEASUREMENTS)
  );
  const [shirtStyles, setShirtStyles] = useState<string[]>([]);
  const [shirtOtherStyle, setShirtOtherStyle] = useState("");
  const [shirtNotes, setShirtNotes] = useState("");

  const [pantFabricCode, setPantFabricCode] = useState("");
  const [pantPatterns, setPantPatterns] = useState<string[]>(["", "", "", "", ""]);
  const [pantStandardSize, setPantStandardSize] = useState("");
  const [pantMeasurements, setPantMeasurements] = useState<Record<string, string>>(
    emptyMeasurements(PANT_MEASUREMENTS)
  );
  const [pantStyles, setPantStyles] = useState<string[]>([]);
  const [pantOtherStyle, setPantOtherStyle] = useState("");
  const [pantNotes, setPantNotes] = useState("");

  const toggleStyle = (
    value: string,
    selected: string[],
    setSelected: (value: string[]) => void
  ) => {
    setSelected(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]);
  };

  const updatePattern = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter(current => current.map((item, i) => (i === index ? value : item)));
  };

  const resetForm = () => {
    setOrderNo(createOrderNo());
    setOrderDate(today());
    setCustomerCode("");
    setCustomerName("");
    setContactNo("");
    setDeliveryAddress("");
    setDeliveryDate("");
    setCustomerSignature("");
    setShirtFabricCode("");
    setShirtPatterns(["", "", "", "", ""]);
    setShirtStandardSize("");
    setShirtMeasurements(emptyMeasurements(SHIRT_MEASUREMENTS));
    setShirtStyles([]);
    setShirtOtherStyle("");
    setShirtNotes("");
    setPantFabricCode("");
    setPantPatterns(["", "", "", "", ""]);
    setPantStandardSize("");
    setPantMeasurements(emptyMeasurements(PANT_MEASUREMENTS));
    setPantStyles([]);
    setPantOtherStyle("");
    setPantNotes("");
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

    if (!orderNo.trim() || !customerName.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please enter the Order No. and Customer Name.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        order_no: orderNo.trim(),
        order_date: orderDate,
        customer_code: customerCode.trim() || null,
        customer_name: customerName.trim(),
        contact_no: contactNo.trim() || null,
        shirt_fabric_code: shirtFabricCode.trim() || null,
        shirt_patterns: shirtPatterns.filter(Boolean),
        shirt_standard_size: shirtStandardSize.trim() || null,
        shirt_measurements: shirtMeasurements,
        shirt_style: { selected: shirtStyles, other: shirtOtherStyle.trim() },
        shirt_notes: shirtNotes.trim() || null,
        pant_fabric_code: pantFabricCode.trim() || null,
        pant_patterns: pantPatterns.filter(Boolean),
        pant_standard_size: pantStandardSize.trim() || null,
        pant_measurements: pantMeasurements,
        pant_style: { selected: pantStyles, other: pantOtherStyle.trim() },
        pant_notes: pantNotes.trim() || null,
        delivery_address: deliveryAddress.trim() || null,
        delivery_date: deliveryDate || null,
        customer_signature: customerSignature.trim() || null,
      };

      const { error } = await (supabase as any).from("order_sheets").insert(payload);
      if (error) throw error;

      toast({
        title: "Order sheet saved",
        description: `Order ${orderNo} has been saved successfully.`,
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
    <div className="mx-auto w-full max-w-[1500px] space-y-5 pb-8">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Artisan Apparels</p>
          <h1 className="text-2xl font-bold text-primary">Shirt & Pant Order Sheet</h1>
          <p className="text-sm text-muted-foreground">Enter measurements and order details, then save the completed sheet.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Order"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Order No." required>
              <Input value={orderNo} onChange={e => setOrderNo(e.target.value)} />
            </Field>
            <Field label="Date">
              <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
            </Field>
            <Field label="Customer Code">
              <Input value={customerCode} onChange={e => setCustomerCode(e.target.value)} />
            </Field>
            <Field label="Contact No.">
              <Input value={contactNo} onChange={e => setContactNo(e.target.value)} inputMode="tel" />
            </Field>
            <Field label="Customer Name" required className="md:col-span-2">
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <OrderSection title="SHIRT" tone="blue">
        <div className="grid gap-0 overflow-hidden rounded-lg border md:grid-cols-[1.1fr_1.5fr_1fr_2fr_1.3fr_1.6fr]">
          <HeaderCell>Fabric Code</HeaderCell>
          <HeaderCell>Pattern / Design</HeaderCell>
          <HeaderCell>Standard Size</HeaderCell>
          <HeaderCell>Measurements (inches)</HeaderCell>
          <HeaderCell>Style</HeaderCell>
          <HeaderCell>Notes</HeaderCell>

          <div className="p-3">
            <Input value={shirtFabricCode} onChange={e => setShirtFabricCode(e.target.value)} placeholder="Fabric code" />
          </div>
          <div className="space-y-3 border-l p-3">
            {shirtPatterns.map((pattern, index) => (
              <Input
                key={index}
                value={pattern}
                onChange={e => updatePattern(setShirtPatterns, index, e.target.value)}
                placeholder={`Pattern / design ${index + 1}`}
              />
            ))}
          </div>
          <div className="border-l p-3">
            <Input value={shirtStandardSize} onChange={e => setShirtStandardSize(e.target.value)} placeholder="e.g. 40 / L" />
          </div>
          <MeasurementGrid
            fields={SHIRT_MEASUREMENTS}
            values={shirtMeasurements}
            setValues={setShirtMeasurements}
          />
          <StyleChecklist
            options={SHIRT_STYLES}
            selected={shirtStyles}
            setSelected={setShirtStyles}
            otherValue={shirtOtherStyle}
            setOtherValue={setShirtOtherStyle}
          />
          <div className="border-l p-3">
            <Textarea value={shirtNotes} onChange={e => setShirtNotes(e.target.value)} placeholder="Shirt notes..." className="min-h-[210px]" />
          </div>
        </div>
      </OrderSection>

      <OrderSection title="PANT" tone="brown">
        <div className="grid gap-0 overflow-hidden rounded-lg border md:grid-cols-[1.1fr_1.5fr_1fr_2fr_1.3fr_1.6fr]">
          <HeaderCell>Pant Fabric Code</HeaderCell>
          <HeaderCell>Pattern / Design</HeaderCell>
          <HeaderCell>Standard Size</HeaderCell>
          <HeaderCell>Measurements (inches)</HeaderCell>
          <HeaderCell>Style</HeaderCell>
          <HeaderCell>Notes</HeaderCell>

          <div className="p-3">
            <Input value={pantFabricCode} onChange={e => setPantFabricCode(e.target.value)} placeholder="Fabric code" />
          </div>
          <div className="space-y-3 border-l p-3">
            {pantPatterns.map((pattern, index) => (
              <Input
                key={index}
                value={pattern}
                onChange={e => updatePattern(setPantPatterns, index, e.target.value)}
                placeholder={`Pattern / design ${index + 1}`}
              />
            ))}
          </div>
          <div className="border-l p-3">
            <Input value={pantStandardSize} onChange={e => setPantStandardSize(e.target.value)} placeholder="e.g. 34 / M" />
          </div>
          <MeasurementGrid
            fields={PANT_MEASUREMENTS}
            values={pantMeasurements}
            setValues={setPantMeasurements}
          />
          <StyleChecklist
            options={PANT_STYLES}
            selected={pantStyles}
            setSelected={setPantStyles}
            otherValue={pantOtherStyle}
            setOtherValue={setPantOtherStyle}
          />
          <div className="border-l p-3">
            <Textarea value={pantNotes} onChange={e => setPantNotes(e.target.value)} placeholder="Pant notes..." className="min-h-[210px]" />
          </div>
        </div>
      </OrderSection>

      <div className="grid gap-4 lg:grid-cols-[2.2fr_1fr_1fr]">
        <Card>
          <CardContent className="p-5">
            <Field label="Delivery Address">
              <Textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="min-h-[120px]" />
            </Field>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Field label="Delivery Date">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="pl-9" />
              </div>
            </Field>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Field label="Customer Signature">
              <Input value={customerSignature} onChange={e => setCustomerSignature(e.target.value)} placeholder="Customer name / signature" />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-2 z-20 flex justify-end rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
        <Button type="button" size="lg" onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-5 w-5" />
          {saving ? "Saving Order..." : "Save Order Sheet"}
        </Button>
      </div>
    </div>
  );
};

const Field = ({
  label,
  children,
  required,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) => (
  <div className={className}>
    <Label className="mb-1.5 block">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
  </div>
);

const HeaderCell = ({ children }: { children: React.ReactNode }) => (
  <div className="border-b bg-muted/60 p-3 text-sm font-semibold text-primary md:border-l first:md:border-l-0">
    {children}
  </div>
);

const MeasurementGrid = ({
  fields,
  values,
  setValues,
}: {
  fields: readonly (readonly [string, string])[];
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) => (
  <div className="border-l p-3">
    <div className="space-y-2">
      {fields.map(([key, label]) => (
        <div key={key} className="grid grid-cols-[95px_12px_1fr] items-center gap-1 text-sm">
          <span>{label}</span>
          <span>:</span>
          <Input
            value={values[key] || ""}
            onChange={e => setValues(current => ({ ...current, [key]: e.target.value }))}
            className="h-8"
          />
        </div>
      ))}
    </div>
  </div>
);

const StyleChecklist = ({
  options,
  selected,
  setSelected,
  otherValue,
  setOtherValue,
}: {
  options: string[];
  selected: string[];
  setSelected: (value: string[]) => void;
  otherValue: string;
  setOtherValue: (value: string) => void;
}) => (
  <div className="border-l p-3">
    <div className="space-y-3">
      {options.map(option => (
        <label key={option} className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={selected.includes(option)}
            onCheckedChange={() => {
              setSelected(selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option]);
            }}
          />
          <span>{option}</span>
        </label>
      ))}
      <div className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={Boolean(otherValue)}
          onCheckedChange={checked => {
            if (!checked) setOtherValue("");
          }}
        />
        <span>Others:</span>
        <Input value={otherValue} onChange={e => setOtherValue(e.target.value)} className="h-8" />
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 text-xs text-muted-foreground">
          {selected.map(style => (
            <span key={style} className="rounded-full bg-muted px-2 py-0.5">{style}</span>
          ))}
        </div>
      )}
    </div>
  </div>
);

const OrderSection = ({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "blue" | "brown";
  children: React.ReactNode;
}) => (
  <Card className="overflow-hidden">
    <CardHeader className={tone === "blue" ? "bg-primary text-primary-foreground" : "bg-amber-900 text-white"}>
      <CardTitle className="text-xl tracking-wide">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-0">{children}</CardContent>
  </Card>
);

export default OrderSheetForm;
