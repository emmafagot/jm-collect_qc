// =====================================================================================
// Agropur - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The agropur_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names (GOOGLECM_CM360_SR...),
// so a agropur step can never resolve to another client's table.
// =====================================================================================

[
  "GOOGLECM_CM360_SR", // CM360
  "FBADS_META_SR"      // Meta
].forEach(name => declare({
  database: "jm-collect",
  schema: agropur_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through agropur_lookup_shortcodes, which filters it to this client first.
