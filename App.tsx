import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Insights from './components/Insights';
import History from './components/History';
import Settings from './components/Settings';
import Account from './components/Account';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Friends from './components/Friends';
import { User, Habit, NumericGoal, HabitStatus, ActivityLog } from './types';
import { onAuthChange, logout } from './services/firebase';
import * as api from './services/api';

const App: React.FC = () => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<NumericGoal[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await api.syncUser(
            firebaseUser.displayName || 'User',
            firebaseUser.photoURL || undefined
          );
        } catch (err) {
          console.error('User sync failed:', err);
        }

        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          avatarUrl: firebaseUser.photoURL || undefined,
        });
      } else {
        setUser(null);
        setHabits([]);
        setGoals([]);
        setLogs([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load data from API when user is authenticated
  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [h, g, l] = await Promise.all([
        api.fetchHabits(),
        api.fetchGoals(),
        api.fetchLogs(),
      ]);
      setHabits(h);
      setGoals(g);
      setLogs(l);

      if (h.length === 0 && g.length === 0) {
        setIsOnboarding(true);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleOnboardingComplete = async (newGoals: NumericGoal[], newHabits: Habit[]) => {
    // Save onboarding goals
    for (const g of newGoals) {
      try {
        await api.createGoal({
          id: g.id,
          title: g.title,
          category: g.category,
          target: g.target,
          unit: g.unit,
          deadline: g.deadline,
        });
      } catch (err) {
        console.error('Failed to create onboarding goal:', err);
      }
    }
    // Save onboarding habits
    for (const h of newHabits) {
      try {
        await api.createHabit({
          id: h.id,
          title: h.title,
          category: h.category,
          isNegative: h.isNegative,
        });
      } catch (err) {
        console.error('Failed to create onboarding habit:', err);
      }
    }
    setIsOnboarding(false);
    loadData();
  };

  const handleToggleHabit = async (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const currentStatus = habit.history[date];
    let nextStatus: string | null = HabitStatus.COMPLETED;
    if (currentStatus === HabitStatus.COMPLETED) nextStatus = HabitStatus.FAILED;
    else if (currentStatus === HabitStatus.FAILED) nextStatus = null;

    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const newHistory = { ...h.history };
      if (nextStatus) newHistory[date] = nextStatus as HabitStatus;
      else delete newHistory[date];
      return { ...h, history: newHistory };
    }));

    // Add log entry for habit toggle
    if (nextStatus === HabitStatus.COMPLETED) {
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        type: 'habit',
        description: `${habit.isNegative ? 'Logged' : 'Completed'} "${habit.title}" for ${date}`,
        timestamp: new Date(),
        reversible: false,
        relatedId: habitId,
      };
      setLogs(prev => [newLog, ...prev]);
    }

    try {
      await api.toggleHabitEntry(habitId, date, nextStatus);
    } catch (err) {
      console.error('Failed to toggle habit:', err);
      loadData();
    }
  };

  const handleUpdateGoal = async (goalId: string, valueToAdd: number) => {
    const today = new Date().toISOString().split('T')[0];
    setGoals(prev => prev.map(g =>
      g.id === goalId ? {
        ...g,
        current: g.current + valueToAdd,
        history: [...(g.history || []), { date: today, amount: valueToAdd }],
      } : g
    ));

    // Add log entry instantly
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        type: 'goal',
        description: `Added ${valueToAdd} ${goal.unit} to ${goal.title}`,
        timestamp: new Date(),
        reversible: true,
        reversed: false,
        relatedId: goalId,
      };
      setLogs(prev => [newLog, ...prev]);
    }

    try {
      await api.addGoalProgress(goalId, valueToAdd);
    } catch (err) {
      console.error('Failed to update goal:', err);
      loadData();
    }
  };

  const handleAddHabit = async (habit: { title: string; category: string; isNegative?: boolean }) => {
    const newHabit = {
      id: `h-${Date.now()}`,
      title: habit.title,
      category: habit.category,
      isNegative: habit.isNegative,
    };
    try {
      const created = await api.createHabit(newHabit);
      setHabits(prev => [...prev, created]);
      setLogs(prev => [
        { id: `log-${Date.now()}`, type: 'habit', description: `Created habit "${habit.title}"`, timestamp: new Date() },
        ...prev,
      ]);
    } catch (err) {
      console.error('Failed to create habit:', err);
    }
  };

  const handleAddGoal = async (goal: { title: string; category: string; target: number; unit: string; deadline: string }) => {
    const newGoal = {
      id: `g-${Date.now()}`,
      title: goal.title,
      category: goal.category,
      target: goal.target,
      unit: goal.unit,
      deadline: goal.deadline,
    };
    try {
      const created = await api.createGoal(newGoal);
      setGoals(prev => [...prev, created]);
      setLogs(prev => [
        { id: `log-${Date.now()}`, type: 'goal', description: `Created goal "${goal.title}" — target: ${goal.target} ${goal.unit}`, timestamp: new Date() },
        ...prev,
      ]);
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setLogs(prev => [
      { id: `log-${Date.now()}`, type: 'habit', description: `Deleted habit "${habit?.title}"`, timestamp: new Date() },
      ...prev,
    ]);
    try {
      await api.deleteHabit(habitId);
    } catch (err) {
      console.error('Failed to delete habit:', err);
      loadData();
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    setLogs(prev => [
      { id: `log-${Date.now()}`, type: 'system', description: `Deleted a goal`, timestamp: new Date() },
      ...prev,
    ]);
    try {
      await api.deleteGoal(goalId);
    } catch (err) {
      console.error('Failed to delete goal:', err);
      loadData();
    }
  };

  // Log handlers
  const handleReverseLog = (logId: string) => {
    const log = logs.find(l => l.id === logId);
    if (!log || !log.reversible || log.reversed) return;
    setLogs(prev => prev.map(l => l.id === logId ? { ...l, reversed: true } : l));
    // If it's a goal log, also reverse the goal value
    if (log.type === 'goal' && log.relatedId) {
      const match = log.description.match(/Added ([\d.]+)/);
      if (match) {
        const amount = parseFloat(match[1]);
        setGoals(prev => prev.map(g =>
          g.id === log.relatedId ? { ...g, current: Math.max(0, g.current - amount) } : g
        ));
      }
    }
  };

  const handleDeleteLog = (logId: string) => {
    setLogs(prev => prev.filter(l => l.id !== logId));
  };

  const handleEditLog = (logId: string, newDescription: string, newAmount?: number) => {
    const log = logs.find(l => l.id === logId);
    if (!log) return;

    // If editing a goal log with a new amount, adjust the goal value
    if (log.type === 'goal' && log.relatedId && newAmount !== undefined) {
      const oldMatch = log.description.match(/Added ([\d.]+)/);
      if (oldMatch) {
        const oldAmount = parseFloat(oldMatch[1]);
        const diff = newAmount - oldAmount;
        setGoals(prev => prev.map(g =>
          g.id === log.relatedId ? { ...g, current: Math.max(0, g.current + diff) } : g
        ));
      }
    }

    setLogs(prev => prev.map(l => l.id === logId ? { ...l, description: newDescription } : l));
  };

  // Edit handlers for Account page
  const handleEditHabit = (habitId: string, updates: { title?: string }) => {
    setHabits(prev => prev.map(h =>
      h.id === habitId ? { ...h, ...updates } : h
    ));
    setLogs(prev => [
      { id: `log-${Date.now()}`, type: 'habit', description: `Updated habit "${updates.title}"`, timestamp: new Date() },
      ...prev,
    ]);
  };

  const handleEditGoal = (goalId: string, updates: { title?: string; target?: number; deadline?: string }) => {
    setGoals(prev => prev.map(g =>
      g.id === goalId ? { ...g, ...updates } : g
    ));
    const goal = goals.find(g => g.id === goalId);
    setLogs(prev => [
      { id: `log-${Date.now()}`, type: 'goal', description: `Updated goal "${updates.title || goal?.title}"`, timestamp: new Date() },
      ...prev,
    ]);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  // Rendering
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-textMuted text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={() => { /* onAuthStateChanged handles it */ }} />;
  }

  if (isOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      user={user}
    >
      {activeTab === 'dashboard' && (
        <Dashboard
          user={user}
          habits={habits}
          goals={goals}
          onToggleHabit={handleToggleHabit}
          onUpdateGoal={handleUpdateGoal}
          onAddHabit={handleAddHabit}
          onAddGoal={handleAddGoal}
        />
      )}
      {activeTab === 'insights' && (
        <Insights
          habits={habits}
          goals={goals}
        />
      )}
      {activeTab === 'friends' && <Friends />}
      {activeTab === 'history' && (
        <History
          logs={logs}
          onReverseLog={handleReverseLog}
          onDeleteLog={handleDeleteLog}
          onEditLog={handleEditLog}
        />
      )}
      {activeTab === 'settings' && <Settings />}
      {activeTab === 'account' && (
        <Account
          user={user}
          habits={habits}
          goals={goals}
          onUpdateUser={setUser}
          onDeleteHabit={handleDeleteHabit}
          onDeleteGoal={handleDeleteGoal}
          onEditHabit={handleEditHabit}
          onEditGoal={handleEditGoal}
          onClose={() => setActiveTab('dashboard')}
        />
      )}
    </Layout>
  );
};

export default App;
