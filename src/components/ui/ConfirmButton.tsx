"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type Props = {
  /** Question shown as the dialog heading. */
  question: string;
  /** Consequence of confirming, and the gentler alternative when there is one. */
  detail?: string;
  /** Label of the destructive button inside the dialog. */
  confirmLabel: string;
  /** Classes for the trigger, so each caller keeps the button it already had. */
  className?: string;
  disabled?: boolean;
  /** Submitter name/value: requestSubmit() carries them into the action. */
  name?: string;
  value?: string;
  children: ReactNode;
};

/**
 * Submit button that asks for confirmation in an in-page dialog instead of
 * window.confirm. It must be rendered inside the form it submits.
 */
export function ConfirmButton({ question, detail, confirmLabel, className, disabled, name, value, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const detailId = useId();

  // showModal() is what puts the dialog in the top layer, and the top layer is
  // where the focus trap, the Esc key and ::backdrop come from. Rendering the
  // element with the `open` attribute instead would give none of that.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus(); // destructive action: start on the safe choice
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function confirm() {
    const trigger = triggerRef.current;
    dialogRef.current?.close();
    // requestSubmit() submits without clicking the trigger, so the guard below
    // does not run again; passing it as the submitter keeps name/value.
    trigger?.form?.requestSubmit(trigger);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="submit"
        name={name}
        value={value}
        disabled={disabled}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        aria-describedby={detail ? detailId : undefined}
        onClose={() => setOpen(false)}
        onClick={(event) => { if (event.target === dialogRef.current) setOpen(false); }}
        className="confirm-dialog m-auto w-[min(30rem,calc(100vw-2rem))] rounded-2xl"
      >
        <div className="p-5 sm:p-6">
          <div className="flex gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-300">
              <AlertTriangle size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-1">
              <h2 id={headingId} className="text-lg font-black leading-tight tracking-tight">{question}</h2>
              {detail ? <p id={detailId} className="mt-2 text-sm leading-6 text-slate-400">{detail}</p> : null}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2 text-sm font-bold">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring inline-flex items-center rounded-xl border border-white/10 px-4 py-2.5 text-slate-200 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirm}
              className="focus-ring inline-flex items-center rounded-xl bg-red-600 px-4 py-2.5 text-white hover:bg-red-500"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
