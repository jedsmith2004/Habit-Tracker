import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Plus, ChevronLeft, ChevronRight, Bell, LayoutDashboard, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Habit, HabitStatus, NumericGoal, Notification } from '../types';

interface DashboardProps {
  user: any;
  habits: Habit[];
  goals: NumericGoal[];
  onToggleHabit: (habitId: string, date: string) => void;
  onUpdateGoal: (goalId: string, value: number) => void;
  onAddHabit: (habit: { title: string; category: Habit['category']; isNegative: boolean }) => void;
  onAddGoal: (goal: { title: string; category: string; target: number; unit: string; deadline: string }) => void;
  externalNotifications?: Notification[];
  onClearNotification?: (id: string) => void;
  onAcceptFriendRequest?: (friendId: string) => void;
  onRejectFriendRequest?: (friendId: string) => void;
  onRSVPFromNotification?: (eventId: string, attending: boolean) => void;
}

// --- Add Habit Modal ---
const AddHabitModal: React.FC<{ onClose: () => void; onAdd: DashboardProps['onAddHabit'] }> = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Habit['category']>('Health');
  const [isNegative, setIsNegative] = useState(false);
  const categories: Habit['category'][] = ['Health', 'Fitness', 'Work', 'Mindfulness', 'Custom'];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-textMain mb-4">New Habit</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-textMuted mb-1">Habit Name</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Wake up before 9am"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none" autoFocus />
          </div>
          <div>
            <label className="block text-sm text-textMuted mb-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${category === c ? 'bg-primary text-white border-primary' : 'bg-surfaceHighlight text-textMuted border-border hover:border-textMuted'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-textMuted mb-1">Habit Type</label>
            <div className="flex gap-3">
              <button onClick={() => setIsNegative(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${!isNegative ? 'bg-primary/10 text-primary border-primary' : 'bg-surfaceHighlight text-textMuted border-border hover:border-textMuted'}`}>
                ✅ Positive <span className="block text-xs text-textMuted mt-0.5">e.g. Exercise daily</span>
              </button>
              <button onClick={() => setIsNegative(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${isNegative ? 'bg-danger/10 text-danger border-danger' : 'bg-surfaceHighlight text-textMuted border-border hover:border-textMuted'}`}>
                🚫 Negative <span className="block text-xs text-textMuted mt-0.5">e.g. No smoking</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-textMuted hover:bg-surfaceHighlight transition-colors">Cancel</button>
          <button onClick={() => { if (title.trim()) { onAdd({ title: title.trim(), category, isNegative }); onClose(); } }}
            disabled={!title.trim()}
            className="flex-1 py-2 rounded-lg bg-primary hover:bg-primaryHover disabled:opacity-50 text-white font-medium transition-colors">
            Create Habit
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Add Goal Modal ---
const AddGoalModal: React.FC<{ onClose: () => void; onAdd: DashboardProps['onAddGoal'] }> = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Strength');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('reps');
  const [deadline, setDeadline] = useState(new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]);
  const categories = ['Strength', 'Endurance', 'Mindfulness', 'Health', 'Custom'];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-textMain mb-4">New Goal</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-textMuted mb-1">Goal Name</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Push-ups"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none" autoFocus />
          </div>
          <div>
            <label className="block text-sm text-textMuted mb-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${category === c ? 'bg-primary text-white border-primary' : 'bg-surfaceHighlight text-textMuted border-border hover:border-textMuted'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-textMuted mb-1">Target</label>
              <input type="number" step="any" value={target} onChange={e => setTarget(e.target.value)} placeholder="100000"
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm text-textMuted mb-1">Unit</label>
              <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="reps"
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-textMuted mb-1">Deadline</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-textMuted hover:bg-surfaceHighlight transition-colors">Cancel</button>
          <button onClick={() => { if (title.trim() && target) { onAdd({ title: title.trim(), category, target: parseFloat(target), unit, deadline }); onClose(); } }}
            disabled={!title.trim() || !target}
            className="flex-1 py-2 rounded-lg bg-primary hover:bg-primaryHover disabled:opacity-50 text-white font-medium transition-colors">
            Create Goal
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, habits, goals, onToggleHabit, onUpdateGoal, onAddHabit, onAddGoal, externalNotifications = [], onClearNotification, onAcceptFriendRequest, onRejectFriendRequest, onRSVPFromNotification }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Generate notifications from goal milestones + external
  const notifications: Notification[] = [...externalNotifications];
  goals.forEach(g => {
    const progress = Math.round((g.current / g.target) * 100);
    if (progress >= 100) {
      notifications.push({ id: `n-${g.id}-done`, message: `🎉 Goal "${g.title}" completed!`, timestamp: new Date(), read: false });
    } else if (progress >= 75) {
      notifications.push({ id: `n-${g.id}-75`, message: `🔥 "${g.title}" is 75% done — keep going!`, timestamp: new Date(), read: false });
    }
  });
  habits.forEach(h => {
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (h.history[ds] === HabitStatus.COMPLETED) streak++;
      else break;
    }
    if (streak >= 7) {
      notifications.push({ id: `n-${h.id}-streak`, message: `🏆 "${h.title}" — 7 day streak!`, timestamp: new Date(), read: false });
    }
  });

  // Week navigation — show 7 days for the selected week (Mon–Sun)
  const getWeekDates = (): Date[] => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7));
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const weekRangeLabel = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const sameMonth = start.getMonth() === end.getMonth();
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = sameMonth
      ? end.toLocaleDateString('en-US', { day: 'numeric' })
      : end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} – ${endStr}, ${end.getFullYear()}`;
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const daysLeft = (deadline: string) => {
    const dl = new Date(deadline);
    const now = new Date();
    return Math.max(0, Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const dailyTarget = (goal: NumericGoal) => {
    const remaining = Math.max(0, goal.target - goal.current);
    const days = daysLeft(goal.deadline);
    if (days <= 0) return remaining;
    return remaining / days;
  };

  const goalBadge = (goal: NumericGoal): { label: string; color: string; icon: React.ReactNode } => {
    const progress = goal.current / goal.target;
    if (progress >= 1) return { label: 'Completed', color: 'bg-primary/20 text-primary', icon: <Check size={12} /> };
    const dl = new Date(goal.deadline);
    const now = new Date();
    const firstEntry = goal.history?.length > 0 ? new Date(goal.history[0].date) : new Date(now.getFullYear(), 0, 1);
    const totalDays = Math.max(1, (dl.getTime() - firstEntry.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(1, (now.getTime() - firstEntry.getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = elapsedDays / totalDays;
    if (progress >= expectedProgress * 1.1) return { label: 'Above Target', color: 'bg-primary/20 text-primary', icon: <TrendingUp size={12} /> };
    if (progress >= expectedProgress * 0.85) return { label: 'On Target', color: 'bg-blue-500/20 text-blue-400', icon: <Minus size={12} /> };
    return { label: 'Below Target', color: 'bg-danger/20 text-danger', icon: <TrendingDown size={12} /> };
  };

  const fmt = (n: number) => {
    if (Number.isInteger(n)) return n.toLocaleString();
    return n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {showAddHabit && <AddHabitModal onClose={() => setShowAddHabit(false)} onAdd={onAddHabit} />}
      {showAddGoal && <AddGoalModal onClose={() => setShowAddGoal(false)} onAdd={onAddGoal} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-primary text-sm font-semibold tracking-wide uppercase mb-1">Overview</h2>
          <h1 className="text-3xl md:text-4xl font-bold text-textMain">{getGreeting()}, {user.name.split(' ')[0]}</h1>
          <p className="text-textMuted mt-1">Let's check off some wins today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xl font-bold text-textMain">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            <p className="text-sm text-textMuted">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
          </div>
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 bg-surfaceHighlight rounded-full hover:bg-surface border border-border text-textMuted transition relative">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="fixed left-3 right-3 top-20 w-auto max-h-[70vh] bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-80 sm:max-h-none">
                <div className="p-3 border-b border-border">
                  <h4 className="font-bold text-textMain text-sm">Notifications</h4>
                </div>
                <div className="max-h-[calc(70vh-3rem)] overflow-y-auto sm:max-h-64">
                  {notifications.length === 0 ? (
                    <p className="text-textMuted text-sm p-4 text-center">All caught up! 🎉</p>
                  ) : notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 border-b border-border/50 hover:bg-surfaceHighlight/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-textMain">{n.message}</p>
                          <p className="text-[10px] text-textMuted mt-1">Just now</p>
                        </div>
                        {onClearNotification && n.type && !n.actionType && (
                          <button onClick={() => onClearNotification(n.id)} className="text-textMuted hover:text-textMain shrink-0 mt-0.5">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      {/* Friend request actions */}
                      {n.actionType === 'friend_request' && n.actionData?.friendId && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => onAcceptFriendRequest?.(n.actionData!.friendId!)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primaryHover text-white rounded-lg text-xs font-medium transition-colors">
                            <Check size={12} /> Accept
                          </button>
                          <button onClick={() => onRejectFriendRequest?.(n.actionData!.friendId!)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-surfaceHighlight hover:bg-border text-textMuted rounded-lg text-xs font-medium transition-colors border border-border">
                            <X size={12} /> Decline
                          </button>
                        </div>
                      )}
                      {/* Event invite actions */}
                      {n.actionType === 'event_invite' && n.actionData?.eventId && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => onRSVPFromNotification?.(n.actionData!.eventId!, true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primaryHover text-white rounded-lg text-xs font-medium transition-colors">
                            <Check size={12} /> Accept
                          </button>
                          <button onClick={() => onRSVPFromNotification?.(n.actionData!.eventId!, false)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-surfaceHighlight hover:bg-border text-textMuted rounded-lg text-xs font-medium transition-colors border border-border">
                            <X size={12} /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5zm7 10l-4-4 1.41-1.41L12 12.17l5.59-5.59L19 8l-7 7z"/></svg>
            <h3 className="text-lg font-bold text-textMain">Current Goals</h3>
          </div>
          <button onClick={() => setShowAddGoal(true)} className="text-primary text-sm font-medium hover:text-primaryHover flex items-center gap-1">
            <Plus size={16} /> Add Goal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map(goal => {
            const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
            const customVal = customAmounts[goal.id] || '';
            const badge = goalBadge(goal);
            const days = daysLeft(goal.deadline);
            const daily = dailyTarget(goal);

            return (
              <div key={goal.id} className="bg-surface border border-border rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-textMain">{goal.title}</h4>
                    <p className="text-xs text-textMuted">{goal.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${badge.color}`}>
                    {badge.icon} {badge.label}
                  </span>
                </div>

                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-3xl font-bold text-textMain">{fmt(goal.current)} <span className="text-sm font-normal text-textMuted">{goal.unit}</span></div>
                    <p className="text-xs text-textMuted mt-1">Target: {fmt(goal.target)} {goal.unit}</p>
                  </div>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-surfaceHighlight" />
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175.93} strokeDashoffset={175.93 - (175.93 * progress) / 100} strokeLinecap="round" className="text-primary transition-all duration-1000 ease-out" />
                    </svg>
                    <span className="absolute text-xs font-bold text-textMain">{progress}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4 text-xs">
                  <span className="text-textMuted">
                    Daily: <span className="text-textMain font-semibold">{fmt(Math.round(daily * 10) / 10)} {goal.unit}/day</span>
                  </span>
                  <span className={`font-semibold ${days <= 7 ? 'text-danger' : days <= 30 ? 'text-yellow-400' : 'text-textMuted'}`}>
                    {days === 0 ? 'Deadline today' : `${days}d left`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 10, 100].map(v => (
                    <button key={v} onClick={() => onUpdateGoal(goal.id, v)}
                      className="px-3 py-1.5 text-xs font-medium bg-surfaceHighlight hover:bg-primary hover:text-white text-textMuted rounded-lg border border-border transition-colors">
                      +{v}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <input type="number" step="any" placeholder="#" value={customVal}
                      onChange={e => setCustomAmounts(prev => ({ ...prev, [goal.id]: e.target.value }))}
                      className="w-16 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-textMain focus:ring-1 focus:ring-primary outline-none"
                    />
                    <button onClick={() => {
                      const val = parseFloat(customVal);
                      if (val > 0) { onUpdateGoal(goal.id, val); setCustomAmounts(prev => ({ ...prev, [goal.id]: '' })); }
                    }}
                      className="px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primaryHover text-white rounded-lg transition-colors">
                      Log
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit Log — Week view, single row per habit */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-primary w-5 h-5" />
            <h3 className="text-lg font-bold text-textMain">Habit Log</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surfaceHighlight rounded-lg p-1">
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-1 hover:text-white text-textMuted"><ChevronLeft size={16} /></button>
              <span className="px-3 text-sm font-medium text-textMain whitespace-nowrap">{weekRangeLabel()}</span>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-1 hover:text-white text-textMuted" disabled={weekOffset >= 0}>
                <ChevronRight size={16} className={weekOffset >= 0 ? 'opacity-30' : ''} />
              </button>
            </div>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:text-primaryHover font-medium">Today</button>
            )}
            <button onClick={() => setShowAddHabit(true)} className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primaryHover">
              <Plus size={16} /> Add Habit
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-sm font-medium text-textMuted min-w-[200px] sticky left-0 bg-surface z-10">Habit</th>
                {weekDates.map((date, dayIdx) => (
                  <th key={dayIdx} className="p-2 text-center">
                    <div className="text-[10px] text-textMuted uppercase">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][dayIdx]}</div>
                    <div className={`text-xs font-semibold mt-0.5 ${isToday(date) ? 'text-primary' : 'text-textMain'}`}>
                      {date.getDate()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => (
                <tr key={habit.id} className="border-t border-border hover:bg-surfaceHighlight/30 transition-colors">
                  <td className="p-4 sticky left-0 bg-surface z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surfaceHighlight flex items-center justify-center text-textMuted shrink-0">
                        {habit.category === 'Health' ? '🍎' : habit.category === 'Fitness' ? '🏃' : habit.category === 'Work' ? '💼' : habit.category === 'Mindfulness' ? '🧘' : '⭐'}
                      </div>
                      <div>
                        <p className="font-medium text-textMain">{habit.title}</p>
                        <p className="text-xs text-textMuted">{habit.category}{habit.isNegative ? ' · Negative' : ''}</p>
                      </div>
                    </div>
                  </td>
                  {weekDates.map(date => {
                    const dateStr = formatDate(date);
                    const status = habit.history[dateStr];
                    const isFuture = date > new Date();

                    let cellState: 'good' | 'bad' | 'empty' = 'empty';
                    if (habit.isNegative) {
                      if (status === HabitStatus.COMPLETED) cellState = 'bad';
                      else if (status === HabitStatus.FAILED) cellState = 'good';
                    } else {
                      if (status === HabitStatus.COMPLETED) cellState = 'good';
                      else if (status === HabitStatus.FAILED) cellState = 'bad';
                    }

                    return (
                      <td key={dateStr} className={`p-1 text-center ${isToday(date) ? 'bg-primary/5' : ''}`}>
                        {!isFuture && (
                          <button
                            onClick={() => onToggleHabit(habit.id, dateStr)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all mx-auto ${
                              cellState === 'good' ? 'bg-primary text-white' :
                              cellState === 'bad' ? 'bg-surfaceHighlight text-danger border border-danger/30' :
                              'bg-surfaceHighlight/50 text-textMuted hover:bg-surfaceHighlight border border-transparent hover:border-border'
                            }`}
                            title={habit.isNegative
                              ? (cellState === 'good' ? 'Avoided ✓' : cellState === 'bad' ? 'Did it ✗' : 'Not logged')
                              : (cellState === 'good' ? 'Completed ✓' : cellState === 'bad' ? 'Missed ✗' : 'Not logged')
                            }
                          >
                            {cellState === 'good' ? (habit.isNegative ? <X size={18} strokeWidth={3} /> : <Check size={18} strokeWidth={3} />) :
                             cellState === 'bad' ? (habit.isNegative ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />) :
                             <div className="w-1.5 h-1.5 rounded-full bg-border" />}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t border-border/50 border-dashed">
                <td className="p-4" colSpan={8}>
                  <button onClick={() => setShowAddHabit(true)} className="flex items-center gap-3 text-textMuted hover:text-textMain transition-colors w-full">
                    <div className="w-8 h-8 rounded-lg border border-dashed border-textMuted flex items-center justify-center"><Plus size={16} /></div>
                    <span className="text-sm font-medium">Create new habit...</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
