"use client";

import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[hsl(var(--card))] p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-center">{title}</h2>
        {description && <p className="mt-2 text-sm text-[hsl(var(--foreground))]/70 text-center">{description}</p>}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm"
            type="button"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-[hsl(var(--primary))]/10 px-4 py-2 text-[hsl(var(--primary))]"
            type="button"
            disabled={loading}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
