### ***✅ 1. System Overview **

The Rental Management System is a lightweight web application designed to help landlords and property managers track properties, tenants, rent payments, and basic expenses.
The system is intentionally simple and avoids unnecessary complexity.

⸻

### ***✅ 2. Core Features **

A. Property Management
	•	Add property (name, type, location, rent amount, photos)
	•	Edit / delete property
	•	Mark as Available or Occupied
	•	View all properties

B. Tenant Management
	•	Add tenant (name, number, ID, emergency contact)
	•	Assign tenant to property
	•	Manage move-out
	•	Track tenant history

C. Rent Management
	•	Record rent payments (date, month, amount, status)
	•	Automatic unpaid/paid status
	•	Monthly rent summary
	•	View outstanding rent

D. Expense Tracking (Optional)
	•	Add expense (repairs, utilities, cleaning, etc.)
	•	Monthly expense report
	•	Profit calculation = Rent – Expenses

E. Agreements (Optional)
	•	Upload PDF agreements
	•	Track contract start & end dates
	•	Renewal reminders

F. Dashboard
	•	Total properties
	•	Occupied vs Vacant
	•	Rent expected vs collected
	•	Unpaid rent list
	•	Monthly expenses summary

G. Settings
	•	User profile
	•	Change password
	•	Property categories
	•	Roles (Admin, Agent)


### ***✅ 3. Recommended Tech Stack (Best + Simple) **

✅ Best Stack for Speed + Simplicity

Frontend  HTML CSS BOOTSTRAP VANILA JS

backend PHP LARAVEL

Database PLANET SCALE(MYSQL)

Hosting cloud HOSTING

### ***✅ 4. Database Design **

TABLE 1: users

Field
Type
Description
id
INT
PK
name
VARCHAR
Admin/agent name
email
VARCHAR
Login email
password
VARCHAR
Hashed password
role
ENUM(‘admin’,‘agent’)
Access control
created_at
TIMESTAMP

TABLE 2: properties


Field
Type
id
INT
name
VARCHAR
type
VARCHAR (house, apartment, shop, etc.)
location
TEXT
monthly_rent
DECIMAL
status
ENUM(‘available’,‘occupied’)
description
TEXT
image
VARCHAR
created_at
TIMESTAMP


TABLE 3: tenants

Field
Type
id
INT
name
VARCHAR
number
VARCHAR
id_number
VARCHAR
emergency_contact
VARCHAR
created_at
TIMESTAM

TABLE 4: rentals (property <-> tenant assignment)


Field
Type
id
INT
tenant_id
INT
property_id
INT
start_date
DATE
end_date
DATE (NULL if still staying)
status
ENUM(‘active’,‘ended’)


TABLE 5: rent_payments

Field
Type
id
INT
rental_id
INT
month
VARCHAR (e.g., “Jan-2025”)
amount_paid
DECIMAL
date_paid
DATE
status
ENUM(‘paid’,‘unpaid’)


TABLE 6: expenses (Optional)


Field
Type
id
INT
property_id
INT
description
VARCHAR
amount
DECIMAL
date
DATE

### ***✅ 5. System Architecture **

Frontend (Bootstrap + JS)
      ↓
Backend (PHP or Laravel)
      ↓
MySQL Database
      ↓
Uploads folder for documents


STEP 5: Recommended Laravel Folder Structure for Rental System

app/
│
├── Models/
│   ├── Property.php
│   ├── Tenant.php
│   ├── Rental.php
│   ├── RentPayment.php
│   └── Expense.php
│
├── Http/
│   ├── Controllers/
│   │   ├── PropertyController.php
│   │   ├── TenantController.php
│   │   ├── RentalController.php
│   │   ├── RentPaymentController.php
│   │   └── ExpenseController.php
│   │
│   ├── Middleware/
│   └── Requests/
│
resources/
├── views/
│   ├── properties/
│   ├── tenants/
│   ├── rentals/
│   ├── payments/
│   ├── expenses/
│   └── dashboard.blade.php
│
routes/
│   └── web.php
│
database/
├── migrations/
├── seeders/
└── factories/



### ***✅ 7. Backend Logic Flow **

Adding Property
	1.	Admin fills form
	2.	System uploads image
	3.	Insert into properties table
	4.	Status defaults to “available”

Assigning Tenant to Property
	1.	Select property + tenant
	2.	Add record to rentals table
	3.	Change property status → “occupied”

Recording Rent Payment
	1.	Select rental
	2.	Select month
	3.	Save payment
	4.	If amount ≥ monthly rent → status = paid
	5.	Dashboard updates automatically

Vacating Tenant
	1.	Update rentals.status → ended
	2.	Update properties.status → available


✅ 8. Dashboard Metrics (Simple)
	•	Total Properties
	•	Available Properties
	•	Busy Properties
	•	Total Expected Rent
	•	Rent Collected This Month
	•	Outstanding Rent
	•	Expenses This Month

⸻

✅ 9. Optional Future Features
	•	SMS reminders
	•	Mobile app version
	•	Multi-landlord accounts
	•	Digital contract signing
	•	Auto-generated invoices

⸻

[follow rules](SideStory.md)

[project documentation](YoRent.md)


