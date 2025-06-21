# Budget App

A comprehensive personal finance management application built with React, Node.js, and Supabase.

## Current Features

### ✅ Completed
- **User Authentication** - Sign up, login, and profile management
- **Budget Management** - Set monthly budgets for different expense categories
- **Transaction Tracking** - Add, view, and manage income and expenses
- **Real-time Data** - All data is stored in Supabase for persistence
- **Responsive Design** - Works on desktop and mobile devices

### 🎯 Next Steps

1. **Dashboard Integration** - Connect budget goals with actual spending
2. **Expense Analytics** - Charts and graphs showing spending patterns
3. **Budget vs Actual Comparison** - Track how spending compares to budget
4. **Export Functionality** - Download transaction history as CSV/PDF
5. **Bank Integration** - Connect with Plaid for automatic transaction import
6. **Notifications** - Alerts when approaching budget limits
7. **Multi-currency Support** - Support for different currencies
8. **Recurring Transactions** - Set up automatic recurring expenses

## Tech Stack

- **Frontend**: React, React Router, CSS3
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Custom CSS with modern gradients and animations

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
3. Set up environment variables in both frontend and backend
4. Start the development servers:
   ```bash
   # Backend
   cd backend && npm start
   
   # Frontend
   cd frontend && npm start
   ```

## Database Schema

### Users Table
- id, email, full_name, yearly_income, monthly_expenses, financial_goal, currency

### Budgets Table
- id, user_id, categories (JSON), total_budget, created_at, updated_at

### Transactions Table
- id, user_id, type, category, amount, description, date, created_at, updated_at

## Current Status

The app now has a complete transaction tracking system that integrates with the existing budget management. Users can:

1. Set up their budget categories and amounts
2. Add income and expense transactions
3. View transaction history with filtering
4. See summary statistics (total income, expenses, net balance)
5. Navigate between budget and transaction pages

The next logical step would be to integrate the transaction data with the budget goals to show progress and provide insights.