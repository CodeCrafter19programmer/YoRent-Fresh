# YoRent Tenant Management System

## Overview

This comprehensive tenant management system has been enhanced with a complete tenant login portal, payment tracking, notification system, and tax accountability features. The system now supports both admin and tenant user roles with distinct interfaces and capabilities.

## New Features

### 🔐 Authentication System
- **Tenant Login**: Secure login system for tenants to access their dashboard
- **Admin Login**: Separate admin interface with full management capabilities
- **Role-based Access Control**: Automatic redirection based on user role
- **User Registration**: New tenant signup with automatic role assignment

### 👤 Tenant Portal Features
- **Personal Dashboard**: Overview of rent payments, balances, and notifications
- **Payment History**: Complete view of all payment records (view-only)
- **Real-time Balance Tracking**: Current outstanding balance and payment status
- **Notification Center**: Receive payment reminders and important updates
- **Property Information**: View assigned property details

### 🔔 Notification System
- **Automatic Payment Reminders**: 
  - 7 days before due date
  - 3 days before due date
  - 1 day before due date
- **Overdue Notifications**: Automatic alerts for late payments
- **Payment Confirmations**: Success notifications when payments are processed
- **Real-time Updates**: Live notification updates using Supabase realtime

### 💰 Admin Payment Management
- **Payment Processing**: Update payment status and record payment details
- **Bulk Payment Management**: Handle multiple tenant payments efficiently
- **Payment Method Tracking**: Record how payments were received
- **Automatic Notifications**: Send confirmations to tenants upon payment updates

### 📊 Admin Notification Dashboard
- **Activity Feed**: Real-time view of all tenant activities
- **Payment Alerts**: Notifications for received payments and overdue accounts
- **Broadcast Messaging**: Send notifications to all tenants or specific individuals
- **Notification Types**: Categorized notifications (payment, maintenance, general)

### 📈 Tax Accountability System
- **Monthly Tax Calculations**: Automated calculation of net income and tax liability
- **Utilities Breakdown**: Detailed tracking of electricity, water, gas, and maintenance costs
- **Revenue Tracking**: Complete overview of rental income vs expenses
- **Tax Rate Management**: Configurable tax rates for different periods
- **Financial Reports**: Comprehensive yearly and monthly financial summaries

## Database Schema Enhancements

### New Tables
- `tax_records`: Monthly tax calculations and financial summaries
- Enhanced `notifications`: Real-time notification system
- Enhanced `payments`: Detailed payment tracking with status management

### New Functions
- `generate_monthly_tax_record()`: Automated tax calculation
- `update_tax_records_on_payment_change()`: Automatic tax record updates
- `has_role()`: Role-based access control

## User Roles & Permissions

### Admin Role
- Full access to all property and tenant management
- Payment processing and management
- Tax accountability and financial reporting
- Notification broadcasting
- User management

### Tenant Role
- View-only access to personal payment history
- Real-time balance and payment status
- Receive notifications and reminders
- View property information
- No modification capabilities

## Key Routes

### Public Routes
- `/login` - Login page for both admins and tenants
- `/signup` - Tenant registration page
- `/unauthorized` - Access denied page

### Admin Routes
- `/` - Admin dashboard
- `/admin/payments` - Payment management interface
- `/admin/notifications` - Notification dashboard
- `/admin/tax` - Tax accountability system
- All existing property and tenant management routes

### Tenant Routes
- `/tenant/dashboard` - Tenant personal dashboard

## Real-time Features

### Live Updates
- Payment status changes reflect immediately
- Notifications appear in real-time
- Balance updates automatically
- Activity feed updates live

### Automatic Processes
- Daily deadline checking for payment reminders
- Automatic overdue status updates
- Tax record generation on payment changes
- Notification cleanup and management

## Security Features

### Row Level Security (RLS)
- Tenants can only view their own data
- Admins have full access to all records
- Secure API endpoints with role validation

### Data Protection
- Encrypted user sessions
- Secure password handling
- Protected routes with authentication checks

## Installation & Setup

### Database Migration
Run the new migration to add tax records functionality:
```sql
-- Apply the new migration
supabase db push
```

### Environment Variables
Ensure your `.env` file contains:
```
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_URL=your_supabase_url
```

### Running the Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage Instructions

### For Tenants
1. **Registration**: Sign up using the `/signup` route
2. **Login**: Access your dashboard via `/login`
3. **Dashboard**: View payment history, balance, and notifications
4. **Notifications**: Check for payment reminders and updates

### For Admins
1. **Login**: Use admin credentials to access admin dashboard
2. **Payment Management**: Process tenant payments via `/admin/payments`
3. **Notifications**: Monitor tenant activity via `/admin/notifications`
4. **Tax Reports**: Generate financial reports via `/admin/tax`

## Technical Implementation

### Frontend Architecture
- React with TypeScript
- Supabase for backend and real-time features
- Tailwind CSS for styling
- shadcn/ui for components
- React Router for navigation

### Backend Features
- PostgreSQL database with RLS
- Real-time subscriptions
- Automated triggers and functions
- Role-based access control

### Notification Service
- Automatic deadline checking
- Configurable notification types
- Real-time delivery system
- Cleanup and management

## Future Enhancements

### Potential Additions
- Email notification integration
- SMS alerts for urgent notifications
- Mobile app support
- Advanced reporting and analytics
- Payment gateway integration
- Document management system

## Support & Maintenance

### Monitoring
- Check notification service logs regularly
- Monitor database performance
- Review user access patterns

### Updates
- Regular security updates
- Feature enhancements based on user feedback
- Database optimization as needed

---

This system provides a complete tenant management solution with real-time capabilities, comprehensive financial tracking, and automated notification systems. All features are designed with security, usability, and scalability in mind.
