import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.session.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.productColor.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data');

  // Create categories
  await prisma.category.create({
    data: {
      name: 'Sarees',
      subcategories: {
        create: [
          { name: 'Silk Sarees' },
          { name: 'Cotton Sarees' },
          { name: 'Banarasi Sarees' },
          { name: 'Designer Sarees' },
          { name: 'Wedding Sarees' },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: 'Suits',
      subcategories: {
        create: [
          { name: 'Anarkali Suits' },
          { name: 'Salwar Suits' },
          { name: 'Palazzo Suits' },
          { name: 'Churidar Suits' },
          { name: 'Party Wear Suits' },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: 'Kurtis',
      subcategories: {
        create: [
          { name: 'Cotton Kurtis' },
          { name: 'Printed Kurtis' },
          { name: 'Embroidered Kurtis' },
          { name: 'Party Wear Kurtis' },
          { name: 'Casual Kurtis' },
        ],
      },
    },
  });

  console.log('✓ Created categories');

  // Products with working placeholder images
  const productsData = [
    // ===== SAREES =====
    {
      sku: 'DSH-SAR-001',
      name: 'Royal Kanjeevaram Silk Saree',
      description: 'Elegant pure Kanjeevaram silk saree with intricate golden zari work and traditional temple border. Perfect for weddings and special occasions.',
      price: 8999,
      originalPrice: 12999,
      category: 'Sarees',
      subcategory: 'Silk Sarees',
      featured: true,
      newArrival: false,
      rating: 4.8,
      reviews: 124,
      images: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop',
      ],
      sizes: ['Free Size'],
      colors: [
        { name: 'Maroon', hex: '#800000' },
        { name: 'Navy Blue', hex: '#000080' },
        { name: 'Emerald', hex: '#50C878' },
      ],
    },
    {
      sku: 'DSH-SAR-002',
      name: 'Banarasi Silk Saree',
      description: 'Authentic Banarasi silk saree with traditional butta motifs and rich pallu. Handwoven by skilled artisans of Varanasi.',
      price: 15999,
      originalPrice: 19999,
      category: 'Sarees',
      subcategory: 'Banarasi Sarees',
      featured: true,
      newArrival: true,
      rating: 4.9,
      reviews: 89,
      images: [
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=800&fit=crop',
      ],
      sizes: ['Free Size'],
      colors: [
        { name: 'Red', hex: '#DC143C' },
        { name: 'Gold', hex: '#FFD700' },
        { name: 'Purple', hex: '#800080' },
      ],
    },
    {
      sku: 'DSH-SAR-003',
      name: 'Jaipuri Cotton Saree',
      description: 'Breathable Jaipuri cotton saree with beautiful block print design. Soft fabric perfect for daily wear in Rajasthan summer.',
      price: 2499,
      originalPrice: 3499,
      category: 'Sarees',
      subcategory: 'Cotton Sarees',
      featured: false,
      newArrival: true,
      rating: 4.5,
      reviews: 156,
      images: [
        'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&h=800&fit=crop',
      ],
      sizes: ['Free Size'],
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Blue', hex: '#4169E1' },
        { name: 'Yellow', hex: '#FFD700' },
      ],
    },
    {
      sku: 'DSH-SAR-004',
      name: 'Bridal Wedding Saree',
      description: 'Exquisite bridal saree with heavy zardozi embroidery, kundan work and rich golden border. Perfect for your wedding day.',
      price: 24999,
      originalPrice: 34999,
      category: 'Sarees',
      subcategory: 'Wedding Sarees',
      featured: true,
      newArrival: false,
      rating: 4.9,
      reviews: 45,
      images: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop',
      ],
      sizes: ['Free Size'],
      colors: [
        { name: 'Red', hex: '#FF0000' },
        { name: 'Pink', hex: '#FF69B4' },
        { name: 'Orange', hex: '#FF8C00' },
      ],
    },
    // ===== SUITS =====
    {
      sku: 'DSH-SUT-001',
      name: 'Lucknowi Anarkali Suit',
      description: 'Beautiful Lucknowi chikankari Anarkali suit with delicate hand embroidery. Flowing silhouette with dupatta and churidar.',
      price: 4599,
      originalPrice: 5999,
      category: 'Suits',
      subcategory: 'Anarkali Suits',
      featured: true,
      newArrival: true,
      rating: 4.6,
      reviews: 112,
      images: [
        'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&h=800&fit=crop',
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Pink', hex: '#FFC0CB' },
        { name: 'Sky Blue', hex: '#87CEEB' },
      ],
    },
    {
      sku: 'DSH-SUT-002',
      name: 'Punjabi Salwar Kameez',
      description: 'Traditional Punjabi patiala salwar suit with phulkari embroidery. Comfortable cotton blend fabric with matching dupatta.',
      price: 3299,
      originalPrice: 4299,
      category: 'Suits',
      subcategory: 'Salwar Suits',
      featured: false,
      newArrival: true,
      rating: 4.4,
      reviews: 98,
      images: [
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=800&fit=crop',
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'Blue', hex: '#0000FF' },
        { name: 'Green', hex: '#228B22' },
        { name: 'Maroon', hex: '#800000' },
      ],
    },
    {
      sku: 'DSH-SUT-003',
      name: 'Heavy Embroidered Party Suit',
      description: 'Glamorous party wear salwar suit with heavy mirror work, sequins and gota patti. Stand out at any Indian celebration.',
      price: 5999,
      originalPrice: 7999,
      category: 'Suits',
      subcategory: 'Party Wear Suits',
      featured: true,
      newArrival: true,
      rating: 4.8,
      reviews: 89,
      images: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Wine', hex: '#722F37' },
        { name: 'Gold', hex: '#FFD700' },
        { name: 'Royal Blue', hex: '#4169E1' },
      ],
    },
    // ===== KURTIS (New Category - Using Your Own Images!) =====
    {
      sku: 'DSH-KUR-001',
      name: 'Golden Block Print Kurti',
      description: 'Elegant cream kurti with beautiful golden block print design. Features button placket and 3/4 sleeves. Perfect with churidar or leggings.',
      price: 1299,
      originalPrice: 1799,
      category: 'Kurtis',
      subcategory: 'Printed Kurtis',
      featured: true,
      newArrival: true,
      rating: 4.7,
      reviews: 86,
      images: [
        '/products/kurti-golden-print.jpg',
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'Cream', hex: '#FFFDD0' },
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Beige', hex: '#F5F5DC' },
      ],
    },
    {
      sku: 'DSH-KUR-002',
      name: 'Patchwork Cotton Kurti',
      description: 'Trendy patchwork kurti with colorful geometric patterns. Made from soft cotton with lace trim on sleeves. Stylish with jeans or pants.',
      price: 999,
      originalPrice: 1499,
      category: 'Kurtis',
      subcategory: 'Cotton Kurtis',
      featured: true,
      newArrival: true,
      rating: 4.5,
      reviews: 124,
      images: [
        '/products/kurti-patchwork.jpg',
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'Multi Color', hex: '#FFD700' },
        { name: 'Pink Mix', hex: '#FFC0CB' },
        { name: 'Blue Mix', hex: '#87CEEB' },
      ],
    },
    {
      sku: 'DSH-KUR-003',
      name: 'Paisley Print Short Kurti',
      description: 'Beautiful short kurti with traditional paisley print in golden. Features lace detailing on placket and sleeves. Perfect casual wear.',
      price: 899,
      originalPrice: 1299,
      category: 'Kurtis',
      subcategory: 'Casual Kurtis',
      featured: true,
      newArrival: true,
      rating: 4.4,
      reviews: 67,
      images: [
        '/products/kurti-paisley.jpg',
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'Cream', hex: '#FFFDD0' },
        { name: 'Off White', hex: '#FAF9F6' },
        { name: 'Light Pink', hex: '#FFB6C1' },
      ],
    },
    {
      sku: 'DSH-KUR-004',
      name: 'Chikankari Embroidered Kurti',
      description: 'Elegant Lucknowi chikankari hand-embroidered kurti. Delicate white thread work on soft cotton. Timeless traditional elegance.',
      price: 1599,
      originalPrice: 2199,
      category: 'Kurtis',
      subcategory: 'Embroidered Kurtis',
      featured: true,
      newArrival: false,
      rating: 4.8,
      reviews: 156,
      images: [
        '/products/kurti-golden-print.jpg',
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Light Blue', hex: '#ADD8E6' },
        { name: 'Peach', hex: '#FFCBA4' },
      ],
    },
    {
      sku: 'DSH-KUR-005',
      name: 'Festive Party Kurti',
      description: 'Stunning party wear kurti with mirror work and sequin embellishments. Perfect for festivals and celebrations.',
      price: 1999,
      originalPrice: 2799,
      category: 'Kurtis',
      subcategory: 'Party Wear Kurtis',
      featured: true,
      newArrival: false,
      rating: 4.6,
      reviews: 92,
      images: [
        '/products/kurti-patchwork.jpg',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Maroon', hex: '#800000' },
        { name: 'Navy Blue', hex: '#000080' },
        { name: 'Bottle Green', hex: '#006A4E' },
      ],
    },
    {
      sku: 'DSH-KUR-006',
      name: 'A-Line Cotton Kurti',
      description: 'Comfortable A-line cotton kurti for daily wear. Simple and elegant with side pockets. Breathable fabric for all-day comfort.',
      price: 799,
      originalPrice: 1099,
      category: 'Kurtis',
      subcategory: 'Cotton Kurtis',
      featured: false,
      newArrival: false,
      rating: 4.3,
      reviews: 234,
      images: [
        '/products/kurti-paisley.jpg',
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
      colors: [
        { name: 'Yellow', hex: '#FFD700' },
        { name: 'Green', hex: '#228B22' },
        { name: 'Blue', hex: '#4169E1' },
      ],
    },
  ];

  for (const productData of productsData) {
    await prisma.product.create({
      data: {
        sku: productData.sku,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        originalPrice: productData.originalPrice,
        category: productData.category,
        subcategory: productData.subcategory,
        featured: productData.featured,
        newArrival: productData.newArrival,
        rating: productData.rating,
        reviews: productData.reviews,
        images: {
          create: productData.images.map((url) => ({ url })),
        },
        sizes: {
          create: productData.sizes.map((size) => ({ size })),
        },
        colors: {
          create: productData.colors,
        },
      },
    });
  }

  console.log('✓ Created 14 products (4 Sarees + 3 Suits + 7 Kurtis)');

  // Create Admin user
  await prisma.user.create({
    data: {
      email: 'admin@darshan.com',
      name: 'Admin User',
      phone: '+91 98765 43210',
      password: 'admin123',
      role: 'ADMIN',
      addresses: {
        create: {
          name: 'Store',
          phone: '+91 98765 43210',
          addressLine1: 'Johari Bazaar',
          addressLine2: 'Near Hawa Mahal',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302001',
          isDefault: true,
        },
      },
    },
  });

  console.log('✓ Created Admin user (admin@darshan.com / admin123)');

  // Create Demo Customer user
  await prisma.user.create({
    data: {
      email: 'user@darshan.com',
      name: 'Demo Customer',
      phone: '+91 87654 32109',
      password: 'user123',
      role: 'CUSTOMER',
      addresses: {
        create: {
          name: 'Home',
          phone: '+91 87654 32109',
          addressLine1: 'MI Road',
          addressLine2: 'Near Statue Circle',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302001',
          isDefault: true,
        },
      },
    },
  });

  console.log('✓ Created Customer user (user@darshan.com / user123)');
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
