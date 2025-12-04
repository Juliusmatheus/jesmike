# 📝 SME Registration - Database Integration Guide

## ✅ What's Been Connected

The **RegisterSME** component is now fully connected to your PostgreSQL database with complete CRUD functionality.

## 🎯 Features Implemented

### 1. **New Registration**
- ✅ Multi-step registration form (4 steps)
- ✅ Saves all data to PostgreSQL database
- ✅ Validates business requirements (3+ years operation, owner age 35-59)
- ✅ Generates unique registration number
- ✅ Sets status to 'pending' for admin review

### 2. **Check Existing Registration**
- ✅ Automatically checks if user email is already registered
- ✅ Pre-fills form with existing data if found
- ✅ Allows users to update their information

### 3. **Data Validation**
- ✅ Business must be operating for 3+ years
- ✅ Owner age must be between 35-59 years
- ✅ Email uniqueness validation
- ✅ Required fields validation

### 4. **Database Integration**
- ✅ Saves to `smes` table in PostgreSQL
- ✅ Stores all business and owner information
- ✅ Tracks document uploads
- ✅ Records registration status

## 📊 Database Schema Updates

### New Fields Added to `smes` Table:
```sql
- trading_name VARCHAR(255)
- owner_id VARCHAR(50)
- owner_passport VARCHAR(50)
- owner_age INTEGER
- owner_address TEXT
- nationality VARCHAR(100)
- years_experience INTEGER
- sub_sector VARCHAR(100)
- annual_turnover_range VARCHAR(50)
- documents_count INTEGER
```

## 🌐 API Endpoints

### 1. Register New SME
```
POST /api/sme/register
```

**Request Body:**
```json
{
  "business_name": "My Business",
  "trading_name": "MB Trading",
  "registration_number": "SME1234567890",
  "industry_sector": "Agriculture",
  "sub_sector": "Crop Production",
  "established_date": "2020-01-15",
  "address": "123 Main St, Windhoek",
  "region": "Khomas",
  "city": "Windhoek",
  "employees": 10,
  "annual_turnover_range": "500001-1000000",
  "business_type": "Private Company",
  "owner_name": "John Doe",
  "owner_id": "12345678",
  "owner_passport": "N1234567",
  "owner_gender": "M",
  "owner_age": 40,
  "owner_address": "456 Owner St",
  "nationality": "Namibian",
  "years_experience": 10,
  "email": "john@mybusiness.com",
  "phone": "+264811234567",
  "status": "pending",
  "documents_count": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "SME registration submitted successfully",
  "sme": {
    "id": 6,
    "business_name": "My Business",
    "registration_number": "SME1234567890",
    "status": "pending",
    ...
  }
}
```

### 2. Check Existing Registration
```
GET /api/sme/check/:email
```

**Example:**
```bash
curl http://localhost:5000/api/sme/check/john@mybusiness.com
```

**Response:**
```json
{
  "exists": true,
  "sme": {
    "id": 6,
    "business_name": "My Business",
    "email": "john@mybusiness.com",
    ...
  }
}
```

### 3. Update SME Information
```
PUT /api/sme/update/:id
```

**Request Body:** (any fields to update)
```json
{
  "phone": "+264819999999",
  "employees": 15,
  "annual_turnover_range": "1000001-5000000"
}
```

### 4. Get All SMEs (with filters)
```
GET /api/sme/all?status=active&region=Khomas&limit=50&offset=0
```

**Query Parameters:**
- `status` - Filter by status (pending, active, rejected)
- `region` - Filter by region
- `sector` - Filter by industry sector
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "smes": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

## 🔄 Registration Flow

### Step 1: Business Information
```
User fills in:
- Business name (required)
- Trading name
- Industry sector (required)
- Sub-sector
- Operation start date (required, must be 3+ years ago)
- Region (required)
- Physical address (required)
- Number of employees
- Annual turnover range
- Business type
```

### Step 2: Owner Information
```
User fills in:
- Full name (required)
- ID number
- Passport number
- Email (required, must be unique)
- Phone (required)
- Physical address
- Nationality
- Gender
- Age (required, must be 35-59)
- Years of experience
```

### Step 3: Documents
```
User uploads:
- Supporting documents (PDF, PNG, JPG)
- Proof of 3+ years operation
- Bank statements, receipts, invoices, etc.
```

### Step 4: Review & Submit
```
User reviews:
- All entered information
- Confirms accuracy
- Submits to database
```

## 💾 Data Storage

### What Gets Saved:
1. **Business Details**
   - Names, sector, dates, location
   - Employee count, turnover
   - Business type

2. **Owner Information**
   - Personal details, contact info
   - Age, nationality, experience
   - ID/Passport numbers

3. **Metadata**
   - Registration number (auto-generated)
   - Status (pending/active/rejected)
   - Document count
   - Timestamps (created_at, updated_at)

### What Doesn't Get Saved (Yet):
- Actual document files (only count tracked)
- Document file paths/URLs
- User authentication tokens

## 🧪 Testing the Registration

### Test New Registration:
1. Navigate to `/register`
2. Fill in all required fields
3. Upload at least one document
4. Submit the form
5. Check database:
```sql
SELECT * FROM smes ORDER BY created_at DESC LIMIT 1;
```

### Test Existing Registration Check:
1. Register with email: `test@example.com`
2. Navigate to `/register` again
3. Should see: "Existing registration found"
4. Form should be pre-filled with data

### Test Validation:
1. Try operation date < 3 years ago → Should fail
2. Try owner age < 35 or > 59 → Should fail
3. Try duplicate email → Should fail
4. Try without documents → Should fail

## 🔒 Security Features

### Implemented:
- ✅ Email uniqueness validation
- ✅ Parameterized SQL queries (SQL injection protection)
- ✅ Input validation on frontend and backend
- ✅ Status tracking (pending review)

### Recommended for Production:
- [ ] User authentication (JWT tokens)
- [ ] File upload to cloud storage (AWS S3, Azure Blob)
- [ ] Email verification
- [ ] CAPTCHA for spam prevention
- [ ] Rate limiting on registration endpoint
- [ ] Admin approval workflow

## 📝 Sample Registration Data

### Valid Test Data:
```javascript
{
  businessName: "Test Business Ltd",
  tradingName: "Test Trading",
  industrySector: "Agriculture",
  subSector: "Crop Production",
  operationStartDate: "2020-01-15", // 3+ years ago
  physicalAddress: "123 Test Street, Windhoek",
  region: "Khomas",
  numberOfEmployees: "10",
  annualTurnover: "500001-1000000",
  businessType: "Private Company",
  ownerFullName: "Test Owner",
  idNumber: "12345678",
  email: "test@testbusiness.com",
  phone: "+264811234567",
  nationality: "Namibian",
  gender: "Male",
  age: "40", // Between 35-59
  yearsOfExperience: "10"
}
```

## 🚀 Next Steps

### Immediate:
1. ✅ Registration form connected to database
2. ✅ Validation working
3. ✅ Data saving correctly
4. ✅ Existing registration check working

### Future Enhancements:
- [ ] File upload to cloud storage
- [ ] Email notifications on registration
- [ ] Admin approval dashboard
- [ ] Status update notifications
- [ ] Document verification system
- [ ] Multi-language support
- [ ] Mobile-responsive improvements

## 🐛 Troubleshooting

### Registration Fails:
```
Error: Email already registered
Solution: Use a different email or check existing registration
```

### Database Connection Error:
```
Error: Failed to register SME
Solution: 
1. Check PostgreSQL is running
2. Verify backend server is running
3. Check database credentials in backend/.env
```

### Validation Errors:
```
Error: Business must have been operating for at least 3 years
Solution: Select a date that is 3+ years in the past
```

```
Error: Business owner age must be between 35-59 years
Solution: Enter an age between 35 and 59
```

## 📊 Database Queries

### Check Recent Registrations:
```sql
SELECT 
  business_name,
  owner_name,
  email,
  region,
  status,
  created_at
FROM smes
ORDER BY created_at DESC
LIMIT 10;
```

### Count by Status:
```sql
SELECT 
  status,
  COUNT(*) as count
FROM smes
GROUP BY status;
```

### Find by Email:
```sql
SELECT * FROM smes WHERE email = 'test@example.com';
```

### Update Status:
```sql
UPDATE smes 
SET status = 'active', updated_at = CURRENT_TIMESTAMP
WHERE id = 6;
```

## ✨ Summary

Your RegisterSME component now:
- ✅ Saves data to PostgreSQL database
- ✅ Checks for existing registrations
- ✅ Validates all requirements
- ✅ Generates unique registration numbers
- ✅ Tracks registration status
- ✅ Allows updates to existing data
- ✅ Provides user feedback with toast notifications

**Everything is ready for SME registrations!** 🎉

---

**Last Updated**: November 28, 2025  
**Status**: ✅ Fully Functional  
**Database**: Connected to PostgreSQL