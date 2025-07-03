# Environment Variables Configuration

This document lists all required environment variables for the eSIM management system.

## Required Variables

### Supabase Database
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Roamify API
```
ROAMIFY_API_KEY=your-roamify-api-key-here
```

## Optional Variables

### Application
```
NODE_ENV=production
PORT=3001
```

### Email (SMTP)
```
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

### Authentication
```
JWT_SECRET=your-jwt-secret-here
```

## Platform Setup

### Render.com
1. Go to your service dashboard
2. Navigate to "Environment" tab
3. Add each variable with its value

### Vercel
1. Go to your project settings
2. Navigate to "Environment Variables" tab
3. Add each variable for Production, Preview, and Development

## Security Notes

- **Never commit secrets to version control**
- All sensitive values should be added via platform dashboards
- Use strong, unique values for JWT secrets
- Rotate API keys regularly for security 