import React from 'react';
import { LayoutDashboard, PenTool, Library, Settings, GraduationCap } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom'; // We'll use HashRouter in App

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  active: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, to, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
          <GraduationCap className="text-white" size={20} />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">EduGenius</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          to="/" 
          active={location.pathname === '/'} 
        />
        <SidebarItem 
          icon={PenTool} 
          label="Create Resource" 
          to="/create" 
          active={location.pathname === '/create'} 
        />
        <SidebarItem 
          icon={Library} 
          label="My Library" 
          to="/library" 
          active={location.pathname === '/library'} 
        />
      </nav>

      <div className="p-4 border-t border-slate-800">
        <SidebarItem 
          icon={Settings} 
          label="Settings" 
          to="/settings" 
          active={location.pathname === '/settings'} 
        />
        <div className="mt-4 px-4 text-xs text-slate-500">
          v1.0.0 (LoongArch Ready)
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
