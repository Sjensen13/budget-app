// =============================================================================
// SUPABASE CLIENT CONFIGURATION
// =============================================================================
// This file configures the Supabase client for the frontend application.
// Supabase provides authentication, database, and real-time functionality.

import { createClient } from '@supabase/supabase-js';

// Create and configure the Supabase client
// This client will be used throughout the app for database operations and authentication
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,      // Supabase project URL from environment variables
  process.env.REACT_APP_SUPABASE_ANON_KEY  // Public anon key for client-side operations
);

// Export the configured client for use in other components
export default supabase;
