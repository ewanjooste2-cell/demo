"use client";

import { useActionState } from "react";
import Link from "next/link";
import { inputClass, labelClass, buttonClass, secondaryButtonClass } from "@/components/ui";
import { LISTING_STATUSES, LISTING_STATUS_LABELS } from "@/lib/format";

type Agent = { id: string; name: string };

type ListingValues = {
  webRef?: string;
  title?: string;
  address?: string;
  suburb?: string;
  price?: number;
  propertyType?: string;
  bedrooms?: number | null;
  status?: string;
  url?: string | null;
  agentId?: string | null;
};

export function ListingForm({
  action,
  agents,
  isAdmin,
  initial = {},
  submitLabel,
}: {
  action: (prev: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string }>;
  agents: Agent[];
  isAdmin: boolean;
  initial?: ListingValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="webRef">
            Web ref (Private Property)
          </label>
          <input id="webRef" name="webRef" required defaultValue={initial.webRef} className={inputClass} placeholder="T4236137" />
        </div>
        <div>
          <label className={labelClass} htmlFor="price">
            Asking price (R)
          </label>
          <input id="price" name="price" type="number" min="0" required defaultValue={initial.price} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="title">
          Title
        </label>
        <input id="title" name="title" required defaultValue={initial.title} className={inputClass} placeholder="3 Bedroom House in Somerset West" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="address">
            Address
          </label>
          <input id="address" name="address" defaultValue={initial.address} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="suburb">
            Suburb
          </label>
          <input id="suburb" name="suburb" required defaultValue={initial.suburb} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="propertyType">
            Type
          </label>
          <select id="propertyType" name="propertyType" defaultValue={initial.propertyType ?? "House"} className={inputClass}>
            {["House", "Apartment", "Townhouse", "Vacant Land", "Farm", "Commercial"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="bedrooms">
            Bedrooms
          </label>
          <input id="bedrooms" name="bedrooms" type="number" min="0" defaultValue={initial.bedrooms ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select id="status" name="status" defaultValue={initial.status ?? "ACTIVE"} className={inputClass}>
            {LISTING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LISTING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="url">
          Private Property URL
        </label>
        <input id="url" name="url" type="url" defaultValue={initial.url ?? ""} className={inputClass} placeholder="https://www.privateproperty.co.za/for-sale/…" />
      </div>
      {isAdmin && (
        <div>
          <label className={labelClass} htmlFor="agentId">
            Agent
          </label>
          <select id="agentId" name="agentId" defaultValue={initial.agentId ?? ""} className={inputClass}>
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href="/listings" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
