require('dotenv').config();             // Loads environment variables from .env
const express = require('express');     // Imports Express to build the API server
const cors = require('cors');           // Allows frontend (React) to call this server
const { createClient } = require('@supabase/supabase-js');  // Supabase client for DB access

const app = express();          // Creates an Express application
app.use(cors());                // Enables CORS so frontend can call backend (bypasses security errors)
app.use(express.json());        // Tells Express to parse JSON bodies in incoming requests

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } } // Recommended for server-side environments
);

// Import and use routes
const transactionsRouter = require('./routes/transactions');
app.use('/api/transactions', transactionsRouter);

// Legacy endpoints for backward compatibility
app.get('/transactions', async (req, res) => {
  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/transactions', async (req, res) => {
  try {
    const { type, category, amount, date } = req.body;
    
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ 
        user_id: user.id,
        type, 
        category, 
        amount, 
        date 
      }]);
    
    if (error) return res.status(500).json({ error });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5001, () => console.log("Server running on port 5001"));

const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaid = new PlaidApi(configuration);