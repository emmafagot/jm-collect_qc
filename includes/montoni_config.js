// =====================================================================================
// Le Groupe Montoni - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/montoni/ may use this
// file. New client: never built in BigQuery before (no scheduled query, no union_media /
// dashboard). Reads the raw Supermetrics tables of montoni_sr_etl,
// and writes ONLY to montoni_dataform (created by Dataform on the first run).
// =====================================================================================

const client = "Le Groupe Montoni";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "montoni";

// Raw Supermetrics tables (read only) and the dataset every montoni action writes to.
const sourceDataset = "montoni_sr_etl";
const outputDataset = "montoni_dataform";

// -------------------------------------------------------------------------------------
// Processing window
// -------------------------------------------------------------------------------------
// Daily run: last 30 days + today (Toronto time). Steps 1-4 only hold this window; the
// dashboard deletes this window and re-inserts it, older rows are never touched.
// Written on the DATE column directly (date >= ...) so BigQuery prunes partitions.
const timezone = "America/Toronto";
const lookbackDays = 30;

// Manual backfill: set the compilation variable montoni_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window. Full history starts 2026-09-09.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.montoni_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`montoni_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// Checked 2026-11-26 (no scheduled query to port): no start date, no campaign exclusion.

// Yahoo DSP: cost > 0. The raw table carries no account, so it is set here.
const yahooAccountId = "2340";
const yahooAccountName = "Jungle Media Canada";

// Google Ads (GADL1): cost > 0. Empty list = every campaign type.
const googleAdsL1ChannelTypes = [];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
// On 2026-11-26 Mediabox had no list under this name: every label comes from the
// agency (plusco) lists until the client exists in Mediabox.
const shortcodeClientName = "le groupe montoni";

module.exports = {
  client,
  tag,
  sourceDataset,
  outputDataset,
  timezone,
  lookbackDays,
  backfillStartDate,
  windowStart,
  yahooAccountId,
  yahooAccountName,
  googleAdsL1ChannelTypes,
  shortcodeClientName
};
