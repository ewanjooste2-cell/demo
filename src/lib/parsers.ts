import * as XLSX from "xlsx";

/**
 * Parsers for the two ways data comes out of Private Property (privateproperty.co.za):
 *  1. Lead notification emails (forwarded/pasted/webhooked text)
 *  2. The listing report exported from the Private Property agent portal (CSV/XLSX)
 * Kept deliberately lenient so Property24-format emails/reports also parse.
 */

export type ParsedLead = {
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  webRef: string | null;
};

/** Pull a lead out of a portal enquiry email body (plain text). */
export function parseLeadEmail(text: string): ParsedLead {
  const clean = text.replace(/\r/g, "");

  const grab = (patterns: RegExp[]): string | null => {
    for (const p of patterns) {
      const m = clean.match(p);
      if (m?.[1]) return m[1].trim();
    }
    return null;
  };

  const name = grab([
    /(?:^|\n)\s*(?:name|from|contact name)\s*[:\-]\s*(.+)/i,
    /enquiry from\s+([A-Za-z][A-Za-z .'-]+)/i,
  ]);

  // Email: labeled line first, else first address that isn't the portal's own.
  let email = grab([/(?:^|\n)\s*(?:e-?mail(?: address)?)\s*[:\-]\s*([^\s,]+@[^\s,]+)/i]);
  if (!email) {
    const all = clean.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
    email = all.find((e) => !/privateproperty|property24/i.test(e)) ?? null;
  }

  const phone = grab([
    /(?:^|\n)\s*(?:phone|tel|telephone|contact(?: number)?|cell(?:phone)?|mobile)\s*[:\-]\s*([+0-9][0-9 ()\-]{6,})/i,
    /(?:^|\n)\s*([+]?27[0-9 \-]{8,}|0[0-9]{2}[ \-]?[0-9]{3}[ \-]?[0-9]{4})\s*(?:\n|$)/,
  ]);

  const message = grab([
    /(?:^|\n)\s*(?:message|comments?|enquiry)\s*[:\-]\s*([\s\S]{5,800}?)(?:\n\s*\n|\n\s*(?:name|e-?mail|phone|tel|web ?ref|reference|listing)\s*[:\-]|$)/i,
  ]);

  // Web refs look like T4236137 / RR4236137 / 116363032 (labeled), or appear in the listing URL.
  const webRef = grab([
    /(?:^|\n)\s*(?:web ?ref(?:erence)?|listing (?:number|ref)|reference|property ref)\s*[:#\-]\s*([A-Z]{0,3}[0-9]{4,12})/i,
    /privateproperty\.co\.za\/[^\s]*?\/([A-Z]{0,3}[0-9]{4,12})(?:[^\dA-Za-z]|$)/i,
    /property24\.com\/[^\s]*?\/([0-9]{6,12})(?:[^\d]|$)/i,
    /\b((?:RR|T)[0-9]{5,9})\b/,
  ]);

  return { name, email, phone, message, webRef };
}

export type ReportRow = {
  webRef: string;
  title: string | null;
  address: string | null;
  price: number | null;
  views: number;
  alertsSent: number;
  leadsCount: number;
};

/**
 * Parse a Private Property listing report (CSV or XLSX buffer).
 * Column names vary, so headers are matched loosely.
 */
export function parseListingReport(buffer: Buffer): ReportRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const findKey = (row: Record<string, unknown>, candidates: string[]) => {
    const keys = Object.keys(row);
    for (const c of candidates) {
      const k = keys.find((key) => norm(key).includes(c));
      if (k) return k;
    }
    return null;
  };

  const out: ReportRow[] = [];
  for (const row of rows) {
    const refKey = findKey(row, ["webref", "reference", "listingnumber", "webreference"]);
    if (!refKey || row[refKey] == null) continue;
    const webRef = String(row[refKey]).trim();
    if (!webRef) continue;

    const num = (candidates: string[]): number => {
      const k = findKey(row, candidates);
      if (!k || row[k] == null) return 0;
      const n = Number(String(row[k]).replace(/[^\d.-]/g, ""));
      return Number.isFinite(n) ? Math.round(n) : 0;
    };
    const str = (candidates: string[]): string | null => {
      const k = findKey(row, candidates);
      return k && row[k] != null ? String(row[k]).trim() : null;
    };

    out.push({
      webRef,
      title: str(["title", "description", "propertytitle"]),
      address: str(["address", "propertyaddress", "street"]),
      price: num(["price", "askingprice"]) || null,
      views: num(["views", "pageviews", "totalviews"]),
      alertsSent: num(["alertssent", "alerts"]),
      leadsCount: num(["leads", "totalleads", "enquiries"]),
    });
  }
  return out;
}
