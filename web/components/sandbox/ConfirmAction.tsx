"use client";

import { useActionState } from "react";
import { type ActionState } from "@/lib/sandbox/actions";
import { FormMessage, SubmitButton, initialActionState } from "@/components/sandbox/form-kit";

/**
 * A one-button form for destructive or irreversible sandbox actions
 * (delete, cancel, reset): asks the browser to confirm first, then shows
 * the server's refusal inline if a business rule blocks it.
 */
export function ConfirmAction({
  action,
  label,
  confirm,
  success,
  variant = "danger",
}: {
  action: (prev: ActionState) => Promise<ActionState>;
  label: string;
  confirm: string;
  success?: string;
  variant?: "danger" | "ghost";
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
      className="flex flex-col items-start gap-2"
    >
      <SubmitButton pending={pending} variant={variant}>
        {label}
      </SubmitButton>
      <FormMessage state={state} success={success} />
    </form>
  );
}
