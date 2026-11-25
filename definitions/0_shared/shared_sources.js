// =====================================================================================
// Shared source declarations
// -------------------------------------------------------------------------------------
// Tables holding rows for EVERY client, declared once here. A client may read them
// only through its own model that filters them to that client first
// (<client>_lookup_shortcodes, <client>_step1_miq).
// =====================================================================================

// Mediabox shortcode dictionary (labels of naming-convention codes, all clients).
declare(qc_shared.shortcodes);

// MiQ partner social delivery (all MiQ clients), filtered on profile_id in each step1_miq.
declare(qc_shared.miqDelivery);
