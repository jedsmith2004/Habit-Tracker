import React, { useState, useEffect, useRef } from 'react';
import { NumericGoal, Habit } from '../types';
import * as api from '../services/api';
import { Search, Loader2, UserPlus, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: (goals: NumericGoal[], habits: Habit[]) => void;
}

const SUGGESTED_GOALS: { title: string; category: string; target: number; unit: string }[] = [
  { title: 'Push-ups Challenge', category: 'Strength', target: 100000, unit: 'reps' },
  { title: 'Pull-ups Master', category: 'Strength', target: 10000, unit: 'reps' },
  { title: 'Yearly Run', category: 'Endurance', target: 1000, unit: 'km' },
  { title: 'Book Worm', category: 'Mindfulness', target: 50, unit: 'books' },
  { title: 'Meditation Hours', category: 'Mindfulness', target: 100, unit: 'hours' },
  { title: 'Water Intake', category: 'Health', target: 730, unit: 'liters' },
];

const SUGGESTED_HABITS: { title: string; category: 'Health' | 'Work' | 'Fitness' | 'Mindfulness' | 'Custom'; isNegative?: boolean }[] = [
  { title: 'Wake up at 6 AM', category: 'Health' },
  { title: 'Exercise 30 mins', category: 'Fitness' },
  { title: 'Read 20 pages', category: 'Mindfulness' },
  { title: 'Meditate 10 mins', category: 'Mindfulness' },
  { title: 'No social media', category: 'Custom', isNegative: true },
  { title: 'No sugar', category: 'Health', isNegative: true },
  { title: 'Drink 2L water', category: 'Health' },
  { title: 'Code 1 hour', category: 'Work' },
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
  const [goalTargets, setGoalTargets] = useState<Record<number, number>>({});
  const [selectedHabits, setSelectedHabits] = useState<number[]>([]);
  const [customGoal, setCustomGoal] = useState({ title: '', target: '', unit: '' });
  const [customHabit, setCustomHabit] = useState({ title: '', isNegative: false });
  const [customGoals, setCustomGoals] = useState<{ title: string; target: number; unit: string }[]>([]);
  const [customHabits, setCustomHabits] = useState<{ title: string; isNegative: boolean }[]>([]);

  // Friend invite state
  const [friendQuery, setFriendQuery] = useState('');
  const [friendResults, setFriendResults] = useState<{ id: string; name: string; email: string; avatarUrl: string }[]>([]);
  const [friendSearching, setFriendSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced friend search
  useEffect(() => {
    if (friendQuery.trim().length < 2) {
      setFriendResults([]);
      setFriendSearching(false);
      return;
    }
    setFriendSearching(true);
    setInviteError(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await api.searchUsers(friendQuery.trim());
        setFriendResults(results);
      } catch (err) {
        console.error('Friend search failed:', err);
        setFriendResults([]);
      } finally {
        setFriendSearching(false);
      }
    }, 400);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [friendQuery]);

  const handleSendRequest = async (userId: string) => {
    setSendingId(userId);
    setInviteError(null);
    try {
      await api.sendFriendRequest(userId);
      setSentRequests(prev => new Set(prev).add(userId));
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send request');
    } finally {
      setSendingId(null);
    }
  };

  const toggleGoal = (idx: number) => {
    setSelectedGoals(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    if (!goalTargets[idx]) setGoalTargets(prev => ({ ...prev, [idx]: SUGGESTED_GOALS[idx].target }));
  };

  const toggleHabit = (idx: number) => {
    setSelectedHabits(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const addCustomGoal = () => {
    if (!customGoal.title || !customGoal.target) return;
    setCustomGoals(prev => [...prev, { title: customGoal.title, target: parseInt(customGoal.target), unit: customGoal.unit || 'units' }]);
    setCustomGoal({ title: '', target: '', unit: '' });
  };

  const addCustomHabit = () => {
    if (!customHabit.title) return;
    setCustomHabits(prev => [...prev, { ...customHabit }]);
    setCustomHabit({ title: '', isNegative: false });
  };

  const handleFinish = () => {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const deadline = `${oneYearFromNow.getFullYear()}-${String(oneYearFromNow.getMonth() + 1).padStart(2, '0')}-${String(oneYearFromNow.getDate()).padStart(2, '0')}`;

    const goals: NumericGoal[] = [
      ...selectedGoals.map((idx) => ({
        id: crypto.randomUUID(),
        title: SUGGESTED_GOALS[idx].title,
        category: SUGGESTED_GOALS[idx].category,
        target: goalTargets[idx] || SUGGESTED_GOALS[idx].target,
        current: 0,
        unit: SUGGESTED_GOALS[idx].unit,
        deadline,
        history: [],
      })),
      ...customGoals.map((g) => ({
        id: crypto.randomUUID(),
        title: g.title,
        category: 'Custom',
        target: g.target,
        current: 0,
        unit: g.unit,
        deadline,
        history: [],
      })),
    ];

    const habits: Habit[] = [
      ...selectedHabits.map((idx) => ({
        id: crypto.randomUUID(),
        title: SUGGESTED_HABITS[idx].title,
        category: SUGGESTED_HABITS[idx].category,
        isNegative: SUGGESTED_HABITS[idx].isNegative,
        history: {},
      })),
      ...customHabits.map((h) => ({
        id: crypto.randomUUID(),
        title: h.title,
        category: 'Custom' as const,
        isNegative: h.isNegative,
        history: {},
      })),
    ];

    onComplete(goals, habits);
  };

  const totalGoals = selectedGoals.length + customGoals.length;
  const totalHabits = selectedHabits.length + customHabits.length;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-surface border border-border rounded-2xl p-8 shadow-2xl">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-3 h-3 rounded-full transition-colors ${s === stage ? 'bg-primary' : s < stage ? 'bg-primary/50' : 'bg-surfaceHighlight'}`} />
          ))}
        </div>

        {/* Stage 1: Goals */}
        {stage === 1 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-textMain mb-2">Welcome to HabitFlow</h1>
              <p className="text-textMuted">Step 1: Choose your goals and set your targets.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {SUGGESTED_GOALS.map((goal, idx) => (
                <div key={idx} onClick={() => toggleGoal(idx)}
                  className={`cursor-pointer border rounded-xl p-4 transition-all ${
                    selectedGoals.includes(idx) ? 'bg-primary/10 border-primary shadow-[0_0_0_2px_rgba(46,160,67,0.4)]' : 'bg-surfaceHighlight/50 border-border hover:border-textMuted'
                  }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-textMain text-sm">{goal.title}</span>
                    {selectedGoals.includes(idx) && <span className="text-primary">✓</span>}
                  </div>
                  {selectedGoals.includes(idx) ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input type="number" value={goalTargets[idx] || goal.target}
                        onChange={e => { e.stopPropagation(); setGoalTargets(prev => ({ ...prev, [idx]: parseInt(e.target.value) || 0 })); }}
                        onClick={e => e.stopPropagation()}
                        className="w-24 bg-background border border-border rounded px-2 py-1 text-textMain text-sm focus:outline-none focus:border-primary" />
                      <span className="text-xs text-textMuted">{goal.unit}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-textMuted">{goal.target.toLocaleString()} {goal.unit}</p>
                  )}
                  <span className="inline-block mt-2 text-[10px] uppercase bg-surface border border-border px-2 py-0.5 rounded text-textMuted">{goal.category}</span>
                </div>
              ))}
            </div>

            {/* Custom goal */}
            <div className="border border-border rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-textMain mb-2">Add Custom Goal</h4>
              <div className="flex gap-2">
                <input type="text" placeholder="Goal name" value={customGoal.title} onChange={e => setCustomGoal({ ...customGoal, title: e.target.value })}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus:border-primary" />
                <input type="number" placeholder="Target" value={customGoal.target} onChange={e => setCustomGoal({ ...customGoal, target: e.target.value })}
                  className="w-24 bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Unit" value={customGoal.unit} onChange={e => setCustomGoal({ ...customGoal, unit: e.target.value })}
                  className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus:border-primary" />
                <button onClick={addCustomGoal} disabled={!customGoal.title || !customGoal.target}
                  className="px-3 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">Add</button>
              </div>
              {customGoals.length > 0 && (
                <div className="mt-3 space-y-1">
                  {customGoals.map((g, i) => (
                    <div key={i} className="flex items-center justify-between bg-surfaceHighlight rounded px-3 py-2 text-sm">
                      <span className="text-textMain">{g.title} — {g.target} {g.unit}</span>
                      <button onClick={() => setCustomGoals(prev => prev.filter((_, j) => j !== i))} className="text-textMuted hover:text-danger">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setStage(2)} disabled={totalGoals === 0}
              className="w-full bg-primary hover:bg-primaryHover disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">
              Next — Choose Habits ({totalGoals} goal{totalGoals !== 1 ? 's' : ''} selected)
            </button>
          </>
        )}

        {/* Stage 2: Habits */}
        {stage === 2 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-textMain mb-2">Daily Habits</h1>
              <p className="text-textMuted">Step 2: Pick habits to track every day.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {SUGGESTED_HABITS.map((habit, idx) => (
                <div key={idx} onClick={() => toggleHabit(idx)}
                  className={`cursor-pointer border rounded-xl p-4 transition-all ${
                    selectedHabits.includes(idx) ? 'bg-primary/10 border-primary shadow-[0_0_0_2px_rgba(46,160,67,0.4)]' : 'bg-surfaceHighlight/50 border-border hover:border-textMuted'
                  }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-textMain text-sm">{habit.title}</span>
                    {selectedHabits.includes(idx) && <span className="text-primary">✓</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] uppercase bg-surface border border-border px-2 py-0.5 rounded text-textMuted">{habit.category}</span>
                    {habit.isNegative && <span className="text-[10px] uppercase bg-danger/10 px-2 py-0.5 rounded text-danger">avoid</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom habit */}
            <div className="border border-border rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-textMain mb-2">Add Custom Habit</h4>
              <div className="flex gap-2 items-center">
                <input type="text" placeholder="Habit name" value={customHabit.title} onChange={e => setCustomHabit({ ...customHabit, title: e.target.value })}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus:border-primary" />
                <label className="flex items-center gap-1 text-xs text-textMuted cursor-pointer whitespace-nowrap">
                  <input type="checkbox" checked={customHabit.isNegative} onChange={e => setCustomHabit({ ...customHabit, isNegative: e.target.checked })}
                    className="accent-danger" />
                  Negative
                </label>
                <button onClick={addCustomHabit} disabled={!customHabit.title}
                  className="px-3 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">Add</button>
              </div>
              {customHabits.length > 0 && (
                <div className="mt-3 space-y-1">
                  {customHabits.map((h, i) => (
                    <div key={i} className="flex items-center justify-between bg-surfaceHighlight rounded px-3 py-2 text-sm">
                      <span className="text-textMain">{h.title} {h.isNegative ? '(avoid)' : ''}</span>
                      <button onClick={() => setCustomHabits(prev => prev.filter((_, j) => j !== i))} className="text-textMuted hover:text-danger">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStage(1)} className="px-6 py-3 border border-border rounded-xl text-textMuted hover:text-textMain transition-colors">
                Back
              </button>
              <button onClick={() => setStage(3)} disabled={totalHabits === 0}
                className="flex-1 bg-primary hover:bg-primaryHover disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">
                Next — Invite Friends ({totalHabits} habit{totalHabits !== 1 ? 's' : ''} selected)
              </button>
            </div>
          </>
        )}

        {/* Stage 3: Invite Friends (optional) */}
        {stage === 3 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-textMain mb-2">Invite Friends</h1>
              <p className="text-textMuted">Step 3: (Optional) Search for friends by name or email.</p>
            </div>

            <div className="border border-border rounded-xl p-5 mb-6">
              {/* Search input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={friendQuery}
                  onChange={e => setFriendQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-textMain placeholder-textMuted text-sm focus:outline-none focus:border-primary"
                />
                {friendSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted animate-spin" />
                )}
              </div>

              {/* Error message */}
              {inviteError && (
                <p className="text-danger text-xs mb-3">{inviteError}</p>
              )}

              {/* Search results */}
              {friendResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {friendResults.map(user => {
                    const alreadySent = sentRequests.has(user.id);
                    const isSending = sendingId === user.id;
                    return (
                      <div key={user.id} className="flex items-center justify-between bg-surfaceHighlight/50 rounded-lg px-3 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-textMain truncate">{user.name}</p>
                            <p className="text-xs text-textMuted truncate">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          disabled={alreadySent || isSending}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                            alreadySent
                              ? 'bg-primary/10 text-primary cursor-default'
                              : 'bg-primary hover:bg-primaryHover text-white disabled:opacity-50'
                          }`}
                        >
                          {isSending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : alreadySent ? (
                            <><Check className="w-3.5 h-3.5" /> Sent</>
                          ) : (
                            <><UserPlus className="w-3.5 h-3.5" /> Add</>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {friendQuery.trim().length >= 2 && !friendSearching && friendResults.length === 0 && (
                <p className="text-center text-textMuted text-sm py-4">No users found matching "{friendQuery}"</p>
              )}

              {friendQuery.trim().length < 2 && (
                <p className="text-center text-textMuted text-xs py-2">Type at least 2 characters to search</p>
              )}

              {/* Sent summary */}
              {sentRequests.size > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-xs text-primary font-medium">✓ {sentRequests.size} friend request{sentRequests.size !== 1 ? 's' : ''} sent</p>
                </div>
              )}
            </div>

            <p className="text-xs text-textMuted text-center mb-4">You can always add more friends later from the Friends tab.</p>

            <div className="bg-surface border border-border rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-textMain mb-2">Your Setup Summary</h4>
              <p className="text-sm text-textMuted">{totalGoals} goal{totalGoals !== 1 ? 's' : ''} · {totalHabits} habit{totalHabits !== 1 ? 's' : ''}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStage(2)} className="px-6 py-3 border border-border rounded-xl text-textMuted hover:text-textMain transition-colors">
                Back
              </button>
              <button onClick={handleFinish}
                className="flex-1 bg-primary hover:bg-primaryHover text-white font-bold py-3 rounded-xl transition-all">
                Start My Journey 🚀
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
