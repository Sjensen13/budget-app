// =============================================================================
// AUTH FORM COMPONENT
// =============================================================================
// This component provides a simple login form for user authentication.
// It uses Supabase for authentication and handles login functionality.
// Note: This appears to be a simpler version compared to the AuthPage component.

import { useState } from "react"; // React hook for managing form state
import supabase from "../supabaseClient"; // Supabase client for authentication

export default function AuthForm() {
  // State for form inputs
  const [email, setEmail] = useState(""); // User's email address
  const [password, setPassword] = useState(""); // User's password

  // Handler function for login form submission
  const handleLogin = async () => {
    // Attempt to sign in the user with email and password
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle authentication result
    if (error) {
      alert(error.message); // Show error message if login fails
    } else {
      console.log("Logged in!", data); // Log success and user data
    }
  };

  // Render the login form
  return (
    <div>
      {/* Email input field */}
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)} // Update email state on input change
      />
      
      {/* Password input field */}
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)} // Update password state on input change
      />
      
      {/* Login button */}
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
