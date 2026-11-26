// =====================================================================================
// Intelcom Dragonfly - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The intelcom_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names (GOOGLEADS_GADL1_SR...),
// so a intelcom step can never resolve to another client's table.
// =====================================================================================

[
  "GOOGLEADS_GADL1_SR"  // Google Ads, campaign level (Search / Performance Max / Shopping)
].forEach(name => declare({
  database: "jm-collect",
  schema: intelcom_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through intelcom_lookup_shortcodes, which filters it to this client first.
// The shared MiQ table is declared there too and filtered on intelcom_config.miqProfileIds
// in intelcom_step1_miq.
