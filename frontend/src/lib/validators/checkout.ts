import { z } from "zod";

export const shippingSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  address_line1: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  postal_code: z.string().min(3),
  country: z.string().min(2),
  phone: z.string().min(7),
  payment_method: z.enum(["stripe", "mock"]),
  guest_email: z.string().email().optional()
});

export type ShippingFormValues = z.infer<typeof shippingSchema>;
