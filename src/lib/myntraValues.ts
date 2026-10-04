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

// Myntra Kurta Sets dropdown values, copied from the template's own masterdata sheet
// (Myntra-Sku-Template-2026-09-20 (1).xlsx, Kurta Sets, v13) — the sheet that put
// DSH_SU_04/05 live (job 1695788). Keys are MyntraListingDetail field names.
export const MYNTRA_KURTA_SETS_VALUES: Record<string, string[]> = {
  prominentColour: ['Red', 'Blue', 'Green', 'Black', 'Purple', 'White', 'Pink', 'Grey', 'Brown', 'Yellow', 'Orange', 'Navy Blue', 'Maroon', 'Cream', 'Silver', 'Gold', 'Tan', 'Beige', 'Peach', 'Multi', 'Copper', 'Steel', 'Olive', 'Khaki', 'Rose', 'Taupe', 'Off White', 'Metallic', 'Charcoal', 'Grey Melange', 'Turquoise Blue', 'Coffee Brown', 'Sea Green', 'Lavender', 'Lime Green', 'Magenta', 'Burgundy', 'Teal', 'Nude', 'Bronze', 'Fluorescent Green', 'Rust', 'Mustard', 'NA', 'Mauve', 'Coral', 'Rose Gold', 'Assorted', 'Champagne', 'Fuchsia', 'Violet', 'Camel Brown', 'Transparent'],
  topType: ['Kurta', 'Kurti', 'Top'],
  bottomType: ['Skirt', 'Palazzos', 'Patiala', 'Salwar', 'Sharara', 'Trousers', 'Harem Pants', 'Dhoti Pants', 'Pyjamas', 'Churidar', 'Panchakattu', 'Mundu', 'Veshti', 'Leggings', 'Farshi Salwar'],
  dupatta: ['With Dupatta', 'NA'],
  topPattern: ['Printed', 'Embroidered', 'Solid', 'Dyed', 'Self Design', 'Yoke Design', 'Striped', 'Colourblocked', 'Woven Design', 'Checked', 'Embellished'],
  topFabric: ['Supernet', 'Pure Cotton', 'Pure Silk', 'Tissue', 'Satin', 'Dupion Silk', 'Jute Silk', 'Jute Cotton', 'Organza', 'Voile', 'Velvet', 'Raw Silk', 'Viscose Rayon', 'Art Silk', 'Poly Georgette', 'Poly Chiffon', 'Net', 'Tussar Silk', 'Poly Crepe', 'Silk Georgette', 'Silk Chiffon', 'Silk Crepe', 'Shantoon', 'Cotton Blend', 'Silk Blend', 'Polyester', 'Linen', 'Nylon', 'Pure Wool', 'Wool Blend', 'Liva', 'Chanderi Cotton', 'Chanderi Silk', 'Poly Chanderi', 'Organic Cotton', 'Poly Silk', 'Acrylic', 'Georgette', 'Cotton Silk', 'Chinon', 'Mulmul', 'Mul Chanderi'],
  topHemline: ['High-Low', 'Straight', 'Curved', 'Asymmetric', 'Flared', 'Scalloped'],
  topLength: ['Above Knee', 'Knee Length', 'Calf Length', 'Floor Length', 'Short'],
  topShape: ['Anarkali', 'Straight', 'A-Line', 'Kaftan', 'Pathani'],
  neck: ['V-Neck', 'Round Neck', 'Scoop Neck', 'Boat Neck', 'Shawl Collar', 'Halter Neck', 'Mandarin Collar', 'Shirt Collar', 'Square Neck', 'U-Neck', 'Cowl Neck', 'Sweetheart Neck', 'Keyhole Neck', 'Band Collar', 'One Shoulder', 'Off-Shoulder', 'Tie-Up Neck', 'Shoulder Straps'],
  sleeveLength: ['Long Sleeves', 'Short Sleeves', 'Sleeveless', 'Three-Quarter Sleeves'],
  sleeveStyling: ['Cap Sleeves', 'Shoulder Straps', 'Puffed Sleeves', 'Roll-Up Sleeves', 'Flared Sleeves', 'Regular Sleeves', 'Cold-Shoulder Sleeves', 'No Sleeves', 'Bell Sleeves', 'Accordion Pleated Sleeves', 'Batwing Sleeves', 'Bishop Sleeves', 'Cape Sleeves', 'Cuffed Sleeves', 'Dolman Sleeves', 'Drop-Shoulder Sleeves', 'Flutter Sleeves', 'Kimono Sleeves', 'Layered Sleeves', 'Petal Sleeves', 'Raglan Sleeves', 'Puff Sleeves', 'Slit Sleeves', 'Thumb Hole Sleeves'],
  slitDetail: ['Front Slit', 'Back Slit', 'Side Slits', 'NA', 'Multiple Slits'],
  bottomFabric: ['Supernet', 'Pure Cotton', 'Pure Silk', 'Tissue', 'Satin', 'Dupion Silk', 'Jute Silk', 'Jute Cotton', 'Organza', 'Voile', 'Velvet', 'Raw Silk', 'Viscose Rayon', 'Art Silk', 'Poly Georgette', 'Poly Chiffon', 'Net', 'Tussar Silk', 'Poly Crepe', 'Silk Georgette', 'Silk Chiffon', 'Silk Crepe', 'Shantoon', 'Cotton Blend', 'Silk Blend', 'Polyester', 'Linen', 'Pure Wool', 'Wool Blend', 'Organic Cotton', 'Poly Silk', 'Georgette', 'Santoon', 'Chinon', 'Mulmul', 'Mul Chanderi'],
  bottomPattern: ['Printed', 'Embroidered', 'Solid', 'Dyed', 'Self Design', 'Checked', 'Striped'],
  bottomClosure: ['Zip', 'Drawstring', 'Button', 'Hook and Eye', 'Slip-On', 'NA'],
  waistband: ['Elasticated', 'Partially Elasticated', 'NA'],
  printType: ['Striped', 'Solid', 'Checked', 'Colourblocked', 'Floral', 'Paisley', 'Abstract', 'Geometric', 'Tribal', 'Chevron', 'Bandhani', 'Animal', 'Quirky', 'Textured', 'Ombre', 'Ethnic Motifs', 'Leheriya', 'Woven Design', 'Tie and Dye'],
  occasion: ['Maternity', 'Festive', 'Fusion', 'Daily'],
  technique: ['Shibori', 'Bandhani', 'Ikat', 'Batik', 'Leheriya', 'Kalamkari', 'Block Print', 'Ombre', 'Screen', 'Foil', 'Khari Print', 'NA', 'Kutch', 'Ajrakh', 'Bagru', 'Patola', 'Dabu', 'Bagh', 'Warli', 'Kantha', 'Screen Print'],
  ornamentation: ['Gotta Patti', 'Mirror Work', 'Sequinned', 'Beads and Stones', 'Zardozi', 'Zari', 'Aari Work', 'Mukaish', 'Patchwork', 'Chikankari', 'Phulkari', 'Thread Work', 'NA'],
  weavePattern: ['Jacquard', 'Brasso', 'Brocade', 'Dobby', 'Denim', 'Khadi', 'Regular'],
  weaveType: ['Handloom', 'Machine Weave', 'Knitted', 'Knitted and Woven'],
  patternCoverage: ['Placement', 'Small', 'Large', 'Yoke or Border', 'None'],
  dupattaFabric: ['Supernet', 'Pure Cotton', 'Pure Silk', 'Tissue', 'Satin', 'Dupion Silk', 'Jute Silk', 'Jute Cotton', 'Organza', 'Voile', 'Velvet', 'Raw Silk', 'Viscose Rayon', 'Art Silk', 'Poly Georgette', 'Poly Chiffon', 'Net', 'Tussar Silk', 'Poly Crepe', 'Silk Georgette', 'Silk Chiffon', 'Silk Crepe', 'Cotton Blend', 'Silk Blend', 'NA', 'Wool', 'Polyester'],
  dupattaPattern: ['Printed', 'Embroidered', 'Solid', 'Dyed', 'Self Design', 'NA'],
  dupattaBorder: ['Tassels', 'Fringed', 'Taping', 'Printed', 'Solid', 'NA'],
  washCare: ['Hand Wash', 'Machine Wash', 'Dry Clean'],
  stitch: ['Made to Measure', 'Ready to Wear', 'Customisable', 'Made On Order'],
  addOns: ['Nehru jacket', 'Waistcoat', 'Jacket', 'NA', 'Camisole', 'Comes with a Mask'],
  numberOfPockets: ['1', '2', 'NA'],
  numberOfItems: ['1', '2', '3', '4', '5'],
  season: ['Spring', 'Summer', 'Fall', 'Winter'],
};
