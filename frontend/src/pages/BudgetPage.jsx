// =============================================================================
// BUDGET PAGE
// =============================================================================
// This is the main budget management dashboard where users can:
// - View their profile information
// - Set up budget categories and amounts
// - Track spending against budgets
// - Save and manage their budget data

import { useState, useEffect, useCallback } from "react"; // React hooks for state and effects
import { useNavigate, useLocation } from "react-router-dom"; // Hook for navigation
import supabase from "../supabaseClient"; // Supabase client for database operations
import axios from "axios"; // HTTP client for API requests to backend
import LogoutButton from "../components/LogoutButton"; // Logout button component
import "./BudgetPage.css"; // CSS styling for this page

export default function BudgetPage() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  const [userProfile, setUserProfile] = useState(null); // User's profile data
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial data fetch
  const [message, setMessage] = useState(""); // Success/error messages
  const [transactions, setTransactions] = useState([]); // User's transactions
  const navigate = useNavigate(); // Navigation function
  const location = useLocation(); // Location for checking state

  // =============================================================================
  // EXPENSE CATEGORIES
  // =============================================================================
  // Predefined list of expense categories with default budgets
  // Each category has an ID, name, icon, budget amount, spent amount, and selection state
  const [expenseCategories, setExpenseCategories] = useState([
    { id: 1, name: "Rent/Mortgage", icon: "🏠", budget: 0, spent: 0, selected: false },
    { id: 2, name: "Food & Dining", icon: "🍽️", budget: 0, spent: 0, selected: false },
    { id: 3, name: "Transportation", icon: "🚗", budget: 0, spent: 0, selected: false },
    { id: 4, name: "Utilities", icon: "⚡", budget: 0, spent: 0, selected: false },
    { id: 5, name: "Healthcare", icon: "🏥", budget: 0, spent: 0, selected: false },
    { id: 6, name: "Entertainment", icon: "🎬", budget: 0, spent: 0, selected: false },
    { id: 7, name: "Shopping", icon: "🛍️", budget: 0, spent: 0, selected: false },
    { id: 8, name: "Insurance", icon: "🛡️", budget: 0, spent: 0, selected: false },
    { id: 9, name: "Debt Payments", icon: "💳", budget: 0, spent: 0, selected: false },
    { id: 10, name: "Savings", icon: "💰", budget: 0, spent: 0, selected: false },
    { id: 11, name: "Education", icon: "📚", budget: 0, spent: 0, selected: false },
    { id: 12, name: "Other", icon: "📝", budget: 0, spent: 0, selected: false }
  ]);

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
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Load transactions from the backend API
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
      const response = await axios.get('http://localhost:5001/api/transactions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      setTransactions(response.data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      // Don't show error to user as this is not critical for budget display
    }
  }, []);

  // Load existing budget data for the user
  const loadExistingBudget = useCallback(async () => {
    try {
      // Get the currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch existing budgets for this user from the 'budgets' table
      // Get the most recent budget instead of using .single()
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      // If budget data exists, update the expense categories with existing data
      // data will be an array, so we take the first (most recent) budget
      if (data && data.length > 0 && data[0].categories) {
        setExpenseCategories(prev => 
          prev.map(cat => {
            const existingCat = data[0].categories.find(existing => existing.id === cat.id);
            return existingCat ? { ...cat, ...existingCat } : cat;
          })
        );
      }
    } catch (error) {
      console.error("Error loading existing budget:", error);
      // Don't show error to user as this is not critical
    }
  }, []);

  // Calculate spent amounts for each category based on transactions
  const calculateSpentAmounts = useCallback(() => {
    setExpenseCategories(prev => 
      prev.map(cat => {
        // Filter transactions for this category and type 'expense'
        const categoryTransactions = transactions.filter(t => 
          t.category === cat.name && t.type === 'expense'
        );
        
        // Sum up all expenses for this category
        const totalSpent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        return { ...cat, spent: totalSpent };
      })
    );
  }, [transactions]);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================
  // Load user profile, existing budget, and transactions when component mounts
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await fetchUserProfile();
      await loadTransactions();
      await loadExistingBudget();
      setIsLoading(false);
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // This effect runs when the page is revisited with a refresh request
  useEffect(() => {
    if (location.state?.refresh) {
      async function refreshData() {
        setIsLoading(true);
        await loadTransactions();
        setIsLoading(false);
      }
      refreshData();
      // Reset the state to avoid re-triggering on other re-renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, loadTransactions, navigate, location.pathname]);

  // Update spent amounts whenever transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      calculateSpentAmounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  // =============================================================================
  // BUDGET MANAGEMENT FUNCTIONS
  // =============================================================================

  // Toggle selection state of a budget category
  const toggleCategorySelection = (categoryId) => {
    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, selected: !cat.selected }
          : cat
      )
    );
  };

  // Update the budget amount for a specific category
  const updateCategoryBudget = (categoryId, newBudget) => {
    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, budget: parseFloat(newBudget) || 0 }
          : cat
      )
    );
  };

  // Save the current budget configuration to the database
  const saveBudget = async () => {
    setIsLoading(true);
    try {
      // Get the currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      // Filter to only include selected categories
      const selectedCategories = expenseCategories.filter(cat => cat.selected);

      // Fetch all existing budgets for the user, newest first
      const { data: existingBudgets, error: fetchError } = await supabase
        .from('budgets')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Prepare budget data for saving, excluding the 'spent' field
      const budgetData = {
        user_id: user.id,
        categories: selectedCategories.map(({ spent, ...rest }) => rest), // Omit 'spent'
        total_budget: selectedCategories.reduce((sum, cat) => sum + cat.budget, 0),
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingBudgets && existingBudgets.length > 0) {
        // If one or more budgets exist, update the most recent one
        const budgetToUpdate = existingBudgets[0];
        result = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', budgetToUpdate.id);
      } else {
        // If no budget exists, create a new one
        budgetData.created_at = new Date().toISOString();
        result = await supabase
          .from('budgets')
          .insert(budgetData);
      }

      if (result.error) throw result.error;

      setMessage("Budget saved successfully!");
      setTimeout(() => setMessage(""), 3000);

    } catch (error) {
      setMessage("Error saving budget: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================================================
  // CALCULATION FUNCTIONS
  // =============================================================================

  // Calculate total budget from all selected categories
  const getTotalBudget = () => {
    return expenseCategories
      .filter(cat => cat.selected)
      .reduce((sum, cat) => sum + cat.budget, 0);
  };

  // Calculate total spent across all categories
  const getTotalSpent = () => {
    return expenseCategories.reduce((sum, cat) => sum + cat.spent, 0);
  };

  // Calculate total income from transactions
  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate remaining budget
  const getRemaining = () => {
    return getTotalBudget() - getTotalSpent();
  };

  // Calculate available budget (income minus spent)
  const getAvailableBudget = () => {
    return getTotalIncome() - getTotalSpent();
  };

  // Get a summary of all categories
  const getCategorySummaries = () => {
    return expenseCategories
      .filter(cat => cat.selected)
      .map(cat => ({
        ...cat,
        remaining: cat.budget - cat.spent
      }));
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  // Show loading state while data is being fetched
  if (isLoading) {
    return <div className="budget-page loading">Loading...</div>;
  }

  return (
    <div className="budget-page">
      {/* Logout Button */}
      <LogoutButton />
      
      <div className="budget-container">
        {/* Header section */}
        <div className="budget-header">
          <h1>My Budget Dashboard</h1>
          <p>Manage your monthly budget and track expenses</p>
        </div>

        {/* Expenses Chart Link */}
        <div className="expenses-chart-link">
          <button 
            className="chart-link-btn"
            onClick={() => navigate('/expenses-chart')}
          >
            📊 View Expenses Chart
          </button>
        </div>

        {/* User Profile Summary */}
        {userProfile && (
          <div className="profile-summary">
            <h2>Welcome, {userProfile.full_name}!</h2>
            <div className="profile-grid">
              <div className="profile-item">
                <span className="label">Yearly Income:</span>
                <span className="value">{userProfile.yearly_income || 'Not set'}</span>
              </div>
              <div className="profile-item">
                <span className="label">Monthly Expenses:</span>
                <span className="value">{userProfile.monthly_expenses || 'Not set'}</span>
              </div>
              <div className="profile-item">
                <span className="label">Financial Goal:</span>
                <span className="value">{userProfile.financial_goal || 'Not set'}</span>
              </div>
              <div className="profile-item">
                <span className="label">Currency:</span>
                <span className="value">{userProfile.currency || 'USD'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Budget Summary Cards */}
        <div className="budget-summary">
          <div className="summary-card">
            <h3>Total Income</h3>
            <p className="amount positive">${getTotalIncome().toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>Total Spent</h3>
            <p className="amount negative">${getTotalSpent().toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>Available Budget</h3>
            <p className={`amount ${getAvailableBudget() >= 0 ? 'positive' : 'negative'}`}>
              ${getAvailableBudget().toFixed(2)}
            </p>
          </div>
        </div>

        {/* Expense Categories Grid */}
        <div className="expense-categories">
          <h2>Expense Categories</h2>
          <p>Click to select categories and set your budget amounts</p>
          
          <div className="categories-grid">
            {expenseCategories.map(category => (
              <div 
                key={category.id} 
                className={`category-card ${category.selected ? 'selected' : ''}`}
                onClick={() => toggleCategorySelection(category.id)}
              >
                <div className="category-header">
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </div>
                
                {category.selected && (
                  <div className="category-details">
                    <div className="category-budget">
                      <label>Budget Amount:</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={category.budget || ''}
                        onChange={(e) => updateCategoryBudget(category.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent card selection when clicking input
                      />
                    </div>
                    
                    {/* Show spent amount and progress */}
                    <div className="category-spending">
                      <div className="spent-info">
                        <span className="spent-label">Spent:</span>
                        <span className="spent-amount">${category.spent.toFixed(2)}</span>
                      </div>
                      
                      {/* Progress bar */}
                      {category.budget > 0 && (
                        <div className="budget-progress">
                          <div className="progress-bar">
                            <div 
                              className={`progress-fill ${category.spent > category.budget ? 'over-budget' : ''}`}
                              style={{ 
                                width: `${Math.min((category.spent / category.budget) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {Math.round((category.spent / category.budget) * 100)}%
                          </span>
                        </div>
                      )}
                      
                      {/* Remaining amount */}
                      {category.budget > 0 && (
                        <div className="remaining-info">
                          <span className="remaining-label">Remaining:</span>
                          <span className={`remaining-amount ${category.budget - category.spent < 0 ? 'negative' : 'positive'}`}>
                            ${(category.budget - category.spent).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="recent-transactions">
          <h2>Recent Transactions</h2>
          <p>Your latest income and spending activity</p>
          
          {transactions.length === 0 ? (
            <div className="no-transactions">
              <p>No transactions yet. Add transactions to see your activity here!</p>
            </div>
          ) : (
            <>
              {/* Income Transactions */}
              {transactions.filter(t => t.type === 'income').length > 0 && (
                <div className="transactions-section">
                  <h3>Recent Income</h3>
                  <div className="transactions-list">
                    {transactions
                      .filter(t => t.type === 'income')
                      .slice(0, 3) // Show only the 3 most recent income transactions
                      .map(transaction => (
                        <div key={transaction.id} className="transaction-item income">
                          {/* Category Icon */}
                          <div className="transaction-icon">
                            💰
                          </div>
                          
                          {/* Transaction Details */}
                          <div className="transaction-details">
                            <div className="transaction-category">Income</div>
                            <div className="transaction-date">
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {/* Transaction Amount */}
                          <div className="transaction-amount">
                            <span className="amount positive">
                              +${transaction.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Expense Transactions */}
              {transactions.filter(t => t.type === 'expense').length > 0 && (
                <div className="transactions-section">
                  <h3>Recent Expenses</h3>
                  <div className="transactions-list">
                    {transactions
                      .filter(t => t.type === 'expense')
                      .slice(0, 5) // Show only the 5 most recent expense transactions
                      .map(transaction => (
                        <div key={transaction.id} className="transaction-item">
                          {/* Category Icon */}
                          <div className="transaction-icon">
                            {expenseCategories.find(cat => cat.name === transaction.category)?.icon || "📝"}
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
                            <span className="amount negative">
                              -${transaction.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* View All Transactions Button */}
          <div className="view-all-transactions">
            <button 
              className="nav-btn"
              onClick={() => navigate('/all-transactions')}
            >
              View All Transactions →
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="budget-actions">
          {/* Success/Error Message Display */}
          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
          
          <div className="action-buttons">
            {/* Save Budget Button */}
            <button 
              className="save-budget-btn"
              onClick={saveBudget}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Budget'}
            </button>
            
            {/* Navigation to Transactions Page */}
            <button 
              className="nav-btn"
              onClick={() => navigate('/transactions')}
            >
              Track Transactions →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 