import { getIdToken } from './firebase';
import type { Habit, NumericGoal, ActivityLog } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API request failed');
  }

  return res.json();
}

// --- Users ---

export const syncUser = (name: string, avatarUrl?: string) =>
  request('/users/sync', {
    method: 'POST',
    body: JSON.stringify({ name, avatarUrl }),
  });

export const updateUser = (data: { name?: string; avatarUrl?: string }) =>
  request('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// --- Habits ---

export const fetchHabits = () => request<Habit[]>('/habits');

export const createHabit = (habit: { id: string; title: string; category: string; isNegative?: boolean }) =>
  request<Habit>('/habits', {
    method: 'POST',
    body: JSON.stringify(habit),
  });

export const deleteHabit = (id: string) =>
  request(`/habits/${id}`, { method: 'DELETE' });

export const toggleHabitEntry = (habitId: string, date: string, status: string | null) =>
  request(`/habits/${habitId}/entries`, {
    method: 'PUT',
    body: JSON.stringify({ date, status }),
  });

// --- Goals ---

export const fetchGoals = () => request<NumericGoal[]>('/goals');

export const createGoal = (goal: { id: string; title: string; category: string; target: number; unit: string; deadline: string }) =>
  request<NumericGoal>('/goals', {
    method: 'POST',
    body: JSON.stringify(goal),
  });

export const deleteGoal = (id: string) =>
  request(`/goals/${id}`, { method: 'DELETE' });

export const addGoalProgress = (goalId: string, amount: number) =>
  request(`/goals/${goalId}/add`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });

// --- Logs ---

export const fetchLogs = (limit = 50) =>
  request<ActivityLog[]>(`/logs?limit=${limit}`);
