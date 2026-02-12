import React, { useEffect, useState, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Sparkles, Activity, Target, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateHabitInsights } from '../services/geminiService';
import { AIInsight, Habit, HabitStatus, NumericGoal } from '../types';

interface InsightsProps {
  habits: Habit[];
  goals: NumericGoal[];
}

const Insights: React.FC<InsightsProps> = ({ habits, goals }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [goalScrollIdx, setGoalScrollIdx] = useState(0);
  const goalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (habits.length === 0 && goals.length === 0) return;
      setLoadingAI(true);
      const result = await generateHabitInsights(habits, goals);
      setInsights(result);
      setLoadingAI(false);
    };
    fetchInsights();
  }, [habits, goals]);

  // Build real chart data from goal history — NO mock data
  const buildGoalChartData = (goal: NumericGoal) => {
    if (!goal.history || goal.history.length === 0) {
      // Show single point at current value if no history entries
      if (goal.current > 0) {
        const now = new Date();
        return [{ name: now.toLocaleString('default', { month: 'short' }), value: goal.current }];
      }
      return [];
    }
    // Aggregate history by month (cumulative)
    const byMonth: Record<string, number> = {};
    goal.history.forEach(e => {
      const m = e.date.slice(0, 7); // YYYY-MM
      byMonth[m] = (byMonth[m] || 0) + e.amount;
    });
    let cumulative = 0;
    return Object.entries(byMonth).sort().map(([month, amount]) => {
      cumulative += amount;
      const d = new Date(month + '-01');
      return { name: d.toLocaleString('default', { month: 'short' }), value: parseFloat(cumulative.toFixed(2)) };
    });
  };

  // Build GitHub-style 52x7 consistency map from real habit data
  const buildConsistencyData = () => {
    const data: { date: string; count: number }[] = [];
    const now = new Date();
    // Go back 52*7 = 364 days
    for (let i = 363; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // Count how many habits were completed on this date
      let count = 0;
      habits.forEach(h => {
        if (h.history[dateStr] === HabitStatus.COMPLETED) count++;
      });
      data.push({ date: dateStr, count });
    }
    return data;
  };

  const consistencyData = buildConsistencyData();
  // Reshape into 7 rows x 52 cols (Sun=0 to Sat=6)
  const weeks: { date: string; count: number }[][] = [];
  for (let w = 0; w < 52; w++) {
    weeks.push([]);
  }
  // Pad start so first entry aligns to correct day of week
  const firstDate = new Date(consistencyData[0]?.date || new Date());
  const startDayOfWeek = firstDate.getDay(); // 0=Sun
  let weekIdx = 0;
  for (let pad = 0; pad < startDayOfWeek; pad++) {
    if (!weeks[0]) weeks[0] = [];
    weeks[0].push({ date: '', count: -1 }); // empty cell
  }
  consistencyData.forEach((d, i) => {
    const totalSlot = startDayOfWeek + i;
    weekIdx = Math.floor(totalSlot / 7);
    if (weekIdx < 52) {
      if (!weeks[weekIdx]) weeks[weekIdx] = [];
      weeks[weekIdx].push(d);
    }
  });

  const getColor = (count: number) => {
    if (count < 0) return 'transparent';
    if (count === 0) return '#21262d';
    if (count === 1) return '#0e4429';
    if (count <= 3) return '#238636';
    return '#2ea043';
  };

  // Build radar from real habit category data
  const categoryMap: Record<string, number> = {};
  habits.forEach(h => {
    const completions = Object.values(h.history).filter(s => s === HabitStatus.COMPLETED).length;
    categoryMap[h.category] = (categoryMap[h.category] || 0) + completions;
  });
  const skillData = Object.entries(categoryMap).map(([subject, value]) => ({
    subject,
    A: value,
    fullMark: Math.max(...Object.values(categoryMap), 1) * 1.2,
  }));

  // Goal scroll handlers
  const scrollGoal = (dir: number) => {
    const next = goalScrollIdx + dir;
    if (next >= 0 && next < goals.length) setGoalScrollIdx(next);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-primary text-sm font-semibold tracking-wide uppercase mb-1">Performance Analytics</h2>
          <h1 className="text-3xl font-bold text-textMain">Long-term Insights</h1>
          <p className="text-textMuted mt-1">Visualizing your journey towards a better self.</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-textMain">{new Date().getFullYear()}</p>
          <p className="text-xs text-textMuted">Annual Review</p>
        </div>
      </div>

      {/* Goal Charts — scrollable */}
      {goals.length > 0 && (
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-textMain">Goal Progress</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-textMuted">{goalScrollIdx + 1} / {goals.length}</span>
              <button onClick={() => scrollGoal(-1)} disabled={goalScrollIdx === 0}
                className="p-1.5 rounded-lg bg-surfaceHighlight hover:bg-surface border border-border text-textMuted disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => scrollGoal(1)} disabled={goalScrollIdx >= goals.length - 1}
                className="p-1.5 rounded-lg bg-surfaceHighlight hover:bg-surface border border-border text-textMuted disabled:opacity-30 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {goals.map((goal, idx) => {
            if (idx !== goalScrollIdx) return null;
            const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
            const chartData = buildGoalChartData(goal);
            const circumference = 2 * Math.PI * 54; // r=54

            return (
              <div key={goal.id} className="bg-surface border border-border rounded-xl p-6 flex flex-col md:flex-row gap-6 h-[320px]">
                {/* Left: info + circle */}
                <div className="flex flex-col justify-between md:w-[20%] min-w-[180px]">
                  <div>
                    <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold uppercase rounded">{goal.category}</span>
                    <h3 className="text-2xl font-bold text-textMain mt-2">{goal.title}</h3>
                    <p className="text-textMuted text-sm mt-1">
                      {goal.current.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {goal.target.toLocaleString(undefined, { maximumFractionDigits: 2 })} {goal.unit}
                    </p>
                    <p className="text-xs text-textMuted mt-0.5">
                      Remaining: {Math.max(0, goal.target - goal.current).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  {/* % circle */}
                  <div className="relative w-32 h-32 mx-auto md:mx-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#21262d" strokeWidth="8" />
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#2ea043" strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - (circumference * progress) / 100}
                        strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-textMain">{progress}%</span>
                    </div>
                  </div>
                </div>

                {/* Right: chart */}
                <div className="flex-1 min-w-0">
                  {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <defs>
                        <linearGradient id={`grad-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2ea043" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2ea043" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                      <XAxis dataKey="name" stroke="#8b949e" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="#8b949e" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                        domain={[0, goal.target]} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '8px' }}
                        itemStyle={{ color: '#f0f6fc' }}
                        formatter={(value: number) => [value.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' ' + goal.unit, goal.title]}
                      />
                      <Line type="monotone" dataKey="value" stroke="#2ea043" strokeWidth={3} dot={false}
                        activeDot={{ r: 6, fill: '#2ea043', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-textMuted text-sm">
                      Log progress on the Dashboard to see your chart
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Consistency Map — GitHub style 52x7 */}
        <div className="bg-surface border border-border rounded-xl p-6 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Consistency Map
            </h3>
            <span className="text-xs text-textMuted">Past Year</span>
          </div>
          <div className="overflow-hidden">
            <div className="flex gap-[2px]" style={{ width: '100%' }}>
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[2px]" style={{ flex: '1 1 0' }}>
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const cell = week[dayIdx];
                    return (
                      <div key={dayIdx}
                        className="rounded-sm"
                        style={{
                          width: '100%', aspectRatio: '1', maxHeight: '11px',
                          backgroundColor: cell ? getColor(cell.count) : 'transparent',
                        }}
                        title={cell && cell.count >= 0 ? `${cell.date}: ${cell.count} habits` : ''}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-textMuted mt-3 uppercase tracking-wider">
            <span>Less</span>
            <div className="flex gap-1 items-center">
              {[0, 1, 2, 4].map(c => (
                <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(c) }} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Skill Balance Radar — from real data */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              Skill Balance
            </h3>
          </div>
          <div className="flex-1 min-h-[200px]">
            {skillData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                  <PolarGrid stroke="#30363d" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name="Completions" dataKey="A" stroke="#2ea043" strokeWidth={2} fill="#2ea043" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-textMuted text-sm">Complete some habits to see your balance</div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-yellow-400" size={20} />
          <h3 className="text-lg font-bold text-textMain">AI Analyst Insights</h3>
          <span className="text-xs text-textMuted ml-auto">Based on your real data</span>
        </div>
        {loadingAI ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-surfaceHighlight rounded w-3/4"></div>
              <div className="h-4 bg-surfaceHighlight rounded"></div>
              <div className="h-4 bg-surfaceHighlight rounded w-5/6"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${
                insight.type === 'positive' ? 'bg-primary/10 border-primary/30' :
                insight.type === 'negative' ? 'bg-danger/10 border-danger/30' :
                'bg-surfaceHighlight border-border'
              }`}>
                <h4 className={`font-bold mb-2 ${
                  insight.type === 'positive' ? 'text-primary' :
                  insight.type === 'negative' ? 'text-danger' :
                  'text-textMuted'
                }`}>{insight.title}</h4>
                <p className="text-sm text-textMain">{insight.content}</p>
              </div>
            ))}
            {insights.length === 0 && !loadingAI && <p className="text-textMuted">Track some habits to unlock AI insights.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
