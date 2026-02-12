import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Friend, HabitEvent, FeedItem } from '../types';
import { MapPin, Search, UserPlus, Zap, CalendarPlus, ChevronRight, Clock, Users, Check, X, ArrowLeft, TrendingUp, Target, Loader2, UserMinus, Send } from 'lucide-react';
import { findNearbyPlaces } from '../services/geminiService';
import * as api from '../services/api';

interface FriendsProps {
  friends: Friend[];
  events: HabitEvent[];
  feed: FeedItem[];
  onSendFriendRequest: (friendId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  onPing: (friendId: string) => void;
  onRSVP: (eventId: string, attending: boolean) => void;
  onCreateEvent: (event: Omit<HabitEvent, 'id' | 'organizer' | 'organizerId' | 'invitees' | 'attendees' | 'declined'>) => void;
  onInviteToEvent: (eventId: string, friendIds: string[]) => void;
  currentUserId: string;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

const Friends: React.FC<FriendsProps> = ({ friends, events, feed, onSendFriendRequest, onRemoveFriend, onPing, onRSVP, onCreateEvent, onInviteToEvent, currentUserId }) => {
  const [nearbyGyms, setNearbyGyms] = useState<string[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', location: '', date: '', time: '' });
  const [showFriendProfile, setShowFriendProfile] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState<string | null>(null); // eventId
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);

  // Add Friend search state
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFindGyms = async () => {
    setLoadingMap(true);
    const lat = 37.7749;
    const lng = -122.4194;
    const places = await findNearbyPlaces(lat, lng, "Climbing Gyms");
    setNearbyGyms(places);
    setLoadingMap(false);
  };

  const filteredFriends = friends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Debounced search for add-friend modal
  useEffect(() => {
    if (addSearchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await api.searchUsers(addSearchQuery.trim());
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [addSearchQuery]);

  const handleAddSearchedFriend = async (userId: string) => {
    setAddingId(userId);
    onSendFriendRequest(userId);
    setSentRequests(prev => new Set(prev).add(userId));
    setAddingId(null);
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    onCreateEvent(newEvent);
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

  const friendById = useMemo(() => {
    const map: Record<string, Friend> = {};
    friends.forEach(f => { map[f.id] = f; });
    return map;
  }, [friends]);

  const myRSVP = (event: HabitEvent) => {
    if (event.attendees.includes(currentUserId)) return 'attending';
    if (event.declined.includes(currentUserId)) return 'declined';
    return 'pending';
  };

  const openFriendProfile = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowFriendProfile(true);
  };

  const fmt = (n: number) => {
    if (Number.isInteger(n)) return n.toLocaleString();
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // ---- Friend Profile View ----
  if (showFriendProfile && selectedFriend) {
    const friendGoals = selectedFriend.goals || [];
    return (
      <div className="max-w-4xl mx-auto pb-20">
        <button onClick={() => setShowFriendProfile(false)} className="flex items-center gap-2 text-textMuted hover:text-textMain mb-6 transition-colors">
          <ArrowLeft size={18} /> Back to Friends
        </button>
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img src={selectedFriend.avatarUrl} alt="" className="w-16 h-16 rounded-full border-4 border-surfaceHighlight" />
            <div>
              <h1 className="text-2xl font-bold text-textMain">{selectedFriend.name}</h1>
              <p className="text-sm text-textMuted">{selectedFriend.status}</p>
              <p className="text-xs text-textMuted mt-0.5">Last active: {selectedFriend.lastActive}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => { onPing(selectedFriend.id); }} className="flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-lg hover:bg-primary/30 transition-colors">
                <Zap size={16} /> Ping to Workout
              </button>
              <button onClick={() => { if (confirm(`Remove ${selectedFriend.name} from friends?`)) { onRemoveFriend(selectedFriend.id); setShowFriendProfile(false); } }}
                className="flex items-center gap-2 bg-danger/20 text-danger px-4 py-2 rounded-lg hover:bg-danger/30 transition-colors">
                <UserMinus size={16} /> Remove
              </button>
            </div>
          </div>
        </div>

        {/* Friend's Goals */}
        <h2 className="text-lg font-bold text-textMain mb-4 flex items-center gap-2">
          <Target size={18} className="text-primary" /> {selectedFriend.name.split(' ')[0]}'s Goals
        </h2>
        {friendGoals.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-textMuted">
            <p>No goals to show yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {friendGoals.map(goal => {
              const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
              return (
                <div key={goal.id} className="bg-surface border border-border rounded-xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-textMain">{goal.title}</h4>
                      <p className="text-xs text-textMuted">{goal.category}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                      progress >= 100 ? 'bg-primary/20 text-primary' : progress >= 50 ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      <TrendingUp size={12} /> {progress}%
                    </span>
                  </div>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="text-2xl font-bold text-textMain">{fmt(goal.current)} <span className="text-sm font-normal text-textMuted">/ {fmt(goal.target)} {goal.unit}</span></div>
                    </div>
                  </div>
                  <div className="w-full bg-surfaceHighlight rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                  </div>
                  {goal.deadline && (
                    <p className="text-xs text-textMuted mt-2">Deadline: {new Date(goal.deadline).toLocaleDateString()}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Friend's recent feed items */}
        <h2 className="text-lg font-bold text-textMain mb-4">Recent Activity</h2>
        {(() => {
          const friendFeed = feed.filter(f => f.friendId === selectedFriend.id);
          if (friendFeed.length === 0) return <p className="text-textMuted text-sm bg-surface border border-border rounded-xl p-6 text-center">No recent activity.</p>;
          return (
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              {friendFeed.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surfaceHighlight transition-colors">
                  <img src={item.friendAvatar} alt="" className="w-9 h-9 rounded-full mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-textMain">{item.description}</p>
                    <span className="text-xs text-textMuted">{timeAgo(item.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    );
  }

  // ---- Main Friends View ----
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
          <button onClick={() => { setShowAddFriend(true); setAddSearchQuery(''); setSearchResults([]); }} className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg transition-colors">
            <UserPlus size={18} /> Add Friend
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Friends list + feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search friends list */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter friends..." className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-textMain placeholder-textMuted focus:outline-none focus:border-primary" />
          </div>

          {/* Friends Row */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {filteredFriends.length === 0 && (
              <div className="text-textMuted text-sm py-4 px-2">No friends yet. Add some!</div>
            )}
            {filteredFriends.map(friend => (
              <button key={friend.id} onClick={() => openFriendProfile(friend)}
                className="flex flex-col items-center gap-1 min-w-[80px] p-3 rounded-xl border transition-all bg-surface border-border hover:border-primary hover:bg-primary/5">
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
              {events.map(event => {
                const rsvp = myRSVP(event);
                const isOrganizer = event.organizerId === currentUserId;
                // Helper: get RSVP status for any person
                const personRSVP = (pid: string): 'attending' | 'declined' | 'invited' => {
                  if (event.attendees.includes(pid)) return 'attending';
                  if (event.declined.includes(pid)) return 'declined';
                  return 'invited'; // in invitees but hasn't responded
                };
                // All known people for this event: attendees + invitees + declined (deduplicated)
                const allPeople = [...new Set([...event.attendees, ...event.invitees, ...event.declined])];

                return (
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
                      <div className="flex items-center gap-3">
                        {/* Attendee avatars with RSVP badges */}
                        <div className="flex -space-x-2">
                          {allPeople.slice(0, 5).map(pid => {
                            const f = friendById[pid];
                            const status = personRSVP(pid);
                            const badgeColor = status === 'attending' ? 'bg-green-500 text-white' : status === 'declined' ? 'bg-red-500 text-white' : 'bg-gray-400 text-white';
                            const badgeIcon = status === 'attending' ? '✓' : status === 'declined' ? '✗' : '?';
                            return (
                              <div key={pid} className="relative">
                                {f ? (
                                  <img src={f.avatarUrl} alt={f.name} className="w-7 h-7 rounded-full border-2 border-surface" title={`${f.name} — ${status}`} />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-primary/20 border-2 border-surface flex items-center justify-center text-[10px] text-primary font-bold">
                                    {pid === currentUserId ? 'You' : '?'}
                                  </div>
                                )}
                                <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${badgeColor} ring-1 ring-surface`}>
                                  {badgeIcon}
                                </span>
                              </div>
                            );
                          })}
                          {allPeople.length > 5 && (
                            <div className="w-7 h-7 rounded-full bg-surfaceHighlight border-2 border-surface flex items-center justify-center text-[10px] text-textMuted font-bold">
                              +{allPeople.length - 5}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-textMuted flex items-center gap-1"><Users size={12} /> {event.attendees.length}</span>
                        {rsvp === 'attending' && <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">Going</span>}
                        {rsvp === 'declined' && <span className="text-[10px] text-danger bg-danger/10 px-2 py-0.5 rounded">Declined</span>}
                        <ChevronRight size={16} className={`text-textMuted transition-transform ${expandedEvent === event.id ? 'rotate-90' : ''}`} />
                      </div>
                    </button>
                    {expandedEvent === event.id && (
                      <div className="p-4 border-t border-border bg-surfaceHighlight/30 space-y-3">
                        <p className="text-sm text-textMuted">{event.description}</p>
                        <p className="text-xs text-textMuted">Organized by <span className="text-textMain font-medium">{event.organizer}</span></p>

                        {/* People list with RSVP status */}
                        {allPeople.length > 0 && (
                          <div>
                            <p className="text-xs text-textMuted mb-2">People:</p>
                            <div className="flex flex-wrap gap-2">
                              {allPeople.map(pid => {
                                const f = friendById[pid];
                                const status = personRSVP(pid);
                                const statusIcon = status === 'attending' ? '✓' : status === 'declined' ? '✗' : '?';
                                const statusColor = status === 'attending' ? 'text-green-400' : status === 'declined' ? 'text-red-400' : 'text-gray-400';
                                return (
                                  <div key={pid} className="flex items-center gap-1.5 bg-surface border border-border rounded-full px-2 py-1">
                                    {f ? <img src={f.avatarUrl} alt="" className="w-5 h-5 rounded-full" /> : <div className="w-5 h-5 rounded-full bg-primary/20" />}
                                    <span className="text-xs text-textMain">{f ? f.name.split(' ')[0] : pid === currentUserId ? 'You' : 'Unknown'}</span>
                                    <span className={`text-xs font-bold ${statusColor}`}>{statusIcon}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => onRSVP(event.id, true)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              rsvp === 'attending' ? 'bg-primary text-white' : 'bg-primary/20 text-primary hover:bg-primary/30'
                            }`}>
                            <Check size={14} /> {rsvp === 'attending' ? 'Attending' : 'Attend'}
                          </button>
                          <button onClick={() => onRSVP(event.id, false)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              rsvp === 'declined' ? 'bg-danger text-white' : 'bg-danger/20 text-danger hover:bg-danger/30'
                            }`}>
                            <X size={14} /> {rsvp === 'declined' ? 'Declined' : 'Decline'}
                          </button>
                          {isOrganizer && (
                            <button onClick={() => { setShowInviteModal(event.id); setSelectedInvitees([]); }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm transition-colors">
                              <Send size={14} /> Invite Friends
                            </button>
                          )}
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surfaceHighlight text-textMuted text-sm hover:text-textMain transition-colors border border-border">
                            <MapPin size={14} /> Maps
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {events.length === 0 && <p className="text-textMuted text-sm">No upcoming events.</p>}
            </div>
          </div>
        </div>

        {/* Right: Places */}
        <div className="space-y-6">
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

          {/* Quick stats */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="font-bold text-textMain mb-3">Community Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-textMuted">Friends</span>
                <span className="text-sm font-bold text-textMain">{friends.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-textMuted">Upcoming Events</span>
                <span className="text-sm font-bold text-textMain">{events.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-textMuted">Feed Items</span>
                <span className="text-sm font-bold text-textMain">{feed.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Friend Modal — Search for real users */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddFriend(false)}>
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-textMain mb-4">Send Friend Request</h3>
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={addSearchQuery}
                onChange={e => setAddSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-textMain placeholder-textMuted focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1">
              {addSearchQuery.trim().length < 2 && (
                <p className="text-sm text-textMuted text-center py-6">Type at least 2 characters to search for users.</p>
              )}

              {addSearchQuery.trim().length >= 2 && searching && (
                <div className="flex items-center justify-center gap-2 py-6 text-textMuted">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Searching...</span>
                </div>
              )}

              {addSearchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-sm text-textMuted text-center py-6">No users found matching "{addSearchQuery}"</p>
              )}

              {searchResults.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surfaceHighlight transition-colors">
                  <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border-2 border-surfaceHighlight" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-textMain truncate">{user.name}</p>
                    <p className="text-xs text-textMuted truncate">{user.email}</p>
                  </div>
                  {sentRequests.has(user.id) ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-surfaceHighlight text-textMuted rounded-lg text-sm font-medium border border-border">
                      <Check size={14} /> Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddSearchedFriend(user.id)}
                      disabled={addingId === user.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primaryHover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
                    >
                      {addingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Send Request
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-border">
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

      {/* Invite Friends to Event Modal */}
      {showInviteModal && (() => {
        const event = events.find(e => e.id === showInviteModal);
        if (!event) return null;
        // Friends who are NOT already invited/attending/declined
        const alreadyInvolved = new Set([...event.invitees, ...event.attendees, ...event.declined]);
        const availableFriends = friends.filter(f => !alreadyInvolved.has(f.id));
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowInviteModal(null)}>
            <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-textMain mb-1">Invite Friends</h3>
              <p className="text-sm text-textMuted mb-4">to "{event.title}"</p>
              {availableFriends.length === 0 ? (
                <p className="text-sm text-textMuted text-center py-6">All your friends are already invited!</p>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {availableFriends.map(f => {
                    const isSelected = selectedInvitees.includes(f.id);
                    return (
                      <button key={f.id} onClick={() => {
                        setSelectedInvitees(prev => isSelected ? prev.filter(x => x !== f.id) : [...prev, f.id]);
                      }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-surfaceHighlight border border-transparent'}`}>
                        <img src={f.avatarUrl} alt={f.name} className="w-10 h-10 rounded-full border-2 border-surfaceHighlight" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold text-textMain">{f.name}</p>
                          <p className="text-xs text-textMuted">{f.status}</p>
                        </div>
                        {isSelected && <Check size={18} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                <button onClick={() => setShowInviteModal(null)} className="px-4 py-2 text-textMuted hover:text-textMain transition-colors">Cancel</button>
                <button onClick={() => {
                  if (selectedInvitees.length > 0) {
                    onInviteToEvent(showInviteModal, selectedInvitees);
                    setShowInviteModal(null);
                    setSelectedInvitees([]);
                  }
                }} disabled={selectedInvitees.length === 0}
                  className="flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                  <Send size={14} /> Send {selectedInvitees.length > 0 ? `(${selectedInvitees.length})` : ''}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Friends;
