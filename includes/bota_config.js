// =====================================================================================
// Bota Bota - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/bota/ may use this
// file. New client: never built in BigQuery before (no scheduled query, no union_media /
// dashboard). Reads the raw Supermetrics tables of bota_sr_etl,
// and writes ONLY to bota_dataform (created by Dataform on the first run).
// =====================================================================================

const client = "Bota Bota";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "bota";

// Raw Supermetrics tables (read only) and the dataset every bota action writes to.
const sourceDataset = "bota_sr_etl";
const outputDataset = "bota_dataform";

// -------------------------------------------------------------------------------------
// Processing window
// -------------------------------------------------------------------------------------
// Daily run: last 30 days + today (Toronto time). Steps 1-4 only hold this window; the
// dashboard deletes this window and re-inserts it, older rows are never touched.
// Written on the DATE column directly (date >= ...) so BigQuery prunes partitions.
const timezone = "America/Toronto";
const lookbackDays = 30;

// Manual backfill: set the compilation variable bota_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window. Full history starts 2026-10-01.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.bota_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`bota_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// Checked 2026-11-26 (no scheduled query to port): no start date, no campaign exclusion.

// TikTok: cost > 0.

// Google Ads: cost > 0, as in sepaq_dash_ah_last_days (cm-collect). Campaign types read
// at campaign level (GADL1, Search naming packs the ad group tokens into the campaign
// name) and at ad level (GADL3). GADL3 also holds the Search campaigns, so the two
// lists must not overlap. Video added to the sepaq L3 list (display, demand gen):
// Bota Bota ran YouTube campaigns (2026-10-01 to 10-07).
const googleAdsL1ChannelTypes = ["search", "shopping", "performance max"];
const googleAdsL3ChannelTypes = ["display", "demand gen", "video"];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
// Checked 2026-11-26: 3 shortcodes under this name, other labels from the plusco lists.
const shortcodeClientName = "botabota";

module.exports = {
  client,
  tag,
  sourceDataset,
  outputDataset,
  timezone,
  lookbackDays,
  backfillStartDate,
  windowStart,
  googleAdsL1ChannelTypes,
  googleAdsL3ChannelTypes,
  shortcodeClientName
};
