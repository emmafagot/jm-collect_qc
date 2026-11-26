// =====================================================================================
// BPA - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The bpa_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names, so a bpa step can
// never resolve to another client's table.
// =====================================================================================

[
  "GOOGLEADS_GADL1_SR"  // Google Ads, campaign level
].forEach(name => declare({
  database: "jm-collect",
  schema: bpa_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through bpa_lookup_shortcodes, which filters it to this client first.
