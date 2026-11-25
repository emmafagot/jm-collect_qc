// =====================================================================================
// Agropur - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/agropur/ may use
// this file. Replaces the BigQuery scheduled query agropur_dash_ah_last_days, which
// writes agropur_sr_etl.union_media and agropur_sr_etl.dash_ah. This pipeline reads
// the same raw Supermetrics tables but writes ONLY to agropur_dataform, so the
// scheduled query and its tables are untouched while both run side by side.
// =====================================================================================

const client = "Agropur";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "agropur";

// Raw Supermetrics tables (read only) and the dataset every agropur action writes to.
const sourceDataset = "agropur_sr_etl";
const outputDataset = "agropur_dataform";

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

// Manual backfill: set the compilation variable agropur_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.agropur_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`agropur_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// Checked 2026-11-24 in the scheduled query agropur_dash_ah_last_days and the saved
// queries agropur_union / agropur_dash_ah: no start date, no campaign exclusion.
// CM360: noise floor only (spend, > 10 impressions or > 5 clicks). The Yahoo DSP
// exclusion is commented out in all three queries: Agropur has no Yahoo source, so
// Yahoo DSP stays in CM360.
// Meta: cost > 0.
const cm360ExcludeYahooDsp = false;

// MiQ (social bought through the partner MiQ, shared table partner_miq): only these
// profiles belong to Agropur (Agropur brands included).
const miqProfileIds = [
  "1158291872860375", // Meta - Agropur_Jungle+MiQ (added 2026-11-25, data from 2026-11-11)
  "2442178479542270"  // Meta - Natrel_Jungle+MiQ (added 2026-11-25, data 2026-08-24 to 2026-09-18)
];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
const shortcodeClientName = "agropur";

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
