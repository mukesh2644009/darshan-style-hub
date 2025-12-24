import prisma from './prisma';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
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

export interface Category {
  name: string;
  subcategories: string[];
}

// Transform database product to Product interface
function transformProduct(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    price: dbProduct.price,
    originalPrice: dbProduct.originalPrice,
    images: dbProduct.images.map((img: any) => img.url),
    category: dbProduct.category,
    subcategory: dbProduct.subcategory,
    sizes: dbProduct.sizes.map((s: any) => s.size),
    colors: dbProduct.colors.map((c: any) => ({ name: c.name, hex: c.hex })),
    inStock: dbProduct.inStock,
    featured: dbProduct.featured,
    newArrival: dbProduct.newArrival,
    rating: dbProduct.rating,
    reviews: dbProduct.reviews,
  };
}

// Get all products
export async function getProducts(filters?: {
  category?: string;
  subcategory?: string;
  featured?: boolean;
  newArrival?: boolean;
  search?: string;
}): Promise<Product[]> {
  const where: any = {};

  if (filters?.category) {
    where.category = filters.category;
  }
  if (filters?.subcategory) {
    where.subcategory = filters.subcategory;
  }
  if (filters?.featured) {
    where.featured = true;
  }
  if (filters?.newArrival) {
    where.newArrival = true;
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      images: true,
      sizes: true,
      colors: true,
    },
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return products.map(transformProduct);
}

// Get single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      sizes: true,
      colors: true,
    },
  });

  if (!product) return null;
  return transformProduct(product);
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    include: {
      subcategories: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return categories.map((cat) => ({
    name: cat.name,
    subcategories: cat.subcategories.map((sub) => sub.name),
  }));
}

// Get featured products
export async function getFeaturedProducts(): Promise<Product[]> {
  return getProducts({ featured: true });
}

// Get new arrivals
export async function getNewArrivals(): Promise<Product[]> {
  return getProducts({ newArrival: true });
}

// Get related products
export async function getRelatedProducts(productId: string, category: string, limit: number = 4): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      category,
      id: { not: productId },
    },
    include: {
      images: true,
      sizes: true,
      colors: true,
    },
    take: limit,
  });

  return products.map(transformProduct);
}

