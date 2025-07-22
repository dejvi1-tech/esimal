import { z } from 'zod';

// Order creation schema (POST /api/orders)
export const createOrderSchema = z.object({
  packageId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string().optional(),
  userId: z.string().optional(),
  country_code: z.string().length(2),
  name: z.string().optional(), // for my-packages
  surname: z.string().optional(), // for my-packages
});

// Package creation schema (POST /api/packages)
export const createPackageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  dataAmount: z.number().min(0), // Allow 0 for unlimited
  days: z.number().min(0), // Allow 0 for unlimited duration
  country: z.string().min(1),
  operator: z.string().min(1),
  type: z.string().min(1),
});

// Package update schema (PUT /api/packages/:id)
export const updatePackageSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  dataAmount: z.number().min(0).optional(), // Allow 0 for unlimited
  days: z.number().min(0).optional(), // Allow 0 for unlimited duration
  country: z.string().min(1).optional(),
  operator: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  validity: z.union([z.string(), z.number()]).optional(),
});

// Order status update schema (PUT /api/orders/:id/status)
export const updateOrderStatusSchema = z.object({
  status: z.string().min(1),
  notes: z.string().optional(),
});

// Order cancel schema (POST /api/orders/:id/cancel)
export const cancelOrderSchema = z.object({}); // No body expected, but keep for extensibility

// Save package schema (POST /api/admin/save-package)
export const savePackageSchema = z.object({
  name: z.string().min(1),
  country_name: z.string().min(1),
  country_code: z.string().min(2).max(4), // Allow 2-4 chars for ISO codes and regional codes like "EUUS"
  data_amount: z.coerce.number().min(0), // Allow 0 for unlimited packages
  days: z.coerce.number().min(0), // Allow 0 for unlimited duration packages
  base_price: z.coerce.number().positive(),
  sale_price: z.coerce.number().positive().optional(),
  profit: z.coerce.number().optional(),
  reseller_id: z.string().optional().nullable(),
  region: z.string().optional(),
  visible: z.boolean().optional(),
  show_on_frontend: z.boolean().optional(),
  location_slug: z.string().optional(),
  homepage_order: z.coerce.number().optional(),
  features: z.record(z.any()).optional(),
}); 