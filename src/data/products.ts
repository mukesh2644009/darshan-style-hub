export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subcategory: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  inStock: boolean;
  featured: boolean;
  newArrival: boolean;
  rating: number;
  reviews: number;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Royal Silk Saree",
    description: "Elegant pure silk saree with intricate golden zari work. Perfect for weddings and special occasions. Comes with matching blouse piece.",
    price: 8999,
    originalPrice: 12999,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&auto=format&fit=crop"
    ],
    category: "Women",
    subcategory: "Sarees",
    sizes: ["Free Size"],
    colors: [
      { name: "Maroon", hex: "#800000" },
      { name: "Navy Blue", hex: "#000080" },
      { name: "Emerald", hex: "#50C878" }
    ],
    inStock: true,
    featured: true,
    newArrival: false,
    rating: 4.8,
    reviews: 124
  },
  {
    id: "2",
    name: "Premium Cotton Kurta",
    description: "Handcrafted cotton kurta with chikankari embroidery. Breathable fabric perfect for summer wear.",
    price: 2499,
    originalPrice: 3499,
    images: [
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop"
    ],
    category: "Men",
    subcategory: "Kurtas",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Sky Blue", hex: "#87CEEB" },
      { name: "Beige", hex: "#F5F5DC" }
    ],
    inStock: true,
    featured: true,
    newArrival: true,
    rating: 4.6,
    reviews: 89
  },
  {
    id: "3",
    name: "Designer Lehenga Choli",
    description: "Stunning bridal lehenga with heavy embroidery and mirror work. Includes choli and dupatta.",
    price: 24999,
    originalPrice: 34999,
    images: [
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&auto=format&fit=crop"
    ],
    category: "Women",
    subcategory: "Lehengas",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Red", hex: "#FF0000" },
      { name: "Pink", hex: "#FFC0CB" },
      { name: "Gold", hex: "#FFD700" }
    ],
    inStock: true,
    featured: true,
    newArrival: false,
    rating: 4.9,
    reviews: 56
  },
  {
    id: "4",
    name: "Classic Nehru Jacket",
    description: "Elegant Nehru jacket in premium fabric. Perfect for formal occasions and festivals.",
    price: 3999,
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop"
    ],
    category: "Men",
    subcategory: "Jackets",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Black", hex: "#000000" },
      { name: "Navy", hex: "#000080" },
      { name: "Maroon", hex: "#800000" }
    ],
    inStock: true,
    featured: false,
    newArrival: true,
    rating: 4.5,
    reviews: 67
  },
  {
    id: "5",
    name: "Printed Anarkali Suit",
    description: "Beautiful floral printed Anarkali suit with flowing silhouette. Includes dupatta and churidar.",
    price: 4599,
    originalPrice: 5999,
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop"
    ],
    category: "Women",
    subcategory: "Suits",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Teal", hex: "#008080" },
      { name: "Mustard", hex: "#FFDB58" },
      { name: "Coral", hex: "#FF7F50" }
    ],
    inStock: true,
    featured: false,
    newArrival: true,
    rating: 4.4,
    reviews: 45
  },
  {
    id: "6",
    name: "Kids Traditional Set",
    description: "Adorable traditional outfit for kids. Perfect for festivals and family functions.",
    price: 1499,
    originalPrice: 1999,
    images: [
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop"
    ],
    category: "Kids",
    subcategory: "Traditional",
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: [
      { name: "Yellow", hex: "#FFD700" },
      { name: "Orange", hex: "#FFA500" },
      { name: "Green", hex: "#008000" }
    ],
    inStock: true,
    featured: true,
    newArrival: false,
    rating: 4.7,
    reviews: 112
  },
  {
    id: "7",
    name: "Banarasi Dupatta",
    description: "Pure Banarasi silk dupatta with golden border. Adds elegance to any outfit.",
    price: 1999,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop"
    ],
    category: "Accessories",
    subcategory: "Dupattas",
    sizes: ["Free Size"],
    colors: [
      { name: "Red", hex: "#FF0000" },
      { name: "Green", hex: "#008000" },
      { name: "Purple", hex: "#800080" }
    ],
    inStock: true,
    featured: false,
    newArrival: false,
    rating: 4.6,
    reviews: 78
  },
  {
    id: "8",
    name: "Designer Sherwani",
    description: "Royal designer sherwani with intricate embroidery. Perfect for groom and special occasions.",
    price: 18999,
    originalPrice: 24999,
    images: [
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&auto=format&fit=crop"
    ],
    category: "Men",
    subcategory: "Sherwanis",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Ivory", hex: "#FFFFF0" },
      { name: "Gold", hex: "#FFD700" },
      { name: "Maroon", hex: "#800000" }
    ],
    inStock: true,
    featured: true,
    newArrival: false,
    rating: 4.9,
    reviews: 34
  }
];

export const categories = [
  { name: "Women", subcategories: ["Sarees", "Lehengas", "Suits", "Kurtis"] },
  { name: "Men", subcategories: ["Kurtas", "Sherwanis", "Jackets", "Dhotis"] },
  { name: "Kids", subcategories: ["Traditional", "Casual", "Party Wear"] },
  { name: "Accessories", subcategories: ["Dupattas", "Stoles", "Jewelry"] }
];

