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
  guest_email: z.string().email().optional(),
  card_number: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const cleaned = val.replace(/\s/g, "");
        return /^\d{16}$/.test(cleaned);
      },
      { message: "Card number must be 16 digits" }
    ),
  card_expiry: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        if (!/^\d{2}\/\d{2}$/.test(val)) return false;
        const [monthStr, yearStr] = val.split("/");
        const month = parseInt(monthStr, 10);
        const year = parseInt(yearStr, 10) + 2000;
        if (month < 1 || month > 12) return false;
        const now = new Date();
        const expiry = new Date(year, month);
        return expiry > now;
      },
      { message: "Expiry must be MM/YY and not expired" }
    ),
  card_cvv: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^\d{3,4}$/.test(val);
      },
      { message: "CVV must be 3 or 4 digits" }
    ),
  card_name: z.string().optional()
});

export type ShippingFormValues = z.infer<typeof shippingSchema>;
