import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import "./SignUpInfoPage.css";

export default function SignUpInfoPage() {
  const [fullName, setFullName] = useState("");
  const [creditCardNumber, setCreditCardNumber] = useState("");
  const [yearlyIncome, setYearlyIncome] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [financialGoal, setFinancialGoal] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user:", user);

      if (!user) {
        throw new Error("You must be logged in to complete your profile.");
      }

      const profileData = { 
        id: user.id, 
        full_name: fullName,
        yearly_income: yearlyIncome,
        monthly_expenses: monthlyExpenses,
        financial_goal: financialGoal,
        currency: currency
      };
      
      console.log("Saving profile data:", profileData);

      const { data, error } = await supabase
        .from('users')
        .upsert([profileData]);

      console.log("Supabase response:", { data, error });

      if (error) {
        throw error;
      }

      setMessage("Profile completed successfully! Redirecting to budget dashboard...");
      
      // Redirect to budget page after a delay
      setTimeout(() => {
        navigate('/budget');
      }, 2000);
      
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-info-page">
      <div className="signup-info-container">
        <div className="signup-info-header">
          <h1>Complete Your Profile</h1>
          <p>Just one more step! Please enter your name.</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-info-form">
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

          {message && (
            <div className={`message ${message.includes('error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

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