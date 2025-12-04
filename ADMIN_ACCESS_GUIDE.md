# Admin Access Guide - JESMIKE Platform

## How to Access Admin Panel

### Step 1: Create an Admin Account

You need to register a business with an email containing "admin" or use the specific admin email.

**Option A: Register with Admin Email**
1. Go to `/register` (Register page)
2. Fill in the registration form
3. **Important:** Use an email that contains "admin" in it
   - Example: `admin@jesmike.com`
   - Example: `myadmin@company.com`
   - Example: `admin.user@email.com`
4. Complete the registration

**Option B: Use Existing Admin Email**
- Email: `admin@jesmike.com`
- This email will automatically grant admin privileges

### Step 2: Login as Admin

1. Go to `/login` (Login page)
2. Enter your admin email
3. Click "Login"
4. You'll be logged in with admin privileges

### Step 3: Access Admin Features

Once logged in as admin, you'll see:

**In Navigation Bar:**
- Home
- Statistics
- Investments
- Businesses
- About
- Contact
- Dashboard
- **Admin** ← Admin-only link
- Profile
- Logout

**Click "Admin"** to access the Admin Panel

## Admin Panel Features

### Current Admin Panel (`/admin`)

The Admin Panel provides:

1. **Dashboard Overview**
   - Total registered SMEs
   - Pending registrations
   - Active businesses
   - System statistics

2. **Business Management**
   - View all registered businesses
   - Approve/Reject registrations
   - Edit business information
   - Delete businesses

3. **User Management**
   - View all users
   - Manage user roles
   - Deactivate accounts

## Admin Privileges Across Platform

### 1. Business Profiles Page (`/businesses`)
**Admin Can:**
- ✅ View all businesses
- ✅ **Delete any business** (red delete button visible)
- ✅ Contact businesses
- ✅ View business details

**Regular Users Cannot:**
- ❌ Delete businesses (button hidden)

### 2. Admin Panel (`/admin`)
**Admin Can:**
- ✅ Access admin panel
- ✅ Manage all registrations
- ✅ Approve/reject businesses
- ✅ View system statistics

**Regular Users Cannot:**
- ❌ Access admin panel (link not visible)
- ❌ See admin routes

### 3. Statistics Page (`/statistics`)
**Admin Can:**
- ✅ Export data (CSV, Excel, PDF)
- ✅ View all statistics
- ✅ Filter data

**Regular Users Can:**
- ✅ View statistics (same as admin)

## Quick Admin Login Steps

### Method 1: Using Existing Data
If you already have a business registered:

1. Go to: `http://localhost:3000/login`
2. Enter any email from your database that contains "admin"
3. Click Login
4. Navigate to `/admin` or click "Admin" in navbar

### Method 2: Create New Admin
1. Go to: `http://localhost:3000/register`
2. Register with email: `admin@jesmike.com`
3. Complete registration
4. Go to: `http://localhost:3000/login`
5. Login with: `admin@jesmike.com`
6. Access Admin Panel

### Method 3: Database Direct (Advanced)
Add admin flag directly in database:

```sql
-- Update existing user to admin
UPDATE smes 
SET email = 'admin@jesmike.com' 
WHERE id = 1;

-- Or insert new admin user
INSERT INTO smes (
  business_name, owner_name, email, phone, 
  region, industry_sector, status, created_at
) VALUES (
  'Admin Account', 'System Admin', 'admin@jesmike.com', 
  '+264 81 000 0000', 'Khomas', 'Administration', 
  'active', CURRENT_TIMESTAMP
);
```

## Testing Admin Access

### Test Checklist:

1. **Login Test**
   - [ ] Login with admin email
   - [ ] Verify "Admin" link appears in navbar
   - [ ] Verify "isAdmin" is true in browser console

2. **Admin Panel Test**
   - [ ] Click "Admin" in navbar
   - [ ] Verify admin panel loads
   - [ ] Check all admin features work

3. **Business Profiles Test**
   - [ ] Go to `/businesses`
   - [ ] Verify delete button appears on business cards
   - [ ] Try deleting a test business
   - [ ] Confirm deletion works

4. **Logout Test**
   - [ ] Logout
   - [ ] Verify "Admin" link disappears
   - [ ] Verify delete buttons disappear from business cards

## Admin Email Detection

The system identifies admins by checking if the email contains "admin":

```javascript
const isAdminUser = sme.email.includes('admin') || sme.email === 'admin@jesmike.com';
```

**Valid Admin Emails:**
- ✅ admin@jesmike.com
- ✅ admin@company.com
- ✅ myadmin@email.com
- ✅ user.admin@domain.com
- ✅ administrator@site.com

**Not Admin Emails:**
- ❌ user@company.com
- ❌ john@email.com
- ❌ business@domain.com

## Current Admin Users in Database

To check who has admin access, run:

```sql
SELECT id, business_name, owner_name, email, status 
FROM smes 
WHERE email LIKE '%admin%';
```

## Troubleshooting

### "Admin link not showing"
**Solution:**
1. Check if logged in with admin email
2. Open browser console: `localStorage.getItem('user')`
3. Verify `isAdmin: true` in user object
4. If false, logout and login again with admin email

### "Cannot access /admin route"
**Solution:**
1. Check if route is protected
2. Verify you're logged in
3. Check `isAdmin` status in AuthContext
4. Clear localStorage and login again

### "Delete button not showing"
**Solution:**
1. Verify admin login
2. Check browser console for `isAdmin` value
3. Refresh the page
4. Clear cache and reload

## Security Recommendations

⚠️ **Current Setup:**
- Admin detection based on email pattern
- No password verification
- Frontend-only protection

🔒 **Production Recommendations:**

1. **Add proper authentication:**
   - Implement password system
   - Use JWT tokens
   - Add session management

2. **Database admin flag:**
   ```sql
   ALTER TABLE smes ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
   UPDATE smes SET is_admin = TRUE WHERE email = 'admin@jesmike.com';
   ```

3. **Backend protection:**
   - Add authentication middleware
   - Verify admin status on server
   - Protect admin API endpoints

4. **Role-based access:**
   - Super Admin
   - Moderator
   - Regular User

## Next Steps

1. **Login as Admin:**
   - Use email with "admin" in it
   - Or register with `admin@jesmike.com`

2. **Access Admin Panel:**
   - Click "Admin" in navbar
   - Or navigate to `/admin`

3. **Test Admin Features:**
   - Delete businesses from `/businesses`
   - Manage registrations in admin panel
   - Export data from statistics

4. **Customize Admin Panel:**
   - Add more admin features
   - Customize dashboard
   - Add reporting tools

## Support

If you need help accessing admin features:
1. Check this guide
2. Verify email contains "admin"
3. Clear browser cache
4. Check browser console for errors
5. Restart the application

---

**Quick Access URLs:**
- Login: `http://localhost:3000/login`
- Admin Panel: `http://localhost:3000/admin`
- Business Profiles: `http://localhost:3000/businesses`
- Register: `http://localhost:3000/register`
