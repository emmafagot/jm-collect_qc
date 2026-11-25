// =====================================================================================
// Trema - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/trema/ may use
// this file. New client: never built in BigQuery before (no scheduled query, no
// trema_sr_etl dataset). Its only source is the shared MiQ table, and every action writes
// ONLY to trema_dataform (created by Dataform on the first run).
// =====================================================================================

const client = "Trema";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "trema";

// Dataset every trema action writes to (no client source dataset: MiQ only).
const outputDataset = "trema_dataform";

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

// Manual backfill: set the compilation variable trema_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.trema_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`trema_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// MiQ only (shared table partner_miq), cost > 0, no start date, no campaign exclusion.
// Data from 2026-06-16 (last delivery 2026-08-28, checked 2026-11-25).

// MiQ (social bought through the partner MiQ, shared table partner_miq): only these
// profiles belong to Trema.
const miqProfileIds = [
  "1455144666629536" // Meta - Trema_Jungle+MiQ
];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
// On 2026-11-25 Mediabox had no list for this client: every label comes from the
// agency (plusco) lists until a "trema" client is created in Mediabox.
const shortcodeClientName = "trema";

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
