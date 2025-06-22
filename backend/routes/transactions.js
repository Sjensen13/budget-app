// =============================================================================
// TRANSACTIONS ROUTER
// =============================================================================
// This router handles all transaction-related API endpoints for the budget app.
// It provides CRUD operations (Create, Read, Update, Delete) for user transactions
// and includes authentication middleware to ensure only authenticated users can access data.

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for database operations
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================
// This middleware verifies JWT tokens for all transaction routes
// It ensures that only authenticated users can access transaction data
// and provides user information to subsequent route handlers

const verifyToken = async (req, res, next) => {
  try {
    // Check if Authorization header exists and has correct format
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token with Supabase and get user information
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    // If token is invalid or user doesn't exist, return 401 error
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Add user and token to request object for use in route handlers
    req.user = user;
    req.token = token; // Pass the token to the next handler for RLS policies
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Token verification failed' });
  }
};

// Apply token verification middleware to all routes in this router
router.use(verifyToken);

// =============================================================================
// TRANSACTION CRUD OPERATIONS
// =============================================================================

// GET /api/transactions - Retrieve all transactions for the authenticated user
router.get('/', async (req, res) => {
  try {
    // Query the transactions table for all transactions belonging to the authenticated user
    // Results are ordered by date (newest first) for better user experience
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)  // Only return transactions for this user
      .order('date', { ascending: false }); // Newest transactions first

    if (error) throw error;
    res.json(data || []); // Return empty array if no transactions found
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions - Create a new transaction for the authenticated user
router.post('/', async (req, res) => {
  try {
    // Extract transaction data from request body
    const { type, category, amount, date } = req.body;
    
    // Debug logging for troubleshooting
    console.log("Supabase URL:", process.env.SUPABASE_URL);
    console.log("Supabase Anon Key:", process.env.SUPABASE_KEY);

    // Create a new Supabase client for THIS REQUEST, authenticated as the user.
    // This ensures that Row Level Security (RLS) policies with auth.uid() work correctly.
    // RLS policies can check the authenticated user's ID against the user_id field.
    const supabaseUserClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY, // Use the public ANON key for this client
      {
        global: {
          headers: { Authorization: `Bearer ${req.token}` } // Pass user's JWT token
        }
      }
    );

    // Prepare transaction data for insertion
    const transactionData = {
      // We still pass user_id so the database doesn't have to look it up,
      // but the RLS policy will now check it against a valid session.
      user_id: req.user.id,
      type,                    // 'income' or 'expense'
      category,                // Category name (e.g., 'Food & Dining')
      amount: parseFloat(amount), // Convert to number and validate
      date                     // Transaction date
    };

    // Use the USER-SPECIFIC client to perform the insert
    // This ensures RLS policies are enforced correctly
    const { data, error } = await supabaseUserClient
      .from('transactions')
      .insert([transactionData])
      .select(); // Return the inserted data

    if (error) throw error;
    res.status(201).json(data[0]); // Return 201 (Created) with the new transaction
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/transactions/:id - Update an existing transaction
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get transaction ID from URL parameters
    const { type, category, amount, date } = req.body; // Get updated data from request body
    
    // Prepare update data
    const updateData = {
      type,
      category,
      amount: parseFloat(amount), // Convert to number
      date
    };

    // Update the transaction in the database
    // Only update if the transaction belongs to the authenticated user
    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)           // Match transaction ID
      .eq('user_id', req.user.id) // Ensure user owns this transaction
      .select(); // Return the updated data

    if (error) throw error;
    res.json(data[0]); // Return the updated transaction
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/transactions/:id - Delete a transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get transaction ID from URL parameters
    
    // Delete the transaction from the database
    // Only delete if the transaction belongs to the authenticated user
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)           // Match transaction ID
      .eq('user_id', req.user.id); // Ensure user owns this transaction

    if (error) throw error;
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// STATISTICS ENDPOINT
// =============================================================================

// GET /api/transactions/stats - Get transaction statistics for the user
router.get('/stats', async (req, res) => {
  try {
    // Fetch all transactions for the user to calculate statistics
    const { data, error } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', req.user.id);

    if (error) throw error;

    // Calculate statistics from the transaction data
    const stats = {
      // Sum all income transactions
      totalIncome: data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      // Sum all expense transactions
      totalExpenses: data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      // Count total number of transactions
      transactionCount: data.length
    };

    // Calculate net balance (income - expenses)
    stats.netBalance = stats.totalIncome - stats.totalExpenses;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the router for use in the main server
module.exports = router;
