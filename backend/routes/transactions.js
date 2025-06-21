const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    req.token = token; // Pass the token to the next handler
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Token verification failed' });
  }
};

// Apply token verification to all routes
router.use(verifyToken);

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new transaction
router.post('/', async (req, res) => {
  try {
    const { type, category, amount, date } = req.body;
    
    console.log("Supabase URL:", process.env.SUPABASE_URL);
    console.log("Supabase Anon Key:", process.env.SUPABASE_KEY);

    // Create a new Supabase client for THIS REQUEST, authenticated as the user.
    // This ensures that RLS policies with auth.uid() work correctly.
    const supabaseUserClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY, // Use the public ANON key for this client
      {
        global: {
          headers: { Authorization: `Bearer ${req.token}` }
        }
      }
    );

    const transactionData = {
      // We still pass user_id so the database doesn't have to look it up,
      // but the RLS policy will now check it against a valid session.
      user_id: req.user.id,
      type,
      category,
      amount: parseFloat(amount),
      date
    };

    // Use the USER-SPECIFIC client to perform the insert
    const { data, error } = await supabaseUserClient
      .from('transactions')
      .insert([transactionData])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a transaction
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, category, amount, date } = req.body;
    
    const updateData = {
      type,
      category,
      amount: parseFloat(amount),
      date
    };

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transaction statistics
router.get('/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', req.user.id);

    if (error) throw error;

    const stats = {
      totalIncome: data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      transactionCount: data.length
    };

    stats.netBalance = stats.totalIncome - stats.totalExpenses;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
