# 🚀 MindBloom - Complete Setup Guide

This guide will help you get the full-stack MindBloom School Management System up and running.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - comes with Node.js
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Angular CLI** - `npm install -g @angular/cli`
- **NestJS CLI** - `npm install -g @nestjs/cli`

## 🛠️ Installation Steps

### 1. Install Root Dependencies

```bash
cd /Users/diyaka/source/personal/mindbloom
npm install
```

### 2. Setup Frontend (Angular)

```bash
cd frontend
npm install
```

### 3. Setup Backend (NestJS)

```bash
cd ../backend
npm install
```

### 4. Setup Shared Models

```bash
cd ../shared
npm install
```

### 5. Configure Database

1. Ensure MongoDB is running on your system:

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Or start manually
mongod --dbpath /path/to/your/data/directory
```

2. Copy `.env.example` to `.env` in the backend folder:

```bash
cd ../backend
cp .env.example .env
```

3. Update the `DATABASE_URL` in `.env` (default works for local MongoDB):

```env
DATABASE_URL="mongodb://localhost:27017/mindbloom"
```

4. Push the Prisma schema to MongoDB:

```bash
npm run prisma:generate
npm run prisma:push
```

## 🎯 Running the Application

### Option 1: Run Everything Together (Recommended)

From the root directory:

```bash
npm run dev
```

This will start both frontend (port 4200) and backend (port 3000) concurrently.

### Option 2: Run Separately

**Backend:**
```bash
cd backend
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm start
```

## 🌐 Access the Application

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3000/api
- **API Documentation (Swagger):** http://localhost:3000/api/docs

## 🔑 Default Login Credentials

```
Email: admin@mindbloom.com
Password: admin123
```

## 📁 Project Structure

```
mindbloom/
├── frontend/                 # Angular 17 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Services, guards, interceptors
│   │   │   ├── shared/      # Shared components
│   │   │   ├── modules/     # Feature modules
│   │   │   └── layouts/     # Layout components
│   │   ├── styles/          # Global styles and theme
│   │   └── assets/          # Static assets
│   └── package.json
│
├── backend/                  # NestJS application
│   ├── src/
│   │   ├── modules/         # Domain modules
│   │   ├── common/          # Shared code
│   │   └── config/          # Configuration
│   ├── prisma/              # Database schema
│   └── package.json
│
├── shared/                   # Shared TypeScript models
│   └── models/
│
└── package.json             # Root workspace config
```

## 🎨 Available Modules

### Frontend Modules
- ✅ Dashboard - Overview and KPIs
- ✅ Students - Student management
- ✅ Academics - Classes and curriculum
- ✅ Attendance - Attendance tracking
- ✅ Fees - Fee management
- ✅ Finance - Financial management
- ✅ HR - Staff management
- ✅ Payroll - Salary processing
- ✅ Library - Library management
- ✅ Hostel - Hostel management
- ✅ Transport - Transportation
- ✅ Setup - System configuration

### Backend API Endpoints
- `/api/auth/login` - Authentication
- `/api/students` - Student CRUD
- `/api/academics` - Academic data
- `/api/attendance` - Attendance records
- `/api/fees` - Fee management
- (Additional endpoints available)

## 🧪 Testing

**Frontend:**
```bash
cd frontend
npm test
```

**Backend:**
```bash
cd backend
npm test
```

## 🏗️ Building for Production

**Build All:**
```bash
npm run build
```

**Build Individual:**
```bash
# Frontend
cd frontend
npm run build:prod

# Backend
cd backend
npm run build
```

## 🎨 Theme Customization

The theme system is located in `frontend/src/styles/theme/`. You can customize:

- **Colors:** `_colors.scss`
- **Typography:** `_typography.scss`
- **Spacing:** `_spacing.scss`
- **Shadows:** `_shadows.scss`
- **Components:** `components/*.scss`

## 📚 Additional Commands

**Database:**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (DB GUI)
npm run prisma:studio
```

**Linting:**
```bash
npm run lint
```

## 🐛 Troubleshooting

### Port Already in Use

If ports 3000 or 4200 are already in use:

**Backend:** Change port in `backend/.env`:
```env
PORT=3001
```

**Frontend:** Change port in `frontend/package.json`:
```json
"start": "ng serve --port 4201"
```

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Verify credentials in `backend/.env`
3. Check database exists: `psql -l`

### Module Not Found Errors

Run:
```bash
npm run install:all
```

## 📞 Support

For issues or questions, refer to:
- Angular Docs: https://angular.io/docs
- NestJS Docs: https://docs.nestjs.com
- Prisma Docs: https://www.prisma.io/docs

## 🎯 Next Steps

1. Customize the theme to match your branding
2. Add actual database logic to backend services
3. Implement remaining CRUD operations
4. Add form validation
5. Implement real authentication
6. Add role-based access control
7. Create reports and dashboards
8. Add email notifications
9. Implement file uploads
10. Add data export features

---

**Happy Coding! 🎉**
