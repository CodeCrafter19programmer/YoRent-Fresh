/**
 * YoRent-Fresh TypeScript Type Definitions
 * Comprehensive type definitions for the rental application
 * Last Updated: 2025-12-17
 */

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profileImageUrl?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  LANDLORD = 'landlord',
  TENANT = 'tenant',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export interface UserProfile extends Omit<User, 'password'> {
  ratings?: Rating[];
  reviews?: Review[];
  rentals?: Rental[];
  listings?: Property[];
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
}

// ============================================================================
// PROPERTY TYPES
// ============================================================================

export interface Property {
  id: string;
  title: string;
  description: string;
  address: Address;
  landlordId: string;
  landlord?: User;
  propertyType: PropertyType;
  category: PropertyCategory;
  status: PropertyStatus;
  pricePerMonth: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  totalArea: number; // in square meters
  maxOccupants: number;
  amenities: Amenity[];
  images: PropertyImage[];
  rules?: PropertyRule[];
  ratings?: Rating[];
  averageRating?: number;
  isAvailable: boolean;
  availableFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  CONDO = 'condo',
  TOWNHOUSE = 'townhouse',
  VILLA = 'villa',
  STUDIO = 'studio',
  ROOM = 'room',
  OTHER = 'other',
}

export enum PropertyCategory {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  MIXED = 'mixed',
}

export enum PropertyStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  MAINTENANCE = 'maintenance',
  REMOVED = 'removed',
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
  category: AmenityCategory;
}

export enum AmenityCategory {
  BEDROOM = 'bedroom',
  BATHROOM = 'bathroom',
  KITCHEN = 'kitchen',
  LIVING = 'living',
  OUTDOOR = 'outdoor',
  SECURITY = 'security',
  UTILITY = 'utility',
  ENTERTAINMENT = 'entertainment',
}

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  isMainImage: boolean;
  uploadedAt: Date;
}

export interface PropertyRule {
  id: string;
  title: string;
  description: string;
  severity: RuleSeverity;
}

export enum RuleSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// ============================================================================
// RENTAL/BOOKING TYPES
// ============================================================================

export interface Rental {
  id: string;
  propertyId: string;
  property?: Property;
  tenantId: string;
  tenant?: User;
  landlordId: string;
  landlord?: User;
  startDate: Date;
  endDate: Date;
  status: RentalStatus;
  totalPrice: number;
  currency: string;
  deposit?: number;
  paymentStatus: PaymentStatus;
  documents?: RentalDocument[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum RentalStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  REFUNDED = 'refunded',
}

export interface RentalDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export enum DocumentType {
  LEASE = 'lease',
  ID = 'id',
  EMPLOYMENT = 'employment',
  REFERENCE = 'reference',
  INSPECTION = 'inspection',
  OTHER = 'other',
}

// ============================================================================
// BOOKING REQUEST TYPES
// ============================================================================

export interface BookingRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  status: BookingRequestStatus;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  message?: string;
  respondedAt?: Date;
  respondedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum BookingRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface Payment {
  id: string;
  rentalId: string;
  rental?: Rental;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  description?: string;
  dueDate: Date;
  paidDate?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  MOBILE_MONEY = 'mobile_money',
  OTHER = 'other',
}

// ============================================================================
// REVIEW & RATING TYPES
// ============================================================================

export interface Review {
  id: string;
  rentalId?: string;
  rental?: Rental;
  propertyId?: string;
  property?: Property;
  authorId: string;
  author?: User;
  targetUserId?: string;
  targetUser?: User;
  rating: number; // 1-5
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
  helpful: number;
  unhelpful: number;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rating {
  id: string;
  rentalId?: string;
  propertyId?: string;
  userId: string;
  score: number; // 1-5
  category: RatingCategory;
  createdAt: Date;
}

export enum RatingCategory {
  CLEANLINESS = 'cleanliness',
  ACCURACY = 'accuracy',
  COMMUNICATION = 'communication',
  LOCATION = 'location',
  VALUE = 'value',
  OVERALL = 'overall',
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

// ============================================================================
// SEARCH & FILTER TYPES
// ============================================================================

export interface SearchFilters {
  query?: string;
  location?: string;
  city?: string;
  country?: string;
  propertyType?: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  minRating?: number;
  availableFrom?: Date;
  availableTo?: Date;
  isAvailable?: boolean;
  sortBy?: SortOption;
  page?: number;
  limit?: number;
}

export enum SortOption {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RATING_ASC = 'rating_asc',
  RATING_DESC = 'rating_desc',
  NEWEST = 'newest',
  OLDEST = 'oldest',
  MOST_POPULAR = 'most_popular',
}

export interface SearchResult {
  id: string;
  title: string;
  price: number;
  location: string;
  rating: number;
  image: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
}

// ============================================================================
// MESSAGE & NOTIFICATION TYPES
// ============================================================================

export interface Message {
  id: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  rentalId?: string;
  propertyId?: string;
  content: string;
  attachments?: Attachment[];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants?: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export enum NotificationType {
  BOOKING_REQUEST = 'booking_request',
  BOOKING_APPROVED = 'booking_approved',
  BOOKING_REJECTED = 'booking_rejected',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  REVIEW_POSTED = 'review_posted',
  MESSAGE_RECEIVED = 'message_received',
  PROPERTY_LISTED = 'property_listed',
  MAINTENANCE_REMINDER = 'maintenance_reminder',
  SYSTEM = 'system',
}

export interface Attachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  url: string;
}

// ============================================================================
// MAINTENANCE & SUPPORT TYPES
// ============================================================================

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  property?: Property;
  tenantId: string;
  tenant?: User;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  images?: string[];
  assignedTo?: string;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum MaintenanceCategory {
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  STRUCTURAL = 'structural',
  APPLIANCE = 'appliance',
  PEST_CONTROL = 'pest_control',
  CLEANING = 'cleaning',
  OTHER = 'other',
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency',
}

export enum MaintenanceStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: SupportCategory;
  priority: TicketPriority;
  status: TicketStatus;
  attachments?: Attachment[];
  assignedTo?: string;
  responses?: TicketResponse[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export enum SupportCategory {
  BILLING = 'billing',
  TECHNICAL = 'technical',
  ACCOUNT = 'account',
  SAFETY = 'safety',
  OTHER = 'other',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_USER = 'waiting_for_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  userId: string;
  user?: User;
  message: string;
  attachments?: Attachment[];
  createdAt: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  filename: string;
  path: string;
  url?: string;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface FilterOptions {
  [key: string]: any;
}

// ============================================================================
// ANALYTICS & STATS TYPES
// ============================================================================

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<UserRole, number>;
}

export interface PropertyStats {
  totalProperties: number;
  availableProperties: number;
  rentedProperties: number;
  averagePrice: number;
  propertiesByType: Record<PropertyType, number>;
}

export interface RentalStats {
  totalRentals: number;
  activeRentals: number;
  completedRentals: number;
  totalRevenue: number;
  averageRentalDuration: number;
}

export interface Dashboard {
  userStats: UserStats;
  propertyStats: PropertyStats;
  rentalStats: RentalStats;
  recentActivity?: Activity[];
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  userId?: string;
  createdAt: Date;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type * from './index';
