import { useState } from 'react';

function BankButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleBankLink = async () => {
    setIsLoading(true);
    try {
      // Placeholder for bank linking functionality
      console.log("Bank linking functionality will be implemented here");
      alert("Bank linking feature coming soon!");
    } catch (error) {
      console.error("Error linking bank:", error);
      alert("Error linking bank account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleBankLink} 
      disabled={isLoading}
      style={{
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.7 : 1
      }}
    >
      {isLoading ? 'Linking...' : 'Link Bank'}
    </button>
  );
}

export default BankButton;
