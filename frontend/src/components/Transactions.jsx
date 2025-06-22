// =============================================================================
// TRANSACTIONS COMPONENT (Legacy)
// =============================================================================
// This is a legacy component that was used for displaying transactions.
// It makes direct API calls to the backend server using axios.
// Note: This component is likely replaced by the more comprehensive TransactionPage.

import axios from "axios"; // HTTP client for making API requests
import { useEffect, useState } from "react"; // React hooks for state and side effects

export default function Transactions() {
  // State to store the list of transactions
  const [tx, setTx] = useState([]);

  // useEffect hook to fetch transactions when component mounts
  useEffect(() => {
    // Make GET request to backend API to fetch all transactions
    axios.get('http://localhost:5001/transactions')
      .then(res => setTx(res.data)) // Update state with fetched transactions
      .catch(err => console.error(err)); // Log any errors to console
  }, []); // Empty dependency array means this runs only once on mount

  // Render the list of transactions
  return (
    <ul>
      {/* Map through transactions and display each one */}
      {tx.map(t => (
        <li key={t.id}>{t.category} - ${t.amount}</li>
      ))}
    </ul>
  );
}
