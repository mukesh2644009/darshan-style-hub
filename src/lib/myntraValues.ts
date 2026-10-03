// Myntra Co-Ords dropdown values, copied from the template's own masterdata sheet
// (Myntra-Sku-Template-2026-10-01.xlsx, Co-Ords, template version 13).
// Keys are MyntraListingDetail field names.
export const MYNTRA_CO_ORDS_VALUES: Record<string, string[]> = {
  prominentColour: ['Red', 'Blue', 'Green', 'Black', 'Purple', 'White', 'Pink', 'Grey', 'Brown', 'Yellow', 'Orange', 'Navy Blue', 'Maroon', 'Cream', 'Silver', 'Gold', 'Tan', 'Beige', 'Peach', 'Multi', 'Copper', 'Steel', 'Olive', 'Khaki', 'Rose', 'Taupe', 'Off White', 'Metallic', 'Charcoal', 'Grey Melange', 'Turquoise Blue', 'Coffee Brown', 'Sea Green', 'Lavender', 'Lime Green', 'Magenta', 'Burgundy', 'Teal', 'Nude', 'Bronze', 'Fluorescent Green', 'Rust', 'Mustard', 'NA', 'Mauve', 'Coral', 'Rose Gold', 'Assorted', 'Champagne', 'Fuchsia', 'Violet', 'Camel Brown', 'Transparent'],
  occasion: ['Casual', 'Party', 'Sports', 'Ethnic', 'Fusion', 'Festive', 'Western'],
  neck: ['Round Neck', 'V-Neck', 'Polo Collar', 'Shirt Collar', 'Scoop Neck', 'Boat Neck', 'Shawl Neck', 'Halter Neck', 'Shoulder Straps', 'One Shoulder', 'Strapless', 'Mandarin Collar', 'Hood', 'High Neck', 'Off-Shoulder', 'Square Neck'],
  sleeveLength: ['Long Sleeves', 'Short Sleeves', 'Sleeveless', 'Three-Quarter Sleeves'],
  topFabric: ['Pure Cotton', 'Nylon', 'Polyester', 'Viscose Rayon', 'Linen', 'Cotton Blend', 'Pure Silk', 'Silk Blend', 'Suede', 'Pure Wool', 'Wool Blend', 'Liva', 'Poly Georgette', 'Organic Cotton', 'Bamboo', 'Acrylic', 'Velvet', 'Chanderi', 'Organza', 'Satin'],
  bottomFabric: ['Pure Cotton', 'Nylon', 'Polyester', 'Viscose Rayon', 'Linen', 'Cotton Blend', 'Pure Silk', 'Silk Blend', 'Suede', 'Pure Wool', 'Wool Blend', 'Organic Cotton', 'Bamboo', 'Acrylic', 'Velvet', 'Chanderi', 'Organza'],
  topType: ['T-shirt', 'Top', 'Sweater', 'Sweatshirt', 'Shirt', 'Coat', 'Tunic', 'Leotard', 'Blazer', 'Waistcoat', 'Vest Top'],
  bottomType: ['Trousers', 'Skirt', 'Shorts', 'Joggers', 'Capris', 'Leggings', 'Palazzos'],
  topPattern: ['Checked', 'Colourblocked', 'Dyed', 'Printed', 'Solid', 'Striped', 'Embellished', 'Self Design', 'Embroidered', 'Woven Design', 'Yoke Design', 'Hem Design', 'Ombre', 'Sequinned'],
  bottomPattern: ['Checked', 'Colourblocked', 'Dyed', 'Printed', 'Solid', 'Striped', 'Embellished', 'Self Design', 'Embroidered', 'Woven Design', 'Hem Design', 'Ombre'],
  washCare: ['Dry Clean', 'Hand Wash', 'Machine Wash'],
  addOns: ['NA', 'Suspenders', 'Waistcoat', 'Jacket', 'Shrug'],
  lining: ['Has a lining', 'NA'],
  numberOfPockets: ['NA', '1', '2'],
  numberOfItems: ['1', '2', '3', '4', '5', '6'],
  season: ['Spring', 'Summer', 'Fall', 'Winter'],
};

// Fabric words seen in descriptions / Flipkart data → the nearest Myntra option.
// Top and Bottom Fabric have different lists (Bottom has no Liva, Poly
// Georgette or Satin), so each entry lists choices in order of preference and
// the first one allowed for that field wins.
const FABRIC_SYNONYMS: [RegExp, string[]][] = [
  [/organic cotton/i, ['Organic Cotton']],
  [/cotton blend|poly ?cotton|cotton[- ]?silk|cotton[- ]?linen/i, ['Cotton Blend']],
  [/cotton|muslin|cambric|khadi|mul ?mul/i, ['Pure Cotton']],
  [/liva/i, ['Liva', 'Viscose Rayon']],
  [/rayon|viscose|modal/i, ['Viscose Rayon']],
  [/georgette/i, ['Poly Georgette', 'Polyester']],
  [/crepe|chiffon|polyester|poly/i, ['Polyester']],
  [/linen/i, ['Linen']],
  [/chanderi/i, ['Chanderi']],
  [/organza/i, ['Organza']],
  [/satin/i, ['Satin', 'Polyester']],
  [/pure silk/i, ['Pure Silk']],
  [/silk/i, ['Silk Blend']],
  [/velvet/i, ['Velvet']],
  [/wool blend/i, ['Wool Blend']],
  [/wool/i, ['Pure Wool']],
  [/nylon/i, ['Nylon']],
  [/bamboo/i, ['Bamboo']],
  [/acrylic/i, ['Acrylic']],
  [/suede/i, ['Suede']],
];

/** Maps any fabric text to a value Myntra accepts for that field, or '' if there's no sensible match. */
export function toMyntraFabric(raw: string | null | undefined, field: 'topFabric' | 'bottomFabric'): string {
  const allowed = MYNTRA_CO_ORDS_VALUES[field];
  const text = (raw || '').trim();
  if (!text) return '';
  if (allowed.includes(text)) return text;
  for (const [pattern, choices] of FABRIC_SYNONYMS) {
    if (pattern.test(text)) return choices.find((c) => allowed.includes(c)) || '';
  }
  return '';
}
