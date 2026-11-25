// =====================================================================================
// Café William - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/cafewilliam/ may use
// this file. Replaces the BigQuery scheduled query cafewilliam_dashboard_last_days,
// which writes cafewilliam_sr_etl.union_media and cafewilliam_sr_etl.dashboard. This
// pipeline reads the same MiQ table but writes ONLY to cafewilliam_dataform, so the
// scheduled query and its tables are untouched while both run side by side.
// =====================================================================================

const client = "Café William";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "cafewilliam";

// Client dataset of the scheduled query (holds no raw table: the only source is the
// shared MiQ table) and the dataset every cafewilliam action writes to.
const sourceDataset = "cafewilliam_sr_etl";
const outputDataset = "cafewilliam_dataform";

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

// Manual backfill: set the compilation variable cafewilliam_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.cafewilliam_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`cafewilliam_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// Checked 2026-11-25 in the scheduled query cafewilliam_dashboard_last_days: the only
// source is MiQ (shared table partner_miq, no raw table in cafewilliam_sr_etl), cost > 0,
// no start date (data from 2026-08-31), no campaign exclusion.

// MiQ (social bought through the partner MiQ, shared table partner_miq): only these
// profiles belong to Café William.
const miqProfileIds = [
  "623148979412379",    // Meta - Cafe Williams_MiQ
  "7697040583310802962" // TikTok - Cafe William_Jungle+MiQ
];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
const shortcodeClientName = "café william";

module.exports = {
  client,
  tag,
  sourceDataset,
  outputDataset,
  timezone,
  lookbackDays,
  backfillStartDate,
  windowStart,
  miqProfileIds,
  shortcodeClientName
};
