# Complete eSIM Selling Flow - Implementation Guide

## 🎯 Goal Description

Implement a full eSIM selling flow connected between:
- **Admin Panel** (for setting prices)
- **Supabase** (for storing selected packages) 
- **Frontend** (for displaying & buying packages)

## 📋 System Architecture

```
Admin Panel → Supabase (my_packages) → Frontend → Backend → Roamify API → User Orders
```

## 🗄️ Step 1: Database Setup

### Create the `my_packages` table

```sql
CREATE TABLE my_packages (
  id uuid PRIMARY KEY,
  name text,
  country_name text,
  data_amount numeric,
  validity_days integer,
  base_price numeric,
  sale_price numeric,
  profit numeric,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Create index for better performance
CREATE INDEX idx_my_packages_created_at ON my_packages(created_at);
```

### Create the `user_orders` table

```sql
CREATE TABLE user_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  package_id uuid REFERENCES my_packages(id),
  roamify_order_id text,
  qr_code_url text,
  iccid text,
  status text DEFAULT 'pending',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_user_orders_user_id ON user_orders(user_id);
CREATE INDEX idx_user_orders_package_id ON user_orders(package_id);
CREATE INDEX idx_user_orders_status ON user_orders(status);
```

## 🔧 Step 2: Backend Implementation

### 2.1 Environment Variables

```env
# backend/.env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
ROAMIFY_TOKEN=your_roamify_api_token
```

### 2.2 Admin Routes (`/api/admin/save-package`)

When admin clicks "Save" on a package:

```typescript
// backend/src/routes/adminRoutes.ts
router.post('/save-package', async (req, res) => {
  try {
    const {
      id,
      name,
      country_name,
      data_amount,
      validity_days,
      base_price,
      sale_price
    } = req.body;

    // Calculate profit
    const profit = sale_price - base_price;

    const { data, error } = await supabase
      .from('my_packages')
      .upsert([{
        id,
        name,
        country_name,
        data_amount,
        validity_days,
        base_price,
        sale_price,
        profit,
        updated_at: new Date().toISOString()
      }], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save package' });
  }
});
```

### 2.3 Frontend Packages Route (`/api/frontend-packages`)

```typescript
// backend/src/index.ts
app.get('/api/frontend-packages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('my_packages')
      .select('id, name, country_name, data_amount, validity_days, sale_price')
      .order('sale_price', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});
```

### 2.4 Order Processing Route (`/api/esim/order`)

```typescript
// backend/src/index.ts
app.post('/api/esim/order', async (req, res) => {
  try {
    const { packageId, userId } = req.body;

    // 1. Get package details from my_packages
    const { data: packageData, error: packageError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // 2. Create order with Roamify API
    const roamifyResponse = await fetch('https://api.getroamify.com/api/esim/order', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ROAMIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageId: packageData.id,
        quantity: 1,
      })
    });

    if (!roamifyResponse.ok) {
      return res.status(500).json({ error: 'Failed to create Roamify order' });
    }

    const roamifyResult = await roamifyResponse.json() as any;

    // 3. Save order to user_orders table
    const { data: orderData, error: orderError } = await supabase
      .from('user_orders')
      .insert([{
        user_id: userId,
        package_id: packageId,
        roamify_order_id: roamifyResult.orderId || roamifyResult.id,
        qr_code_url: roamifyResult.qrCode || roamifyResult.qr_code,
        iccid: roamifyResult.iccid,
        status: 'active'
      }])
      .select()
      .single();

    if (orderError) {
      return res.status(500).json({ error: 'Failed to save order' });
    }

    // 4. Return order details
    res.json({
      success: true,
      order: orderData,
      qrCode: roamifyResult.qrCode || roamifyResult.qr_code,
      iccid: roamifyResult.iccid
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});
```

## 🖥️ Step 3: Frontend Implementation

### 3.1 Admin Panel Component

```typescript
// frontend/src/pages/AdminPanel.tsx
interface Package {
  id: string;
  name: string;
  country_name: string;
  data_amount: number;
  validity_days: number;
  base_price: number;
  sale_price: number;
  profit: number;
  created_at: string;
  updated_at: string;
}

const handleSave = async (pkg: Package) => {
  try {
    // Calculate profit
    const profit = pkg.sale_price - pkg.base_price;
    
    const body = {
      id: pkg.id,
      name: pkg.name,
      country_name: pkg.country_name,
      data_amount: pkg.data_amount,
      validity_days: pkg.validity_days,
      base_price: pkg.base_price,
      sale_price: pkg.sale_price,
      profit: profit
    };

    const res = await fetch('/api/admin/save-package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      alert('Saved!');
    } else {
      alert('Failed to save package');
    }
  } catch (err) {
    alert("Failed to save package. Please try again.");
  }
};
```

### 3.2 Frontend Package Display

```typescript
// frontend/src/components/MyPackagesSection.tsx
interface MyPackage {
  id: string;
  name: string;
  country_name: string;
  data_amount: number;
  validity_days: number;
  sale_price: number;
}

const handleBuy = async (id: string) => {
  try {
    const res = await fetch('/api/esim/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        packageId: id,
        userId: 'current-user-id' // Replace with actual user ID
      }),
    });

    const result = await res.json();
    
    if (res.ok && result.success) {
      if (result.qrCode) {
        alert(`Order created successfully! QR Code: ${result.qrCode}`);
      } else {
        alert('Order created successfully! Check your email for QR code.');
      }
    } else {
      alert('Failed to create order: ' + (result.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Failed to create order. Please try again.');
  }
};
```

## 🔄 Step 4: Complete User Flow

### 4.1 Admin Flow
1. Admin navigates to admin panel
2. Views existing packages from main `packages` table
3. Edits package details (name, sale price, etc.)
4. Clicks "Save" → calls `POST /api/admin/save-package`
5. Package is inserted/updated in `my_packages` table with calculated profit

### 4.2 Frontend Flow
1. User visits website
2. Frontend calls `GET /api/frontend-packages`
3. Displays packages from `my_packages` table
4. User clicks "Buy Now" on a package
5. Frontend calls `POST /api/esim/order` with `packageId`

### 4.3 Order Processing Flow
1. Backend receives order request
2. Fetches package details from `my_packages` using `packageId`
3. Calls Roamify API with package ID
4. Saves order details to `user_orders` table
5. Returns QR code and order details to frontend
6. User receives eSIM activation details

## 🧪 Step 5: Testing

### 5.1 Test Admin Panel
```bash
# Start backend
cd backend && npm run dev

# Start frontend  
cd frontend && npm run dev

# Navigate to admin panel and test saving packages
```

### 5.2 Test Frontend Buy Flow
```bash
# Add some test packages via admin panel
# Navigate to frontend and test buying packages
# Check browser console for API responses
```

### 5.3 Test API Endpoints
```bash
# Test package saving
curl -X POST http://localhost:5000/api/admin/save-package \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-package-id",
    "name": "Test Package",
    "country_name": "United States",
    "data_amount": 5,
    "validity_days": 30,
    "base_price": 15,
    "sale_price": 19.99
  }'

# Test package fetching
curl http://localhost:5000/api/frontend-packages

# Test order creation
curl -X POST http://localhost:5000/api/esim/order \
  -H "Content-Type: application/json" \
  -d '{"packageId": "package-uuid", "userId": "user-uuid"}'
```

## ✅ Success Criteria

- ✅ Admin can save packages to `my_packages` table with profit calculation
- ✅ Frontend displays only packages from `my_packages`
- ✅ Users can buy packages and receive QR codes
- ✅ Orders are saved to `user_orders` table
- ✅ Complete integration between admin, frontend, and Roamify API

## 🚀 Final User Flow Summary

1. **Admin** picks the packages to sell → sets prices → saves to `my_packages`
2. **Frontend** fetches from `my_packages` → shows to user
3. **User** clicks Buy → triggers order via backend → shows/downloads QR

This implementation provides a complete, scalable eSIM selling platform with full admin control and seamless user experience. 