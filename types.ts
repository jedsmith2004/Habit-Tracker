export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export enum HabitStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED'
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: 'Health' | 'Work' | 'Fitness' | 'Mindfulness' | 'Custom';
  isNegative?: boolean; // e.g. "No smoking" — green cross / red tick
  history: Record<string, HabitStatus>; // date string YYYY-MM-DD -> status
}

export interface NumericGoal {
  id: string;
  title: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  deadline: string; // YYYY-MM-DD
  history: { date: string; amount: number }[];
}

export interface Friend {
  id: string;
  name: string;
  avatarUrl: string;
  status: string;
  lastActive: string;
  goals?: NumericGoal[];
  habits?: Habit[];
}

export interface FriendRequest {
  requestId: string;
  id: string;       // the user who sent the request
  name: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type?: 'goal' | 'habit' | 'friend' | 'event' | 'ping' | 'friend_request' | 'event_invite';
  actionType?: 'friend_request' | 'event_invite';
  actionData?: { friendId?: string; eventId?: string };
}

export interface FeedItem {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar: string;
  description: string;
  timestamp: Date;
}

export interface HabitEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  organizer: string;
  organizerId: string;
  invitees: string[];
  attendees: string[];
  declined: string[];
}

export interface ActivityLog {
  id: string;
  type: 'habit' | 'goal' | 'system' | 'event' | 'friend';
  description: string;
  timestamp: Date;
  reversible?: boolean;
  reversed?: boolean;
  relatedId?: string; // habit or goal id
}

export interface AIInsight {
  title: string;
  content: string;
  type: 'positive' | 'negative' | 'neutral';
}
