import React from 'react';
import { LayoutDashboard, BarChart2, History, Settings, Users, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  user: any;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogout, user }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'insights', icon: BarChart2, label: 'Insights' },
    { id: 'friends', icon: Users, label: 'Friends' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r border-border flex flex-col hidden md:flex">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5 text-white">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-xl font-bold text-textMain">HabitFlow</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-surfaceHighlight text-primary'
                  : 'text-textMuted hover:bg-surface hover:text-textMain'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          {/* User card — click to open Account */}
          <button
            onClick={() => onTabChange('account')}
            className={`w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-surface cursor-pointer mb-2 transition-colors text-left ${
              activeTab === 'account' ? 'bg-surfaceHighlight ring-1 ring-primary' : ''
            }`}
          >
            <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=2ea043&color=fff`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover bg-surfaceHighlight" 
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-textMain truncate">{user.name}</p>
              <p className="text-xs text-textMuted truncate">Free Plan</p>
            </div>
          </button>
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-2 text-textMuted hover:text-danger transition-colors">
            <LogOut size={18} />
            <span className="text-sm">Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Nav Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center justify-between px-4">
         <div className="flex items-center space-x-2">
             <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4 text-white">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
             </div>
             <span className="font-bold text-lg text-textMain">HabitFlow</span>
         </div>
         <button className="text-textMuted" onClick={() => onTabChange('settings')}>
             <Settings size={24} />
         </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:p-8 p-4 pt-20 md:pt-8 relative">
        {children}
      </main>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border h-16 flex justify-around items-center z-50 px-2">
          {navItems.slice(0, 4).map((item) => (
             <button
               key={item.id}
               onClick={() => onTabChange(item.id)}
               className={`flex flex-col items-center justify-center space-y-1 w-full h-full ${
                 activeTab === item.id ? 'text-primary' : 'text-textMuted'
               }`}
             >
               <item.icon size={20} />
               <span className="text-[10px]">{item.label}</span>
             </button>
          ))}
      </div>
    </div>
  );
};

export default Layout;
