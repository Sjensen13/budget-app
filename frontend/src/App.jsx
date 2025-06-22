// =============================================================================
// MAIN APP COMPONENT
// =============================================================================
// This is the main App component that handles routing between different pages
// of the budget application. It uses React Router to manage navigation.

import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';           // Login/Signup page
import SignUpInfoPage from './pages/SignUpInfoPage'; // User profile completion
import BudgetPage from './pages/BudgetPage';       // Budget management dashboard
import TransactionPage from './pages/TransactionPage'; // Transaction tracking
import AllTransactionsPage from './pages/AllTransactionsPage'; // Read-only all transactions
import ExpensesChartPage from './pages/ExpensesChartPage'; // Expenses chart visualization

function App() {
  return (
    // Routes component defines all the possible routes in the application
    <Routes>
      {/* Root route - shows authentication page for login/signup */}
      <Route path="/" element={<AuthPage />} />
      
      {/* Profile completion route - shown after successful signup */}
      <Route path="/complete-profile" element={<SignUpInfoPage />} />
      
      {/* Budget dashboard route - main budget management interface */}
      <Route path="/budget" element={<BudgetPage />} />
      
      {/* Transaction tracking route - for managing income and expenses */}
      <Route path="/transactions" element={<TransactionPage />} />
      
      {/* All transactions route - read-only view of all transactions */}
      <Route path="/all-transactions" element={<AllTransactionsPage />} />
      
      {/* Expenses chart route - circular graph showing expenses by category */}
      <Route path="/expenses-chart" element={<ExpensesChartPage />} />
    </Routes>
  );
}

export default App;
