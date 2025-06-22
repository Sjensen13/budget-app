// =============================================================================
// BUDGET PAGE
// =============================================================================
// This is the main budget management dashboard where users can:
// - View their profile information
// - Set up budget categories and amounts
// - Track spending against budgets
// - Save and manage their budget data

import { useState, useEffect, useCallback } from "react"; // React hooks for state and effects
import { useNavigate } from "react-router-dom"; // Hook for navigation
import supabase from "../supabaseClient"; // Supabase client for database operations
import "./BudgetPage.css"; // CSS styling for this page

export default function BudgetPage() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  const [userProfile, setUserProfile] = useState(null); // User's profile data
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial data fetch
  const [message, setMessage] = useState(""); // Success/error messages
  const navigate = useNavigate(); // Navigation function

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

  // Load existing budget data for the user
  const loadExistingBudget = useCallback(async () => {
    try {
      // Get the currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch existing budget for this user from the 'budgets' table
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      // If budget data exists, update the expense categories with existing data
      if (data && data.categories) {
        setExpenseCategories(prev => 
          prev.map(cat => {
            const existingCat = data.categories.find(existing => existing.id === cat.id);
            return existingCat ? { ...cat, ...existingCat } : cat;
          })
        );
      }
    } catch (error) {
      console.error("Error loading existing budget:", error);
      // Don't show error to user as this is not critical
    }
  }, []);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================
  // Load user profile and existing budget when component mounts
  useEffect(() => {
    const initializeData = async () => {
      await fetchUserProfile();
      await loadExistingBudget();
    };
    initializeData();
  }, [fetchUserProfile, loadExistingBudget]);

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

      // Prepare budget data for saving
      const budgetData = {
        user_id: user.id,
        categories: selectedCategories,
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

    } catch (error) {
      setMessage(`Error saving budget: ${error.message}`);
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

  // Calculate total spent from all selected categories
  const getTotalSpent = () => {
    return expenseCategories
      .filter(cat => cat.selected)
      .reduce((sum, cat) => sum + cat.spent, 0);
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
      <div className="budget-container">
        {/* Header section */}
        <div className="budget-header">
          <h1>My Budget Dashboard</h1>
          <p>Manage your monthly budget and track expenses</p>
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
            <h3>Total Budget</h3>
            <p className="amount">${getTotalBudget().toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>Total Spent</h3>
            <p className="amount">${getTotalSpent().toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>Remaining</h3>
            <p className={`amount ${getTotalBudget() - getTotalSpent() < 0 ? 'negative' : 'positive'}`}>
              ${(getTotalBudget() - getTotalSpent()).toFixed(2)}
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
                )}
              </div>
            ))}
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