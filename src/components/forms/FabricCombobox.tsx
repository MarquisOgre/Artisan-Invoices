import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type FabricOption = {
  id: string;
  code: string;
  brand: string;
  article: string;
  design: string;
  finish?: string | null;
  count_spec?: string | null;
  composition?: string | null;
  swatch_url?: string | null;
  is_active?: boolean;
};

type FabricComboboxProps = {
  fabrics: FabricOption[];
  value: string;
  onChange: (fabric: FabricOption | null) => void;
  placeholder?: string;
};

const FabricCombobox = ({
  fabrics,
  value,
  onChange,
  placeholder = "Select fabric code",
}: FabricComboboxProps) => {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => fabrics.find(fabric => fabric.id === value) || null, [fabrics, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-11 w-full justify-between border-slate-200 bg-white px-3 font-normal hover:bg-slate-50"
        >
          <span className={cn("truncate text-left", !selected && "text-muted-foreground")}>
            {selected ? selected.code : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(520px,calc(100vw-2rem))] p-0">
        <Command>
          <CommandInput placeholder="Search fabric code, article, design..." />
          <CommandList>
            <CommandEmpty>No fabric found.</CommandEmpty>
            <CommandGroup>
              {fabrics.map(fabric => (
                <CommandItem
                  key={fabric.id}
                  value={`${fabric.code} ${fabric.brand} ${fabric.article} ${fabric.design} ${fabric.finish || ""} ${fabric.composition || ""}`}
                  onSelect={() => {
                    onChange(fabric);
                    setOpen(false);
                  }}
                  className="items-start gap-3 px-3 py-2.5"
                >
                  <Check className={cn("mt-0.5 h-4 w-4 shrink-0", selected?.id === fabric.id ? "opacity-100" : "opacity-0")} />
                  <div className="min-w-0">
                    <div className="font-semibold text-[#123766]">{fabric.code}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {fabric.article} · {fabric.design}
                      {fabric.composition ? ` · ${fabric.composition}` : ""}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default FabricCombobox;
