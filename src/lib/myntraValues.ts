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

// Myntra Dresses dropdown values, copied from the template's own masterdata sheet
// (Myntra-Sku-Template-2026-10-04.xlsx, Dresses, template version 13). Keys are
// MyntraListingDetail field names ("Pattern" is stored in topPattern).
export const MYNTRA_DRESSES_VALUES: Record<string, string[]> = {
  prominentColour: ['Red', 'Blue', 'Green', 'Black', 'Purple', 'White', 'Pink', 'Grey', 'Brown', 'Yellow', 'Orange', 'Navy Blue', 'Maroon', 'Cream', 'Silver', 'Gold', 'Tan', 'Beige', 'Peach', 'Multi', 'Copper', 'Steel', 'Olive', 'Khaki', 'Rose', 'Taupe', 'Off White', 'Metallic', 'Charcoal', 'Grey Melange', 'Turquoise Blue', 'Coffee Brown', 'Sea Green', 'Lavender', 'Lime Green', 'Magenta', 'Burgundy', 'Teal', 'Nude', 'Bronze', 'Fluorescent Green', 'Rust', 'Mustard', 'NA', 'Mauve', 'Coral', 'Rose Gold', 'Assorted', 'Champagne', 'Fuchsia', 'Violet', 'Camel Brown', 'Transparent'],
  occasion: ['Casual', 'Formal', 'Party', 'Ethnic', 'Maternity', 'NA', 'Sports', 'Fusion', 'Wedding'],
  neck: ['V-Neck', 'Round Neck', 'Boat Neck', 'Halter Neck', 'Off-Shoulder', 'Strapless', 'Square Neck', 'Shirt Collar', 'Mock Neck', 'One Shoulder', 'Cowl Neck', 'Mandarin Collar', 'Scoop Neck', 'Peter Pan Collar', 'Sweetheart Neck', 'Tie-Up Neck', 'Shoulder Straps', 'Keyhole Neck', 'Choker Neck', 'Hood', 'Asymmetric Neck', 'Above the Keyboard Collar', 'High Neck', 'Plunge Neck', 'Scarf Neck', 'Polo Collar', 'Henley Neck'],
  sleeveLength: ['Long Sleeves', 'Short Sleeves', 'Sleeveless', 'Three-Quarter Sleeves'],
  fabric: ['Cotton', 'BLENDED', 'Other', 'NA', 'Polyester', 'Nylon', 'Viscose Rayon', 'Synthetic', 'Cashmere', 'Linen', 'Silk', 'Wool', 'Linen Blend', 'Tencel', 'Acrylic', 'Modal', 'Ramie', 'Leather', 'Bemberg', 'Khadi', 'Pure Wool', 'Wool Blend', 'Liva', 'Brasso', 'Jacquard', 'Livaeco', 'Polyester PU Coated', 'Georgette', 'Organic Cotton', 'Bamboo', 'Poly Silk', 'Lame', 'Brocade', 'Chiffon', 'Crepe', 'Denim', 'Lyocell', 'Organza', 'Chambray', 'Faux Leather', 'Raffia', 'Satin', 'Suede', 'Triacetate', 'Velvet', 'Elastane', 'Polyamide', 'Viscose', 'Poly Satin', 'Pure Cotton', 'Recycled Cotton', 'Scuba', 'Tweed', 'Corduroy', 'Net'],
  fabricType: ['Chiffon', 'Georgette', 'Denim', 'Net', 'Lace', 'Crepe', 'Satin', 'Jacquard', 'Cotton', 'Linen', 'Knitted', 'Velvet', 'NA', 'Scuba', 'Liva', 'Dobby', 'Corduroy', 'Cotton Cambric', 'Chambray', 'Schiffli', 'Faux Leather', 'Metallic', 'Mesh', 'Tweed'],
  knitOrWoven: ['Knitted', 'Woven', 'Knitted and Woven'],
  closure: ['Zip', 'Concealed Zip', 'Button', 'Hook and Eye', 'NA', 'Tie-Ups'],
  dressShape: ['Wrap', 'Shirt', 'Fit and Flare', 'A-Line', 'Shift', 'Bodycon', 'T-shirt', 'Kaftan', 'Maxi', 'Peplum', 'Blouson', 'Sheath', 'Pinafore', 'Drop-Waist', 'Empire', 'Balloon', 'Jumper Dress', 'Gown', 'Blazer Dresses', 'Corset', 'Bandeau'],
  dressType: ['Maxi', 'Draped', 'Wrap', 'Empire', 'T-shirt', 'Balloon', 'A-Line', 'Peplum', 'Tiered', 'Kaftan', 'Shirt', 'Corset', 'Bandeau', 'Blouson', 'Blazer', 'Bandage', 'Bodycon', 'Drop-Waist', 'Fit and Flare', 'Gown', 'Jumper', 'Pinafore', 'Sheath', 'Shift', 'Slip', 'Trapeze', 'Waisted'],
  dressLength: ['Mini', 'Above Knee', 'Knee Length', 'Maxi', 'Midi'],
  sleeveStyling: ['Kimono Sleeves', 'Batwing Sleeves', 'Extended Sleeves', 'Slit Sleeves', 'Cold-Shoulder Sleeves', 'Regular Sleeves', 'Cuffed Sleeves', 'Puff Sleeves', 'Cap Sleeves', 'Roll-Up Sleeves', 'Flutter Sleeves', 'Flared Sleeves', 'No Sleeves', 'Shoulder Straps', 'Cape Sleeves', 'Bell Sleeves', 'Bishop Sleeves', 'Accordion Pleated Sleeves', 'Dolman Sleeves', 'Drop-Shoulder Sleeves', 'Layered Sleeves', 'Petal Sleeves', 'Puffed Sleeves', 'Raglan Sleeves', 'Thumb Hole Sleeves'],
  topPattern: ['Checked', 'Solid', 'Striped', 'Printed', 'Embroidered', 'Self Design', 'Embellished', 'Colourblocked', 'Dyed', 'Textured', 'Pleated', 'Ombre'],
  printType: ['Abstract', 'Animal', 'Tribal', 'Alphanumeric', 'Floral', 'Geometric', 'Graphic', 'Colourblocked', 'Polka Dots', 'Bohemian', 'Striped', 'Solid', 'Ethnic Motifs', 'Tropical', 'Conversational', 'Checked', 'Tie and Dye', 'Self Design', 'Embellished', 'Typography', 'Chevron', 'Camouflage', 'Cartoon Characters', 'Brand Logo', 'Stars', 'Superhero', 'Humour and Comic', 'Ombre', 'Paisley', 'Ikat Print', 'Cable Knit', 'Gingham Checks', 'Candy Stripes', 'Micro Ditsy', 'Multi Stripes', 'Indie Prints', 'Scarf Print', 'NA'],
  washCare: ['Hand Wash', 'Machine Wash', 'Dry Clean'],
  addOns: ['Comes with a belt', 'NA', 'Comes with a Mask'],
  lining: ['Has a lining', 'NA'],
  multipackSet: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'NA'],
  numberOfItems: ['1', '2', '3', '4', '5'],
  season: ['Spring', 'Summer', 'Fall', 'Winter'],
};
