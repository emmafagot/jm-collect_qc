// =====================================================================================
// CQTS - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The cqts_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names (GOOGLECM_CM360_SR...),
// so a cqts step can never resolve to another client's table.
// =====================================================================================

[
  "GOOGLECM_CM360_SR"  // CM360
].forEach(name => declare({
  database: "jm-collect",
  schema: cqts_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through cqts_lookup_shortcodes, which filters it to this client first.
// The shared MiQ table is declared there too and filtered on cqts_config.miqProfileIds
// in cqts_step1_miq.
