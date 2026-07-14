"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createHunt } from "@/app/(portal)/hunting/actions";
import { inputClass, labelClass, buttonClass, secondaryButtonClass } from "@/components/ui";

export function HuntForm({
  agents,
  isAdmin,
  currentUserId,
}: {
  agents: { id: string; name: string }[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState(createHunt, undefined);

  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="address">
            Property address
          </label>
          <input id="address" name="address" required className={inputClass} placeholder="12 Main Rd" />
        </div>
        <div>
          <label className={labelClass} htmlFor="suburb">
            Suburb
          </label>
          <input id="suburb" name="suburb" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="ownerName">
          Home owner name
        </label>
        <input id="ownerName" name="ownerName" required className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="ownerPhone">
            Owner contact number
          </label>
          <input id="ownerPhone" name="ownerPhone" type="tel" className={inputClass} placeholder="082 123 4567" />
        </div>
        <div>
          <label className={labelClass} htmlFor="ownerEmail">
            Owner email
          </label>
          <input id="ownerEmail" name="ownerEmail" type="email" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="sourceUrl">
            Link to the posting
          </label>
          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            className={inputClass}
            placeholder="https://… (Marketplace, Gumtree, private listing)"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="askingPrice">
            Asking price (R, optional)
          </label>
          <input id="askingPrice" name="askingPrice" type="number" min="0" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className={inputClass}
          placeholder="Anything useful — condition, why it looks promising, best time to call…"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="agentId">
          Assign to agent {isAdmin ? "" : "(optional — you can take it yourself)"}
        </label>
        <select
          id="agentId"
          name="agentId"
          defaultValue={isAdmin ? "" : currentUserId}
          className={inputClass}
        >
          <option value="">Unassigned — decide later</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Saving…" : "Add hunt"}
        </button>
        <Link href="/hunting" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
