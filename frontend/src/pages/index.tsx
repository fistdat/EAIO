import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Cpu, LineChart, MessageCircle } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, to }) => (
  <Link 
    to={to}
    className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
  >
    <div className="text-blue-600 mb-2">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </Link>
);

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Energy AI Optimizer</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Intelligent energy optimization through advanced AI analysis and recommendations
        </p>
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <FeatureCard
          title="Energy Dashboard"
          description="Monitor real-time energy consumption and identify usage patterns"
          icon={<BarChart3 size={32} />}
          to="/dashboard"
        />
        <FeatureCard
          title="Advanced Analytics"
          description="Deep insights into energy consumption and optimization opportunities"
          icon={<Cpu size={32} />}
          to="/analytics"
        />
        <FeatureCard
          title="Consumption Forecast"
          description="Predict future energy usage with AI-powered forecasting models"
          icon={<LineChart size={32} />}
          to="/forecasting"
        />
        <FeatureCard
          title="Ask EnergyAI"
          description="Chat with our AI assistant about your energy usage and get personalized recommendations"
          icon={<MessageCircle size={32} />}
          to="/chat"
        />
      </section>
    </div>
  );
} 