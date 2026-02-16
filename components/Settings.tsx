import React, { useState, useEffect } from 'react';
import { Moon, Bell, Shield } from 'lucide-react';

interface SettingsState {
  darkMode: boolean;
  compactView: boolean;
  dailyReminders: boolean;
  goalAlerts: boolean;
  friendPings: boolean;
  weeklyReport: boolean;
}

const Toggle: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
  <button onClick={onChange} className={`w-10 h-6 rounded-full relative transition-colors ${enabled ? 'bg-primary' : 'bg-surfaceHighlight'}`}>
    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${enabled ? 'right-1' : 'left-1'}`} />
  </button>
);

// Light theme CSS variables
const LIGHT_THEME: Record<string, string> = {
  '--color-background': '#f6f8fa',
  '--color-surface': '#ffffff',
  '--color-surfaceHighlight': '#f0f0f0',
  '--color-border': '#d0d7de',
  '--color-textMain': '#24292f',
  '--color-textMuted': '#656d76',
  '--color-primary': '#2ea043',
  '--color-primaryHover': '#238636',
  '--color-danger': '#cf222e',
};

// Dark theme CSS variables
const DARK_THEME: Record<string, string> = {
  '--color-background': '#0d1117',
  '--color-surface': '#161b22',
  '--color-surfaceHighlight': '#21262d',
  '--color-border': '#30363d',
  '--color-textMain': '#f0f6fc',
  '--color-textMuted': '#8b949e',
  '--color-primary': '#2ea043',
  '--color-primaryHover': '#238636',
  '--color-danger': '#da3633',
};

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('habitflow-settings');
    if (saved) return JSON.parse(saved);
    return {
      darkMode: true,
      compactView: false,
      dailyReminders: true,
      goalAlerts: true,
      friendPings: true,
      weeklyReport: false,
    };
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem('habitflow-settings', JSON.stringify(settings));
  }, [settings]);

  // Apply dark/light mode
  useEffect(() => {
    const theme = settings.darkMode ? DARK_THEME : LIGHT_THEME;
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    // Also set a data attribute for potential CSS usage
    root.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
  }, [settings.darkMode]);

  // Apply compact view
  useEffect(() => {
    document.documentElement.setAttribute('data-compact', settings.compactView ? 'true' : 'false');
  }, [settings.compactView]);

  const toggle = (key: keyof SettingsState) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className="text-primary text-sm font-semibold tracking-wide uppercase mb-1">Preferences</h2>
        <h1 className="text-3xl font-bold text-textMain">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-surfaceHighlight/30">
            <h2 className="font-semibold text-textMain flex items-center gap-2">
              <Moon size={18} /> Appearance
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-textMain">Dark Mode</span>
                <p className="text-xs text-textMuted">Use dark color scheme</p>
              </div>
              <Toggle enabled={settings.darkMode} onChange={() => toggle('darkMode')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-textMain">Compact View</span>
                <p className="text-xs text-textMuted">Show more content with less spacing</p>
              </div>
              <Toggle enabled={settings.compactView} onChange={() => toggle('compactView')} />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-surfaceHighlight/30">
            <h2 className="font-semibold text-textMain flex items-center gap-2">
              <Bell size={18} /> Notifications
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-textMain">Daily Reminders (9 AM)</span>
                <p className="text-xs text-textMuted">Get a push notification to log habits</p>
              </div>
              <Toggle enabled={settings.dailyReminders} onChange={() => toggle('dailyReminders')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-textMain">Goal Achievement Alerts</span>
                <p className="text-xs text-textMuted">Celebrate when you hit milestones</p>
              </div>
              <Toggle enabled={settings.goalAlerts} onChange={() => toggle('goalAlerts')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-textMain">Friend Pings</span>
                <p className="text-xs text-textMuted">Notify when friends ping you</p>
              </div>
              <Toggle enabled={settings.friendPings} onChange={() => toggle('friendPings')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-textMain">Weekly Report</span>
                <p className="text-xs text-textMuted">Email summary every Monday</p>
              </div>
              <Toggle enabled={settings.weeklyReport} onChange={() => toggle('weeklyReport')} />
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-surfaceHighlight/30">
            <h2 className="font-semibold text-textMain flex items-center gap-2">
              <Shield size={18} /> Privacy
            </h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-textMuted">
              Your data is stored securely with Neon PostgreSQL and authenticated via Firebase.
              We never share your habit data with third parties.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Settings;
