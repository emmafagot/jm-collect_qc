// =====================================================================================
// Hubblo - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/hubblo/ may use
// this file. New client: never built in BigQuery before (no scheduled query, no
// hubblo_sr_etl dataset). Its only source is the shared MiQ table, and every action writes
// ONLY to hubblo_dataform (created by Dataform on the first run).
// =====================================================================================

const client = "Hubblo";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "hubblo";

// Dataset every hubblo action writes to (no client source dataset: MiQ only).
const outputDataset = "hubblo_dataform";

// -------------------------------------------------------------------------------------
// Processing window
// -------------------------------------------------------------------------------------
// Daily run: last 30 days + today (Toronto time). Steps 1-4 only hold this window; the
// dashboard deletes this window and re-inserts it, older rows are never touched.
//
// Written on the DATE column directly (date >= ...) so BigQuery prunes partitions. The
// old filter DATE(TIMESTAMP(date), "America/Toronto") >= CURRENT_DATE - 31 is exactly
// date >= CURRENT_DATE - 30, because TIMESTAMP(date) is midnight UTC = the previous
// evening in Toronto.
const timezone = "America/Toronto";
const lookbackDays = 30;

// Manual backfill: set the compilation variable hubblo_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.hubblo_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`hubblo_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// MiQ only (shared table partner_miq), cost > 0, no start date, no campaign exclusion.
// Data from 2026-04-08 (last delivery 2026-07-23, checked 2026-11-25).

// MiQ (social bought through the partner MiQ, shared table partner_miq): only these
// profiles belong to Hubblo.
const miqProfileIds = [
  "2151715245664308" // Meta - Hubblo SAT_Jungle+MiQ
];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
// Mediabox client_name "Hubblo" (checked 2026-11-25).
const shortcodeClientName = "hubblo";

module.exports = {
  client,
  tag,
  outputDataset,
  timezone,
  lookbackDays,
  backfillStartDate,
  windowStart,
  miqProfileIds,
  shortcodeClientName
};
