import React, { useState } from 'react';
import { Check, X, Plus, ChevronLeft, ChevronRight, Bell, LayoutDashboard } from 'lucide-react';
import { Habit, HabitStatus, NumericGoal } from '../types';

interface DashboardProps {
  user: any;
  habits: Habit[];
  goals: NumericGoal[];
  onToggleHabit: (habitId: string, date: string) => void;
  onUpdateGoal: (goalId: string, value: number) => void;
  onAddHabit: (habit: { title: string; category: Habit['category']; isNegative: boolean }) => void;
  onAddGoal: (goal: { title: string; category: string; target: number; unit: string; deadline: string }) => void;
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
              <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="100000"
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
          <button onClick={() => { if (title.trim() && target) { onAdd({ title: title.trim(), category, target: parseInt(target), unit, deadline }); onClose(); } }}
            disabled={!title.trim() || !target}
            className="flex-1 py-2 rounded-lg bg-primary hover:bg-primaryHover disabled:opacity-50 text-white font-medium transition-colors">
            Create Goal
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, habits, goals, onToggleHabit, onUpdateGoal, onAddHabit, onAddGoal }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  // Navigate month
  const changeMonth = (delta: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + delta);
    setSelectedDate(d);
  };

  // Generate dates for the selected month's visible window
  // Show the full week row containing selected date, plus surrounding days
  const getMonthDates = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates: Date[] = [];

    // Start from the Sunday of the week containing the 1st
    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());

    // End at the Saturday of the week containing the last day
    const end = new Date(lastDay);
    end.setDate(end.getDate() + (6 - end.getDay()));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const dates = getMonthDates();
  // Group into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date) => date.getMonth() === selectedDate.getMonth();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
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
          <button className="p-3 bg-surfaceHighlight rounded-full hover:bg-surface border border-border text-textMuted transition">
            <Bell size={20} />
          </button>
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
            return (
              <div key={goal.id} className="bg-surface border border-border rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-textMain">{goal.title}</h4>
                    <p className="text-xs text-textMuted">{goal.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${progress >= 100 ? 'bg-primary/20 text-primary' : 'bg-surfaceHighlight text-textMuted'}`}>
                    {progress >= 100 ? 'Completed' : progress > 80 ? 'On Track' : 'In Progress'}
                  </span>
                </div>

                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-textMain">{goal.current.toLocaleString()} <span className="text-sm font-normal text-textMuted">{goal.unit}</span></div>
                    <p className="text-xs text-textMuted mt-1">Target: {goal.target.toLocaleString()}</p>
                  </div>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-surfaceHighlight" />
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175.93} strokeDashoffset={175.93 - (175.93 * progress) / 100} strokeLinecap="round" className="text-primary transition-all duration-1000 ease-out" />
                    </svg>
                    <span className="absolute text-xs font-bold text-textMain">{progress}%</span>
                  </div>
                </div>

                {/* Quick log buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 10, 100].map(v => (
                    <button key={v} onClick={() => onUpdateGoal(goal.id, v)}
                      className="px-3 py-1.5 text-xs font-medium bg-surfaceHighlight hover:bg-primary hover:text-white text-textMuted rounded-lg border border-border transition-colors">
                      +{v}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <input type="number" placeholder="#" value={customVal}
                      onChange={e => setCustomAmounts(prev => ({ ...prev, [goal.id]: e.target.value }))}
                      className="w-16 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-textMain focus:ring-1 focus:ring-primary outline-none"
                    />
                    <button onClick={() => {
                      const val = parseInt(customVal);
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

      {/* Habit Log */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-primary w-5 h-5" />
            <h3 className="text-lg font-bold text-textMain">Habit Log</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surfaceHighlight rounded-lg p-1">
              <button onClick={() => changeMonth(-1)} className="p-1 hover:text-white text-textMuted"><ChevronLeft size={16} /></button>
              <span className="px-3 text-sm font-medium text-textMain">{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => changeMonth(1)} className="p-1 hover:text-white text-textMuted"><ChevronRight size={16} /></button>
            </div>
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
                {weeks.length > 0 && weeks[0].map((_, dayIdx) => (
                  <th key={dayIdx} className="p-2 text-center" colSpan={1}>
                    <div className="text-xs text-textMuted">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayIdx]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => (
                <React.Fragment key={habit.id}>
                  {weeks.map((week, wIdx) => (
                    <tr key={`${habit.id}-w${wIdx}`} className={`border-t border-border hover:bg-surfaceHighlight/30 transition-colors ${wIdx > 0 ? 'border-t-0' : ''}`}>
                      {wIdx === 0 && (
                        <td className="p-4 sticky left-0 bg-surface z-10" rowSpan={weeks.length}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surfaceHighlight flex items-center justify-center text-textMuted">
                              {habit.category === 'Health' ? '🍎' : habit.category === 'Fitness' ? '🏃' : habit.category === 'Work' ? '💼' : habit.category === 'Mindfulness' ? '🧘' : '⭐'}
                            </div>
                            <div>
                              <p className="font-medium text-textMain">{habit.title}</p>
                              <p className="text-xs text-textMuted">{habit.category}{habit.isNegative ? ' · Negative' : ''}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      {week.map(date => {
                        const dateStr = formatDate(date);
                        const status = habit.history[dateStr];
                        const isFuture = date > new Date();
                        const inMonth = isCurrentMonth(date);

                        // Negative habits: green cross (good = avoided), red tick (bad = did it)
                        const isGood = habit.isNegative
                          ? status === HabitStatus.FAILED   // For negative: "FAILED" means they avoided it (good)
                          : status === HabitStatus.COMPLETED; // For positive: "COMPLETED" is good
                        const isBad = habit.isNegative
                          ? status === HabitStatus.COMPLETED // For negative: "COMPLETED" means they did the bad thing
                          : status === HabitStatus.FAILED;   // For positive: "FAILED" is bad

                        return (
                          <td key={dateStr} className={`p-1 text-center ${isToday(date) ? 'bg-surfaceHighlight/20' : ''} ${!inMonth ? 'opacity-30' : ''}`}>
                            {!isFuture && (
                              <button
                                onClick={() => onToggleHabit(habit.id, dateStr)}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all mx-auto ${
                                  isGood ? 'bg-primary text-white' :
                                  isBad ? 'bg-surfaceHighlight text-danger border border-danger/30' :
                                  'bg-surfaceHighlight/50 text-textMuted hover:bg-surfaceHighlight border border-transparent hover:border-border'
                                }`}
                                title={habit.isNegative ? (isGood ? 'Avoided ✓' : isBad ? 'Did it ✗' : 'Not logged') : undefined}
                              >
                                {isGood ? (habit.isNegative ? <X size={18} strokeWidth={3} /> : <Check size={18} strokeWidth={3} />) :
                                 isBad ? (habit.isNegative ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />) :
                                 <div className="w-1.5 h-1.5 rounded-full bg-border" />}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
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