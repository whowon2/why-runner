"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PARSONS_MAX_INDENT, type ParsonsLine } from "@/lib/parsons";
import { cn } from "@/lib/utils";

interface Item extends ParsonsLine {
  key: string;
}

/**
 * Reorder + indent the given lines. Drag a row, or use the arrow buttons
 * (keyboard accessible): ↑/↓ move a line, ←/→ change its indentation.
 */
export function ParsonsEditor({
  lines,
  onChange,
}: {
  lines: string[];
  onChange: (lines: ParsonsLine[]) => void;
}) {
  const t = useTranslations("Parsons");
  const [items, setItems] = useState<Item[]>(() =>
    lines.map((text, i) => ({ key: `${i}`, text, indent: 0 })),
  );
  const [dragging, setDragging] = useState<number | null>(null);

  function update(next: Item[]) {
    setItems(next);
    onChange(next.map(({ text, indent }) => ({ text, indent })));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    update(next);
  }

  function indent(index: number, delta: number) {
    const value = items[index].indent + delta;
    if (value < 0 || value > PARSONS_MAX_INDENT) return;
    update(
      items.map((item, i) => (i === index ? { ...item, indent: value } : item)),
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-xs">{t("instructions")}</p>
      <ol className="flex flex-col gap-1">
        {items.map((item, index) => (
          <li
            className={cn(
              "flex items-center gap-1 rounded-md border bg-background pr-1",
              dragging === index && "opacity-50",
            )}
            draggable
            key={item.key}
            onDragEnd={() => setDragging(null)}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragging !== null && dragging !== index) {
                move(dragging, index);
                setDragging(index);
              }
            }}
            onDragStart={() => setDragging(index)}
          >
            <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
            <code
              className="flex-1 overflow-x-auto whitespace-pre py-1.5 font-mono text-xs"
              style={{ paddingLeft: `${item.indent * 1.5}rem` }}
            >
              {item.text}
            </code>
            <RowButton
              disabled={item.indent === 0}
              label={t("outdent")}
              onClick={() => indent(index, -1)}
            >
              <ChevronLeft />
            </RowButton>
            <RowButton
              disabled={item.indent === PARSONS_MAX_INDENT}
              label={t("indent")}
              onClick={() => indent(index, 1)}
            >
              <ChevronRight />
            </RowButton>
            <RowButton
              disabled={index === 0}
              label={t("moveUp")}
              onClick={() => move(index, index - 1)}
            >
              <ArrowUp />
            </RowButton>
            <RowButton
              disabled={index === items.length - 1}
              label={t("moveDown")}
              onClick={() => move(index, index + 1)}
            >
              <ArrowDown />
            </RowButton>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RowButton({
  children,
  label,
  ...props
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={label}
      className="size-6"
      size="icon"
      title={label}
      type="button"
      variant="ghost"
      {...props}
    >
      {children}
    </Button>
  );
}

/** Read-only rendering of a submitted Parsons answer. */
export function ParsonsViewer({ lines }: { lines: ParsonsLine[] }) {
  return (
    <ol className="flex flex-col gap-0.5 rounded-md border bg-muted/50 p-2">
      {lines.map((line, i) => (
        <li key={`${i}-${line.text}`}>
          <code
            className="whitespace-pre font-mono text-xs text-foreground"
            style={{ paddingLeft: `${line.indent * 1.5}rem` }}
          >
            {line.text}
          </code>
        </li>
      ))}
    </ol>
  );
}
