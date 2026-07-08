"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createLead } from "@/app/(portal)/leads/actions";
import { inputClass, labelClass, buttonClass, secondaryButtonClass } from "@/components/ui";

export function LeadForm({
  listings,
}: {
  listings: { id: string; title: string; webRef: string }[];
}) {
  const [state, formAction, pending] = useActionState(createLead, undefined);

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      <div>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input id="name" name="name" required className={inputClass} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">
            Phone
          </label>
          <input id="phone" name="phone" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="listingId">
          Listing
        </label>
        <select id="listingId" name="listingId" className={inputClass} defaultValue="">
          <option value="">Not linked to a listing</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} ({l.webRef})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="message">
          Message / enquiry
        </label>
        <textarea id="message" name="message" rows={3} className={inputClass} />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Saving…" : "Create lead"}
        </button>
        <Link href="/leads" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
