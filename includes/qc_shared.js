// =====================================================================================
// Shared (non-client) configuration
// -------------------------------------------------------------------------------------
// Only the location of shared reference tables. Never put client values here.
// =====================================================================================

// Mediabox shortcode dictionary - one row per (client_name, list_name, shortcode) for
// ALL clients. Each client reads it only through its own <client>_lookup_shortcodes
// model, which filters it to that client's lists + the agency fallback lists.
const shortcodes = {
  database: "mediabox-1cd44",
  schema: "mediabox_2",
  name: "shortcodes"
};

// Agency-wide lists: a client inherits a list from here only when it has no list of
// the same name of its own.
const agencyShortcodeClient = "plusco";

module.exports = {
  shortcodes,
  agencyShortcodeClient
};
