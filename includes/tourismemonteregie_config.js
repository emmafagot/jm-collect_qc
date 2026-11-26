// =====================================================================================
// Tourisme Montérégie - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/tourismemonteregie/ may use this
// file. New client: never built in BigQuery before (no scheduled query, no union_media /
// dashboard). Reads the raw Supermetrics tables of tourismemonteregie_sr_etl,
// and writes ONLY to tourismemonteregie_dataform (created by Dataform on the first run).
// =====================================================================================

const client = "Tourisme Montérégie";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "tourismemonteregie";

// Raw Supermetrics tables (read only) and the dataset every tourismemonteregie action writes to.
const sourceDataset = "tourismemonteregie_sr_etl";
const outputDataset = "tourismemonteregie_dataform";

// -------------------------------------------------------------------------------------
// Processing window
// -------------------------------------------------------------------------------------
// Daily run: last 30 days + today (Toronto time). Steps 1-4 only hold this window; the
// dashboard deletes this window and re-inserts it, older rows are never touched.
// Written on the DATE column directly (date >= ...) so BigQuery prunes partitions.
const timezone = "America/Toronto";
const lookbackDays = 30;

// Manual backfill: set the compilation variable tourismemonteregie_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window. Full history starts 2026-05-14.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.tourismemonteregie_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`tourismemonteregie_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// Checked 2026-11-26 (no scheduled query to port): no start date, no campaign exclusion.

// CM360: noise floor (spend, > 10 impressions or > 5 clicks), as for every CM360 client,
// and these sites removed (LOWER(site)).
// MiQ / Media IQ sites excluded (requested 2026-11-26).
const cm360ExcludedSites = ["miq", "media iq"];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
// Checked 2026-11-26: 2 shortcodes under this name, other labels from the plusco lists.
const shortcodeClientName = "tourisme montérégie";

module.exports = {
  client,
  tag,
  sourceDataset,
  outputDataset,
  timezone,
  lookbackDays,
  backfillStartDate,
  windowStart,
  cm360ExcludedSites,
  shortcodeClientName
};
