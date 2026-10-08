import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Fabric = {
  id: string;
  code: string;
  brand: string;
  article: string;
  design: string;
  finish: string | null;
  count_spec: string | null;
  composition: string | null;
  category: "Suiting" | "Shirting";
  swatch_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type FabricPageProps = {
  onImported?: () => void;
};

const emptyForm = {
  code: "",
  brand: "CIROCCO",
  article: "",
  design: "",
  finish: "",
  count_spec: "",
  composition: "",
  category: "Shirting",
  swatch_url: "",
};

const FabricPage = (_props: FabricPageProps) => {
  const { toast } = useToast();
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Fabric | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadFabrics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fabrics")
      .select("*")
      .eq("is_active", true)
      .order("brand", { ascending: true })
      .order("article", { ascending: true })
      .order("design", { ascending: true });

    if (error) {
      console.error("Error loading fabrics:", error);
      toast({ title: "Unable to load fabrics", description: error.message, variant: "destructive" });
    } else {
      setFabrics((data || []) as Fabric[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFabrics();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return fabrics;
    return fabrics.filter(fabric =>
      [fabric.code, fabric.brand, fabric.article, fabric.design, fabric.finish, fabric.count_spec, fabric.composition]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [fabrics, search]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (fabric: Fabric) => {
    setEditing(fabric);
    setForm({
      code: fabric.code,
      brand: fabric.brand,
      article: fabric.article,
      design: fabric.design,
      finish: fabric.finish || "",
      count_spec: fabric.count_spec || "",
      composition: fabric.composition || "",
      swatch_url: fabric.swatch_url || "",
      category: fabric.category || "Shirting",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.brand.trim() || !form.article.trim() || !form.design.trim()) {
      toast({
        title: "Required fields missing",
        description: "Fabric Code, Brand, Article and Design are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        brand: form.brand.trim(),
        article: form.article.trim(),
        design: form.design.trim(),
        finish: form.finish.trim() || null,
        count_spec: form.count_spec.trim() || null,
        composition: form.composition.trim() || null,
        category: form.category,
        swatch_url: form.swatch_url.trim() || null,
        is_active: true,
      };

      if (editing) {
        const { error } = await supabase.from("fabrics").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Fabric updated", description: `${payload.code} has been updated.` });
      } else {
        const { error } = await supabase.from("fabrics").insert(payload);
        if (error) throw error;
        toast({ title: "Fabric added", description: `${payload.code} has been added to the fabric master.` });
      }

      setDialogOpen(false);
      await loadFabrics();
    } catch (error: any) {
      console.error("Error saving fabric:", error);
      toast({
        title: "Unable to save fabric",
        description: error?.message || "Please check the Fabric Code and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fabric: Fabric) => {
    if (!window.confirm(`Deactivate fabric ${fabric.code}?`)) return;

    const { error } = await supabase
      .from("fabrics")
      .update({ is_active: false })
      .eq("id", fabric.id);

    if (error) {
      toast({ title: "Unable to deactivate fabric", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Fabric deactivated", description: `${fabric.code} is no longer available for new orders.` });
    loadFabrics();
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold text-primary">Fabric Master</h1>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full sm:w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search code, article, design, composition..."
              className="h-10 pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label="Clear fabric search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button onClick={openNew} className="h-10 shrink-0 sm:h-11">
            <Plus className="mr-2 h-4 w-4" />
            Add Fabric
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead>
                <tr className="border-y bg-[#edf5fc] text-left text-[#123766]">
                  <th className="px-4 py-3 font-bold">Fabric Code</th>
                  <th className="px-4 py-3 font-bold">Category</th>
                  <th className="px-4 py-3 font-bold">Brand</th>
                  <th className="px-4 py-3 font-bold">Article</th>
                  <th className="px-4 py-3 font-bold">Design</th>
                  <th className="px-4 py-3 font-bold">Finish</th>
                  <th className="px-4 py-3 font-bold">Count</th>
                  <th className="px-4 py-3 font-bold">Composition</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">Loading fabrics...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No fabrics found.</td></tr>
                ) : (
                  filtered.map(fabric => (
                    <tr key={fabric.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-[#123766]">{fabric.code}</td>
                      <td className="px-4 py-3 font-medium text-[#123766]">{fabric.category}</td>
                      <td className="px-4 py-3">{fabric.brand}</td>
                      <td className="px-4 py-3">{fabric.article}</td>
                      <td className="px-4 py-3">{fabric.design}</td>
                      <td className="px-4 py-3">{fabric.finish || "—"}</td>
                      <td className="px-4 py-3">{fabric.count_spec || "—"}</td>
                      <td className="px-4 py-3">{fabric.composition || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(fabric)}>
                            <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(fabric)}>
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Deactivate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">
            Showing {filtered.length} of {fabrics.length} active fabrics.
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Fabric" : "Add Fabric"}</DialogTitle>
            <DialogDescription>
              Fabric details are saved to the Fabric Master and become available in Order Forms.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Fabric Code *" value={form.code} onChange={value => setForm(prev => ({ ...prev, code: value }))} placeholder="e.g. CIR-CAI-E03" />
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value as "Suiting" | "Shirting" }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Shirting">Shirting</option>
                <option value="Suiting">Suiting</option>
              </select>
            </div>
            <FormField label="Brand *" value={form.brand} onChange={value => setForm(prev => ({ ...prev, brand: value }))} placeholder="CIROCCO" />
            <FormField label="Article *" value={form.article} onChange={value => setForm(prev => ({ ...prev, article: value }))} placeholder="CAIRO" />
            <FormField label="Design *" value={form.design} onChange={value => setForm(prev => ({ ...prev, design: value }))} placeholder="E03" />
            <FormField label="Finish" value={form.finish} onChange={value => setForm(prev => ({ ...prev, finish: value }))} placeholder="Regular Finish" />
            <FormField label="Count" value={form.count_spec} onChange={value => setForm(prev => ({ ...prev, count_spec: value }))} placeholder="60 Lee x 60 Lee" />
            <FormField label="Composition" value={form.composition} onChange={value => setForm(prev => ({ ...prev, composition: value }))} placeholder="100% Linen" />
            <FormField label="Swatch URL (optional)" value={form.swatch_url} onChange={value => setForm(prev => ({ ...prev, swatch_url: value }))} placeholder="https://..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update Fabric" : "Add Fabric"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FormField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

export default FabricPage;
