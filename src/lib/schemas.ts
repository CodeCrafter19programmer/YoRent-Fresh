import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Password must contain at least one uppercase letter').regex(/[a-z]/, 'Password must contain at least one lowercase letter').regex(/[0-9]/, 'Password must contain at least one digit');
const phoneSchema = z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number').min(10, 'Phone number must be at least 10 digits');
const urlSchema = z.string().url('Invalid URL');

// Auth Schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const newPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

// Property Listing Schemas
export const propertyListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must not exceed 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000, 'Description must not exceed 5000 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  propertyType: z.enum(['apartment', 'house', 'condo', 'townhouse', 'studio'], {
    errorMap: () => ({ message: 'Invalid property type' }),
  }),
  bedrooms: z.number().int().min(0, 'Bedrooms must be at least 0'),
  bathrooms: z.number().int().min(0, 'Bathrooms must be at least 0'),
  squareFeet: z.number().positive('Square feet must be greater than 0'),
  price: z.number().positive('Price must be greater than 0'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required'),
  amenities: z.array(z.string()).min(1, 'At least one amenity is required'),
  availableFrom: z.coerce.date('Invalid date'),
  petFriendly: z.boolean(),
  smokingAllowed: z.boolean(),
  parking: z.boolean(),
  furnished: z.boolean().optional(),
});

export type PropertyListingFormData = z.infer<typeof propertyListingSchema>;

// Rental Application Schemas
export const rentalApplicationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: z.coerce.date('Invalid date'),
  employmentStatus: z.enum(['employed', 'self-employed', 'student', 'retired', 'unemployed'], {
    errorMap: () => ({ message: 'Invalid employment status' }),
  }),
  employer: z.string().min(2, 'Employer name must be at least 2 characters').optional(),
  annualIncome: z.number().positive('Annual income must be greater than 0'),
  previousRentalHistory: z.array(z.object({
    landlordName: z.string(),
    propertyAddress: z.string(),
    rentalPeriod: z.string(),
    reasonForMoving: z.string(),
  })).optional(),
  references: z.array(z.object({
    name: z.string(),
    relationship: z.string(),
    phone: phoneSchema,
  })).min(1, 'At least one reference is required'),
  criminalHistory: z.boolean(),
  criminalDetails: z.string().optional(),
  additionalNotes: z.string().max(1000, 'Additional notes must not exceed 1000 characters').optional(),
  agreeToBackgroundCheck: z.boolean().refine(val => val === true, 'You must agree to a background check'),
});

export type RentalApplicationFormData = z.infer<typeof rentalApplicationSchema>;

// User Profile Schemas
export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: phoneSchema.optional(),
  bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
  profileImage: z.string().url('Invalid image URL').optional(),
  preferredLanguage: z.enum(['en', 'es', 'fr', 'de', 'it'], {
    errorMap: () => ({ message: 'Invalid language' }),
  }).optional(),
  timezone: z.string().optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

export const changeEmailSchema = z.object({
  currentEmail: emailSchema,
  newEmail: emailSchema,
  password: z.string().min(1, 'Password is required'),
}).refine(data => data.currentEmail !== data.newEmail, {
  message: 'New email must be different from current email',
  path: ['newEmail'],
});

export type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Messaging Schemas
export const messageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject must not exceed 100 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message must not exceed 5000 characters'),
  attachments: z.array(z.string().url('Invalid file URL')).optional(),
});

export type MessageFormData = z.infer<typeof messageSchema>;

// Review and Rating Schemas
export const reviewSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must not exceed 100 characters'),
  comment: z.string().min(20, 'Comment must be at least 20 characters').max(2000, 'Comment must not exceed 2000 characters'),
  cleanliness: z.number().int().min(1).max(5).optional(),
  communication: z.number().int().min(1).max(5).optional(),
  accuracy: z.number().int().min(1).max(5).optional(),
  checkIn: z.number().int().min(1).max(5).optional(),
  value: z.number().int().min(1).max(5).optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// Payment Schemas
export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'], {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  description: z.string().min(5, 'Description must be at least 5 characters').optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required').optional(),
  billingAddress: z.string().min(5, 'Billing address is required').optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

export const creditCardSchema = z.object({
  cardNumber: z.string().regex(/^\d{13,19}$/, 'Invalid card number').transform(val => val.replace(/\s/g, '')),
  cardholderName: z.string().min(3, 'Cardholder name must be at least 3 characters'),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(new Date().getFullYear()),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV'),
});

export type CreditCardFormData = z.infer<typeof creditCardSchema>;

// Search and Filter Schemas
export const propertySearchSchema = z.object({
  location: z.string().min(2, 'Location must be at least 2 characters').optional(),
  minPrice: z.number().int().positive().optional(),
  maxPrice: z.number().int().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  propertyType: z.enum(['apartment', 'house', 'condo', 'townhouse', 'studio']).optional(),
  amenities: z.array(z.string()).optional(),
  petFriendly: z.boolean().optional(),
  furnished: z.boolean().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'rating']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).optional(),
}).refine(data => {
  if (data.minPrice && data.maxPrice) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, {
  message: 'Minimum price must be less than or equal to maximum price',
  path: ['minPrice'],
});

export type PropertySearchFormData = z.infer<typeof propertySearchSchema>;

// Support/Contact Schemas
export const contactSupportSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject must not exceed 100 characters'),
  category: z.enum(['bug_report', 'feature_request', 'billing', 'account', 'other'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  message: z.string().min(20, 'Message must be at least 20 characters').max(3000, 'Message must not exceed 3000 characters'),
  attachments: z.array(z.string().url('Invalid file URL')).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export type ContactSupportFormData = z.infer<typeof contactSupportSchema>;

// Export all schemas as a collection
export const schemas = {
  auth: {
    login: loginSchema,
    signup: signupSchema,
    resetPassword: resetPasswordSchema,
    newPassword: newPasswordSchema,
  },
  property: {
    listing: propertyListingSchema,
    search: propertySearchSchema,
  },
  rental: {
    application: rentalApplicationSchema,
  },
  profile: {
    update: profileUpdateSchema,
    changeEmail: changeEmailSchema,
    changePassword: changePasswordSchema,
  },
  messaging: {
    message: messageSchema,
  },
  review: {
    review: reviewSchema,
  },
  payment: {
    payment: paymentSchema,
    creditCard: creditCardSchema,
  },
  support: {
    contactSupport: contactSupportSchema,
  },
};
