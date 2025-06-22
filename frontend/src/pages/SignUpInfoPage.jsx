// =============================================================================
// SIGN UP INFO PAGE
// =============================================================================
// This page allows new users to complete their profile after signing up.
// Users provide additional information like name, income, expenses, and financial goals.
// This data is used to personalize their budget experience.

import { useState } from "react"; // React hook for managing form state
import { useNavigate } from "react-router-dom"; // Hook for programmatic navigation
import supabase from "../supabaseClient"; // Supabase client for database operations
import "./SignUpInfoPage.css"; // CSS styling for this page

export default function SignUpInfoPage() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  // State for all form fields and UI states
  const [fullName, setFullName] = useState(""); // User's full name
  const [creditCardNumber, setCreditCardNumber] = useState(""); // Credit card (currently unused)
  const [yearlyIncome, setYearlyIncome] = useState(""); // User's yearly income range
  const [monthlyExpenses, setMonthlyExpenses] = useState(""); // User's monthly expenses range
  const [financialGoal, setFinancialGoal] = useState(""); // User's primary financial goal
  const [currency, setCurrency] = useState("USD"); // User's preferred currency
  const [isLoading, setIsLoading] = useState(false); // Loading state for form submission
  const [message, setMessage] = useState(""); // Success/error messages
  const navigate = useNavigate(); // Navigation function

  // =============================================================================
  // FORM SUBMISSION HANDLER
  // =============================================================================
  // Handle form submission to save user profile data
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    setIsLoading(true); // Show loading state
    setMessage(""); // Clear previous messages

    try {
      // Get the currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user:", user);

      // Ensure user is authenticated
      if (!user) {
        throw new Error("You must be logged in to complete your profile.");
      }

      // Prepare profile data for database insertion
      const profileData = { 
        id: user.id, // Use the user's auth ID as the profile ID
        full_name: fullName,
        yearly_income: yearlyIncome,
        monthly_expenses: monthlyExpenses,
        financial_goal: financialGoal,
        currency: currency
      };
      
      console.log("Saving profile data:", profileData);

      // Save profile data to the 'users' table in Supabase
      // Using upsert to handle both insert and update cases
      const { data, error } = await supabase
        .from('users')
        .upsert([profileData]);

      console.log("Supabase response:", { data, error });

      if (error) {
        throw error;
      }

      setMessage("Profile completed successfully! Redirecting to budget dashboard...");
      
      // Redirect to budget page after a delay to show success message
      setTimeout(() => {
        navigate('/budget');
      }, 2000);
      
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage(error.message);
    } finally {
      setIsLoading(false); // Hide loading state
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div className="signup-info-page">
      <div className="signup-info-container">
        {/* Header section */}
        <div className="signup-info-header">
          <h1>Complete Your Profile</h1>
          <p>Just one more step! Please enter your name.</p>
        </div>

        {/* Profile completion form */}
        <form onSubmit={handleSubmit} className="signup-info-form">
          {/* Full Name Input */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Yearly Income Selection */}
          <div className="yearly-income-info">
            <label htmlFor="yearlyIncome">Yearly Income</label>
            <select
              id="yearlyIncome"
              value={yearlyIncome}
              onChange={(e) => setYearlyIncome(e.target.value)}
              required
            >
              <option value="">Select your yearly income</option>
              <option value="0-20k">$0 - $20,000</option>
              <option value="20-40k">$20,000 - $40,000</option>
              <option value="40-60k">$40,000 - $60,000</option>
              <option value="60-80k">$60,000 - $80,000</option>
              <option value="80-100k">$80,000 - $100,000</option>
              <option value="100k+">$100,000+</option>
            </select>
          </div>

          {/* Monthly Expenses Selection */}
          <div className="monthly-expenses-info">
            <label htmlFor="monthlyExpenses">Monthly Expenses</label>
            <select
              id="monthlyExpenses"
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(e.target.value)}
              required
            >
              <option value="">Select your monthly expenses</option>
              <option value="0-1k">$0 - $1,000</option>
              <option value="1k-2k">$1,000 - $2,000</option>
              <option value="2k-3k">$2,000 - $3,000</option>
              <option value="3k-4k">$3,000 - $4,000</option>
              <option value="4k-5k">$4,000 - $5,000</option>
              <option value="5k+">$5,000+</option>
            </select>
          </div>

          {/* Financial Goal Selection */}
          <div className="financial-goal-info">
            <label htmlFor="financialGoal">Primary Financial Goal</label>
            <select
              id="financialGoal"
              value={financialGoal}
              onChange={(e) => setFinancialGoal(e.target.value)}
              required
            >
              <option value="">Select your primary goal</option>
              <option value="save-emergency">Build Emergency Fund</option>
              <option value="save-retirement">Save for Retirement</option>
              <option value="pay-debt">Pay Off Debt</option>
              <option value="save-house">Save for House</option>
              <option value="save-vacation">Save for Vacation</option>
              <option value="invest">Invest Money</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Currency Selection */}
          <div className="currency-info">
            <label htmlFor="currency">Preferred Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
            </select>
          </div>

          {/* Success/Error Message Display */}
          {message && (
            <div className={`message ${message.includes('error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : ' Next '}
          </button>
        </form>
      </div>
    </div>
  );
} 