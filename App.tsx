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

    try {
      await api.toggleHabitEntry(habitId, date, nextStatus);
    } catch (err) {
      console.error('Failed to toggle habit:', err);
      loadData();
    }
  };

  const handleUpdateGoal = async (goalId: string, valueToAdd: number) => {
    setGoals(prev => prev.map(g =>
      g.id === goalId ? { ...g, current: g.current + valueToAdd } : g
    ));

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
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    try {
      await api.deleteHabit(habitId);
    } catch (err) {
      console.error('Failed to delete habit:', err);
      loadData();
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    try {
      await api.deleteGoal(goalId);
    } catch (err) {
      console.error('Failed to delete goal:', err);
      loadData();
    }
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
      {activeTab === 'history' && <History logs={logs} />}
      {activeTab === 'settings' && <Settings />}
      {activeTab === 'account' && (
        <Account
          user={user}
          habits={habits}
          goals={goals}
          onUpdateUser={setUser}
          onDeleteHabit={handleDeleteHabit}
          onDeleteGoal={handleDeleteGoal}
          onClose={() => setActiveTab('dashboard')}
        />
      )}
    </Layout>
  );
};

export default App;
