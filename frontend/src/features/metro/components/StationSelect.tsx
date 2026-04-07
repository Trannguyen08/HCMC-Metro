"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { METRO_STATIONS, type MetroStation } from "@/lib/mock-data";

export function StationSelect({
  value,
  onChange,
  placeholder = "Chọn ga"
}: {
  value: MetroStation | null;
  onChange: (v: MetroStation | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value ? value.name : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm ga..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy ga phù hợp.</CommandEmpty>
            <CommandGroup heading="Danh sách ga">
              {METRO_STATIONS.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.name} ${s.code}`}
                  onSelect={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.id === s.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

