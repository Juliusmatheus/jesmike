# SME Registration & JESMIKE Investment Platform for Namibia

A comprehensive web platform for registering unregistered Small and Medium Enterprises (SMEs) operating in Namibia for 3+ years and connecting them with JESMIKE investors.

## Features

### 🏢 SME Registration
- Multi-step registration form for unregistered businesses
- Document upload functionality (bank statements, receipts, invoices)
- Business information capture (name, sector, region, employees, turnover)
- Owner information capture (age 35-59, experience, contact details)
- Validation for 3+ years operation requirement
- Registration status tracking

### 📊 Statistics & Analytics
- Interactive dashboard with data visualizations
- Regional statistics (14 Namibian regions)
- Industry sector analysis
- Growth trends and projections
- Gender distribution of business owners
- Business size distribution
- Export functionality (PDF, Excel, CSV)

### 💼 Investment Opportunities
- Browse JESMIKE investment opportunities
- Filter by sector, country, and business stage
- Connect with investors from Brazil, Russia, India, China, and South Africa
- Investment requirement matching
- Express interest functionality

### 👥 User Management
- Secure authentication system
- Role-based access control (SME Owner, Admin)
- User profile management
- Registration status tracking

### 🔧 Admin Panel
- Registration approval/rejection
- User management
- System configuration
- Statistics overview
- Audit logs

## Technology Stack

- **Frontend**: React.js 18.2.0
- **Routing**: React Router DOM 6.20.0
- **Charts**: Recharts 2.10.3
- **Forms**: React Hook Form 7.48.2
- **File Upload**: React Dropzone 14.2.3
- **Notifications**: React Toastify 9.1.3
- **HTTP Client**: Axios 1.6.2

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd myke1
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```
src/
├── components/
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # User dashboard
│   ├── Investment/     # Investment opportunities
│   ├── LandingPage/    # Landing page
│   ├── Layout/         # Layout components (Navbar)
│   ├── Profile/        # User profile
│   ├── Registration/   # SME registration form
│   ├── Statistics/     # Statistics dashboard
│   └── Admin/          # Admin panel
├── context/            # React context (AuthContext)
├── App.js             # Main app component
├── App.css            # App styles
├── index.js           # Entry point
└── index.css          # Global styles
```

## Key Features Implementation

### Registration Flow
1. **Step 1: Business Information**
   - Business name, trading name
   - Industry sector and sub-sector
   - Operation start date (must be 3+ years ago)
   - Physical address and region
   - Number of employees and annual turnover
   - Business type

2. **Step 2: Owner Information**
   - Full name, ID/passport number
   - Contact details (email, phone)
   - Physical address
   - Nationality, gender, age (35-59)
   - Years of experience

3. **Step 3: Documents**
   - Upload bank statements (3+ years)
   - Upload receipts and invoices
   - Upload purchase records
   - Upload tax receipts
   - Drag and drop file upload

4. **Step 4: Review & Submit**
   - Review all information
   - Accept terms and conditions
   - Submit registration

### Statistics Dashboard
- Real-time statistics visualization
- Regional distribution charts
- Industry sector analysis
- Growth trends over time
- Gender distribution
- Business size distribution
- Export functionality

### Investment Opportunities
- Filter by sector, country, stage
- Search functionality
- Detailed investment requirements
- Contact information
- Express interest feature

## Requirements Met

✅ Unregistered businesses operating 3+ years only
✅ Document upload and verification
✅ 14 Namibian regions support
✅ Industry sector classification
✅ Owner age validation (35-59)
✅ Statistics and analytics dashboard
✅ JESMIKE investment opportunities
✅ Admin panel for management
✅ Responsive design
✅ User authentication
✅ Profile management

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner

## Future Enhancements

- Backend API integration
- Real-time notifications
- Email verification
- Document verification system
- Payment gateway integration
- Mobile applications (iOS/Android)
- Multi-language support (Afrikaans, local languages)
- Advanced analytics and AI features
- Integration with BIPA systems
- Integration with government ministries

## License

This project is proprietary and confidential.

## Contact

For questions or support, please contact the development team.

