// =====================================================================================
// CQTS - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/cqts/ may use
// this file. New client: never built in BigQuery before (no scheduled query, no
// union_media / dashboard). Reads the raw Supermetrics table of cqts_sr_etl and the
// shared MiQ table, and writes ONLY to cqts_dataform (created by Dataform on the first
// run).
// =====================================================================================

const client = "CQTS";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "cqts";

// Raw Supermetrics tables (read only) and the dataset every cqts action writes to.
const sourceDataset = "cqts_sr_etl";
const outputDataset = "cqts_dataform";

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

// Manual backfill: set the compilation variable cqts_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.cqts_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`cqts_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// Checked 2026-11-26 (no scheduled query to port): no start date, no campaign exclusion.
// CM360 (cqts_sr_etl.GOOGLECM_CM360_SR): noise floor (spend, > 10 impressions or > 5
// clicks), as for every CM360 client. No Yahoo DSP site in this table, so the Yahoo DSP
// exclusion is off (it only matters for clients that also collect Yahoo directly).
const cm360ExcludeYahooDsp = false;

// MiQ (social bought through the partner MiQ, shared table partner_miq): only these
// profiles belong to CQTS. Cost > 0. Data from 2026-11-09.
const miqProfileIds = [
  "1455316246208040",                    // Meta - CQTS_Jungle+MiQ
  "7703976612488380424",                 // Tiktok - CQTS_Jungle+MiQ
  "5b81a3ce-8560-4225-b364-2c5fc27115a4" // Snapchat - CQTS_Jungle+MiQ
];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
// On 2026-11-26 Mediabox had no list for "cqts": every label comes from the agency
// (plusco) lists until the client is created in Mediabox.
const shortcodeClientName = "cqts";

module.exports = {
  client,
  tag,
  sourceDataset,
  outputDataset,
  timezone,
  lookbackDays,
  backfillStartDate,
  windowStart,
  cm360ExcludeYahooDsp,
  miqProfileIds,
  shortcodeClientName
};
