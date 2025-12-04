# Quick Start Guide

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (version 6 or higher)

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Open Browser**
   - The app will automatically open at `http://localhost:3000`
   - If it doesn't, manually navigate to the URL

## Using the Application

### For SME Owners

1. **Register Your Business**
   - Click "Register SME" on the landing page
   - Complete the 4-step registration form:
     - Step 1: Business Information
     - Step 2: Owner Information
     - Step 3: Upload Documents (proving 3+ years operation)
     - Step 4: Review & Submit
   - Wait for admin approval

2. **Login**
   - Use any email and password (demo mode)
   - Access your dashboard
   - View registration status
   - Complete your profile

3. **Explore Investments**
   - Browse JESMIKE investment opportunities
   - Filter by sector, country, or stage
   - Express interest in opportunities

### For Administrators

1. **Login as Admin**
   - Use an email containing "admin" (e.g., admin@example.com)
   - Access the admin panel

2. **Manage Registrations**
   - View pending registrations
   - Approve or reject applications
   - View registration details

3. **View Statistics**
   - Access comprehensive analytics
   - View regional distribution
   - Analyze industry sectors
   - Export reports

### Key Features

- **Registration**: Multi-step form with document upload
- **Statistics**: Interactive charts and data visualizations
- **Investments**: JESMIKE investment opportunities
- **Admin Panel**: Registration management
- **Profile**: User profile management

## Demo Credentials

- **Regular User**: Any email and password
- **Admin User**: Email containing "admin" + any password

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
# Or change port in package.json
```

### Dependencies Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Issues
```bash
# Clear build cache
npm run build
```

## Next Steps

1. Connect to backend API
2. Implement real authentication
3. Add database integration
4. Deploy to production

## Support

For issues or questions, please contact the development team.

