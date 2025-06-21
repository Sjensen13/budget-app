import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import SignUpInfoPage from './pages/SignUpInfoPage';
import BudgetPage from './pages/BudgetPage';
import TransactionPage from './pages/TransactionPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/complete-profile" element={<SignUpInfoPage />} />
      <Route path="/budget" element={<BudgetPage />} />
      <Route path="/transactions" element={<TransactionPage />} />
    </Routes>
  );
}

export default App;
