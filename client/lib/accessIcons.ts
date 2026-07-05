// Access-type -> MaterialCommunityIcons glyph name.
// Shared by the map markers, bathroom cards, and the Saved/Submitted lists so the
// icon set stays consistent (and renders everywhere — emoji don't on some simulators).
export const ACCESS_ICON: Record<string, string> = {
  public: 'toilet',
  key_required: 'key',
  purchase_required: 'cart',
};

export const DEFAULT_ACCESS_ICON = 'toilet';
