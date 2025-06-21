import { useState } from "react"; // React hook to manage component state
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient"; // Import the Supabase client for auth functions
import "./AuthPage.css"; // Import CSS styling for the auth page

export default function AuthPage() {
  // State for input fields, loading state, auth mode (sign in/sign up), and messages
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Handle login or sign up when the form is submitted
  const handleAuth = async (e) => {
    e.preventDefault(); // Prevent page reload
    setIsLoading(true); // Show loading state
    setMessage(""); // Clear any previous message

    try {
      if (isSignUp) {
        // Sign up the user
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error; // If there's an error, handle it
        
        // After successful sign-up, automatically sign them in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        
        setMessage("Account created and signed in successfully!"); // Show success message
        
        // Wait for a bit to let the user see the message, then redirect
        setTimeout(() => {
          navigate('/complete-profile');
        }, 2000);

      } else {
        // Sign in the user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Logged in successfully!"); // Show success message
        setTimeout(() => {
          navigate("/budget");
        }, 2000);
      }
    } catch (error) {
      setMessage(error.message); // Show any error messages
    } finally {
      setIsLoading(false); // Stop loading spinner
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>My Budget</h1> {/* App title */}
          <p>
            {isSignUp ? 'Welcome!' : 'Welcome back!'} Please {isSignUp ? 'create an account' : 'sign in'} to continue.
            {/* Text that changes based on whether the user is signing up or signing in */}
          </p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          {/* Email input */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Update email state
              required
            />
          </div>

          {/* Password input */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Update password state
              required
            />
          </div>

          {/* Display message (success or error) */}
          {message && (
            <div className={`message ${message.includes('error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Submit button, disabled while loading */}
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {/* Footer with toggle between Sign In and Sign Up */}
        <div className="auth-footer">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              className="toggle-button"
              onClick={() => setIsSignUp(!isSignUp)} // Toggle the sign-in/sign-up mode
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
