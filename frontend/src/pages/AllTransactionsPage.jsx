// =============================================================================
// ALL TRANSACTIONS PAGE
// =============================================================================
// This page displays all user transactions in a simple, read-only format
// - Shows all transactions without any add/edit functionality
// - Clean, minimal design focused only on transaction display
// - Simple navigation back to main pages

import { useState, useEffect, useCallback } from "react"; // React hooks for state and effects
import { useNavigate } from "react-router-dom"; // Hook for navigation
import supabase from "../supabaseClient"; // Supabase client for user authentication
import axios from "axios"; // HTTP client for API requests to backend
import "./AllTransactionsPage.css"; // CSS styling for this page

export default function AllTransactionsPage() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  const [transactions, setTransactions] = useState([]); // List of user transactions
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial data fetch
  const [message, setMessage] = useState(""); // Error messages only
  const navigate = useNavigate(); // Navigation function

  // =============================================================================
  // EXPENSE CATEGORIES
  // =============================================================================
  // Predefined list of expense categories for icons
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

  // Load all transactions for the authenticated user
  const loadTransactions = useCallback(async () => {
    try {
      // Get the currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Redirect to login if no user is authenticated
      if (!user) {
        navigate('/');
        return;
      }

      // Get the session token to pass to backend for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      // Make API request to backend to fetch user's transactions
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
  }, [navigate]);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================
  // Load transactions when component mounts
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  // Get the icon for a specific category
  const getCategoryIcon = (categoryName) => {
    const category = expenseCategories.find(cat => cat.name === categoryName);
    return category ? category.icon : "📝"; // Default icon if category not found
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  // Show loading state while data is being fetched
  if (isLoading) {
    return <div className="all-transactions-page loading">Loading...</div>;
  }

  return (
    <div className="all-transactions-page">

      
      <div className="transactions-container">
        {/* Header section */}
        <div className="transactions-header">
          <h1>All Transactions</h1>
          <p>Complete history of your income and expenses</p>
        </div>

        {/* Error Message Display */}
        {message && (
          <div className="message error">
            {message}
          </div>
        )}

        {/* Transactions List */}
        <div className="transactions-section">
          <div className="transactions-header-row">
            <h2>Transaction History</h2>
            <div className="transaction-count">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {transactions.length === 0 ? (
            <div className="no-transactions">
              <p>No transactions found.</p>
            </div>
          ) : (
            <div className="transactions-list">
              {transactions.map(transaction => (
                <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                  {/* Category Icon */}
                  <div className="transaction-icon">
                    {getCategoryIcon(transaction.category)}
                  </div>
                  
                  {/* Transaction Details */}
                  <div className="transaction-details">
                    <div className="transaction-category">{transaction.category}</div>
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="navigation-section">
          <button 
            className="nav-btn"
            onClick={() => navigate('/budget')}
          >
            ← Back to Budget
          </button>
        </div>
      </div>
    </div>
  );
} 