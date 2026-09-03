"use client";

import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import Image from "next/image";
import { Reorder, useDragControls } from "motion/react";
import { GripVertical, Trash2, Plus, ChevronDown, X } from "lucide-react";
import { updateAboutBlocks, uploadAboutBlockImage } from "@/actions/page-content";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { AboutBlocksRenderer } from "@/components/about/AboutBlocksRenderer";
import { BLOCK_TYPES, type AboutBlock } from "@/lib/about-blocks";

// Full drag-and-drop page builder for the About page: a Reorder.Group of
// block cards (add/remove/reorder/edit) on the left, and a live preview
// pane on the right rendering the exact same draft state through
// AboutBlocksRenderer — the same component the real page uses — so the
// preview can never show something the saved page wouldn't. Nothing here
// touches the database until "Save Changes" is pressed; edits before that
// live only in this component's state.

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
                {block.items.length > 1 && (
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

function BlockCard({
  block,
  onChange,
  onRemove,
  canRemove,
}: {
  block: AboutBlock;
  onChange: (block: AboutBlock) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [open, setOpen] = useState(false);
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      className="rounded-xl border border-border-subtle bg-surface shadow-sm"
    >
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab touch-none text-charcoal/40 hover:text-charcoal active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center justify-between text-left">
          <span className="text-sm font-medium text-charcoal">{BLOCK_LABELS[block.type]}</span>
          <ChevronDown size={16} className={`text-charcoal/40 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? "Remove block" : "The page needs at least one block"}
          className="text-charcoal/40 hover:text-red-700 disabled:opacity-30 disabled:hover:text-charcoal/40"
        >
          <Trash2 size={15} />
        </button>
      </div>
      {open && (
        <div className="border-t border-border-subtle p-4">
          <BlockFields block={block} onChange={onChange} />
        </div>
      )}
    </Reorder.Item>
  );
}

function LivePreview({ blocks }: { blocks: AboutBlock[] }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => setScale(Math.max(0.15, el.clientWidth / 1440));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outerRef} className="w-full overflow-hidden rounded-2xl border border-border-subtle bg-ivory-soft">
      <div className="h-[calc(100vh-260px)] overflow-y-auto">
        <div style={{ width: 1440, zoom: scale } as CSSProperties}>
          <AboutBlocksRenderer blocks={blocks} animate={false} />
        </div>
      </div>
    </div>
  );
}

export function AboutBuilder({ initialBlocks }: { initialBlocks: AboutBlock[] }) {
  const [blocks, setBlocks] = useState<AboutBlock[]>(initialBlocks);
  const [savedBlocks, setSavedBlocks] = useState<AboutBlock[]>(initialBlocks);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const dirty = JSON.stringify(blocks) !== JSON.stringify(savedBlocks);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function updateBlock(id: string, next: AboutBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? next : b)));
    setSaved(false);
  }

  function removeBlock(id: string) {
    if (blocks.length <= 1) return;
    if (!confirm("Remove this block?")) return;
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSaved(false);
  }

  function addBlock(type: (typeof BLOCK_TYPES)[number]) {
    const block = type.create(crypto.randomUUID());
    setBlocks((prev) => [...prev, block]);
    setAddMenuOpen(false);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateAboutBlocks(blocks);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedBlocks(blocks);
      setSaved(true);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
            {blocks.length} block{blocks.length === 1 ? "" : "s"}
          </p>
          <div className="relative">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddMenuOpen((o) => !o)}>
              <Plus size={14} /> Add block
            </Button>
            {addMenuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-72 rounded-lg border border-border-subtle bg-surface p-1.5 shadow-lg">
                {BLOCK_TYPES.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => addBlock(t)}
                    className="block w-full rounded-md px-3 py-2 text-left hover:bg-ivory-soft"
                  >
                    <span className="text-sm font-medium text-charcoal">{t.label}</span>
                    <span className="block text-xs text-charcoal/55">{t.description}</span>
                  </button>
                ))}
              </div>
            )}
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

        <Reorder.Group
          axis="y"
          values={blocks}
          onReorder={(next) => {
            setBlocks(next);
            setSaved(false);
          }}
          className="mt-4 space-y-3"
        >
          {blocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              onChange={(next) => updateBlock(block.id, next)}
              onRemove={() => removeBlock(block.id)}
              canRemove={blocks.length > 1}
            />
          ))}
        </Reorder.Group>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-charcoal/50">Live preview</p>
        <LivePreview blocks={blocks} />
      </div>
    </div>
  );
}
