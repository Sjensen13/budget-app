// =============================================================================
// EXPENSES CHART PAGE
// =============================================================================
// This page displays a circular pie chart showing all expenses by category
// with percentages and total amounts

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from "chart.js";
import supabase from "../supabaseClient";
import axios from "axios";
import LogoutButton from "../components/LogoutButton";
import "./ExpensesChartPage.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

export default function ExpensesChartPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Color palette for the pie chart
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
    '#36A2EB', '#FFCE56'
  ];

  // Load transactions from the backend API
  const loadTransactions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      const response = await axios.get('http://localhost:5001/api/transactions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      setTransactions(response.data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      setError("Error loading transactions: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Calculate expenses by category
  const getExpensesByCategory = () => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};

    expenses.forEach(expense => {
      if (categoryTotals[expense.category]) {
        categoryTotals[expense.category] += expense.amount;
      } else {
        categoryTotals[expense.category] = expense.amount;
      }
    });

    return categoryTotals;
  };

  // Prepare chart data
  const getChartData = () => {
    const categoryTotals = getExpensesByCategory();
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);

    return {
      labels: categories.map(cat => `${cat} (${((categoryTotals[cat] / total) * 100).toFixed(1)}%)`),
      datasets: [
        {
          data: amounts,
          backgroundColor: colors.slice(0, categories.length),
          borderColor: colors.slice(0, categories.length).map(color => color + '80'),
          borderWidth: 2,
        },
      ],
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: 'Expenses by Category',
        font: {
          size: 20,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const categoryTotals = getExpensesByCategory();
  const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

  if (isLoading) {
    return (
      <div className="expenses-chart-container">
        <div className="loading">Loading expenses data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="expenses-chart-container">
        <div className="error">{error}</div>
        <button onClick={() => navigate('/budget')} className="back-button">
          Back to Budget
        </button>
      </div>
    );
  }

  return (
    <div className="expenses-chart-container">
      {/* Logout Button */}
      <LogoutButton />
      
      <div className="chart-header">
        <h1>Expenses Overview</h1>
        <button onClick={() => navigate('/budget')} className="back-button">
          ← Back to Budget
        </button>
      </div>

      {totalExpenses === 0 ? (
        <div className="no-expenses">
          <h2>No expenses found</h2>
          <p>Add some transactions to see your expense breakdown here.</p>
          <button onClick={() => navigate('/transactions')} className="add-transaction-button">
            Add Transaction
          </button>
        </div>
      ) : (
        <div className="chart-content">
          <div className="total-summary">
            <h2>Total Expenses: ${totalExpenses.toFixed(2)}</h2>
          </div>
          
          <div className="chart-wrapper">
            <Pie data={getChartData()} options={chartOptions} />
          </div>

          <div className="category-breakdown">
            <h3>Category Breakdown</h3>
            <div className="category-list">
              {Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a) // Sort by amount descending
                .map(([category, amount], index) => {
                  const percentage = ((amount / totalExpenses) * 100).toFixed(1);
                  return (
                    <div key={category} className="category-item">
                      <div className="category-color" style={{ backgroundColor: colors[index % colors.length] }}></div>
                      <div className="category-info">
                        <span className="category-name">{category}</span>
                        <span className="category-amount">${amount.toFixed(2)}</span>
                      </div>
                      <div className="category-percentage">{percentage}%</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 