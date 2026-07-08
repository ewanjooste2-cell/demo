"use client";

import { useActionState } from "react";
import { importLeadEmail, importReport } from "./actions";
import { Card, inputClass, labelClass, buttonClass } from "@/components/ui";

export default function ImportPage() {
  const [emailState, emailAction, emailPending] = useActionState(importLeadEmail, undefined);
  const [reportState, reportAction, reportPending] = useActionState(importReport, undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Import from Private Property</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Two ways to get your Private Property data in: paste an enquiry email to log a lead, or
          upload the listing report export to record views.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="p-6">
          <h2 className="font-medium text-stone-900 dark:text-stone-100">Paste a lead email</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 mb-4">
            Copy the whole enquiry notification email from Private Property and paste it here. The
            portal picks out the name, contact details, message and web ref, and links the lead to
            the right listing automatically.
          </p>
          <form action={emailAction} className="space-y-3">
            <textarea
              name="emailText"
              rows={10}
              className={`${inputClass} font-mono text-xs`}
              placeholder={`Name: Johan Botha\nEmail: johan@example.com\nPhone: 082 123 4567\nMessage: Hi, I'd like to view this property...\nWeb ref: T4236101`}
            />
            {emailState?.error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {emailState.error}
              </p>
            )}
            <button type="submit" disabled={emailPending} className={buttonClass}>
              {emailPending ? "Parsing…" : "Create lead from email"}
            </button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-medium text-stone-900 dark:text-stone-100">Upload the listing report</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 mb-4">
            In the Private Property agent portal, export your listing report (views, alerts and
            leads per listing) and upload it here. Each upload records a snapshot, so uploading
            weekly builds the trend graphs.
          </p>
          <form action={reportAction} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="file">
                Report file (CSV or XLSX)
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="block w-full text-sm text-stone-600 dark:text-stone-400 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 dark:file:bg-stone-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-stone-700 dark:file:text-stone-300 hover:file:bg-stone-200 dark:hover:file:bg-stone-700"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="capturedAt">
                Report date
              </label>
              <input
                id="capturedAt"
                name="capturedAt"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
              <input type="checkbox" name="createMissing" defaultChecked className="rounded border-stone-300 dark:border-stone-700" />
              Create listings for web refs not in the portal yet
            </label>
            {reportState?.error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {reportState.error}
              </p>
            )}
            {reportState?.success && (
              <p className="text-sm text-green-700 dark:text-green-400" role="status">
                {reportState.success}
              </p>
            )}
            <button type="submit" disabled={reportPending} className={buttonClass}>
              {reportPending ? "Importing…" : "Import report"}
            </button>
          </form>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-medium text-stone-900 dark:text-stone-100">Automatic lead capture (webhook)</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          To log leads automatically without pasting: set up a rule in Outlook/Power Automate (or a
          service like Mailparser) that forwards Private Property enquiry emails as a POST request
          to <code className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-xs">/api/webhooks/lead</code>{" "}
          with the header{" "}
          <code className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-xs">x-webhook-token</code> set to
          the value of <code className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-xs">LEAD_WEBHOOK_TOKEN</code>{" "}
          in the portal&apos;s .env file. Send JSON with either{" "}
          <code className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-xs">
            {"{ name, email, phone, message, webRef }"}
          </code>{" "}
          or the raw email as{" "}
          <code className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-xs">{"{ subject, body }"}</code>{" "}
          — the portal parses it the same way as the paste box above.
        </p>
      </Card>
    </div>
  );
}
