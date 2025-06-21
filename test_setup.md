# Testing the RLS Fix

## Steps to Complete:

### 1. **Apply RLS Policies in Supabase**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `setup_rls_policies.sql`
4. Run the SQL script

### 2. **Verify Table Structure**
Make sure your `transactions` table has a `user_id` column:
```sql
-- Check if user_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'user_id';
```

If it doesn't exist, run:
```sql
ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id);
```

### 3. **Start Your Backend Server**
```bash
cd backend
npm start
```

**Note:** The backend now runs on port 5001 (not 5000) to avoid conflicts with macOS AirPlay.

### 4. **Test the Application**
1. Start your frontend: `cd frontend && npm start`
2. Sign in to your application
3. Try to add a new transaction
4. Check if the transaction appears in the list

### 5. **Debugging Tips**

If you still get errors:

1. **Check Browser Console** for any JavaScript errors
2. **Check Backend Console** for server-side errors
3. **Verify Authentication** - make sure you're logged in
4. **Check Network Tab** - look for failed API requests
5. **Verify Backend is Running** - should be on http://localhost:5001

### 6. **Common Issues and Solutions**

**Issue: "Authorization header required"**
- Solution: Make sure you're logged in and the session token is being sent

**Issue: "Invalid token"**
- Solution: Try logging out and logging back in to get a fresh token

**Issue: "new row violates row-level security policy"**
- Solution: Make sure the RLS policies have been applied correctly in Supabase

**Issue: CORS errors**
- Solution: Make sure the backend is running on port 5001 and CORS is properly configured

**Issue: 403/406 errors**
- Solution: These should be resolved once RLS policies are in place and authentication is working

### 7. **Verify RLS Policies**
You can check if RLS policies are active by running this in Supabase SQL Editor:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'transactions';
```

This should show 4 policies for the transactions table.

### 8. **Test Backend Connection**
You can test if the backend is working by running:
```bash
curl -I http://localhost:5001/api/transactions
```

This should return a 401 Unauthorized response (which is correct since we're not sending auth headers). 