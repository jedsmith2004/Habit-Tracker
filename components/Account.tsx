import React, { useState } from 'react';
import { User, Habit, NumericGoal, HabitStatus } from '../types';
import { generateAvatarImage } from '../services/geminiService';
import { Camera, Save, Edit2, Check, X, Trash2, ArrowLeft } from 'lucide-react';

interface AccountProps {
  user: User;
  habits: Habit[];
  goals: NumericGoal[];
  onUpdateUser: (u: User) => void;
  onDeleteHabit?: (habitId: string) => void;
  onDeleteGoal?: (goalId: string) => void;
  onClose: () => void;
}

const Account: React.FC<AccountProps> = ({ user, habits, goals, onUpdateUser, onDeleteHabit, onDeleteGoal, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);
  const [tab, setTab] = useState<'profile' | 'habits' | 'goals'>('profile');

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
        </div>
      )}

      {/* Habits Tab */}
      {tab === 'habits' && (
        <div className="space-y-3">
          {habits.length === 0 ? (
            <p className="text-textMuted text-center py-8">No habits yet.</p>
          ) : habits.map(h => (
            <div key={h.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between group">
              <div>
                <h4 className="font-semibold text-textMain">{h.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase bg-surfaceHighlight px-2 py-0.5 rounded text-textMuted">{h.category}</span>
                  {h.isNegative && <span className="text-[10px] uppercase bg-danger/10 px-2 py-0.5 rounded text-danger">Negative</span>}
                  <span className="text-xs text-textMuted">{habitCompletions(h)} completions</span>
                </div>
              </div>
              {onDeleteHabit && (
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
            return (
              <div key={g.id} className="bg-surface border border-border rounded-lg p-4 group">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-textMain">{g.title}</h4>
                    <span className="text-[10px] uppercase bg-surfaceHighlight px-2 py-0.5 rounded text-textMuted">{g.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-textMain">{progress}%</span>
                    {onDeleteGoal && (
                      <button onClick={() => onDeleteGoal(g.id)}
                        className="p-2 text-textMuted hover:text-danger opacity-0 group-hover:opacity-100 transition-all" title="Delete goal">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-surfaceHighlight rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-textMuted mt-1">
                  {g.current.toLocaleString()} / {g.target.toLocaleString()} {g.unit} — Deadline: {g.deadline}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Account;
