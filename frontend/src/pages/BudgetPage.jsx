import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import "./BudgetPage.css";

export default function BudgetPage() {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Expense categories with default budgets
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
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const loadExistingBudget = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch existing budget for this user
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      if (data && data.categories) {
        // Update the expense categories with existing budget data
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

  useEffect(() => {
    const initializeData = async () => {
      await fetchUserProfile();
      await loadExistingBudget();
    };
    initializeData();
  }, [fetchUserProfile, loadExistingBudget]);

  const toggleCategorySelection = (categoryId) => {
    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, selected: !cat.selected }
          : cat
      )
    );
  };

  const updateCategoryBudget = (categoryId, newBudget) => {
    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, budget: parseFloat(newBudget) || 0 }
          : cat
      )
    );
  };

  const saveBudget = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      const selectedCategories = expenseCategories.filter(cat => cat.selected);

      // Fetch all existing budgets for the user, newest first.
      const { data: existingBudgets, error: fetchError } = await supabase
        .from('budgets')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const budgetData = {
        user_id: user.id,
        categories: selectedCategories,
        total_budget: selectedCategories.reduce((sum, cat) => sum + cat.budget, 0),
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingBudgets && existingBudgets.length > 0) {
        // If one or more budgets exist, update the most recent one.
        const budgetToUpdate = existingBudgets[0];
        result = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', budgetToUpdate.id);
      } else {
        // If no budget exists, create a new one.
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

  const getTotalBudget = () => {
    return expenseCategories
      .filter(cat => cat.selected)
      .reduce((sum, cat) => sum + cat.budget, 0);
  };

  const getTotalSpent = () => {
    return expenseCategories
      .filter(cat => cat.selected)
      .reduce((sum, cat) => sum + cat.spent, 0);
  };

  if (isLoading) {
    return <div className="budget-page loading">Loading...</div>;
  }

  return (
    <div className="budget-page">
      <div className="budget-container">
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

        {/* Budget Summary */}
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
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="budget-actions">
          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
          
          <button 
            className="save-budget-btn"
            onClick={saveBudget}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      </div>
    </div>
  );
} 