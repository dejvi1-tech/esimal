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
  dataAmount: z.number().positive(),
  days: z.number().positive(),
  country: z.string().min(1),
  operator: z.string().min(1),
  type: z.string().min(1),
});

// Package update schema (PUT /api/packages/:id)
export const updatePackageSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  dataAmount: z.number().positive().optional(),
  days: z.number().positive().optional(),
  country: z.string().min(1).optional(),
  operator: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  validity: z.union([z.string(), z.number()]).optional(),
}); 