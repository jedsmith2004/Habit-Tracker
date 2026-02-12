import React, { useState } from 'react';
import { MOCK_FRIENDS } from '../constants';
import { Friend, FeedItem, HabitEvent } from '../types';
import { MapPin, Search, UserPlus, Zap, CalendarPlus, ChevronRight, Clock, Users, Check, X } from 'lucide-react';
import { findNearbyPlaces } from '../services/geminiService';

const MOCK_FEED: FeedItem[] = [
  { id: 'f1', friendId: '1', friendName: 'Alex Chen', friendAvatar: 'https://ui-avatars.com/api/?name=Alex+Chen&background=2ea043&color=fff', description: 'Completed 50 push-ups', timestamp: new Date(Date.now() - 3600000) },
  { id: 'f2', friendId: '2', friendName: 'Sam Rivera', friendAvatar: 'https://ui-avatars.com/api/?name=Sam+Rivera&background=238636&color=fff', description: 'Reached 1,000km running goal!', timestamp: new Date(Date.now() - 7200000) },
  { id: 'f3', friendId: '3', friendName: 'Jordan Lee', friendAvatar: 'https://ui-avatars.com/api/?name=Jordan+Lee&background=0e4429&color=fff', description: 'Started a new meditation habit', timestamp: new Date(Date.now() - 86400000) },
];

const MOCK_EVENTS: HabitEvent[] = [
  { id: 'e1', title: 'Morning Run Club', description: '5K group run at the park', location: 'Central Park, Gate 2', date: '2025-01-15', time: '06:30', organizer: 'Alex Chen', organizerId: '1', invitees: ['2','3'], attendees: ['1','2'], declined: [] },
  { id: 'e2', title: 'Meditation Session', description: 'Guided 30-min meditation', location: 'Zen Studio, Floor 3', date: '2025-01-18', time: '18:00', organizer: 'Jordan Lee', organizerId: '3', invitees: ['1','2'], attendees: ['3'], declined: [] },
];

const Friends: React.FC = () => {
  const [friends] = useState<Friend[]>(MOCK_FRIENDS);
  const [feed] = useState<FeedItem[]>(MOCK_FEED);
  const [events, setEvents] = useState<HabitEvent[]>(MOCK_EVENTS);
  const [nearbyGyms, setNearbyGyms] = useState<string[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', location: '', date: '', time: '' });

  const handleFindGyms = async () => {
    setLoadingMap(true);
    const lat = 37.7749;
    const lng = -122.4194;
    const places = await findNearbyPlaces(lat, lng, "Climbing Gyms");
    setNearbyGyms(places);
    setLoadingMap(false);
  };

  const filteredFriends = friends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleRSVP = (eventId: string, attending: boolean) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      const myId = 'me';
      if (attending) {
        return { ...e, attendees: [...e.attendees, myId], declined: e.declined.filter(id => id !== myId) };
      } else {
        return { ...e, declined: [...e.declined, myId], attendees: e.attendees.filter(id => id !== myId) };
      }
    }));
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    const ev: HabitEvent = {
      id: `e-${Date.now()}`,
      ...newEvent,
      organizer: 'You',
      organizerId: 'me',
      invitees: friends.map(f => f.id),
      attendees: ['me'],
      declined: [],
    };
    setEvents(prev => [...prev, ev]);
    setShowCreateEvent(false);
    setNewEvent({ title: '', description: '', location: '', date: '', time: '' });
  };

  const timeAgo = (d: Date) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-primary text-sm font-semibold tracking-wide uppercase mb-1">Community</h2>
          <h1 className="text-3xl font-bold text-textMain">Friends & Events</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateEvent(true)} className="flex items-center gap-2 bg-surfaceHighlight hover:bg-surface border border-border text-textMain px-4 py-2 rounded-lg transition-colors">
            <CalendarPlus size={18} /> New Event
          </button>
          <button onClick={() => setShowAddFriend(true)} className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg transition-colors">
            <UserPlus size={18} /> Add Friend
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Friends list + feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search friends..." className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-textMain placeholder-textMuted focus:outline-none focus:border-primary" />
          </div>

          {/* Friends Row */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {filteredFriends.map(friend => (
              <button key={friend.id} onClick={() => setSelectedFriend(selectedFriend?.id === friend.id ? null : friend)}
                className={`flex flex-col items-center gap-1 min-w-[80px] p-3 rounded-xl border transition-all ${
                  selectedFriend?.id === friend.id ? 'bg-primary/10 border-primary' : 'bg-surface border-border hover:border-textMuted'
                }`}>
                <img src={friend.avatarUrl} alt={friend.name} className="w-10 h-10 rounded-full border-2 border-surfaceHighlight" />
                <span className="text-xs text-textMain font-medium truncate w-full text-center">{friend.name.split(' ')[0]}</span>
                <span className="text-[10px] text-textMuted truncate w-full text-center">{friend.status}</span>
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="font-bold text-textMain mb-4">Activity Feed</h3>
            <div className="space-y-3">
              {feed.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surfaceHighlight transition-colors">
                  <img src={item.friendAvatar} alt="" className="w-9 h-9 rounded-full mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-textMain"><span className="font-semibold">{item.friendName}</span> {item.description}</p>
                    <span className="text-xs text-textMuted">{timeAgo(item.timestamp)}</span>
                  </div>
                </div>
              ))}
              {feed.length === 0 && <p className="text-textMuted text-sm">No recent activity from friends.</p>}
            </div>
          </div>

          {/* Events */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="font-bold text-textMain mb-4 flex items-center gap-2">
              <CalendarPlus size={18} className="text-primary" /> Upcoming Events
            </h3>
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                    className="w-full p-4 flex justify-between items-center hover:bg-surfaceHighlight transition-colors text-left">
                    <div>
                      <h4 className="font-semibold text-textMain">{event.title}</h4>
                      <p className="text-xs text-textMuted flex items-center gap-2 mt-1">
                        <Clock size={12} /> {event.date} at {event.time}
                        <span className="mx-1">•</span>
                        <MapPin size={12} /> {event.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-textMuted flex items-center gap-1"><Users size={12} /> {event.attendees.length}</span>
                      <ChevronRight size={16} className={`text-textMuted transition-transform ${expandedEvent === event.id ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                  {expandedEvent === event.id && (
                    <div className="p-4 border-t border-border bg-surfaceHighlight/30 space-y-3">
                      <p className="text-sm text-textMuted">{event.description}</p>
                      <p className="text-xs text-textMuted">Organized by <span className="text-textMain font-medium">{event.organizer}</span></p>
                      <div className="flex gap-2">
                        <button onClick={() => handleRSVP(event.id, true)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors">
                          <Check size={14} /> Attend
                        </button>
                        <button onClick={() => handleRSVP(event.id, false)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger/20 text-danger text-sm hover:bg-danger/30 transition-colors">
                          <X size={14} /> Decline
                        </button>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surfaceHighlight text-textMuted text-sm hover:text-textMain transition-colors border border-border">
                          <MapPin size={14} /> Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {events.length === 0 && <p className="text-textMuted text-sm">No upcoming events.</p>}
            </div>
          </div>
        </div>

        {/* Right: Selected friend profile OR places */}
        <div className="space-y-6">
          {selectedFriend ? (
            <div className="bg-surface border border-border rounded-xl p-6 text-center">
              <img src={selectedFriend.avatarUrl} alt="" className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-surfaceHighlight" />
              <h3 className="text-xl font-bold text-textMain">{selectedFriend.name}</h3>
              <p className="text-sm text-textMuted mb-4">{selectedFriend.status}</p>
              <p className="text-xs text-textMuted mb-4">Last active: {selectedFriend.lastActive}</p>
              <button className="w-full flex items-center justify-center gap-2 bg-primary/20 text-primary py-2 rounded-lg hover:bg-primary/30 transition-colors">
                <Zap size={16} /> Ping to Workout
              </button>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-bold text-textMain mb-2">Meet Up Spots</h3>
              <p className="text-sm text-textMuted mb-4">Find nearby gyms and parks.</p>
              <button onClick={handleFindGyms} disabled={loadingMap}
                className="w-full bg-surfaceHighlight hover:bg-border border border-border text-textMain py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                <MapPin size={16} className="text-primary" />
                {loadingMap ? 'Searching...' : 'Find Nearby Spots'}
              </button>
              {nearbyGyms.length > 0 && (
                <div className="mt-4 space-y-2">
                  {nearbyGyms.map((gym, i) => (
                    <div key={i} className="text-sm p-2 bg-background rounded border border-border text-textMain">{gym}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddFriend(false)}>
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-textMain mb-4">Add Friend</h3>
            <input type="text" placeholder="Search by name or email..." className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-textMain placeholder-textMuted focus:outline-none focus:border-primary mb-4" />
            <p className="text-sm text-textMuted mb-4">Friend requests coming soon — search to find and connect with other users.</p>
            <div className="flex justify-end">
              <button onClick={() => setShowAddFriend(false)} className="px-4 py-2 text-textMuted hover:text-textMain transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateEvent(false)}>
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-textMain mb-4">Create Event</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Event title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-textMain placeholder-textMuted focus:outline-none focus:border-primary" />
              <textarea placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-textMain placeholder-textMuted focus:outline-none focus:border-primary resize-none h-20" />
              <input type="text" placeholder="Location" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-textMain placeholder-textMuted focus:outline-none focus:border-primary" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="bg-background border border-border rounded-lg px-4 py-2.5 text-textMain focus:outline-none focus:border-primary" />
                <input type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="bg-background border border-border rounded-lg px-4 py-2.5 text-textMain focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCreateEvent(false)} className="px-4 py-2 text-textMuted hover:text-textMain transition-colors">Cancel</button>
              <button onClick={handleCreateEvent} disabled={!newEvent.title || !newEvent.date}
                className="px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg font-medium transition-colors disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
