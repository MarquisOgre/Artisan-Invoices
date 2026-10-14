import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2, X } from "lucide-react";
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
    <div className="mx-auto flex w-full min-w-0 max-w-[1500px] flex-col space-y-5 pb-[env(safe-area-inset-bottom)] [overflow-wrap:normal] md:h-full md:min-h-0 md:overflow-hidden md:space-y-4">
      <div className="flex shrink-0 flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold text-primary">Fabric Master</h1>

        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full min-w-0 sm:max-w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search fabrics"
              placeholder="Search code, article, design, composition..."
              className="h-10 pl-9 pr-9"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearch("")}
                className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
                aria-label="Clear fabric search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Button onClick={openNew} className="h-10 shrink-0 sm:h-11">
            <Plus className="mr-2 h-4 w-4" />
            Add Fabric
          </Button>
        </div>
      </div>

      <div className="space-y-3 md:hidden" aria-label="Fabric list">
        {loading ? (
          <p className="py-10 text-center text-muted-foreground" role="status">Loading fabrics...</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground" role="status">No fabrics found.</p>
        ) : (
          filtered.map(fabric => (
            <Card key={fabric.id}>
              <CardContent className="p-4">
                <article aria-label={`Fabric ${fabric.code}`}>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {[
                      ["Category", fabric.category],
                      ["Fabric Code", fabric.code],
                      ["Brand", fabric.brand],
                      ["Article", fabric.article],
                      ["Design", fabric.design],
                      ["Finish", fabric.finish],
                      ["Count", fabric.count_spec],
                      ["Composition", fabric.composition],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="mt-1 font-medium [overflow-wrap:anywhere]">{value || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                    <Button variant="outline" onClick={() => openEdit(fabric)}>
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(fabric)}>
                      <Trash2 className="h-4 w-4" />
                      Deactivate
                    </Button>
                  </div>
                </article>
              </CardContent>
            </Card>
          ))
        )}
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {fabrics.length} active fabrics.
        </p>
      </div>

      <Card className="hidden min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex">
        <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0">
          <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain rounded-md border">
            <table className="w-full whitespace-nowrap text-sm">
              <thead className="sticky top-0 z-10 bg-[#edf5fc]">
                <tr className="border-y bg-[#edf5fc] text-left text-[#123766]">
                  <th className="px-4 py-3 font-bold">Category</th>
                  <th className="px-4 py-3 font-bold">Fabric Code</th>
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
                      <td className="px-4 py-3 font-medium text-[#123766]">{fabric.category}</td>
                      <td className="px-4 py-3 font-semibold text-[#123766]">{fabric.code}</td>
                      <td className="px-4 py-3">{fabric.brand}</td>
                      <td className="px-4 py-3">{fabric.article}</td>
                      <td className="px-4 py-3">{fabric.design}</td>
                      <td className="px-4 py-3">{fabric.finish || "—"}</td>
                      <td className="px-4 py-3">{fabric.count_spec || "—"}</td>
                      <td className="px-4 py-3">{fabric.composition || "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => openEdit(fabric)} aria-label={`Edit fabric ${fabric.code}`} title={`Edit ${fabric.code}`}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(fabric)} aria-label={`Deactivate fabric ${fabric.code}`} title={`Deactivate ${fabric.code}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="shrink-0 border-t px-4 py-3 text-xs text-muted-foreground">
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
            <FormField label="Fabric Code *" value={form.code} onChange={value => setForm(prev => ({ ...prev, code: value }))} placeholder="e.g. CIR-CAI-E03" />
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
