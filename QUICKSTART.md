# 🚀 Quick Start Guide - MindBloom

Get up and running in 5 minutes!

## ⚡ Prerequisites Check

```bash
# Verify installations
node --version    # Should be v18 or higher
npm --version     # Should be v9 or higher
mongod --version  # MongoDB should be installed
```

If any are missing:
- Node.js: https://nodejs.org/
- MongoDB: https://www.mongodb.com/try/download/community

## 📦 Step 1: Install Dependencies

```bash
cd /Users/diyaka/source/personal/mindbloom

# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

## 🗄️ Step 2: Setup Database

### Start MongoDB
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Or start manually
mongod --dbpath /path/to/your/data/directory

# Verify MongoDB is running
mongosh --eval "db.version()"
```

### Configure Environment
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` (default works for local MongoDB):
```env
DATABASE_URL="mongodb://localhost:27017/mindbloom"
```

### Push Schema to MongoDB
```bash
npm run prisma:generate
npm run prisma:push
```

## 🎯 Step 3: Start Development

### Option A: Start Everything (Recommended)
```bash
# From root directory
npm run dev
```

This starts:
- Frontend: http://localhost:4200
- Backend: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs

### Option B: Start Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## 🔐 Step 4: Login

Open http://localhost:4200

**Default Credentials:**
```
Email: admin@mindbloom.com
Password: admin123
```

## ✅ Verify Installation

After starting, you should see:

1. **Frontend** loads at http://localhost:4200
2. **Backend** runs at http://localhost:3000
3. **Swagger docs** accessible at http://localhost:3000/api/docs
4. **Login page** displays correctly
5. **Dashboard** loads after login

## 🎨 Explore the Application

After login, navigate through:

- 📊 **Dashboard** - View KPIs and stats
- 👨‍🎓 **Students** - Student management with list/detail views
- 📚 **Academics** - Academic information
- ✓ **Attendance** - Attendance tracking
- 💰 **Fees** - Fee management
- And all other modules...

## 🛠️ Development Tips

### Hot Reload
Both frontend and backend support hot reload. Make changes and see them instantly!

### Database GUI
```bash
cd backend
npm run prisma:studio
```
Opens Prisma Studio at http://localhost:5555

### View API Docs
Navigate to http://localhost:3000/api/docs to see Swagger API documentation

### Check Errors
- **Frontend errors**: Browser console (F12)
- **Backend errors**: Terminal running `npm run start:dev`

## 🐛 Troubleshooting

### Port Already in Use

**Backend (3000):**
```bash
# backend/.env
PORT=3001
```

**Frontend (4200):**
```bash
# frontend/package.json
"start": "ng serve --port 4201"
```

### Database Connection Failed
```bash
# Test connection
mongosh

# In mongosh:
show dbs
use mindbloom
show collections
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules frontend/node_modules backend/node_modules shared/node_modules
npm run install:all
```

### Prisma Errors
```bash
cd backend
npx prisma generate
npx prisma db push
```

## 📚 What's Next?

1. **Customize Theme** - Edit `frontend/src/styles/theme/_colors.scss`
2. **Add Real Data** - Update backend services with actual database logic
3. **Implement Features** - Build out the CRUD operations
4. **Add Validations** - Enhance form validations
5. **Deploy** - Follow deployment guide (coming soon)

## 📖 Additional Resources

- **Full Setup**: See `SETUP.md`
- **Project Summary**: See `PROJECT_SUMMARY.md`
- **Main README**: See `README.md`

## 🎯 Common Commands

```bash
# Development
npm run dev              # Start everything
npm run dev:web          # Frontend only
npm run dev:api          # Backend only

# Building
npm run build            # Build all
npm run build:web        # Build frontend
npm run build:api        # Build backend

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to MongoDB
npm run prisma:studio    # Database GUI

# Testing
npm test                 # Run all tests
npm run lint             # Lint code
```

## ✅ Success Checklist

- [ ] Node.js and MongoDB installed
- [ ] Dependencies installed (`npm run install:all`)
- [ ] MongoDB running and schema pushed
- [ ] Environment variables configured
- [ ] Application starts without errors
- [ ] Can login successfully
- [ ] Dashboard displays correctly
- [ ] Navigation works between modules

## 🎉 You're Ready!

Your full-stack school management system is now running!

**Happy Coding! 🚀**

---

Need help? Check:
- Console logs for errors
- `SETUP.md` for detailed instructions
- API documentation at `/api/docs`
