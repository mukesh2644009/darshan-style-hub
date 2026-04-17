export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  coverImage: string;
  /** Plain text paragraphs separated by blank lines */
  content: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'choose-suit-for-body-type',
    title: 'How to Choose a Suit That Flatters Your Shape',
    excerpt:
      'Simple tips for picking Anarkali, straight-cut, and palazzo suits so you feel confident at every occasion.',
    date: '2026-03-15',
    readTime: '4 min read',
    coverImage: '/products/categories/suits.png',
    content: `Not every suit silhouette suits every body type — and that's okay. The goal is balance and comfort.

A-line and Anarkali styles work beautifully if you like definition at the waist with flow below. Straight cuts are versatile for office and daily wear. Palazzo sets add ease and movement — great when you want a relaxed but put-together look.

When shopping online, check the size chart and fabric. Cotton and blends breathe well in warm weather; heavier embroidery shines at events. When in doubt, message us on WhatsApp — we're happy to suggest a size or style.`,
  },
  {
    slug: 'care-for-embroidered-ethnic-wear',
    title: 'Caring for Embroidered Ethnic Wear',
    excerpt:
      'Wash, store, and iron your suits and kurtis so colours stay rich and threadwork stays intact.',
    date: '2026-03-28',
    readTime: '5 min read',
    coverImage: '/products/categories/kurti.png',
    content: `Embroidery and prints need a little extra love. Hand wash or gentle machine cycle in cold water helps colours last. Turn pieces inside out to protect embellishments.

Avoid harsh bleach. Dry in shade — direct sun can fade dyes. Store folded with breathable covers in a dry cupboard; don't hang heavy embroidered pieces for months (they can stretch).

Iron on low heat with a cloth between the iron and fabric on decorated areas. Small pulls can often be snipped carefully — when unsure, ask a local tailor.`,
  },
  {
    slug: 'co-ord-sets-styling-2026',
    title: 'Co Ord Sets: Easy Styling Ideas for 2026',
    excerpt:
      'From brunches to office days — how to wear printed and solid co ord sets without overthinking.',
    date: '2026-04-10',
    readTime: '3 min read',
    coverImage: '/products/categories/co-ord-sets.png',
    content: `Co ord sets are the fastest way to look coordinated with zero guesswork. Match jewellery to one accent — if the print is busy, keep earrings simple.

Footwear changes the mood: kolhapuris for ethnic casual, block heels for dinners, clean sneakers for fusion looks (where the set allows).

Layer with a dupatta or light jacket when you need polish. Mixing co ord separates with solid basics from your wardrobe can stretch how often you wear each piece.`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
