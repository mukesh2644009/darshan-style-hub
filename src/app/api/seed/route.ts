import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint seeds the database - DISABLED after initial setup
// To re-enable, change SEED_ENABLED to true

const SEED_ENABLED = true; // Set to true only when you need to re-seed

export async function GET(request: Request) {
  // Seed is disabled for security
  if (!SEED_ENABLED) {
    return NextResponse.json({ 
      error: 'Seed endpoint is disabled. Contact admin to enable.',
      hint: 'Set SEED_ENABLED = true in the code to re-enable'
    }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Simple protection - change this secret!
  if (secret !== 'darshan2026') {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
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

    // Create sample products - Using YOUR authentic images from /public/products/
    const products = [
      // SAREES
      {
        sku: 'DSH-SAR-001',
        name: 'Royal Kanjeevaram Silk Saree',
        description: 'Elegant pure Kanjeevaram silk saree with intricate golden zari work.',
        price: 8999,
        originalPrice: 12999,
        category: 'Sarees',
        subcategory: 'Silk Sarees',
        featured: true,
        newArrival: false,
        rating: 4.8,
        reviews: 124,
        images: ['/products/kurti-golden-print.jpg'],
        sizes: ['Free Size'],
        colors: [{ name: 'Maroon', hex: '#800000' }],
      },
      {
        sku: 'DSH-SAR-002',
        name: 'Banarasi Silk Saree',
        description: 'Traditional Banarasi silk saree with golden zari border.',
        price: 7599,
        originalPrice: 9999,
        category: 'Sarees',
        subcategory: 'Banarasi Sarees',
        featured: true,
        newArrival: true,
        rating: 4.9,
        reviews: 89,
        images: ['/products/kurti-patchwork.jpg'],
        sizes: ['Free Size'],
        colors: [{ name: 'Red', hex: '#DC143C' }],
      },
      {
        sku: 'DSH-SAR-003',
        name: 'Cotton Handloom Saree',
        description: 'Lightweight cotton saree perfect for daily wear.',
        price: 1999,
        originalPrice: 2999,
        category: 'Sarees',
        subcategory: 'Cotton Sarees',
        featured: false,
        newArrival: true,
        rating: 4.5,
        reviews: 67,
        images: ['/products/kurti-paisley.jpg'],
        sizes: ['Free Size'],
        colors: [{ name: 'Blue', hex: '#4169E1' }],
      },
      // SUITS
      {
        sku: 'DSH-SUT-001',
        name: 'Elegant Anarkali Suit',
        description: 'Beautiful Lucknowi chikankari Anarkali suit with delicate embroidery.',
        price: 4599,
        originalPrice: 5999,
        category: 'Suits',
        subcategory: 'Anarkali Suits',
        featured: true,
        newArrival: true,
        rating: 4.6,
        reviews: 112,
        images: ['/products/kurti-golden-print.jpg'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'White', hex: '#FFFFFF' }],
      },
      {
        sku: 'DSH-SUT-002',
        name: 'Palazzo Suit Set',
        description: 'Trendy palazzo suit with printed kurta and dupatta.',
        price: 2999,
        originalPrice: 3999,
        category: 'Suits',
        subcategory: 'Palazzo Suits',
        featured: true,
        newArrival: false,
        rating: 4.4,
        reviews: 78,
        images: ['/products/kurti-patchwork.jpg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [{ name: 'Pink', hex: '#FF69B4' }],
      },
      {
        sku: 'DSH-SUT-003',
        name: 'Party Wear Salwar Suit',
        description: 'Stunning party wear suit with heavy embroidery.',
        price: 5499,
        originalPrice: 7999,
        category: 'Suits',
        subcategory: 'Party Wear Suits',
        featured: false,
        newArrival: true,
        rating: 4.7,
        reviews: 92,
        images: ['/products/kurti-paisley.jpg'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'Navy', hex: '#000080' }],
      },
      // KURTIS - Using your authentic images
      {
        sku: 'DSH-KUR-001',
        name: 'Golden Block Print Kurti',
        description: 'Elegant cream kurti with beautiful golden block print design.',
        price: 1299,
        originalPrice: 1799,
        category: 'Kurtis',
        subcategory: 'Printed Kurtis',
        featured: true,
        newArrival: true,
        rating: 4.7,
        reviews: 86,
        images: ['/products/kurti-golden-print.jpg'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'Cream', hex: '#FFFDD0' }],
      },
      {
        sku: 'DSH-KUR-002',
        name: 'Patchwork Cotton Kurti',
        description: 'Trendy patchwork kurti with colorful geometric patterns.',
        price: 999,
        originalPrice: 1499,
        category: 'Kurtis',
        subcategory: 'Cotton Kurtis',
        featured: true,
        newArrival: true,
        rating: 4.5,
        reviews: 124,
        images: ['/products/kurti-patchwork.jpg'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'Multi Color', hex: '#FFD700' }],
      },
      {
        sku: 'DSH-KUR-003',
        name: 'Chikankari Embroidered Kurti',
        description: 'Beautiful Lucknowi chikankari work kurti in pure cotton.',
        price: 1599,
        originalPrice: 2199,
        category: 'Kurtis',
        subcategory: 'Embroidered Kurtis',
        featured: true,
        newArrival: false,
        rating: 4.8,
        reviews: 156,
        images: ['/products/kurti-golden-print.jpg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [{ name: 'White', hex: '#FFFFFF' }],
      },
      {
        sku: 'DSH-KUR-004',
        name: 'Paisley Print Short Kurti',
        description: 'Stylish short kurti with traditional paisley print.',
        price: 899,
        originalPrice: 1299,
        category: 'Kurtis',
        subcategory: 'Printed Kurtis',
        featured: false,
        newArrival: true,
        rating: 4.3,
        reviews: 45,
        images: ['/products/kurti-paisley.jpg'],
        sizes: ['S', 'M', 'L'],
        colors: [{ name: 'Yellow', hex: '#FFD700' }],
      },
      {
        sku: 'DSH-KUR-005',
        name: 'Party Wear Kurti',
        description: 'Elegant party wear kurti with sequin work.',
        price: 1999,
        originalPrice: 2799,
        category: 'Kurtis',
        subcategory: 'Party Wear Kurtis',
        featured: true,
        newArrival: true,
        rating: 4.6,
        reviews: 78,
        images: ['/products/kurti-patchwork.jpg'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'Maroon', hex: '#800000' }],
      },
      {
        sku: 'DSH-KUR-006',
        name: 'Casual Cotton Kurti',
        description: 'Comfortable daily wear cotton kurti.',
        price: 699,
        originalPrice: 999,
        category: 'Kurtis',
        subcategory: 'Casual Kurtis',
        featured: false,
        newArrival: false,
        rating: 4.4,
        reviews: 234,
        images: ['/products/kurti-paisley.jpg'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'Green', hex: '#228B22' }],
      },
    ];

    for (const p of products) {
      await prisma.product.create({
        data: {
          sku: p.sku,
          name: p.name,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice,
          category: p.category,
          subcategory: p.subcategory,
          featured: p.featured,
          newArrival: p.newArrival,
          rating: p.rating,
          reviews: p.reviews,
          images: { create: p.images.map((url) => ({ url })) },
          sizes: { create: p.sizes.map((size) => ({ size })) },
          colors: { create: p.colors },
        },
      });
    }

    // Create Admin user
    await prisma.user.create({
      data: {
        email: 'admin@darshan.com',
        name: 'Admin User',
        phone: '+91 98765 43210',
        password: 'admin123',
        role: 'ADMIN',
      },
    });

    // Create Demo Customer
    await prisma.user.create({
      data: {
        email: 'user@darshan.com',
        name: 'Demo Customer',
        phone: '+91 87654 32109',
        password: 'user123',
        role: 'CUSTOMER',
      },
    });

    return NextResponse.json({
      success: true,
      message: '🎉 Database seeded successfully!',
      data: {
        categories: 3,
        products: products.length,
        users: 2,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}

