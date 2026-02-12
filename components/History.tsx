import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { Clock, RotateCcw, Edit2, Check, X, Trash2 } from 'lucide-react';

interface HistoryProps {
  logs: ActivityLog[];
  onReverseLog?: (logId: string) => void;
  onDeleteLog?: (logId: string) => void;
  onEditLog?: (logId: string, newDescription: string) => void;
}

const History: React.FC<HistoryProps> = ({ logs, onReverseLog, onDeleteLog, onEditLog }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

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
    setEditText(log.description);
  };

  const confirmEdit = (logId: string) => {
    onEditLog?.(logId, editText);
    setEditingId(null);
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'habit': return 'bg-primary/10 text-primary';
      case 'goal': return 'bg-blue-500/10 text-blue-400';
      case 'event': return 'bg-yellow-500/10 text-yellow-400';
      default: return 'bg-surfaceHighlight text-textMuted';
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'habit': return '🏋️';
      case 'goal': return '🎯';
      case 'event': return '📅';
      default: return '⚙️';
    }
  };

  // Group logs by date
  const groupedLogs: Record<string, ActivityLog[]> = {};
  logs.forEach(log => {
    const dateKey = formatDate(log.timestamp);
    if (!groupedLogs[dateKey]) groupedLogs[dateKey] = [];
    groupedLogs[dateKey].push(log);
  });

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className="text-primary text-sm font-semibold tracking-wide uppercase mb-1">Timeline</h2>
        <h1 className="text-3xl font-bold text-textMain">Activity History</h1>
        <p className="text-textMuted mt-1">{logs.length} entries total</p>
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
                          <div className="flex items-center gap-2">
                            <input type="text" value={editText} onChange={e => setEditText(e.target.value)}
                              className="flex-1 bg-background border border-border rounded px-3 py-1 text-textMain text-sm focus:outline-none focus:border-primary" />
                            <button onClick={() => confirmEdit(log.id)} className="p-1 text-primary hover:text-primaryHover"><Check size={16} /></button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-textMuted hover:text-textMain"><X size={16} /></button>
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
                        {/* Action buttons — visible on hover */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEditLog && !log.reversed && (
                            <button onClick={() => startEdit(log)} className="p-1.5 rounded text-textMuted hover:text-textMain hover:bg-surface" title="Edit">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {onReverseLog && log.reversible && !log.reversed && (
                            <button onClick={() => onReverseLog(log.id)} className="p-1.5 rounded text-textMuted hover:text-yellow-400 hover:bg-surface" title="Reverse">
                              <RotateCcw size={14} />
                            </button>
                          )}
                          {onDeleteLog && (
                            <button onClick={() => onDeleteLog(log.id)} className="p-1.5 rounded text-textMuted hover:text-danger hover:bg-surface" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
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
