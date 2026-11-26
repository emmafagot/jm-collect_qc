// =====================================================================================
// Intelcom Dragonfly - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/intelcom/ may use
// this file. New client: never built in BigQuery before (no scheduled query, no
// union_media / dashboard). Reads the raw Supermetrics table of intelcom_sr_etl and the
// shared MiQ table, and writes ONLY to intelcom_dataform (created by Dataform on the
// first run).
// =====================================================================================

const client = "Intelcom Dragonfly";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "intelcom";

// Raw Supermetrics tables (read only) and the dataset every intelcom action writes to.
const sourceDataset = "intelcom_sr_etl";
const outputDataset = "intelcom_dataform";

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

// Manual backfill: set the compilation variable intelcom_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.intelcom_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`intelcom_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// Checked 2026-11-26 (no scheduled query to port): no start date, no campaign exclusion.
// Google Ads L1 (intelcom_sr_etl.GOOGLEADS_GADL1_SR): cost > 0, campaign types below.
// Data from 2026-10-01 (Search + Performance Max).
const googleAdsChannelTypes = ["search", "shopping", "performance max"];

// MiQ (social bought through the partner MiQ, shared table partner_miq): only these
// profiles belong to Intelcom Dragonfly. Cost > 0. Data from 2026-09-01 (LinkedIn),
// 2026-10-07 (Meta), 2026-10-15 (Reddit).
const miqProfileIds = [
  "750579406662348", // Meta - Intelcom Dragonfly_Jungle+MiQ
  "526280958",       // Linkedin - Intelcom Dragonfly_Jungle+MiQ
  "a2_jnvui4ievjqf"  // Reddit - Intelcom Dragonfly_Jungle+MiQ
];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
// On 2026-11-26 Mediabox held 2 shortcodes for "intelcom dragonfly"; every other label
// comes from the agency (plusco) lists.
const shortcodeClientName = "intelcom dragonfly";

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
  miqProfileIds,
  shortcodeClientName
};
