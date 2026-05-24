# Admin Panel Setup Guide

## Overview
Admin users are now separated from regular users. Admins access the Admin Panel (port 3001) while regular users use the main frontend (port 3000).

## Architecture

### Main Frontend (GU.AI-Frontend)
- **Port**: 3000
- **Users**: CUSTOMER, STAFF
- **Purpose**: Regular user interface
- **Auth**: Redirects admins to Admin Panel

### Admin Panel (GU.AI-admin-panel)
- **Port**: 3001
- **Users**: ADMIN only
- **Purpose**: Admin management interface
- **Auth**: Strict admin role verification

## Implementation Details

### 1. Admin Panel Supabase Client (`src/lib/supabase.ts`)
- Session persistence enabled
- Auto-refresh tokens enabled
- Custom storage key: `guai-admin-auth-token`
- Separate from main frontend storage

### 2. Admin AuthContext (`src/contexts/AuthContext.tsx`)
- Global auth state for admin panel
- Automatically checks user role from database
- Provides `isAdmin` flag
- Wrapped in RootLayout

### 3. Admin Middleware (`middleware.ts`)
- Protects all admin routes (`/dashboard`, `/users`, `/settings`, `/reports`)
- Verifies user is authenticated
- Verifies user has `admin` role
- Redirects non-admins to login with error
- Redirects authenticated admins away from login

### 4. Main Frontend Middleware Update (`middleware.ts`)
- When authenticated user visits auth pages (`/login`, `/register`)
- Checks user role from database
- If `admin` → redirects to Admin Panel (configured via `NEXT_PUBLIC_ADMIN_PANEL_URL`)
- If `customer`/`staff` → redirects to dashboard

### 5. Admin Login Page (`src/app/login/page.tsx`)
- Real Supabase authentication
- Verifies user role after successful login
- If not admin → signs out and shows error
- Supports OAuth (Google, GitHub) with role verification

### 6. Admin Callback Page (`src/app/auth/callback/page.tsx`)
- OAuth callback handler
- Verifies admin role before allowing access
- Signs out non-admin users immediately

## Environment Variables

### Main Frontend (.env)
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_ADMIN_PANEL_URL=http://localhost:3001  # Admin panel URL
```

### Admin Panel (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For admin operations
```

## User Flow

### Admin User
1. Admin visits main frontend `/login`
2. Logs in with credentials
3. Middleware detects admin role
4. Redirects to Admin Panel (http://localhost:3001)
5. Admin panel middleware verifies admin role
6. Admin accesses dashboard

### Regular User
1. User visits main frontend `/login`
2. Logs in with credentials
3. Middleware detects customer/staff role
4. Redirects to main frontend `/dashboard`
5. User accesses regular features

### Direct Admin Panel Access
1. Admin visits Admin Panel `/login` directly
2. Logs in with credentials
3. Login page verifies admin role
4. Redirects to `/dashboard`
5. Middleware verifies admin role on every protected route

## Security Features

- ✅ Strict role verification on every protected route
- ✅ Separate storage keys for admin vs user sessions
- ✅ Non-admins immediately signed out from admin panel
- ✅ OAuth callbacks verify admin role
- ✅ Server-side middleware protection
- ✅ Automatic token refresh

## Adding New Admin Users

To add a new admin user:

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'new-admin@example.com';
```

Or create a new admin:
```sql
INSERT INTO public.users (email, name, role)
VALUES ('admin@example.com', 'Admin Name', 'admin');
```

## Testing

1. **Test Admin Redirect**:
   - Create admin user in database
   - Login at main frontend `/login`
   - Should redirect to admin panel

2. **Test Regular User**:
   - Create customer user in database
   - Login at main frontend `/login`
   - Should redirect to main dashboard

3. **Test Admin Panel Protection**:
   - Try to access admin panel `/dashboard` without auth
   - Should redirect to `/login`

4. **Test Non-Admin Blocked**:
   - Login as customer at admin panel `/login`
   - Should show error: "Bạn không có quyền truy cập Admin Panel"

## Troubleshooting

### Admin not redirecting to admin panel
- Check `NEXT_PUBLIC_ADMIN_PANEL_URL` in main frontend .env
- Verify user role is `admin` in database
- Check middleware logs for role check results

### Admin panel login failing
- Verify Supabase credentials in admin panel .env.local
- Check user exists in `users` table with `role = 'admin'`
- Check browser console for auth errors

### Session not persisting
- Check localStorage for `guai-admin-auth-token`
- Verify `persistSession: true` in Supabase client config
- Check browser localStorage is enabled
