import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      {/* User Preferences Section */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">User Preferences</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              defaultValue="Energy Manager"
              className="input mt-1"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              defaultValue="energy.manager@example.com"
              className="input mt-1"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              defaultValue="facility_manager"
            >
              <option value="facility_manager">Facility Manager</option>
              <option value="energy_analyst">Energy Analyst</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Save
          </button>
        </div>
      </div>

      {/* App Settings Section */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Application Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-500">Receive alerts for anomalies and energy spikes</p>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 bg-primary-600"
                role="switch"
                aria-checked="true"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 translate-x-5"
                ></span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Email Reports</h3>
              <p className="text-sm text-gray-500">Receive weekly email reports</p>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 bg-gray-200"
                role="switch"
                aria-checked="false"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 translate-x-0"
                ></span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Dark Mode</h3>
              <p className="text-sm text-gray-500">Use dark theme for the interface</p>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 bg-gray-200"
                role="switch"
                aria-checked="false"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 translate-x-0"
                ></span>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Save
          </button>
        </div>
      </div>

      {/* API Integration Section */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">API Integrations</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="weather-api" className="block text-sm font-medium text-gray-700">
              Weather API Key
            </label>
            <input
              type="text"
              name="weather-api"
              id="weather-api"
              placeholder="Enter your API key"
              className="input mt-1"
            />
            <p className="mt-1 text-sm text-gray-500">Used for weather impact analysis</p>
          </div>
          <div>
            <label htmlFor="building-system" className="block text-sm font-medium text-gray-700">
              Building Management System Integration
            </label>
            <select
              id="building-system"
              name="building-system"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              defaultValue=""
            >
              <option value="">Select a system</option>
              <option value="bacnet">BACnet</option>
              <option value="modbus">Modbus</option>
              <option value="custom">Custom API</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 