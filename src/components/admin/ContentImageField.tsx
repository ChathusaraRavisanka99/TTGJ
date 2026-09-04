"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { FieldError, Label } from "@/components/ui/Field";
import type { ActionResult } from "@/actions/auth";

export function ContentImageField({
  label,
  currentSrc,
  action,
}: {
  label: string;
  currentSrc: string;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
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
      const result = await action(formData);
      if (!result.ok) setError(result.error);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    });
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-border-subtle bg-ivory-soft">
        <Image src={currentSrc} alt="" fill sizes="384px" className="object-cover" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input ref={fileInput} type="file" accept="image/*" className="text-sm" />
        <Button type="button" variant="outline" size="sm" onClick={handleUpload} disabled={pending}>
          {pending ? "Uploading..." : "Replace Image"}
        </Button>
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
