"use client";

import { useActionState } from "react";
import {
  type DeactivateUserFormState,
  deactivateUser,
} from "@/app/admin/users/actions";

const initialState: DeactivateUserFormState = {
  status: "idle",
  message: "",
};

type DeactivateUserButtonProps = {
  userId: string;
  userName: string;
  disabledReason?: string;
};

export function DeactivateUserButton({
  userId,
  userName,
  disabledReason,
}: DeactivateUserButtonProps) {
  const [state, formAction, isPending] = useActionState(
    deactivateUser,
    initialState,
  );

  if (disabledReason) {
    return (
      <span className="text-xs font-semibold text-slate-400">
        {disabledReason}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `¿Desactivar la cuenta de ${userName}? Ya no podrá iniciar sesión.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input name="userId" type="hidden" value={userId} />
        <button
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Desactivando…" : "Desactivar"}
        </button>
      </form>
      {state.message ? (
        <p
          aria-live="polite"
          className={`max-w-48 text-right text-xs ${
            state.status === "error" ? "text-red-600" : "text-emerald-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
