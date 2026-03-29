# GM-CAD Authentication System

This project includes a complete authentication system with admin and user roles.

## Features

### Admin Authentication
- Admin credentials are stored in environment variables
- Admin can login at `/admin/login`
- Admin dashboard at `/admin/home` with user management
- Admin can add new users and view all users

### User Authentication
- User accounts are stored in MongoDB with bcrypt password hashing
- User login at `/login`
- User profile at `/profile` with password change functionality
- Protected routes with middleware

## Setup Instructions

### 1. Environment Variables
Update your `.env.local` file with:
```env
MONGODB_URI=mongodb://localhost:27017/caddb
NEXT_PUBLIC_ADMIN_EMAIL=admin@gmcad.com
NEXT_PUBLIC_ADMIN_PASS=admin123
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-gm-cad-2025
```

### 2. MongoDB Setup
Make sure MongoDB is running locally or update the `MONGODB_URI` to point to your MongoDB instance.

### 3. Dependencies
All required dependencies are already installed:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token management
- `jose` - JWT utilities
- `@types/bcryptjs` & `@types/jsonwebtoken` - TypeScript types

## Routes

### Public Routes
- `/` - Home page with authentication links
- `/login` - User login page
- `/admin/login` - Admin login page

### Protected Routes
- `/profile` - User profile page (requires user authentication)
- `/admin/home` - Admin dashboard (requires admin authentication)

### API Routes
- `POST /api/auth/login` - Login for both admin and users
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register` - Register new users (used by admin)
- `GET /api/auth/me` - Get current user info
- `GET /api/users` - Get all users (admin only)
- `POST /api/users/change-password` - Change user password

## Usage

### Admin Access
1. Go to `/admin/login`
2. Use the admin credentials from environment variables:
   - Email: `admin@gmcad.com`
   - Password: `admin123`
3. Access the admin dashboard to manage users

### User Access
1. Admin must first create a user account from the admin dashboard
2. Users can then login at `/login` with their email and password
3. Users can access their profile and change passwords

## Security Features

- JWT tokens stored in HTTP-only cookies
- Password hashing with bcrypt (12 rounds)
- Route protection with Next.js middleware
- Role-based access control
- Secure token verification

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── me/route.ts
│   │   └── users/
│   │       ├── route.ts
│   │       └── change-password/route.ts
│   ├── login/page.tsx
│   ├── profile/page.tsx
│   └── admin/
│       ├── login/page.tsx
│       └── home/page.tsx
├── lib/
│   ├── auth.ts
│   └── mongodb.ts
├── models/
│   └── User.ts
└── middleware.ts
```

## Testing

1. Start the development server: `npm run dev`
2. Open `http://localhost:3000`
3. Test admin login with the provided credentials
4. Create a test user from the admin dashboard
5. Test user login and profile functionality

## Notes

- Make sure to change the admin credentials and JWT secret in production
- The middleware automatically redirects unauthenticated users to login pages
- All passwords are hashed using bcrypt before storing in the database
- JWT tokens expire after 7 days
