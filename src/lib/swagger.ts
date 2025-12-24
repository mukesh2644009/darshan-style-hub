import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Darshan Style Hub API',
        version: '1.0.0',
        description: 'API documentation for Darshan Style Hub E-commerce Platform',
        contact: {
          name: 'Darshan Style Hub',
          email: 'contact@darshanstylehub.com',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
        {
          url: 'http://www.darshanclothsjaipur.com',
          description: 'Production server',
        },
      ],
      tags: [
        { name: 'Products', description: 'Product management endpoints' },
        { name: 'Orders', description: 'Order management endpoints' },
        { name: 'Admin', description: 'Admin dashboard endpoints' },
        { name: 'Upload', description: 'File upload endpoints' },
      ],
      paths: {
        '/api/products': {
          get: {
            tags: ['Products'],
            summary: 'Get all products',
            description: 'Retrieve a list of all products with optional filters',
            parameters: [
              {
                name: 'category',
                in: 'query',
                description: 'Filter by category (Sarees, Suits, Kurtis)',
                schema: { type: 'string' },
              },
              {
                name: 'featured',
                in: 'query',
                description: 'Filter featured products only',
                schema: { type: 'boolean' },
              },
              {
                name: 'newArrival',
                in: 'query',
                description: 'Filter new arrival products only',
                schema: { type: 'boolean' },
              },
            ],
            responses: {
              '200': {
                description: 'List of products',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
        },
        '/api/products/{id}': {
          get: {
            tags: ['Products'],
            summary: 'Get product by ID',
            description: 'Retrieve a single product by its ID',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Product ID',
                schema: { type: 'string' },
              },
            ],
            responses: {
              '200': {
                description: 'Product details',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
              '404': {
                description: 'Product not found',
              },
            },
          },
        },
        '/api/orders': {
          get: {
            tags: ['Orders'],
            summary: 'Get all orders',
            description: 'Retrieve a list of all orders',
            responses: {
              '200': {
                description: 'List of orders',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Order' },
                    },
                  },
                },
              },
            },
          },
          post: {
            tags: ['Orders'],
            summary: 'Create a new order',
            description: 'Place a new order',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateOrderRequest' },
                },
              },
            },
            responses: {
              '201': {
                description: 'Order created successfully',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
              '400': {
                description: 'Invalid request',
              },
            },
          },
        },
        '/api/admin/orders/{id}/status': {
          patch: {
            tags: ['Admin'],
            summary: 'Update order status',
            description: 'Update the status of an order (Admin only)',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Order ID',
                schema: { type: 'string' },
              },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
                      },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Status updated successfully',
              },
              '400': {
                description: 'Invalid status',
              },
            },
          },
        },
        '/api/admin/products/{id}': {
          get: {
            tags: ['Admin'],
            summary: 'Get product details (Admin)',
            description: 'Get full product details for editing',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Product ID',
                schema: { type: 'string' },
              },
            ],
            responses: {
              '200': {
                description: 'Product details',
              },
              '404': {
                description: 'Product not found',
              },
            },
          },
          patch: {
            tags: ['Admin'],
            summary: 'Update product',
            description: 'Update product details including price',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Product ID',
                schema: { type: 'string' },
              },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UpdateProductRequest' },
                },
              },
            },
            responses: {
              '200': {
                description: 'Product updated successfully',
              },
              '400': {
                description: 'Invalid request',
              },
            },
          },
          delete: {
            tags: ['Admin'],
            summary: 'Delete product',
            description: 'Delete a product from the catalog',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Product ID',
                schema: { type: 'string' },
              },
            ],
            responses: {
              '200': {
                description: 'Product deleted successfully',
              },
              '404': {
                description: 'Product not found',
              },
            },
          },
        },
        '/api/upload': {
          post: {
            tags: ['Upload'],
            summary: 'Upload product image',
            description: 'Upload an image file for products',
            requestBody: {
              required: true,
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    properties: {
                      file: {
                        type: 'string',
                        format: 'binary',
                      },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'File uploaded successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        url: { type: 'string' },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
              },
              '400': {
                description: 'No file uploaded',
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Product: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unique product ID' },
              name: { type: 'string', description: 'Product name' },
              description: { type: 'string', description: 'Product description' },
              price: { type: 'number', description: 'Selling price in INR' },
              originalPrice: { type: 'number', description: 'Original price (for discount display)' },
              category: { type: 'string', enum: ['Sarees', 'Suits', 'Kurtis'] },
              subcategory: { type: 'string' },
              featured: { type: 'boolean' },
              newArrival: { type: 'boolean' },
              rating: { type: 'number' },
              reviews: { type: 'integer' },
              images: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    url: { type: 'string' },
                  },
                },
              },
              sizes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    size: { type: 'string' },
                  },
                },
              },
              colors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    hex: { type: 'string' },
                  },
                },
              },
            },
          },
          Order: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
              paymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] },
              paymentMethod: { type: 'string' },
              subtotal: { type: 'number' },
              shipping: { type: 'number' },
              discount: { type: 'number' },
              total: { type: 'number' },
              shippingName: { type: 'string' },
              shippingPhone: { type: 'string' },
              shippingAddress: { type: 'string' },
              shippingCity: { type: 'string' },
              shippingState: { type: 'string' },
              shippingPincode: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/OrderItem' },
              },
            },
          },
          OrderItem: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              productId: { type: 'string' },
              quantity: { type: 'integer' },
              price: { type: 'number' },
              size: { type: 'string' },
              color: { type: 'string' },
            },
          },
          CreateOrderRequest: {
            type: 'object',
            required: ['items', 'shippingName', 'shippingPhone', 'shippingAddress', 'shippingCity', 'shippingState', 'shippingPincode'],
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    productId: { type: 'string' },
                    quantity: { type: 'integer' },
                    size: { type: 'string' },
                    color: { type: 'string' },
                  },
                },
              },
              shippingName: { type: 'string' },
              shippingPhone: { type: 'string' },
              shippingAddress: { type: 'string' },
              shippingCity: { type: 'string' },
              shippingState: { type: 'string' },
              shippingPincode: { type: 'string' },
              paymentMethod: { type: 'string', default: 'COD' },
            },
          },
          UpdateProductRequest: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' },
              originalPrice: { type: 'number' },
              category: { type: 'string' },
              subcategory: { type: 'string' },
              featured: { type: 'boolean' },
              newArrival: { type: 'boolean' },
            },
          },
        },
      },
    },
  });
  return spec;
};

