# Admin vs Client Privileges - Business Profiles

## Overview

The Business Profiles page is now accessible to both regular users (clients) and administrators, but with different privileges.

## Access Levels

### 1. Public/Client Access
**Who:** All users (logged in or not)

**Can:**
- ✅ View all registered businesses
- ✅ Filter businesses by region, sector, and search
- ✅ View business details (click "View Profile")
- ✅ Contact businesses

**Cannot:**
- ❌ Delete businesses
- ❌ Edit business information (unless it's their own via Profile page)

### 2. Admin Access
**Who:** Users with admin role (isAdmin = true)

**Can:**
- ✅ Everything clients can do, PLUS:
- ✅ **Delete any business** using the red Delete button
- ✅ Access Admin Panel
- ✅ Manage all businesses

**Cannot:**
- Nothing restricted for admins on this page

## Implementation Details

### Frontend Changes

**File:** `src/components/BusinessProfiles/BusinessProfiles.js`

Added:
```javascript
import { useAuth } from '../../context/AuthContext';

const BusinessProfiles = () => {
  const { isAdmin } = useAuth();
  // ... rest of code
  
  // Delete button only shows for admins
  {isAdmin && (
    <button className="btn btn-danger btn-sm" onClick={handleDelete}>
      Delete
    </button>
  )}
}
```

### Navigation

**File:** `src/components/Layout/Navbar.js`

The "Businesses" link appears in the main navigation for everyone:
- Home
- Statistics
- Investments
- **Businesses** ← Visible to all
- About
- Contact

## User Experience

### Regular User View
When a regular user visits `/businesses`:
1. Sees all business cards
2. Can view details and contact
3. **No delete button visible**

### Admin View
When an admin visits `/businesses`:
1. Sees all business cards
2. Can view details and contact
3. **Red delete button visible on each card**
4. Can delete any business with confirmation

## Security Notes

⚠️ **Current Implementation:**
- Frontend hides delete button from non-admins
- Backend DELETE endpoint has NO authentication check

🔒 **Recommended Security Improvements:**

1. **Add backend authentication middleware:**
```javascript
// backend/server.js
app.delete('/api/business/:id', requireAuth, requireAdmin, async (req, res) => {
  // Delete logic
});
```

2. **Add role checking:**
```javascript
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

3. **Add audit logging:**
- Log who deleted what and when
- Store in database for accountability

## Testing

### Test as Regular User:
1. Visit `/businesses`
2. Verify you can see businesses
3. Verify NO delete button appears
4. Verify you can view details

### Test as Admin:
1. Login as admin
2. Visit `/businesses`
3. Verify delete button appears on each card
4. Try deleting a business
5. Confirm deletion works

## Admin Identification

Currently, admin status is determined by the `isAdmin` property in the AuthContext. To make a user an admin:

1. **In the database:** Add an `is_admin` column to users table
2. **In AuthContext:** Set `isAdmin: true` for admin users
3. **In Login:** Check admin status from database

## Future Enhancements

1. **Role-based permissions:**
   - Super Admin (full access)
   - Moderator (can approve/reject, but not delete)
   - Regular User (view only)

2. **Soft delete:**
   - Mark as deleted instead of permanent removal
   - Allow restore functionality

3. **Bulk operations:**
   - Select multiple businesses
   - Bulk approve/reject/delete

4. **Activity log:**
   - Track all admin actions
   - Display in admin panel

## Current Status

✅ Frontend privilege separation implemented
✅ Delete button hidden from non-admins
✅ Businesses page accessible to all
⚠️ Backend security needs implementation
⚠️ Admin role assignment needs database support
