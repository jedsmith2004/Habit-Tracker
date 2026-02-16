import React, { useState } from 'react';
import { User, Habit, NumericGoal, HabitStatus } from '../types';
import { generateAvatarImage } from '../services/geminiService';
import { Camera, Save, Edit2, Check, X, Trash2, ArrowLeft } from 'lucide-react';

interface AccountProps {
  user: User;
  habits: Habit[];
  goals: NumericGoal[];
  onUpdateUser: (u: User) => void;
  onDeleteAccount?: () => Promise<void> | void;
  onDeleteHabit?: (habitId: string) => void;
  onDeleteGoal?: (goalId: string) => void;
  onEditHabit?: (habitId: string, updates: { title?: string; category?: Habit['category'] }) => void;
  onEditGoal?: (goalId: string, updates: { title?: string; target?: number; deadline?: string }) => void;
  onClose: () => void;
}

const Account: React.FC<AccountProps> = ({ user, habits, goals, onUpdateUser, onDeleteAccount, onDeleteHabit, onDeleteGoal, onEditHabit, onEditGoal, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);
  const [tab, setTab] = useState<'profile' | 'habits' | 'goals'>('profile');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editHabitTitle, setEditHabitTitle] = useState('');
  const [editHabitCategory, setEditHabitCategory] = useState<Habit['category']>('Custom');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState('');
  const [editGoalDeadline, setEditGoalDeadline] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleGenerateAvatar = async () => {
    if (!prompt) return;
    setGenerating(true);
    const url = await generateAvatarImage(prompt);
    if (url) setTempAvatar(url);
    setGenerating(false);
  };

  const saveProfile = () => {
    const updates: Partial<User> = {};
    if (tempAvatar) updates.avatarUrl = tempAvatar;
    if (nameInput !== user.name) updates.name = nameInput;
    if (Object.keys(updates).length > 0) {
      onUpdateUser({ ...user, ...updates });
      setTempAvatar(null);
      setPrompt('');
      setEditingName(false);
    }
  };

  const saveName = () => {
    if (nameInput.trim()) {
      onUpdateUser({ ...user, name: nameInput.trim() });
    }
    setEditingName(false);
  };

  const handleDeleteAccount = async () => {
    if (!onDeleteAccount) return;
    setDeletingAccount(true);
    try {
      await onDeleteAccount();
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  // Habit stats
  const habitCompletions = (h: Habit) => Object.values(h.history).filter(s => s === HabitStatus.COMPLETED).length;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Back button */}
      <button onClick={onClose} className="flex items-center gap-2 text-textMuted hover:text-textMain mb-6 transition-colors">
        <ArrowLeft size={18} /> Back
      </button>

      {/* Profile Header */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group shrink-0">
            <img
              src={tempAvatar || user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=2ea043&color=fff`}
              alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-surfaceHighlight" />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="text-white" />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            {editingName ? (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-textMain text-xl font-bold focus:outline-none focus:border-primary" />
                <button onClick={saveName} className="p-1.5 text-primary hover:text-primaryHover"><Check size={18} /></button>
                <button onClick={() => { setEditingName(false); setNameInput(user.name); }} className="p-1.5 text-textMuted hover:text-textMain"><X size={18} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-2xl font-bold text-textMain">{user.name}</h2>
                <button onClick={() => setEditingName(true)} className="p-1 text-textMuted hover:text-textMain"><Edit2 size={16} /></button>
              </div>
            )}
            <p className="text-textMuted">{user.email}</p>
            <div className="flex gap-4 mt-3 justify-center sm:justify-start">
              <div className="text-center">
                <p className="text-lg font-bold text-textMain">{habits.length}</p>
                <p className="text-[10px] uppercase text-textMuted">Habits</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-textMain">{goals.length}</p>
                <p className="text-[10px] uppercase text-textMuted">Goals</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-textMain">
                  {habits.reduce((sum, h) => sum + habitCompletions(h), 0)}
                </p>
                <p className="text-[10px] uppercase text-textMuted">Completions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surfaceHighlight rounded-lg p-1 mb-6">
        {(['profile', 'habits', 'goals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-surface text-textMain shadow-sm' : 'text-textMuted hover:text-textMain'
            }`}>{t}</button>
        ))}
      </div>

      {/* Profile Tab — Avatar Generator */}
      {tab === 'profile' && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-textMain">AI Avatar Generator</h3>
          <label className="text-sm text-textMuted">Describe yourself or a style (e.g., "Cyberpunk ninja", "Peaceful monk")</label>
          <div className="flex gap-2">
            <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter description..."
              className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-primary" />
            <button onClick={handleGenerateAvatar} disabled={generating || !prompt}
              className="bg-primary hover:bg-primaryHover disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              {generating ? 'Creating...' : 'Generate'}
            </button>
          </div>
          {tempAvatar && (
            <div className="flex justify-end">
              <button onClick={saveProfile} className="flex items-center gap-2 text-primary hover:underline">
                <Save size={16} /> Save New Avatar
              </button>
            </div>
          )}

          {onDeleteAccount && (
            <div className="pt-4 border-t border-border">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 text-sm font-medium"
              >
                Delete Account
              </button>
            </div>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => !deletingAccount && setShowDeleteConfirm(false)}>
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-textMain mb-2">Delete account?</h3>
            <p className="text-sm text-textMuted mb-5">This will permanently remove your account, habits, goals, logs, friends, and events. This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingAccount}
                className="px-4 py-2 rounded-lg border border-border text-textMuted hover:text-textMain"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="px-4 py-2 rounded-lg bg-danger text-white hover:opacity-90 disabled:opacity-60"
              >
                {deletingAccount ? 'Deleting...' : 'Yes, delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habits Tab */}
      {tab === 'habits' && (
        <div className="space-y-3">
          {habits.length === 0 ? (
            <p className="text-textMuted text-center py-8">No habits yet.</p>
          ) : habits.map(h => (
            <div key={h.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between group">
              <div className="flex-1 min-w-0">
                {editingHabitId === h.id ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="text" value={editHabitTitle} onChange={e => setEditHabitTitle(e.target.value)}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-textMain text-sm focus:outline-none focus:border-primary" />
                    <select
                      value={editHabitCategory}
                      onChange={e => setEditHabitCategory(e.target.value as Habit['category'])}
                      className="bg-background border border-border rounded-lg px-3 py-1.5 text-textMain text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="Health">Health</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Work">Work</option>
                      <option value="Mindfulness">Mindfulness</option>
                      <option value="Custom">Custom</option>
                    </select>
                    <button onClick={() => {
                      if (editHabitTitle.trim()) onEditHabit?.(h.id, { title: editHabitTitle.trim(), category: editHabitCategory });
                      setEditingHabitId(null);
                    }} className="p-1.5 text-primary hover:text-primaryHover"><Check size={16} /></button>
                    <button onClick={() => setEditingHabitId(null)} className="p-1.5 text-textMuted hover:text-textMain"><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-textMain">{h.title}</h4>
                      {onEditHabit && (
                        <button onClick={() => { setEditingHabitId(h.id); setEditHabitTitle(h.title); setEditHabitCategory(h.category); }}
                          className="p-1 text-textMuted hover:text-textMain opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={14} /></button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase bg-surfaceHighlight px-2 py-0.5 rounded text-textMuted">{h.category}</span>
                      {h.isNegative && <span className="text-[10px] uppercase bg-danger/10 px-2 py-0.5 rounded text-danger">Negative</span>}
                      <span className="text-xs text-textMuted">{habitCompletions(h)} completions</span>
                    </div>
                  </>
                )}
              </div>
              {onDeleteHabit && editingHabitId !== h.id && (
                <button onClick={() => onDeleteHabit(h.id)}
                  className="p-2 text-textMuted hover:text-danger opacity-0 group-hover:opacity-100 transition-all" title="Delete habit">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Goals Tab */}
      {tab === 'goals' && (
        <div className="space-y-3">
          {goals.length === 0 ? (
            <p className="text-textMuted text-center py-8">No goals yet.</p>
          ) : goals.map(g => {
            const progress = Math.min(100, Math.round((g.current / g.target) * 100));
            const isEditing = editingGoalId === g.id;
            return (
              <div key={g.id} className="bg-surface border border-border rounded-lg p-4 group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input type="text" value={editGoalTitle} onChange={e => setEditGoalTitle(e.target.value)} placeholder="Goal name"
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-textMain text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-textMuted">Target:</label>
                          <input type="number" step="any" value={editGoalTarget} onChange={e => setEditGoalTarget(e.target.value)}
                            className="w-24 bg-background border border-border rounded px-2 py-1 text-textMain text-xs focus:outline-none focus:border-primary" />
                          <label className="text-xs text-textMuted">Deadline:</label>
                          <input type="date" value={editGoalDeadline} onChange={e => setEditGoalDeadline(e.target.value)}
                            className="bg-background border border-border rounded px-2 py-1 text-textMain text-xs focus:outline-none focus:border-primary" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            onEditGoal?.(g.id, {
                              title: editGoalTitle.trim() || undefined,
                              target: editGoalTarget ? parseFloat(editGoalTarget) : undefined,
                              deadline: editGoalDeadline || undefined,
                            });
                            setEditingGoalId(null);
                          }} className="px-3 py-1 text-xs bg-primary text-white rounded-lg hover:bg-primaryHover">Save</button>
                          <button onClick={() => setEditingGoalId(null)} className="px-3 py-1 text-xs text-textMuted hover:text-textMain">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div>
                          <h4 className="font-semibold text-textMain">{g.title}</h4>
                          <span className="text-[10px] uppercase bg-surfaceHighlight px-2 py-0.5 rounded text-textMuted">{g.category}</span>
                        </div>
                        {onEditGoal && (
                          <button onClick={() => {
                            setEditingGoalId(g.id);
                            setEditGoalTitle(g.title);
                            setEditGoalTarget(String(g.target));
                            setEditGoalDeadline(g.deadline);
                          }} className="p-1 text-textMuted hover:text-textMain opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={14} /></button>
                        )}
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-textMain">{progress}%</span>
                      {onDeleteGoal && (
                        <button onClick={() => onDeleteGoal(g.id)}
                          className="p-2 text-textMuted hover:text-danger opacity-0 group-hover:opacity-100 transition-all" title="Delete goal">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <>
                    <div className="h-2 bg-surfaceHighlight rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-textMuted mt-1">
                      {g.current.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {g.target.toLocaleString(undefined, { maximumFractionDigits: 2 })} {g.unit} — Deadline: {g.deadline}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Account;
