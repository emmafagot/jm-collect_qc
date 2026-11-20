// =====================================================================================
// Shared media helpers (NO client data here)
// -------------------------------------------------------------------------------------
// Generic building blocks reused by every client: the standard column list every
// step1 source model must return, and agency-wide labelling rules. Nothing in this
// file may name a client, a client dataset or a client filter - those live in
// includes/<client>_config.js only.
// =====================================================================================

// -------------------------------------------------------------------------------------
// Standard columns returned by every <client>_step1_<source> model.
// step2 selects these columns BY NAME (never SELECT *), so a source that returns its
// columns in a different order can never shift values into the wrong column.
// -------------------------------------------------------------------------------------
const unionDimensions = [
  // Platform structure
  "date", "data_source",
  "account_id", "account", "advertiser_id", "advertiser",
  "level_1_id", "level_1", "level_2_id", "level_2", "level_3_id", "level_3",
  "plt_publisher_id", "plt_publisher", "campaign_type", "currency",
  // Level 1 (campaign) taxonomy
  "client", "l1_lob", "campaign_identifier", "l1_objective", "l1_year",
  "external_id", "billing_id",
  // Level 2 (placement / ad group / line) taxonomy
  "l2_objective", "l2_product", "l2_lob", "l2_campaign_identifier",
  "publisher", "channel", "placement_location", "audience", "l2_language",
  "targeting", "targeting_details", "market", "market_details", "device",
  "buying_type", "l2_creative_grouping", "inventory",
  // Level 3 (creative / ad) taxonomy
  "creative_product_message", "version", "format", "format_details",
  "l3_language", "l3_creative_grouping", "cta", "creative_flight_dates",
  "l3_campaign_identifier", "l3_lob"
];

// Metrics. video_views and audio_views are FINAL here: each source decides in its own
// step1 model which platform metric is its "view", so no later step needs a
// CASE WHEN data_source = ...
const metrics = [
  "media_spend", "impressions", "clicks",
  "video_completion_25", "video_completion_50", "video_completion_75",
  "video_completion_95", "video_completion_100", "video_views",
  "audio_completion_25", "audio_completion_50", "audio_completion_75",
  "audio_completion_100", "audio_views",
  "post_likes", "post_engagements", "post_reactions", "post_comments",
  "post_saves", "post_shares", "carousel_swipes", "follows",
  "lost_impressions", "available_impressions",
  "viewable_impressions", "measurable_impressions"
];

// SELECT <every standard column> FROM <table> - used by step2 for each source.
function selectStandardColumns(table) {
  return `SELECT\n  ${unionDimensions.concat(metrics).join(",\n  ")}\nFROM ${table}`;
}

// "SUM(m) AS m" for every metric (optionally cast to INT64 except media_spend).
function sumMetrics(castToInt = false) {
  return metrics
    .map(m => (castToInt && m !== "media_spend")
      ? `CAST(SUM(${m}) AS INT64) AS ${m}`
      : `SUM(${m}) AS ${m}`)
    .join(",\n  ");
}

// -------------------------------------------------------------------------------------
// Agency-wide labelling rules (English display names)
// -------------------------------------------------------------------------------------

// Cossette programmatic desks are labelled here, not in Mediabox.
// Returns a SQL expression: the English label of a publisher / inventory code.
function agencyDeskLabelEn(codeColumn, mediaboxLabelColumn) {
  return `CASE
    WHEN ${codeColumn} = 'csp-dbm' THEN 'Cossette Programmatic DV360'
    WHEN ${codeColumn} = 'csp-ytb' THEN 'Cossette Programmatic Youtube'
    ELSE COALESCE(${mediaboxLabelColumn}, ${codeColumn})
  END`;
}

// Media type (channel group) derived from the data source and the publisher code.
const socialSources = ["meta", "linkedin", "x", "twitter", "snapchat", "pinterest", "tiktok", "reddit"];
const programmaticPublishers = [
  "adb-snp", "ask-loc", "aut-gnl", "cni-gnl", "dax-gnl", "fue-gnl", "ggl-gnl", "glassview",
  "gmg-gnl", "idn-gnl", "illumin", "inmark", "ipd-gnl", "mgn-gnl", "miq-gnl", "msa-gnl",
  "mtk-gnl", "ntv-gnl", "pulse", "seedtag", "sta-gnl", "tbl-gnl", "tmr-gnl", "trint",
  "ttd-gnl", "zfr-gnl"
];
const searchPublishers = ["aps-gnl", "bin-srh", "ggl-ads", "ggl-sem"];

const quoteList = arr => arr.map(v => `'${v}'`).join(", ");

function channelGroup(dataSourceColumn, publisherColumn) {
  return `CASE
    WHEN ${dataSourceColumn} IN (${quoteList(socialSources)}) THEN 'Social'
    WHEN LOWER(${publisherColumn}) LIKE '%csp%' THEN 'Programmatic'
    WHEN LOWER(${publisherColumn}) IN (${quoteList(programmaticPublishers)}) THEN 'Programmatic'
    WHEN LOWER(${publisherColumn}) IN (${quoteList(searchPublishers)}) THEN 'SEM'
    ELSE 'Direct'
  END`;
}

module.exports = {
  unionDimensions,
  metrics,
  selectStandardColumns,
  sumMetrics,
  agencyDeskLabelEn,
  channelGroup
};
