// =============================================================================
// REACT APP ENTRY POINT
// =============================================================================
// This is the main entry point for the React budget app.
// It initializes the React application and sets up the routing system.

import React from 'react';
import { createRoot } from 'react-dom/client'; // Modern React 18+ root creation
import { BrowserRouter } from 'react-router-dom'; // Router for client-side navigation
import './index.css'; // Global CSS styles
import App from './App.jsx'; // Main App component

// Create the root element for React 18+ concurrent features
const root = createRoot(document.getElementById('root'));

// Render the app with React Router wrapper
root.render(
  <React.StrictMode>
    {/* BrowserRouter enables client-side routing throughout the app */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
); 