"use client";

import { useRef, useState, useTransition, type CSSProperties } from "react";
import Image from "next/image";
import { Reorder, useDragControls } from "motion/react";
import { GripVertical, Trash2, Plus, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { updateAboutRows, uploadAboutBlockImage } from "@/actions/page-content";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { AboutBlocksRenderer } from "@/components/about/AboutBlocksRenderer";
import { BLOCK_TYPES, SPAN_PRESETS, type AboutBlock, type AboutRow, type AboutColumn, type ColumnSpan, type SpacerHeight } from "@/lib/about-blocks";

const SPACER_HEIGHT_LABELS: Record<SpacerHeight, string> = { sm: "Small", md: "Medium", lg: "Large", xl: "Extra large" };

// Full drag-and-drop page builder for the About page, laid out as rows of
// side-by-side columns (a 12-unit grid, like a normal page builder) rather
// than a single top-to-bottom stack — drag rows to reorder them, add
// columns to a row to sit blocks side-by-side, and set each column's
// width share. The live preview pane on the right renders the exact same
// draft state through AboutBlocksRenderer — the same component the real
// page uses — so the preview can never show something the saved page
// wouldn't. Nothing here touches the database until "Save Changes" is
// pressed; edits before that live only in this component's state.

type BlockTypeEntry = (typeof BLOCK_TYPES)[number];

function BlockImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function handleUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadAboutBlockImage(formData);
      if (!result.ok) {
        setError(result.error);
      } else if (result.url) {
        onChange(result.url);
      }
      if (fileInput.current) fileInput.current.value = "";
    });
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-border-subtle bg-ivory-soft">
        {value && <Image src={value} alt="" fill className="object-cover" />}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="text-xs file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-charcoal file:hover:bg-gold-soft"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleUpload} disabled={pending}>
          {pending ? "Uploading..." : "Replace image"}
        </Button>
      </div>
      <FieldHint>Only images are supported.</FieldHint>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}

function BlockFields({ block, onChange }: { block: AboutBlock; onChange: (block: AboutBlock) => void }) {
  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-4">
          <BlockImageField label="Background image" value={block.image} onChange={(image) => onChange({ ...block, image })} />
          <div>
            <Label>Kicker</Label>
            <Input value={block.kicker} onChange={(e) => onChange({ ...block, kicker: e.target.value })} />
          </div>
          <div>
            <Label>Heading</Label>
            <Textarea value={block.heading} onChange={(e) => onChange({ ...block, heading: e.target.value })} />
          </div>
        </div>
      );
    case "text":
      return (
        <div className="space-y-4">
          <div>
            <Label>Label</Label>
            <Input value={block.label} onChange={(e) => onChange({ ...block, label: e.target.value })} />
          </div>
          <div>
            <Label>Lead sentence</Label>
            <Textarea value={block.lead} onChange={(e) => onChange({ ...block, lead: e.target.value })} />
          </div>
          <div>
            <Label>Body paragraph 1</Label>
            <Textarea value={block.body1} onChange={(e) => onChange({ ...block, body1: e.target.value })} />
          </div>
          <div>
            <Label>Body paragraph 2</Label>
            <Textarea value={block.body2} onChange={(e) => onChange({ ...block, body2: e.target.value })} />
          </div>
        </div>
      );
    case "imageCaption":
      return (
        <div className="space-y-4">
          <BlockImageField label="Image" value={block.image} onChange={(image) => onChange({ ...block, image })} />
          <div>
            <Label>Kicker</Label>
            <Input value={block.kicker} onChange={(e) => onChange({ ...block, kicker: e.target.value })} />
          </div>
          <div>
            <Label>Caption</Label>
            <Textarea value={block.body} onChange={(e) => onChange({ ...block, body: e.target.value })} />
          </div>
        </div>
      );
    case "image":
      return (
        <div className="space-y-4">
          <BlockImageField label="Image" value={block.image} onChange={(image) => onChange({ ...block, image })} />
          <div>
            <Label>Caption (optional)</Label>
            <Input value={block.caption} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
          </div>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-4">
          <div>
            <Label>Quote text</Label>
            <Textarea value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
          </div>
          <div>
            <Label>Highlighted ending</Label>
            <Input value={block.highlight} onChange={(e) => onChange({ ...block, highlight: e.target.value })} />
            <FieldHint>Shown in gold immediately after the quote text.</FieldHint>
          </div>
        </div>
      );
    case "cta":
      return (
        <div className="space-y-4">
          <div>
            <Label>Heading</Label>
            <Input value={block.heading} onChange={(e) => onChange({ ...block, heading: e.target.value })} />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea value={block.body} onChange={(e) => onChange({ ...block, body: e.target.value })} />
          </div>
          <FieldHint>The Shop Gemstones / Submit a Sourcing Request buttons below this are fixed.</FieldHint>
        </div>
      );
    case "spacer":
      return (
        <div>
          <Label>Height</Label>
          <Select value={block.height} onChange={(e) => onChange({ ...block, height: e.target.value as SpacerHeight })}>
            {(Object.entries(SPACER_HEIGHT_LABELS) as [SpacerHeight, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <FieldHint>Empty space filled with the page background — no visible line.</FieldHint>
        </div>
      );
    case "principles": {
      const p = block;
      function updateItem(i: number, patch: Partial<{ title: string; body: string }>) {
        const items = p.items.map((item, idx) => (idx === i ? { ...item, ...patch } : item));
        onChange({ ...p, items });
      }
      function removeItem(i: number) {
        if (p.items.length <= 1) return;
        onChange({ ...p, items: p.items.filter((_, idx) => idx !== i) });
      }
      function addItem() {
        if (p.items.length >= 6) return;
        onChange({ ...p, items: [...p.items, { title: "New principle", body: "A short description." }] });
      }
      return (
        <div className="space-y-4">
          {p.items.map((item, i) => (
            <div key={i} className="rounded-lg border border-border-subtle p-3">
              <div className="flex items-center justify-between">
                <Label className="mb-0">Item {i + 1}</Label>
                {p.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-charcoal/40 hover:text-red-700">
                    <X size={14} />
                  </button>
                )}
              </div>
              <Input className="mt-1" value={item.title} onChange={(e) => updateItem(i, { title: e.target.value })} placeholder="Title" />
              <Textarea className="mt-2" value={item.body} onChange={(e) => updateItem(i, { body: e.target.value })} placeholder="Body" />
            </div>
          ))}
          {p.items.length < 6 && (
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus size={14} /> Add item
            </Button>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}

const BLOCK_LABELS = Object.fromEntries(BLOCK_TYPES.map((t) => [t.type, t.label])) as Record<AboutBlock["type"], string>;

function BlockTypeMenu({ onPick, align = "right" }: { onPick: (type: BlockTypeEntry) => void; align?: "left" | "right" }) {
  return (
    <div className={`absolute z-10 mt-1 w-72 rounded-lg border border-border-subtle bg-surface p-1.5 shadow-lg ${align === "right" ? "right-0" : "left-0"}`}>
      {BLOCK_TYPES.map((t) => (
        <button
          key={t.type}
          type="button"
          onClick={() => onPick(t)}
          className="block w-full rounded-md px-3 py-2 text-left hover:bg-ivory-soft"
        >
          <span className="text-sm font-medium text-charcoal">{t.label}</span>
          <span className="block text-xs text-charcoal/55">{t.description}</span>
        </button>
      ))}
    </div>
  );
}

function ColumnCard({
  column,
  onChangeBlock,
  onChangeSpan,
  onRemove,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
}: {
  column: AboutColumn;
  onChangeBlock: (block: AboutBlock) => void;
  onChangeSpan: (span: ColumnSpan) => void;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-w-[240px] flex-1 rounded-lg border border-border-subtle bg-ivory-soft/60">
      <div className="flex items-center gap-1 p-2">
        <button
          type="button"
          onClick={onMoveLeft}
          disabled={!canMoveLeft}
          className="text-charcoal/40 hover:text-charcoal disabled:opacity-20 disabled:hover:text-charcoal/40"
          aria-label="Move column left"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveRight}
          disabled={!canMoveRight}
          className="text-charcoal/40 hover:text-charcoal disabled:opacity-20 disabled:hover:text-charcoal/40"
          aria-label="Move column right"
        >
          <ChevronRight size={14} />
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center gap-1.5 truncate text-left">
          <span className="truncate text-xs font-medium text-charcoal">{BLOCK_LABELS[column.block.type]}</span>
          <ChevronDown size={13} className={`shrink-0 text-charcoal/40 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <Select
          value={column.span}
          onChange={(e) => onChangeSpan(Number(e.target.value) as ColumnSpan)}
          className="w-auto shrink-0 py-1 pl-2 pr-6 text-[11px]"
        >
          {SPAN_PRESETS.map((p) => (
            <option key={p.span} value={p.span}>{p.label}</option>
          ))}
        </Select>
        <button type="button" onClick={onRemove} className="text-charcoal/40 hover:text-red-700" aria-label="Remove column">
          <Trash2 size={13} />
        </button>
      </div>
      {open && (
        <div className="border-t border-border-subtle p-3">
          <BlockFields block={column.block} onChange={onChangeBlock} />
        </div>
      )}
    </div>
  );
}

function RowCard({
  row,
  index,
  onChangeBlock,
  onChangeSpan,
  onRemoveColumn,
  onMoveColumn,
  onAddColumn,
  onRemoveRow,
  canRemoveRow,
}: {
  row: AboutRow;
  index: number;
  onChangeBlock: (colId: string, block: AboutBlock) => void;
  onChangeSpan: (colId: string, span: ColumnSpan) => void;
  onRemoveColumn: (colId: string) => void;
  onMoveColumn: (colId: string, direction: -1 | 1) => void;
  onAddColumn: (type: BlockTypeEntry) => void;
  onRemoveRow: () => void;
  canRemoveRow: boolean;
}) {
  const controls = useDragControls();
  const [addOpen, setAddOpen] = useState(false);
  const totalSpan = row.columns.reduce((sum, c) => sum + c.span, 0);

  return (
    <Reorder.Item value={row} dragListener={false} dragControls={controls} className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab touch-none text-charcoal/40 hover:text-charcoal active:cursor-grabbing"
          aria-label="Drag to reorder row"
        >
          <GripVertical size={16} />
        </button>
        <span className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
          Row {index + 1} · {totalSpan}/12 used
        </span>
        <div className="relative ml-auto">
          <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen((o) => !o)} disabled={row.columns.length >= 4}>
            <Plus size={12} /> Add column
          </Button>
          {addOpen && (
            <BlockTypeMenu
              onPick={(t) => {
                onAddColumn(t);
                setAddOpen(false);
              }}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onRemoveRow}
          disabled={!canRemoveRow}
          title={canRemoveRow ? "Remove row" : "The page needs at least one row"}
          className="text-charcoal/40 hover:text-red-700 disabled:opacity-30 disabled:hover:text-charcoal/40"
        >
          <Trash2 size={15} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {row.columns.map((col, i) => (
          <ColumnCard
            key={col.id}
            column={col}
            onChangeBlock={(block) => onChangeBlock(col.id, block)}
            onChangeSpan={(span) => onChangeSpan(col.id, span)}
            onRemove={() => onRemoveColumn(col.id)}
            onMoveLeft={() => onMoveColumn(col.id, -1)}
            onMoveRight={() => onMoveColumn(col.id, 1)}
            canMoveLeft={i > 0}
            canMoveRight={i < row.columns.length - 1}
          />
        ))}
      </div>
    </Reorder.Item>
  );
}

// Fixed scale, fixed simulated viewport width — deliberately NOT measured
// from the container at runtime. A ResizeObserver-driven scale (tried
// first) could balloon toward 1 on a wide monitor, since the panel had no
// width cap of its own. A fixed number can't do that, at the cost of the
// panel not perfectly filling odd container widths. `zoom` (rather than
// `transform: scale`) is what lets the outer `overflow-y-auto` get a
// correctly-sized scrollable area without also having to measure and set
// an explicit height by hand.
const PREVIEW_SCALE = 0.33;

function LivePreview({ rows }: { rows: AboutRow[] }) {
  return (
    <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-2xl border border-border-subtle bg-ivory-soft lg:mx-0">
      <div className="h-[calc(100vh-260px)] overflow-y-auto">
        <div style={{ width: 1440, zoom: PREVIEW_SCALE } as CSSProperties}>
          <AboutBlocksRenderer rows={rows} animate={false} />
        </div>
      </div>
    </div>
  );
}

export function AboutBuilder({ initialRows }: { initialRows: AboutRow[] }) {
  const [rows, setRows] = useState<AboutRow[]>(initialRows);
  const [savedRows, setSavedRows] = useState<AboutRow[]>(initialRows);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [addRowMenuOpen, setAddRowMenuOpen] = useState(false);

  const dirty = JSON.stringify(rows) !== JSON.stringify(savedRows);

  function changeBlock(rowId: string, colId: string, block: AboutBlock) {
    setRows((prev) => prev.map((r) => (r.id !== rowId ? r : { ...r, columns: r.columns.map((c) => (c.id !== colId ? c : { ...c, block })) })));
    setSaved(false);
  }

  function changeSpan(rowId: string, colId: string, span: ColumnSpan) {
    setRows((prev) => prev.map((r) => (r.id !== rowId ? r : { ...r, columns: r.columns.map((c) => (c.id !== colId ? c : { ...c, span })) })));
    setSaved(false);
  }

  function removeColumn(rowId: string, colId: string) {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    if (row.columns.length <= 1) {
      if (rows.length <= 1) return;
      if (!confirm("This is the last column in this row — remove the whole row?")) return;
      setRows(rows.filter((r) => r.id !== rowId));
    } else {
      if (!confirm("Remove this column?")) return;
      setRows(rows.map((r) => (r.id !== rowId ? r : { ...r, columns: r.columns.filter((c) => c.id !== colId) })));
    }
    setSaved(false);
  }

  function moveColumn(rowId: string, colId: string, direction: -1 | 1) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const idx = r.columns.findIndex((c) => c.id === colId);
        const nextIdx = idx + direction;
        if (idx < 0 || nextIdx < 0 || nextIdx >= r.columns.length) return r;
        const columns = [...r.columns];
        [columns[idx], columns[nextIdx]] = [columns[nextIdx], columns[idx]];
        return { ...r, columns };
      }),
    );
    setSaved(false);
  }

  function addColumn(rowId: string, type: BlockTypeEntry) {
    const newCol: AboutColumn = { id: crypto.randomUUID(), span: 6, block: type.create(crypto.randomUUID()) };
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId || r.columns.length >= 4) return r;
        // Shrink a lone full-width column so the new one has visible room
        // beside it — purely a friendlier default, not enforced elsewhere.
        const columns = r.columns.length === 1 && r.columns[0].span === 12
          ? [{ ...r.columns[0], span: 6 as ColumnSpan }, newCol]
          : [...r.columns, newCol];
        return { ...r, columns };
      }),
    );
    setSaved(false);
  }

  function addRow(type: BlockTypeEntry) {
    const row: AboutRow = { id: crypto.randomUUID(), columns: [{ id: crypto.randomUUID(), span: 12, block: type.create(crypto.randomUUID()) }] };
    setRows((prev) => [...prev, row]);
    setAddRowMenuOpen(false);
    setSaved(false);
  }

  function removeRow(rowId: string) {
    if (rows.length <= 1) return;
    if (!confirm("Remove this row?")) return;
    setRows(rows.filter((r) => r.id !== rowId));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateAboutRows(rows);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedRows(rows);
      setSaved(true);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
            {rows.length} row{rows.length === 1 ? "" : "s"}
          </p>
          <div className="relative">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddRowMenuOpen((o) => !o)}>
              <Plus size={14} /> Add row
            </Button>
            {addRowMenuOpen && <BlockTypeMenu onPick={addRow} />}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3">
          <Button type="button" variant="gold" size="sm" onClick={handleSave} disabled={pending || !dirty}>
            {pending ? "Saving..." : "Save Changes"}
          </Button>
          {!dirty && saved && <span className="text-sm text-green-700">Saved.</span>}
          {dirty && <span className="text-sm text-charcoal/50">Unsaved changes</span>}
          <FieldError>{error ?? undefined}</FieldError>
        </div>

        <Reorder.Group axis="y" values={rows} onReorder={(next) => { setRows(next); setSaved(false); }} className="mt-4 space-y-3">
          {rows.map((row, i) => (
            <RowCard
              key={row.id}
              row={row}
              index={i}
              onChangeBlock={(colId, block) => changeBlock(row.id, colId, block)}
              onChangeSpan={(colId, span) => changeSpan(row.id, colId, span)}
              onRemoveColumn={(colId) => removeColumn(row.id, colId)}
              onMoveColumn={(colId, direction) => moveColumn(row.id, colId, direction)}
              onAddColumn={(type) => addColumn(row.id, type)}
              onRemoveRow={() => removeRow(row.id)}
              canRemoveRow={rows.length > 1}
            />
          ))}
        </Reorder.Group>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-charcoal/50">Live preview</p>
        <LivePreview rows={rows} />
      </div>
    </div>
  );
}
