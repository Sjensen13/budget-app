// =============================================================================
// TRANSACTION PAGE
// =============================================================================
// This page allows users to track their income and expenses by:
// - Viewing all their transactions
// - Adding new transactions
// - Deleting transactions
// - Seeing financial summaries (income, expenses, net balance)
// - Communicating with the backend API for data persistence

import { useState, useEffect, useCallback } from "react"; // React hooks for state and effects
import { useNavigate } from "react-router-dom"; // Hook for navigation
import supabase from "../supabaseClient"; // Supabase client for user authentication
import axios from "axios"; // HTTP client for API requests to backend
import LogoutButton from "../components/LogoutButton"; // Logout button component
import "./TransactionPage.css"; // CSS styling for this page

export default function TransactionPage() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  const [transactions, setTransactions] = useState([]); // List of user transactions
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial data fetch
  const [message, setMessage] = useState(""); // Success/error messages
  const [showAddForm, setShowAddForm] = useState(false); // Toggle for add transaction form
  const [userProfile, setUserProfile] = useState(null); // User's profile data
  const navigate = useNavigate(); // Navigation function

  // =============================================================================
  // FORM STATE
  // =============================================================================
  // State for the new transaction form
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense', // Transaction type: 'income' or 'expense'
    category: '', // Category name
    amount: '', // Transaction amount
    date: new Date().toISOString().split('T')[0] // Today's date as default
  });

  // =============================================================================
  // EXPENSE CATEGORIES
  // =============================================================================
  // Predefined list of expense categories (matching BudgetPage)
  // Used for categorizing transactions
  const expenseCategories = [
    { id: 1, name: "Rent/Mortgage", icon: "🏠" },
    { id: 2, name: "Food & Dining", icon: "🍽️" },
    { id: 3, name: "Transportation", icon: "🚗" },
    { id: 4, name: "Utilities", icon: "⚡" },
    { id: 5, name: "Healthcare", icon: "🏥" },
    { id: 6, name: "Entertainment", icon: "🎬" },
    { id: 7, name: "Shopping", icon: "🛍️" },
    { id: 8, name: "Insurance", icon: "🛡️" },
    { id: 9, name: "Debt Payments", icon: "💳" },
    { id: 10, name: "Savings", icon: "💰" },
    { id: 11, name: "Education", icon: "📚" },
    { id: 12, name: "Other", icon: "📝" }
  ];

  // =============================================================================
  // DATA FETCHING FUNCTIONS
  // =============================================================================

  // Fetch user profile data from the database
  const fetchUserProfile = useCallback(async () => {
    try {
      // Get the currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Redirect to login if no user is authenticated
      if (!user) {
        navigate('/');
        return;
      }

      // Fetch user profile data from the 'users' table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      setMessage("Error loading profile: " + error.message);
    }
  }, [navigate]);

  // Load all transactions for the authenticated user
  const loadTransactions = useCallback(async () => {
    try {
      // Get the currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get the session token to pass to backend for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      // Make API request to backend to fetch user's transactions
      // Include JWT token in Authorization header for authentication
      const response = await axios.get('http://localhost:5001/api/transactions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      setTransactions(response.data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      setMessage("Error loading transactions: " + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================
  // Load user profile and transactions when component mounts
  useEffect(() => {
    const initializeData = async () => {
      await fetchUserProfile();
      await loadTransactions();
    };
    initializeData();
  }, [fetchUserProfile, loadTransactions]);

  // =============================================================================
  // TRANSACTION MANAGEMENT FUNCTIONS
  // =============================================================================

  // Handle adding a new transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault(); // Prevent form submission
    setIsLoading(true); // Show loading state
    
    try {
      // Get the currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      // Get the session token for backend authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      // Prepare transaction data for API request
      const transactionData = {
        type: newTransaction.type,
        category: newTransaction.category,
        amount: parseFloat(newTransaction.amount), // Convert to number
        date: newTransaction.date
      };

      // Make API request to backend to create new transaction
      const response = await axios.post('http://localhost:5001/api/transactions', transactionData, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      // Add new transaction to the beginning of the list
      setTransactions(prev => [response.data, ...prev]);
      
      // Reset form to default values
      setNewTransaction({
        type: 'expense',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      setShowAddForm(false); // Hide the form
      setMessage("Transaction added successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error creating transaction:", error);
      setMessage("Error adding transaction: " + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a transaction
  const deleteTransaction = async (transactionId) => {
    // Confirm deletion with user
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    
    try {
      // Get the session token for backend authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      // Make API request to backend to delete transaction
      await axios.delete(`http://localhost:5001/api/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      // Remove transaction from local state
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      setMessage("Transaction deleted successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Error deleting transaction: " + (error.response?.data?.error || error.message));
    }
  };

  // =============================================================================
  // CALCULATION FUNCTIONS
  // =============================================================================

  // Calculate total expenses from all transactions
  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate total income from all transactions
  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Get the icon for a specific category
  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return "💰"; // Default icon for income without category
    const category = expenseCategories.find(cat => cat.name === categoryName);
    return category ? category.icon : "📝"; // Default icon if category not found
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  // Show loading state while data is being fetched
  if (isLoading) {
    return <div className="transaction-page loading">Loading...</div>;
  }

  return (
    <div className="transaction-page">
      {/* Logout Button */}
      <LogoutButton />
      
      <div className="transaction-container">
        {/* Header section */}
        <div className="transaction-header">
          <h1>Transaction Tracker</h1>
          <p>Track your income and expenses</p>
        </div>

        {/* User Profile Summary */}
        {userProfile && (
          <div className="profile-summary">
            <h2>Welcome, {userProfile.full_name}!</h2>
            <div className="profile-grid">
              <div className="profile-item">
                <span className="label">Currency:</span>
                <span className="value">{userProfile.currency || 'USD'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Summary Cards */}
        <div className="transaction-summary">
          <div className="summary-card">
            <h3>Total Income</h3>
            <p className="amount positive">${getTotalIncome().toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>Total Expenses</h3>
            <p className="amount negative">${getTotalExpenses().toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>Net Balance</h3>
            <p className={`amount ${getTotalIncome() - getTotalExpenses() >= 0 ? 'positive' : 'negative'}`}>
              ${(getTotalIncome() - getTotalExpenses()).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Add Transaction Button */}
        <div className="add-transaction-section">
          <button 
            className="add-transaction-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Transaction'}
          </button>
        </div>

        {/* Add Transaction Form */}
        {showAddForm && (
          <div className="add-transaction-form">
            <h3>Add New Transaction</h3>
            <form onSubmit={handleAddTransaction}>
              {/* Transaction Type and Category Row */}
              <div className="form-row">
                <div className="form-group">
                  <label>Type:</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                
                {newTransaction.type === 'expense' && (
                  <div className="form-group">
                    <label>Category:</label>
                    <select
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                      required
                    >
                      <option value="">Select Category</option>
                      {expenseCategories.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Amount and Date Row */}
              <div className="form-row">
                <div className="form-group">
                  <label>Amount:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Date:</label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success/Error Message Display */}
        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {/* Transactions List */}
        <div className="transactions-section">
          <h2>Recent Transactions</h2>
          
          {transactions.length === 0 ? (
            <div className="no-transactions">
              <p>No transactions yet. Add your first transaction to get started!</p>
            </div>
          ) : (
            <div className="transactions-list">
              {transactions.slice(0, 5).map(transaction => (
                <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                  {/* Category Icon */}
                  <div className="transaction-icon">
                    {getCategoryIcon(transaction.category)}
                  </div>
                  
                  {/* Transaction Details */}
                  <div className="transaction-details">
                    <div className="transaction-category">
                      {transaction.type === 'income' && !transaction.category ? 'Income' : transaction.category}
                    </div>
                    <div className="transaction-date">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Transaction Amount */}
                  <div className="transaction-amount">
                    <span className={`amount ${transaction.type === 'income' ? 'positive' : 'negative'}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Delete Button */}
                  <button 
                    className="delete-btn"
                    onClick={() => deleteTransaction(transaction.id)}
                    title="Delete transaction"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="navigation-section">
          <button 
            className="nav-btn"
            onClick={() => navigate('/budget', { state: { refresh: true } })}
          >
            ← Back to Budget
          </button>
        </div>
      </div>
    </div>
  );
} 