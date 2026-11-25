// =====================================================================================
// Unibroue - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The unibroue_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names (GOOGLECM_CM360_SR...),
// so a unibroue step can never resolve to another client's table.
// =====================================================================================

[
  "GOOGLECM_CM360_SR", // CM360
  "FBADS_META_SR"      // Meta
].forEach(name => declare({
  database: "jm-collect",
  schema: unibroue_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through unibroue_lookup_shortcodes, which filters it to this client first.
