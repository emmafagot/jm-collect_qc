// =====================================================================================
// Tourisme Montérégie - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The tourismemonteregie_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names, so a tourismemonteregie step can
// never resolve to another client's table.
// =====================================================================================

[
  "GOOGLECM_CM360_SR"   // CM360
].forEach(name => declare({
  database: "jm-collect",
  schema: tourismemonteregie_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through tourismemonteregie_lookup_shortcodes, which filters it to this client first.
