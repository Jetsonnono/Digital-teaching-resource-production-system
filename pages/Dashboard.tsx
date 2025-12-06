import React from 'react';
import { Clock, FileText, Image as ImageIcon, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
      <Icon className="text-white" size={24} />
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

const RecentActivityItem = ({ title, type, date }: { title: string, type: string, date: string }) => (
  <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-4">
      <div className={`w-2 h-2 rounded-full ${type === 'Lesson Plan' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
      <div>
        <h4 className="font-medium text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500">{type}</p>
      </div>
    </div>
    <span className="text-xs text-slate-400 font-mono">{date}</span>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500 mt-1">Welcome back, Professor. Here is your resource overview.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={FileText} label="Total Resources" value="124" color="bg-blue-500" />
        <StatCard icon={Zap} label="Generated Today" value="8" color="bg-amber-500" />
        <StatCard icon={ImageIcon} label="Media Assets" value="45" color="bg-purple-500" />
        <StatCard icon={Clock} label="Hours Saved" value="32" color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Recent Creations</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-1">
            <RecentActivityItem title="Photosynthesis Introduction" type="Lesson Plan" date="10:42 AM" />
            <RecentActivityItem title="Advanced Calculus Quiz" type="Quiz" date="Yesterday" />
            <RecentActivityItem title="Audio Transcript Analysis" type="Media Analysis" date="Yesterday" />
            <RecentActivityItem title="French Revolution Slides" type="Presentation" date="2 days ago" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-bold mb-4">Quick Action</h3>
          <p className="text-blue-100 text-sm mb-6">Start creating a new multimodal lesson plan with Gemini 2.5.</p>
          <Link to="/create" className="block w-full bg-white text-blue-600 text-center py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Create Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;