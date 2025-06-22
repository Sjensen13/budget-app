// =============================================================================
// BANK BUTTON COMPONENT
// =============================================================================
// This component provides a button for linking bank accounts to the budget app.
// Currently, it's a placeholder that shows a "coming soon" message.
// In the future, this will integrate with Plaid API for secure bank account access.

import { useState } from 'react'; // React hook for managing component state

function BankButton() {
  // State to track whether the bank linking process is in progress
  const [isLoading, setIsLoading] = useState(false);

  // Handler function for when the bank link button is clicked
  const handleBankLink = async () => {
    setIsLoading(true); // Start loading state
    try {
      // Placeholder for bank linking functionality
      // This will be replaced with actual Plaid integration
      console.log("Bank linking functionality will be implemented here");
      alert("Bank linking feature coming soon!");
    } catch (error) {
      console.error("Error linking bank:", error);
      alert("Error linking bank account");
    } finally {
      setIsLoading(false); // End loading state regardless of success/failure
    }
  };

  // Render the bank linking button
  return (
    <button 
      onClick={handleBankLink} // Call handler when button is clicked
      disabled={isLoading} // Disable button while loading
      style={{
        padding: '10px 20px',
        backgroundColor: '#007bff', // Bootstrap blue color
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: isLoading ? 'not-allowed' : 'pointer', // Change cursor based on loading state
        opacity: isLoading ? 0.7 : 1 // Reduce opacity when loading
      }}
    >
      {/* Show different text based on loading state */}
      {isLoading ? 'Linking...' : 'Link Bank'}
    </button>
  );
}

export default BankButton;
