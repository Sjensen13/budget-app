// =============================================================================
// LOGOUT BUTTON COMPONENT
// =============================================================================
// This is a reusable logout button component that can be placed on any page.
// It handles user logout functionality and redirects to the authentication page.

import { useState } from "react"; // React hook for state management
import { useNavigate } from "react-router-dom"; // Hook for navigation
import supabase from "../supabaseClient"; // Supabase client for authentication
import "./LogoutButton.css"; // CSS styling for the logout button

export default function LogoutButton() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  const [isLoading, setIsLoading] = useState(false); // Loading state for logout process
  const navigate = useNavigate(); // Navigation function

  // =============================================================================
  // LOGOUT HANDLER
  // =============================================================================
  // Handle user logout when the button is clicked
  const handleLogout = async () => {
    setIsLoading(true); // Show loading state
    
    try {
      // Sign out the user using Supabase auth
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error; // Handle any logout errors
      }
      
      // Redirect to the authentication page after successful logout
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, redirect to auth page for security
      navigate('/');
    } finally {
      setIsLoading(false); // Stop loading state
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="logout-button"
      title="Logout"
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
} 