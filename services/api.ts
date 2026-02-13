import { getIdToken } from './firebase';
import type { Habit, NumericGoal, ActivityLog, Friend, FriendRequest, FeedItem, HabitEvent } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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

export const editHabit = (habitId: string, updates: { title?: string }) =>
  request(`/habits/${habitId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

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

export const editGoal = (goalId: string, updates: { title?: string; target?: number; deadline?: string }) =>
  request(`/goals/${goalId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

export const addGoalProgress = (goalId: string, amount: number) =>
  request(`/goals/${goalId}/add`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });

// --- Logs ---

export const fetchLogs = (limit = 50) =>
  request<ActivityLog[]>(`/logs?limit=${limit}`);

export const reverseLog = (logId: string) =>
  request(`/logs/${logId}/reverse`, { method: 'PUT' });

export const editLog = (logId: string, description: string, newAmount?: number) =>
  request(`/logs/${logId}`, {
    method: 'PUT',
    body: JSON.stringify({ description, newAmount }),
  });

// --- Friends ---

export const fetchFriends = () =>
  request<Friend[]>('/friends');

export const fetchFriendRequests = () =>
  request<FriendRequest[]>('/friends/requests');

export const searchUsers = (query: string) =>
  request<{ id: string; name: string; email: string; avatarUrl: string }[]>(`/friends/search?q=${encodeURIComponent(query)}`);

export const sendFriendRequest = (friendId: string) =>
  request<{ success: boolean; name: string }>('/friends', {
    method: 'POST',
    body: JSON.stringify({ friendId }),
  });

export const acceptFriendRequest = (friendId: string) =>
  request<Friend>('/friends/accept', {
    method: 'POST',
    body: JSON.stringify({ friendId }),
  });

export const rejectFriendRequest = (friendId: string) =>
  request('/friends/reject', {
    method: 'POST',
    body: JSON.stringify({ friendId }),
  });

export const removeFriend = (friendId: string) =>
  request(`/friends/${friendId}`, { method: 'DELETE' });

export const fetchFeed = (opts?: { offset?: number; limit?: number; friendId?: string }) => {
  const params = new URLSearchParams();
  if (opts?.offset) params.set('offset', String(opts.offset));
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.friendId) params.set('friendId', opts.friendId);
  const qs = params.toString();
  return request<FeedItem[]>(`/friends/feed${qs ? `?${qs}` : ''}`);
};

export const pingFriend = (friendId: string) =>
  request<{ success: boolean; friendName: string }>('/friends/ping', {
    method: 'POST',
    body: JSON.stringify({ friendId }),
  });

// --- Events ---

export const fetchEvents = () =>
  request<HabitEvent[]>('/events');

export const createEvent = (event: { id: string; title: string; description: string; location: string; date: string; time: string }) =>
  request<HabitEvent>('/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });

export const inviteToEvent = (eventId: string, friendIds: string[]) =>
  request('/events/' + eventId + '/invite', {
    method: 'POST',
    body: JSON.stringify({ friendIds }),
  });

export const rsvpEvent = (eventId: string, attending: boolean) =>
  request('/events/' + eventId + '/rsvp', {
    method: 'POST',
    body: JSON.stringify({ attending }),
  });
