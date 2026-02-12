import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { Clock, RotateCcw, Edit2, Check, X } from 'lucide-react';

interface HistoryProps {
  logs: ActivityLog[];
  onReverseLog?: (logId: string) => void;
  onEditLog?: (logId: string, newDescription: string, newAmount?: number) => void;
}

const History: React.FC<HistoryProps> = ({ logs, onReverseLog, onEditLog }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');

  const formatDate = (ts: Date | string) => {
    const d = typeof ts === 'string' ? new Date(ts) : ts;
    return d.toLocaleDateString();
  };

  const formatTime = (ts: Date | string) => {
    const d = typeof ts === 'string' ? new Date(ts) : ts;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const startEdit = (log: ActivityLog) => {
    setEditingId(log.id);
    const match = log.description.match(/Added ([\d.]+)/);
    setEditAmount(match ? match[1] : '');
  };

  const confirmEdit = (log: ActivityLog) => {
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount <= 0) return;
    const newDescription = log.description.replace(/Added [\d.]+/, `Added ${newAmount}`);
    onEditLog?.(log.id, newDescription, newAmount);
    setEditingId(null);
    setEditAmount('');
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'habit': return 'bg-primary/10 text-primary';
      case 'goal': return 'bg-blue-500/10 text-blue-400';
      case 'event': return 'bg-yellow-500/10 text-yellow-400';
      case 'friend': return 'bg-purple-500/10 text-purple-400';
      case 'system': return 'bg-surfaceHighlight text-textMuted';
      default: return 'bg-surfaceHighlight text-textMuted';
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'habit': return '🏋️';
      case 'goal': return '🎯';
      case 'event': return '📅';
      case 'friend': return '👥';
      case 'system': return '⚙️';
      default: return '⚙️';
    }
  };

  const filteredLogs = filterType === 'all' ? logs : logs.filter(l => l.type === filterType);

  const groupedLogs: Record<string, ActivityLog[]> = {};
  filteredLogs.forEach(log => {
    const dateKey = formatDate(log.timestamp);
    if (!groupedLogs[dateKey]) groupedLogs[dateKey] = [];
    groupedLogs[dateKey].push(log);
  });

  const filterOptions = ['all', 'habit', 'goal', 'event', 'friend', 'system'];

  const isGoalProgressLog = (log: ActivityLog) => log.type === 'goal' && /Added [\d.]+/.test(log.description);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className="text-primary text-sm font-semibold tracking-wide uppercase mb-1">Timeline</h2>
        <h1 className="text-3xl font-bold text-textMain">Activity History</h1>
        <p className="text-textMuted mt-1">{logs.length} entries total</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filterOptions.map(f => (
          <button key={f} onClick={() => setFilterType(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
              filterType === f ? 'bg-primary text-white border-primary' : 'bg-surfaceHighlight text-textMuted border-border hover:border-textMuted'
            }`}>{f}</button>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-textMuted">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No activity yet. Start tracking!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedLogs).map(([dateKey, dateLogs]) => (
            <div key={dateKey}>
              <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm py-2 mb-3">
                <span className="text-xs font-bold uppercase text-textMuted tracking-wider bg-surfaceHighlight px-3 py-1 rounded-full">{dateKey}</span>
              </div>
              <div className="relative border-l border-border ml-3 space-y-4">
                {dateLogs.map(log => (
                  <div key={log.id} className={`ml-6 relative group ${log.reversed ? 'opacity-50' : ''}`}>
                    <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-surfaceHighlight ring-4 ring-background text-xs">
                      {typeIcon(log.type)}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-surface border border-border p-4 rounded-lg hover:bg-surfaceHighlight/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        {editingId === log.id ? (
                          <div className="space-y-2">
                            <p className="text-sm text-textMuted">{log.description.replace(/Added [\d.]+/, 'Added ...')}</p>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-textMuted">New amount:</label>
                              <input type="number" step="any" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                                className="w-24 bg-background border border-border rounded px-2 py-1 text-textMain text-xs focus:outline-none focus:border-primary" autoFocus />
                              <button onClick={() => confirmEdit(log)} className="p-1 text-primary hover:text-primaryHover"><Check size={16} /></button>
                              <button onClick={() => setEditingId(null)} className="p-1 text-textMuted hover:text-textMain"><X size={16} /></button>
                            </div>
                            <span className="text-[10px] text-textMuted">This will adjust the goal's actual value</span>
                          </div>
                        ) : (
                          <>
                            <h3 className={`text-base font-semibold text-textMain ${log.reversed ? 'line-through' : ''}`}>{log.description}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${typeColor(log.type)}`}>{log.type}</span>
                              {log.reversed && <span className="text-[10px] text-danger uppercase">Reversed</span>}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <time className="text-sm text-textMuted">{formatTime(log.timestamp)}</time>
                        {!log.reversed && editingId !== log.id && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Goal progress logs: edit amount */}
                            {onEditLog && isGoalProgressLog(log) && (
                              <button onClick={() => startEdit(log)} className="p-1.5 rounded text-textMuted hover:text-textMain hover:bg-surface" title="Edit amount">
                                <Edit2 size={14} />
                              </button>
                            )}
                            {/* Goal progress logs: revert */}
                            {onReverseLog && log.reversible && isGoalProgressLog(log) && (
                              <button onClick={() => onReverseLog(log.id)} className="p-1.5 rounded text-textMuted hover:text-yellow-400 hover:bg-surface" title="Revert">
                                <RotateCcw size={14} />
                              </button>
                            )}
                            {/* Habit logs: revert only */}
                            {onReverseLog && log.type === 'habit' && log.reversible && (
                              <button onClick={() => onReverseLog(log.id)} className="p-1.5 rounded text-textMuted hover:text-yellow-400 hover:bg-surface" title="Revert">
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
