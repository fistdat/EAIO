import React, { ReactNode } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

// Layout component - Temporary placeholder until actual component exists
const MainLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <Outlet />
  </div>
);

// Page components
import HomePage from '../pages/index';
// Using PascalCase for imports
import DashboardPage from '../pages/Dashboard';
import AnalyticsPage from '../pages/Analytics';
import ForecastingPage from '../pages/Forecasting';
import ReportsPage from '../pages/Reports';
import ChatPage from '../components/chat/ChatPage';
// Create a simple 404 page
const NotFoundPage = () => <div className="p-8 text-center">Page Not Found</div>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'forecasting',
        element: <ForecastingPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
} 