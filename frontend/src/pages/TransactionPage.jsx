import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import axios from "axios";
import "./TransactionPage.css";

export default function TransactionPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  // Form state for adding new transactions
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Expense categories (matching BudgetPage)
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

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

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

  const loadTransactions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get the session token to pass to backend
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

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

  useEffect(() => {
    const initializeData = async () => {
      await fetchUserProfile();
      await loadTransactions();
    };
    initializeData();
  }, [fetchUserProfile, loadTransactions]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      // Get the session token to pass to backend
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      const transactionData = {
        type: newTransaction.type,
        category: newTransaction.category,
        amount: parseFloat(newTransaction.amount),
        date: newTransaction.date
      };

      const response = await axios.post('http://localhost:5001/api/transactions', transactionData, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      setTransactions(prev => [response.data, ...prev]);
      setNewTransaction({
        type: 'expense',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
      setMessage("Transaction added successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Error adding transaction: " + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    
    try {
      // Get the session token to pass to backend
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      await axios.delete(`http://localhost:5001/api/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      setMessage("Transaction deleted successfully!");
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Error deleting transaction: " + (error.response?.data?.error || error.message));
    }
  };

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getCategoryIcon = (categoryName) => {
    const category = expenseCategories.find(cat => cat.name === categoryName);
    return category ? category.icon : "📝";
  };

  if (isLoading) {
    return <div className="transaction-page loading">Loading...</div>;
  }

  return (
    <div className="transaction-page">
      <div className="transaction-container">
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

        {/* Transaction Summary */}
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
              </div>

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

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Message Display */}
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
              {transactions.map(transaction => (
                <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                  <div className="transaction-icon">
                    {getCategoryIcon(transaction.category)}
                  </div>
                  
                  <div className="transaction-details">
                    <div className="transaction-category">{transaction.category}</div>
                    <div className="transaction-date">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="transaction-amount">
                    <span className={`amount ${transaction.type === 'income' ? 'positive' : 'negative'}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </span>
                  </div>
                  
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
            onClick={() => navigate('/budget')}
          >
            ← Back to Budget
          </button>
        </div>
      </div>
    </div>
  );
} 