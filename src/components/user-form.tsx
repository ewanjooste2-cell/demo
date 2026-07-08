"use client";

import { useActionState } from "react";
import { createUser } from "@/app/(portal)/admin/users/actions";
import { inputClass, labelClass, buttonClass } from "@/components/ui";

export function UserForm() {
  const [state, formAction, pending] = useActionState(createUser, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="new-name">
          Full name
        </label>
        <input id="new-name" name="name" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="new-email">
          Email
        </label>
        <input id="new-email" name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="new-password">
          Password (min 8 characters)
        </label>
        <input id="new-password" name="password" type="password" required minLength={8} className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="new-role">
          Role
        </label>
        <select id="new-role" name="role" defaultValue="AGENT" className={inputClass}>
          <option value="AGENT">Agent — sees own listings and leads</option>
          <option value="ADMIN">Principal — sees everything, manages users</option>
        </select>
      </div>
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Adding…" : "Add user"}
      </button>
    </form>
  );
}
