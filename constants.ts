import { Habit, HabitStatus, NumericGoal, Friend, ActivityLog } from './types';

export const INITIAL_HABITS: Habit[] = [
  { id: 'h1', title: 'Wake up before 9am', category: 'Health', history: {} },
  { id: 'h2', title: 'Go to bed before midnight', category: 'Health', history: {} },
  { id: 'h3', title: 'Brush teeth', category: 'Health', history: {} },
  { id: 'h4', title: 'Shower', category: 'Health', history: {} },
  { id: 'h5', title: 'Eat breakfast', category: 'Health', history: {} },
  { id: 'h6', title: 'Eat lunch', category: 'Health', history: {} },
  { id: 'h7', title: 'Eat dinner', category: 'Health', history: {} },
  { id: 'h8', title: 'Go climbing', category: 'Fitness', history: {} },
  { id: 'h9', title: 'Work (1hr+)', category: 'Work', history: {} },
  { id: 'h10', title: 'Go for a run', category: 'Fitness', history: {} },
  { id: 'h11', title: 'Meditate', category: 'Mindfulness', history: {} },
];

export const INITIAL_GOALS: NumericGoal[] = [
  {
    id: 'g1',
    title: 'Push-ups',
    category: 'Strength',
    target: 100000,
    current: 75240,
    unit: 'reps',
    deadline: '2024-12-31',
    history: []
  },
  {
    id: 'g2',
    title: 'Pull-ups',
    category: 'Strength',
    target: 10000,
    current: 1250,
    unit: 'reps',
    deadline: '2024-12-31',
    history: []
  },
  {
    id: 'g3',
    title: 'Running',
    category: 'Endurance',
    target: 1000,
    current: 450,
    unit: 'km',
    deadline: '2024-12-31',
    history: []
  }
];

export const MOCK_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Sarah Connor', avatarUrl: 'https://picsum.photos/40/40?random=1', status: 'Crushing goals!', lastActive: '2m ago' },
  { id: 'f2', name: 'John Wick', avatarUrl: 'https://picsum.photos/40/40?random=2', status: 'Running...', lastActive: '1h ago' },
  { id: 'f3', name: 'Ellen Ripley', avatarUrl: 'https://picsum.photos/40/40?random=3', status: 'Climbing', lastActive: '5h ago' },
];

export const MOCK_LOGS: ActivityLog[] = [
  { id: 'l1', type: 'habit', description: 'Checked off "Wake up 9am"', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: 'l2', type: 'goal', description: 'Logged 50 pushups', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
  { id: 'l3', type: 'habit', description: 'Checked off "Meditate"', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
];

// Helper to generate last 365 days for consistency map
export const generateYearData = () => {
  const data = [];
  const now = new Date();
  for (let i = 365; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      count: Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0,
    });
  }
  return data;
};
