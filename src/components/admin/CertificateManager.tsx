"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2 } from "lucide-react";
import { uploadCertificateFile, removeCertificateFile } from "@/actions/catalog-admin";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Field";

export function CertificateManager({ gemstoneId, certFileUrl }: { gemstoneId: string; certFileUrl: string | null }) {
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
      const result = await uploadCertificateFile(gemstoneId, formData);
      if (!result.ok) setError(result.error);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    });
  }

  function handleRemove() {
    if (!confirm("Remove the attached certificate file?")) return;
    startTransition(async () => {
      await removeCertificateFile(gemstoneId);
      router.refresh();
    });
  }

  return (
    <div>
      {certFileUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-ivory-soft px-4 py-3">
          <FileText size={18} className="shrink-0 text-charcoal/60" />
          <a href={certFileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-sm text-charcoal underline decoration-charcoal/30 underline-offset-2 hover:text-gold">
            View attached certificate
          </a>
          <button type="button" title="Remove" onClick={handleRemove} disabled={pending} className="shrink-0 rounded p-1.5 text-charcoal/50 hover:bg-charcoal/10 hover:text-red-700">
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <p className="text-sm text-charcoal/50">No certificate file attached yet.</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input ref={fileInput} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="text-sm" />
        <Button type="button" variant="outline" size="sm" onClick={handleUpload} disabled={pending}>
          {pending ? "Uploading..." : certFileUrl ? "Replace File" : "Upload Certificate"}
        </Button>
      </div>
      <p className="mt-1.5 text-xs text-charcoal/45">PDF, JPEG, PNG, or WEBP — a scan or photo of the lab report.</p>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
