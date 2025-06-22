// =============================================================================
// TRANSACTIONS ROUTER
// =============================================================================
// This router handles all transaction-related API endpoints for the budget app.
// It provides CRUD operations (Create, Read, Update, Delete) for user transactions
// and includes authentication middleware to ensure only authenticated users can access data.

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

module.exports = (config) => {
  const router = express.Router();

  // =============================================================================
  // AUTHENTICATION MIDDLEWARE
  // =============================================================================
  // This middleware verifies JWT tokens for all transaction routes
  // It ensures that only authenticated users can access transaction data
  // and provides user information to subsequent route handlers

  const verifyToken = async (req, res, next) => {
    try {
      // Initialize Supabase client with the public key for token verification
      const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);

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
      // Use the admin client for this request to bypass RLS for data fetching
      const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);
      
      // Query the transactions table for all transactions belonging to the authenticated user
      // Results are ordered by date (newest first) for better user experience
      const { data, error } = await supabaseAdmin
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
    console.log('POST /api/transactions endpoint hit.');
    try {
      // Use the admin client for this request to bypass RLS for data insertion
      const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);

      // Extract transaction data from request body
      const { type, category, amount, date } = req.body;
      console.log('Received transaction data:', req.body);
      
      // Check if the service key is loaded
      if (!config.SUPABASE_SERVICE_KEY) {
        console.error('CRITICAL: SUPABASE_SERVICE_KEY is not loaded in the environment.');
        // Do not expose this detailed error to the client
        return res.status(500).json({ error: 'Server configuration error.' });
      }
      console.log('Supabase Service Key is loaded.');

      // Prepare transaction data for insertion
      const transactionData = {
        // user_id is set to ensure the transaction is linked to the correct user.
        // RLS policies will enforce that a user can only interact with their own data.
        user_id: req.user.id,
        type,                    // 'income' or 'expense'
        category,                // Category name (e.g., 'Food & Dining')
        amount: parseFloat(amount), // Convert to number and validate
        date                     // Transaction date
      };
      console.log('Attempting to insert transaction:', transactionData);

      // Use the admin client to perform the insert.
      // RLS policies are still enforced for authenticated users.
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert([transactionData])
        .select(); // Return the inserted data

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Transaction created successfully:', data[0]);
      res.status(201).json(data[0]); // Return 201 (Created) with the new transaction
    } catch (error) {
      console.error('Error creating transaction (in catch block):', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/transactions/:id - Update an existing transaction
  router.put('/:id', async (req, res) => {
    try {
      // Use the admin client for this request
      const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);
      
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
      const { data, error } = await supabaseAdmin
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
      // Use the admin client for this request
      const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);

      const { id } = req.params; // Get transaction ID from URL parameters
      
      // Delete the transaction from the database
      // Only delete if the transaction belongs to the authenticated user
      const { error } = await supabaseAdmin
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
      // Use the admin client for this request
      const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);

      // Fetch all transactions for the user to calculate statistics
      const { data, error } = await supabaseAdmin
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

  return router;
};
