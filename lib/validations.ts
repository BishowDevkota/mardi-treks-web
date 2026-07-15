import { z } from "zod";

// ---- Auth ----
export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .trim(),
  email: z.string().email("Please enter a valid email").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ---- Booking ----
export const travelerDetailSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(200).trim(),
  email: z.string().email("Valid email is required").trim().toLowerCase(),
  phone: z.string().min(6, "Valid phone number is required").max(20).trim(),
  nationality: z.string().min(2, "Nationality is required").max(100).trim(),
  passportNumber: z.string().max(50).optional().or(z.literal("")),
  age: z.number().int().min(1).max(120).optional().nullable(),
});

export const createBookingSchema = z.object({
  trekSlug: z.string().min(1, "Trek slug is required"),
  trekTitle: z.string().min(1, "Trek title is required"),
  trekPrice: z.number().positive("Price must be positive"),
  trekDuration: z.number().int().positive("Duration must be positive"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  groupSize: z.number().int().min(1, "At least 1 traveler").max(20),
  specialRequests: z.string().max(2000).optional().or(z.literal("")),
  travelers: z
    .array(travelerDetailSchema)
    .min(1, "At least one traveler is required")
    .max(20),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ---- Payment ----
export const createPaymentSchema = z.object({
  bookingId: z.string().min(1),
  method: z.enum(["stripe", "esewa", "khalti"]),
  returnUrl: z.string().url().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ---- Contact ----
export const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required").max(200).trim(),
  email: z.string().email("Valid email is required").trim().toLowerCase(),
  subject: z.string().min(5, "Subject is required").max(200).trim(),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000).trim(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

// ---- Review ----
export const reviewSchema = z.object({
  trekSlug: z.string().min(1),
  author: z.string().min(2, "Name is required").max(100).trim(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10, "Review must be at least 10 characters").max(2000).trim(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
