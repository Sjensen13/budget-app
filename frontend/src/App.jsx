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
    </Routes>
  );
}

export default App;
