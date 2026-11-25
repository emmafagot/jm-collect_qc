// =====================================================================================
// Nautilus Plus - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The nautilus_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names (FBADS_META_SR...),
// so a nautilus step can never resolve to another client's table.
// =====================================================================================

[
  "FBADS_META_SR",      // Meta
  "GOOGLEADS_GADL1_SR"  // Google Ads, campaign level (Search / Performance Max / Shopping)
].forEach(name => declare({
  database: "jm-collect",
  schema: nautilus_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through nautilus_lookup_shortcodes, which filters it to this client first.
