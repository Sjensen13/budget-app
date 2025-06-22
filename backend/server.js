// =============================================================================
// BUDGET APP BACKEND SERVER
// =============================================================================
// This is the main Express.js server that handles all backend operations for the budget app.
// It provides REST API endpoints for user authentication, transaction management,
// and budget tracking. The server uses Supabase for database operations and authentication.

require('dotenv').config();             // Loads environment variables from .env file
const express = require('express');     // Imports Express.js framework to build the API server
const cors = require('cors');           // Allows frontend (React) to call this server (bypasses CORS security errors)
const { createClient } = require('@supabase/supabase-js');  // Supabase client for database access and auth

// Create Express application instance
const app = express();          
app.use(cors());                // Enable CORS so frontend can call backend (bypasses security errors)
app.use(express.json());        // Tell Express to parse JSON bodies in incoming requests

// Initialize Supabase client for server-side operations
// This client is used for admin operations and doesn't persist user sessions
const supabase = createClient(
  process.env.SUPABASE_URL,     // Supabase project URL from environment variables
  process.env.SUPABASE_KEY,     // Supabase service role key for admin operations
  { auth: { persistSession: false } } // Recommended for server-side environments - don't persist sessions
);

// =============================================================================
// ROUTE SETUP
// =============================================================================
// Import and use the transactions router for all transaction-related endpoints
// This router handles CRUD operations for user transactions
const transactionsRouter = require('./routes/transactions');
app.use('/api/transactions', transactionsRouter); // Mount router at /api/transactions

// =============================================================================
// LEGACY ENDPOINTS (for backward compatibility)
// =============================================================================
// These endpoints are kept for backward compatibility but the new router-based
// approach above is preferred. These endpoints handle basic transaction operations.

// GET /transactions - Retrieve all transactions for the authenticated user
app.get('/transactions', async (req, res) => {
  try {
    // Verify JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase and get the user information
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    // If token is invalid or user doesn't exist, return 401 error
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Query the transactions table for all transactions belonging to this user
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id); // Only return transactions for the authenticated user
    
    if (error) return res.status(500).json({ error });
    res.json(data); // Return the transactions as JSON
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /transactions - Create a new transaction for the authenticated user
app.post('/transactions', async (req, res) => {
  try {
    // Extract transaction data from request body
    const { type, category, amount, date } = req.body;
    
    // Verify JWT token (same process as GET endpoint)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Insert the new transaction into the database
    // Include the user_id to associate the transaction with the authenticated user
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ 
        user_id: user.id,  // Associate transaction with the authenticated user
        type,              // 'income' or 'expense'
        category,          // Category name (e.g., 'Food & Dining')
        amount,            // Transaction amount
        date               // Transaction date
      }]);
    
    if (error) return res.status(500).json({ error });
    res.status(201).json(data); // Return 201 (Created) with the new transaction data
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server on port 5001
app.listen(5001, () => console.log("Server running on port 5001"));

// =============================================================================
// PLAID INTEGRATION SETUP (for future bank account linking)
// =============================================================================
// This section sets up Plaid API client for future bank account integration
// Plaid allows secure access to bank account data for transaction importing

const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

// Configure Plaid API client with environment-specific settings
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'], // Use sandbox for testing
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,  // Plaid client ID from environment
      'PLAID-SECRET': process.env.PLAID_SECRET,        // Plaid secret key from environment
    },
  },
});

// Create Plaid API instance for making requests to Plaid's API
const plaid = new PlaidApi(configuration);