# MindBloom - School Management System

A modern full-stack school management system built with Angular and NestJS.

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend**: Angular 17+ with standalone components
- **Backend**: NestJS REST API with modular architecture
- **Shared**: Common TypeScript models and DTOs

## 📁 Project Structure

```
mindbloom/
├── frontend/          # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Core services, guards, interceptors
│   │   │   ├── shared/        # Shared components, directives, pipes
│   │   │   ├── modules/       # Feature modules
│   │   │   └── layouts/       # Layout components
│   │   ├── styles/            # Global styles and theme
│   │   └── assets/            # Static assets and illustrations
│   └── package.json
├── backend/           # NestJS application
│   ├── src/
│   │   ├── modules/           # Domain modules
│   │   ├── common/            # Shared backend code
│   │   └── config/            # Configuration
│   └── package.json
├── shared/            # Shared TypeScript definitions
│   ├── models/
│   └── dtos/
└── package.json       # Root workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Angular CLI 17+
- NestJS CLI

### Installation

```bash
# Install dependencies for all packages
npm run install:all

# Or install individually
npm install
cd frontend && npm install
cd ../backend && npm install
cd ../shared && npm install
```

### Development

```bash
# Run both frontend and backend
npm run dev

# Run only frontend (http://localhost:4200)
npm run dev:web

# Run only backend (http://localhost:3000)
npm run dev:api
```

### Build

```bash
# Build all projects
npm run build

# Build individually
npm run build:web
npm run build:api
npm run build:shared
```

## 🎨 Modules

### Frontend Modules
- **Dashboard**: Overview and KPIs
- **Students**: Student management and profiles
- **Academics**: Classes, subjects, curriculum
- **Attendance**: Student attendance tracking
- **Fees**: Fee management and collection
- **Finance**: Financial management and accounting
- **HR**: Staff and employee management
- **Payroll**: Salary and payroll processing
- **Library**: Library management system
- **Hostel**: Hostel and accommodation
- **Transport**: Transportation management
- **Setup**: System configuration and settings

### Backend Modules
- Authentication & Authorization (JWT + RBAC)
- Students Management
- Academics Management
- Attendance Tracking
- Fee Management
- Finance & Accounting
- HR & Staff Management
- Payroll Processing
- Library Management
- Hostel Management
- Transport Management
- System Configuration

## 🎨 Design System

The application uses a custom design system that replicates the original WPF theme:

- **Colors**: AccentBlue, AccentDark, Slate palette
- **Typography**: Modern sans-serif with consistent hierarchy
- **Components**: Premium SaaS-style UI components
- **Spacing**: 4px-based spacing scale
- **Shadows**: Layered shadow system for depth

## 🔧 Tech Stack

### Frontend
- Angular 17+ (Standalone Components)
- SCSS for styling
- Angular Router
- Angular CDK
- RxJS
- TypeScript

### Backend
- NestJS
- Prisma ORM
- MongoDB
- JWT Authentication
- Class Validator
- Swagger/OpenAPI

## 📝 License

Proprietary - All rights reserved
