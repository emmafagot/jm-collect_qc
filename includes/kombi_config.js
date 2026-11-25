// =====================================================================================
// Kombi Sports - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/kombi/ may use
// this file. Replaces the BigQuery scheduled query kombi_dash_ah_last_days, which
// writes kombi_sr_etl.union_media and kombi_sr_etl.dash_ah. This pipeline reads
// the same raw Supermetrics tables but writes ONLY to kombi_dataform, so the
// scheduled query and its tables are untouched while both run side by side.
// =====================================================================================

const client = "Kombi Sports";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "kombi";

// Raw Supermetrics tables (read only) and the dataset every kombi action writes to.
const sourceDataset = "kombi_sr_etl";
const outputDataset = "kombi_dataform";

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

// Manual backfill: set the compilation variable kombi_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.kombi_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`kombi_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// Checked 2026-11-25 in the scheduled query kombi_dash_ah_last_days and the saved
// queries kombi_union / kombi_dash_ah: no start date (raw data from 2026-03-30), no
// campaign exclusion. (The saved copy kombi_dash_ah_last_days is an older version
// without conversions; the scheduled query is the reference.)
// Meta and TikTok: cost > 0. CM360 is not read (not in the scheduled query; the raw
// table only holds a few zero-cost rows).

// -------------------------------------------------------------------------------------
// Meta conversions (FBADS_METACONV_SR, one row per action type)
// -------------------------------------------------------------------------------------
// Each kept action type gets its own metric column. The scheduled query put them in one
// "conversions" column with a single conversion_name (MAX), so rows holding several
// types (e.g. add_to_cart + purchase) were labelled "purchase" and summed both.
// Decision 2026-11-25 (Emmanuelle): one column per type, no conversion_name.
// Columns are named after the action type, not the source, so another source (TikTok,
// Google Ads...) can fill the same columns later in its own step1 model.
const metaConversions = [
  { actionType: "purchase",    column: "purchase" },
  { actionType: "add_to_cart", column: "add_to_cart" },
  { actionType: "lead",        column: "lead" }
];
// Revenue of the purchases (action_value of the purchase rows).
const purchaseValueColumn = "purchase_value";

// Client-specific metrics carried through every step (see includes/media.js): every
// kombi step1 model returns them (0 when the source has none).
const extraMetrics = metaConversions.map(c => c.column).concat([purchaseValueColumn]);

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
const shortcodeClientName = "kombi sports";

module.exports = {
  client,
  tag,
  sourceDataset,
  outputDataset,
  timezone,
  lookbackDays,
  backfillStartDate,
  windowStart,
  metaConversions,
  purchaseValueColumn,
  extraMetrics,
  shortcodeClientName
};
