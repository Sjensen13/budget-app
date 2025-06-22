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

// =============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// =============================================================================
// Check for essential environment variables on startup.
// If any are missing, log a clear error and exit the process.
const requiredEnv = ['SUPABASE_URL', 'SUPABASE_KEY', 'SUPABASE_SERVICE_KEY'];
const missingEnv = requiredEnv.filter(v => !process.env[v]);

if (missingEnv.length > 0) {
  console.error(`
    FATAL ERROR: Missing required environment variables: ${missingEnv.join(', ')}
    Please ensure you have a .env file in the /backend directory with all the required keys.
    Example .env file:
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_KEY=your_supabase_service_role_key
  `);
  process.exit(1); // Exit the application
}

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
const transactionsRouter = require('./routes/transactions')({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
});
app.use('/api/transactions', transactionsRouter); // Mount router at /api/transactions

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