// =====================================================================================
// Nautilus Plus - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/nautilus/ may use
// this file. Replaces the BigQuery scheduled query nautilus_dashboard_last_days, which
// writes nautilus_sr_etl.union_media and nautilus_sr_etl.dashboard. This pipeline reads
// the same raw Supermetrics tables but writes ONLY to nautilus_dataform, so the
// scheduled query and its tables are untouched while both run side by side.
// =====================================================================================

const client = "Nautilus Plus";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "nautilus";

// Raw Supermetrics tables (read only) and the dataset every nautilus action writes to.
const sourceDataset = "nautilus_sr_etl";
const outputDataset = "nautilus_dataform";

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

// Manual backfill: set the compilation variable nautilus_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.nautilus_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`nautilus_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// Checked 2026-11-25 in the scheduled query nautilus_dashboard_last_days and the saved
// queries nautilus_union_media / nautilus_dashboard: no start date (raw data from
// 2026-09-01), same clauses in all three.
// Meta: no filter (zero-cost rows kept).
// Google Ads L1: cost > 0, campaign types below, and the campaigns below excluded.
const googleAdsChannelTypes = ["search", "shopping", "performance max"];

// Old Google Ads campaigns (former naming "44509794_np-ongoing_paid-search_...", no
// taxonomy), excluded in all three queries. Last delivery 2026-09-07.
const googleAdsExcludedCampaignIds = [
  "15248275381", "19734943655", "23041110420",
  "15182044525", "23041110423", "19741299505"
];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
// "nautilus plus" as in the scheduled query. On 2026-11-25 the shortcode table had no
// list for this client, so every label comes from the agency (plusco) lists.
const shortcodeClientName = "nautilus plus";

module.exports = {
  client,
  tag,
  sourceDataset,
  outputDataset,
  timezone,
  lookbackDays,
  backfillStartDate,
  windowStart,
  googleAdsChannelTypes,
  googleAdsExcludedCampaignIds,
  shortcodeClientName
};
