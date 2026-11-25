// =====================================================================================
// Groupe Marcelle - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/marcelle/ may use
// this file. Replaces the BigQuery scheduled query marcelle_dash_ah_last_days, which
// writes marcelle_sr_etl.union_media and marcelle_sr_etl.dash_ah. This pipeline reads
// the same raw Supermetrics tables but writes ONLY to marcelle_dataform, so the
// scheduled query and its tables are untouched while both run side by side.
// =====================================================================================

const client = "Groupe Marcelle";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "marcelle";

// Raw Supermetrics tables (read only) and the dataset every marcelle action writes to.
const sourceDataset = "marcelle_sr_etl";
const outputDataset = "marcelle_dataform";

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

// Manual backfill: set the compilation variable marcelle_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.marcelle_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`marcelle_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// CM360: Yahoo DSP is collected separately (VDSP_YAH_SR), so its CM360 rows were meant
// to be excluded. In the scheduled query the exclusion never applied (AND / OR
// precedence: it only applied to the "clicks > 5" branch). On 2026-11-20 the last 30
// days of dash_ah held 295 CM360 "yahoo dsp" rows ($23,954 / 14.3M impressions).
// Exclusion applied (decided 2026-11-20): Yahoo DSP is reported by the yahoo source only.
const cm360ExcludeYahooDsp = true;

// Yahoo DSP: the raw table carries no account, so it is set here.
const yahooAccountId = "2340";
const yahooAccountName = "Jungle Media Canada";

// MiQ (social bought through the partner MiQ, shared table partner_miq): only these
// profiles belong to Groupe Marcelle. Added 2026-11-25, data from 2026-10-27.
const miqProfileIds = [
  "a2_jvm0nh884j56" // Reddit - Groupe Marcelle Inc_Jungle+MiQ
];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
const shortcodeClientName = "groupe marcelle";

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
  yahooAccountId,
  yahooAccountName,
  miqProfileIds,
  shortcodeClientName
};
