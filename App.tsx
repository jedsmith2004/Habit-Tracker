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
import { User, Habit, NumericGoal, HabitStatus, ActivityLog, Friend, FriendRequest, HabitEvent, FeedItem, Notification as AppNotification } from './types';
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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [events, setEvents] = useState<HabitEvent[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
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
      const [h, g, l, fr, frReq, feedData] = await Promise.all([
        api.fetchHabits(),
        api.fetchGoals(),
        api.fetchLogs(),
        api.fetchFriends(),
        api.fetchFriendRequests(),
        api.fetchFeed(),
      ]);
      setHabits(h);
      setGoals(g);
      setLogs(l);
      setFriends(fr);
      setFriendRequests(frReq);
      setFeed(feedData);

      // Generate notifications for pending friend requests
      const frNotifs: AppNotification[] = frReq.map(r => ({
        id: `fr-req-${r.id}`,
        message: `👋 ${r.name} sent you a friend request`,
        timestamp: new Date(r.createdAt),
        read: false,
        type: 'friend_request' as const,
        actionType: 'friend_request' as const,
        actionData: { friendId: r.id },
      }));
      setNotifications(prev => {
        // Keep non-friend-request notifications, replace friend request ones
        const nonFrNotifs = prev.filter(n => n.type !== 'friend_request');
        return [...frNotifs, ...nonFrNotifs];
      });

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
    let nextStatus: string | null;

    if (habit.isNegative) {
      // Negative: empty → FAILED(avoided/good) → COMPLETED(did it/bad) → empty
      if (!currentStatus) nextStatus = HabitStatus.FAILED;
      else if (currentStatus === HabitStatus.FAILED) nextStatus = HabitStatus.COMPLETED;
      else nextStatus = null;
    } else {
      // Positive: empty → COMPLETED(done/good) → FAILED(missed/bad) → empty
      if (!currentStatus) nextStatus = HabitStatus.COMPLETED;
      else if (currentStatus === HabitStatus.COMPLETED) nextStatus = HabitStatus.FAILED;
      else nextStatus = null;
    }

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
        reversible: true,
        reversed: false,
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
  const handleReverseLog = async (logId: string) => {
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
    // If it's a habit log, remove the habit entry for that date
    if (log.type === 'habit' && log.relatedId) {
      const dateMatch = log.description.match(/for (\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const date = dateMatch[1];
        setHabits(prev => prev.map(h => {
          if (h.id !== log.relatedId) return h;
          const newHistory = { ...h.history };
          delete newHistory[date];
          return { ...h, history: newHistory };
        }));
      }
    }
    // Persist to server
    try {
      await api.reverseLog(logId);
    } catch (err) {
      console.error('Failed to reverse log:', err);
      loadData(); // rollback by reloading
    }
  };

  const handleEditLog = async (logId: string, newDescription: string, newAmount?: number) => {
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
    try {
      await api.editLog(logId, newDescription, newAmount);
    } catch (err) {
      console.error('Failed to edit log:', err);
      loadData();
    }
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

  // ---------- Friend Handlers ----------
  const handleSendFriendRequest = async (friendId: string) => {
    try {
      const result = await api.sendFriendRequest(friendId);
      setLogs(prev => [
        { id: `log-${Date.now()}`, type: 'friend', description: `Sent friend request to "${result.name}"`, timestamp: new Date() },
        ...prev,
      ]);
      setNotifications(prev => [
        { id: `notif-${Date.now()}`, message: `📤 Friend request sent to ${result.name}`, timestamp: new Date(), read: false, type: 'friend' },
        ...prev,
      ]);
    } catch (err) {
      console.error('Failed to send friend request:', err);
    }
  };

  const handleAcceptFriendRequest = async (friendId: string) => {
    try {
      const newFriend = await api.acceptFriendRequest(friendId);
      setFriends(prev => [...prev, newFriend]);
      setFriendRequests(prev => prev.filter(r => r.id !== friendId));
      // Remove the friend request notification
      setNotifications(prev => prev.filter(n => !(n.actionType === 'friend_request' && n.actionData?.friendId === friendId)));
      setLogs(prev => [
        { id: `log-${Date.now()}`, type: 'friend', description: `Accepted friend request from "${newFriend.name}"`, timestamp: new Date() },
        ...prev,
      ]);
      setNotifications(prev => [
        { id: `notif-${Date.now()}`, message: `✅ You and ${newFriend.name} are now friends!`, timestamp: new Date(), read: false, type: 'friend' },
        ...prev,
      ]);
      // Refresh feed since we have a new friend
      const feedData = await api.fetchFeed();
      setFeed(feedData);
    } catch (err) {
      console.error('Failed to accept friend request:', err);
    }
  };

  const handleRejectFriendRequest = async (friendId: string) => {
    try {
      await api.rejectFriendRequest(friendId);
      const req = friendRequests.find(r => r.id === friendId);
      setFriendRequests(prev => prev.filter(r => r.id !== friendId));
      setNotifications(prev => prev.filter(n => !(n.actionType === 'friend_request' && n.actionData?.friendId === friendId)));
      setLogs(prev => [
        { id: `log-${Date.now()}`, type: 'friend', description: `Declined friend request from "${req?.name || 'someone'}"`, timestamp: new Date() },
        ...prev,
      ]);
    } catch (err) {
      console.error('Failed to reject friend request:', err);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    setFriends(prev => prev.filter(f => f.id !== friendId));
    if (friend) {
      setLogs(prev => [
        { id: `log-${Date.now()}`, type: 'friend', description: `Removed "${friend.name}" from friends`, timestamp: new Date() },
        ...prev,
      ]);
    }
    try {
      await api.removeFriend(friendId);
    } catch (err) {
      console.error('Failed to remove friend:', err);
      if (friend) setFriends(prev => [...prev, friend]);
    }
  };

  const handlePingFriend = (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;
    setNotifications(prev => [
      { id: `notif-${Date.now()}`, message: `⚡ You pinged ${friend.name} to workout!`, timestamp: new Date(), read: false, type: 'ping' },
      ...prev,
    ]);
    setLogs(prev => [
      { id: `log-${Date.now()}`, type: 'friend', description: `Pinged "${friend.name}" to workout`, timestamp: new Date() },
      ...prev,
    ]);
  };

  const handleRSVP = (eventId: string, attending: boolean) => {
    if (!user) return;
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      const uid = user.id;
      if (attending) {
        return { ...e, attendees: [...e.attendees.filter(a => a !== uid), uid], declined: e.declined.filter(d => d !== uid) };
      } else {
        return { ...e, declined: [...e.declined.filter(d => d !== uid), uid], attendees: e.attendees.filter(a => a !== uid) };
      }
    }));
    const event = events.find(e => e.id === eventId);
    if (event) {
      setNotifications(prev => [
        { id: `notif-${Date.now()}`, message: attending ? `✅ You're attending "${event.title}"` : `❌ You declined "${event.title}"`, timestamp: new Date(), read: false, type: 'event' },
        ...prev,
      ]);
      setLogs(prev => [
        { id: `log-${Date.now()}`, type: 'event', description: `${attending ? 'Attending' : 'Declined'} event "${event.title}"`, timestamp: new Date() },
        ...prev,
      ]);
    }
  };

  const handleCreateEvent = (eventData: { title: string; description: string; location: string; date: string; time: string }) => {
    if (!user) return;
    const newEvent: HabitEvent = {
      id: `event-${Date.now()}`,
      ...eventData,
      organizer: user.name,
      organizerId: user.id,
      invitees: [],
      attendees: [user.id],
      declined: [],
    };
    setEvents(prev => [...prev, newEvent]);
    setLogs(prev => [
      { id: `log-${Date.now()}`, type: 'event', description: `Created event "${eventData.title}"`, timestamp: new Date() },
      ...prev,
    ]);
    setNotifications(prev => [
      { id: `notif-${Date.now()}`, message: `📅 Event "${eventData.title}" created!`, timestamp: new Date(), read: false, type: 'event' },
      ...prev,
    ]);
  };

  const handleInviteToEvent = (eventId: string, friendIds: string[]) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      const newInvitees = [...new Set([...e.invitees, ...friendIds])];
      return { ...e, invitees: newInvitees };
    }));
    const event = events.find(e => e.id === eventId);
    friendIds.forEach(fid => {
      const friend = friends.find(f => f.id === fid);
      if (friend && event) {
        setNotifications(prev => [
          { id: `notif-${Date.now()}-${fid}`, message: `📨 Invited ${friend.name} to "${event.title}"`, timestamp: new Date(), read: false, type: 'event' },
          ...prev,
        ]);
      }
    });
    if (event) {
      setLogs(prev => [
        { id: `log-${Date.now()}`, type: 'event', description: `Invited ${friendIds.length} friend(s) to "${event.title}"`, timestamp: new Date() },
        ...prev,
      ]);
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
          externalNotifications={notifications}
          onClearNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
          onAcceptFriendRequest={handleAcceptFriendRequest}
          onRejectFriendRequest={handleRejectFriendRequest}
          onRSVPFromNotification={handleRSVP}
        />
      )}
      {activeTab === 'insights' && (
        <Insights
          habits={habits}
          goals={goals}
        />
      )}
      {activeTab === 'friends' && (
        <Friends
          friends={friends}
          events={events}
          feed={feed}
          onSendFriendRequest={handleSendFriendRequest}
          onRemoveFriend={handleRemoveFriend}
          onPing={handlePingFriend}
          onRSVP={handleRSVP}
          onCreateEvent={handleCreateEvent}
          onInviteToEvent={handleInviteToEvent}
          currentUserId={user.id}
        />
      )}
      {activeTab === 'history' && (
        <History
          logs={logs}
          onReverseLog={handleReverseLog}
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
