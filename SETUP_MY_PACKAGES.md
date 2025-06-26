# My Packages Integration Setup Guide

This guide will help you set up the complete integration between your admin panel and the `my_packages` table in Supabase, enabling the full buy flow for your frontend.

## ✅ Step 1: Create the my_packages table in Supabase

### Option A: Using the Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
CREATE TABLE my_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id text,
  country text,
  name text,
  data float,
  days int,
  base_price float,
  sale_price float,
  visible boolean DEFAULT true,
  region text
);
```

### Option B: Using the provided script
```bash
cd backend
node src/scripts/create_my_packages_table.js
```

## ✅ Step 2: Environment Variables

Make sure you have the following environment variables in your `backend/.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
ROAMIFY_TOKEN=your_roamify_api_token
```

## ✅ Step 3: Backend Setup

The backend has been updated with the following new routes:

### Admin Routes (`/api/admin/save-package`)
- **POST** `/api/admin/save-package` - Save or update a package in the `my_packages` table

### Frontend Routes
- **GET** `/api/frontend-packages` - Get all visible packages for the frontend
- **POST** `/api/order` - Create an eSIM order using the Roamify API

## ✅ Step 4: Frontend Setup

### Admin Panel Updates
The `AdminPanel.tsx` component has been updated to:
- Work with the new `my_packages` table structure
- Save packages using the new `/api/admin/save-package` endpoint
- Display reseller IDs for better package management

### New MyPackagesSection Component
A new component `MyPackagesSection.tsx` has been created that:
- Fetches packages from `/api/frontend-packages`
- Displays packages in a beautiful card layout
- Handles the buy flow using `/api/order`

### HomePage Integration
The `HomePage.tsx` has been updated to include the new `MyPackagesSection` component.

## ✅ Step 5: Testing the Integration

### 1. Test the Admin Panel
1. Start your backend server: `cd backend && npm run dev`
2. Start your frontend: `cd frontend && npm run dev`
3. Navigate to the admin panel
4. Edit package prices and click "Save"
5. Check your Supabase dashboard to confirm packages are saved

### 2. Test the Frontend Buy Flow
1. Navigate to the homepage
2. Scroll down to see the new "Available eSIM Packages" section
3. Click "Buy Now" on any package
4. Check the browser console for the order response
5. Verify the order was created in your Roamify dashboard

## 🔄 Flow Summary

1. **Admin Panel**: Admin saves/updates package data via `/api/admin/save-package`
2. **Database**: Data is stored in Supabase in the `my_packages` table
3. **Frontend**: Fetches only packages where `visible = true` via `/api/frontend-packages`
4. **Buy Flow**: When a user clicks "Buy Now", the backend uses the `reseller_id` to place the order with Roamify API
5. **Order**: The order is automatic and correctly linked to the package

## 🐛 Troubleshooting

### Common Issues

1. **"Package not found" error**
   - Make sure the `my_packages` table exists in Supabase
   - Verify that packages have been saved via the admin panel

2. **"Failed to create order" error**
   - Check that `ROAMIFY_TOKEN` is set in your environment variables
   - Verify the Roamify API endpoint is accessible

3. **"Failed to fetch packages" error**
   - Check that your Supabase credentials are correct
   - Verify the `my_packages` table has data

### Debug Steps

1. Check browser console for detailed error messages
2. Check backend logs for API errors
3. Verify Supabase table structure matches the expected schema
4. Test API endpoints directly using tools like Postman or curl

## 📝 API Endpoints Reference

### Admin Endpoints
```
POST /api/admin/save-package
Body: {
  reseller_id: string,
  country: string,
  name: string,
  data: number,
  days: number,
  base_price: number,
  sale_price: number,
  visible: boolean,
  region: string
}
```

### Frontend Endpoints
```
GET /api/frontend-packages
Response: Array of packages with id, name, country, data, days, sale_price

POST /api/order
Body: { packageId: string }
Response: Roamify API response
```

## 🎉 Success!

Once you've completed all steps, you should have:
- ✅ A working admin panel that saves packages to `my_packages`
- ✅ A frontend that displays packages from `my_packages`
- ✅ A complete buy flow that creates orders via Roamify API
- ✅ Full integration between your admin panel and frontend

Your eSIM business is now ready to scale! 🚀 