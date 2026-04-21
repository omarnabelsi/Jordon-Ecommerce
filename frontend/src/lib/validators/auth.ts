import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email(),
    first_name: z.string().min(2),
    last_name: z.string().min(2),
    password: z.string().min(8),
    confirm_password: z.string().min(8)
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match"
  });

export type RegisterValues = z.infer<typeof registerSchema>;
