# Testing Tenant Validation

## Overview
The login page now validates tenant codes against the backend database and displays the tenant's actual name after successful validation.

## How It Works

1. **User clicks "Change" button** on the login page
2. **Enters school code** (e.g., "greenfield") 
3. **System validates** the code against the backend API
4. **If valid**: Displays the tenant's full name (e.g., "Greenfield High School")
5. **If invalid**: Shows error message with shake animation

## Testing Steps

### 1. Start the Backend
```bash
cd backend
npm run start:dev
```

### 2. Start the Frontend
```bash
cd frontend
npm start
```

### 3. Create a Test Tenant

Run the provided script to create a test tenant:
```bash
node scripts/create-test-tenant.js
```

This creates a tenant with:
- **Name**: Greenfield High School
- **Code**: greenfield
- **Plan**: premium

### 4. Test the Login Flow

1. Open http://localhost:4200
2. You should see the login overlay
3. Click the **"Change"** button next to the School Code field
4. Enter: `greenfield`
5. Press Enter or click the checkmark button
6. The field should now display: **"Greenfield High School"** ✅

### 5. Test Error Handling

1. Click "Change" again
2. Enter an invalid code like: `invalid-school`
3. Press Enter
4. You should see an error message with a shake animation ❌

## API Endpoints

### Get Tenant by Code
```
GET /api/tenants/code/:code
```

Example:
```bash
curl http://localhost:3000/api/tenants/code/greenfield
```

Response:
```json
{
  "id": "...",
  "name": "Greenfield High School",
  "subdomain": "greenfield",
  "status": "active",
  "plan": "premium"
}
```

### Create Tenant (for testing)
```
POST /api/tenants
Content-Type: application/json

{
  "name": "Your School Name",
  "subdomain": "schoolcode",
  "plan": "free" | "basic" | "premium" | "enterprise"
}
```

## Features Implemented

✅ **Backend Validation** - Tenant codes are validated against MongoDB  
✅ **Display Tenant Name** - Shows full school name after validation  
✅ **Loading States** - Spinner animation during validation  
✅ **Error Handling** - Clear error messages with shake animation  
✅ **Keyboard Shortcuts** - Enter to save, Esc to cancel  
✅ **Beautiful UX** - Smooth transitions and visual feedback  
✅ **Public Endpoint** - No authentication required for tenant lookup  

## Troubleshooting

**"School code not found" error:**
- Make sure you created the test tenant first
- Verify the backend is running
- Check the code is entered correctly (case-sensitive)

**Backend not responding:**
- Ensure MongoDB is running
- Check backend is on port 3000
- Verify TenantModule is registered in AppModule

**Frontend errors:**
- Clear browser cache
- Check browser console for errors
- Verify frontend is connected to backend proxy
