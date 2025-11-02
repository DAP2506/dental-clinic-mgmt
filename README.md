# DentalCare - Clinic Management System

A modern, comprehensive dental clinic management system built with Next.js 15, TypeScript, and Supabase. This application provides a complete solution for managing dental clinics with patient records, appointments, treatments, and billing - all localized for India with ₹ (Indian Rupee) currency.

## 🦷 Features

### **Core Functionality**
- **Patient Management**: Complete patient records with medical history, allergies, and demographics
- **Appointment Scheduling**: Dynamic appointment booking with doctor and treatment tracking
- **Treatment Plans**: Comprehensive treatment records with progress tracking
- **Billing & Invoicing**: Invoice generation with payment tracking in Indian Rupees (₹)
- **Dashboard Analytics**: Real-time stats for patients, appointments, and revenue

### **Technical Features**
- **Dynamic Data**: Real-time data from Supabase database
- **Search & Pagination**: Advanced search with server-side pagination
- **Responsive Design**: Mobile-first design with dark mode support
- **India Localization**: Currency formatting in ₹, Indian date formats, and localized content
- **Type Safety**: Full TypeScript implementation with strict type checking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git

### 1. Clone and Install
```bash
git clone <repository-url>
cd dental-clinic-project
npm install
```

### 2. Database Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. In your Supabase SQL Editor, run the complete script from `setup-database.sql`
3. This will create all tables, sample data, and configure Row Level Security

### 3. Environment Configuration
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📊 Database Schema

### Core Tables
- **`patients`** - Patient demographics and medical information
- **`doctors`** - Doctor profiles and specializations  
- **`treatments`** - Treatment types with pricing in ₹
- **`cases`** - Patient cases linking treatments and progress
- **`appointments`** - Scheduled appointments with time slots
- **`invoices`** - Billing records with payment status

### Sample Data Included
- 4 sample doctors with Indian names and specializations
- 8 sample patients with realistic Indian demographics
- 10 treatment types with Indian Rupee pricing
- Random appointments, cases, and invoices for testing

## 🛠 Technology Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for analytics

### Backend
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security
- **Real-time subscriptions** for live updates

### Development
- **ESLint** and **TypeScript** for code quality
- **Responsive design** with mobile-first approach
- **Dark mode** support throughout

## 📱 Pages & Features

### Dashboard (`/`)
- Real-time statistics (patients, appointments, revenue)
- Recent appointments and cases
- Monthly revenue tracking in ₹
- Quick action buttons

### Patients (`/patients`)
- Searchable patient list with pagination
- Patient profile management
- Medical history and allergy tracking
- Case history per patient

### Appointments (`/appointments`) 
- Calendar view of appointments
- Appointment scheduling and management
- Doctor and treatment assignment
- Status tracking (Scheduled → Confirmed → Completed)

### Treatments (`/treatments`)
- Treatment catalog with ₹ pricing
- Duration and category management
- Usage analytics and reporting

### Billing (`/billing`)
- Invoice generation and management
- Payment tracking with Indian payment methods
- Outstanding balance monitoring
- Revenue reporting in ₹

## 🌐 India Localization

### Currency & Formatting
- All monetary values display in **Indian Rupees (₹)**
- Number formatting follows Indian standards (lakhs/crores)
- Date formatting in DD/MM/YYYY format
- Phone numbers in Indian format (+91-XXXXX-XXXXX)

### Content
- Sample data uses Indian names and locations
- Medical terminology appropriate for Indian healthcare
- Time zones and business hours for Indian clinics

## 🔧 Development

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   ├── layout/         # Layout components
│   └── ui/             # UI components
├── lib/                # Utility functions
│   ├── supabase.ts     # Database client and types
│   └── utils.ts        # Helper functions
└── hooks/              # Custom React hooks
```

### Key Components
- **DashboardLayout**: Main application layout with sidebar
- **Patient Components**: Patient list, forms, and profiles  
- **Supabase Integration**: Type-safe database operations
- **Utility Functions**: Currency formatting, date handling, etc.

### Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📋 TODO / Roadmap

### Phase 1 (Current)
- ✅ Core patient management
- ✅ Basic appointment scheduling
- ✅ Treatment catalog
- ✅ Dashboard with analytics

### Phase 2 (Next)
- [ ] Advanced appointment calendar
- [ ] Patient case file management
- [ ] Prescription management
- [ ] SMS/Email notifications

### Phase 3 (Future)
- [ ] Multi-clinic support
- [ ] Staff role management
- [ ] Advanced reporting
- [ ] Mobile app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Check the [Supabase documentation](https://supabase.com/docs)
- Review [Next.js documentation](https://nextjs.org/docs)

---

**Built with ❤️ for Indian dental clinics**
