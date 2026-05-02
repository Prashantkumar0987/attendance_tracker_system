import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');
  const thirtyAgo = format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd');

  useEffect(() => {
    api.get(`/attendance/analytics?startDate=${thirtyAgo}&endDate=${today}`)
      .then(r => setAnalytics(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;

  const statusMap = {};
  analytics?.overallStats?.forEach(s => { statusMap[s._id] = s.count; });
  const totalMarked = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const presentPct = totalMarked > 0 ? ((statusMap.present || 0) / totalMarked * 100).toFixed(1) : 0;

  const pieData = [
    { name: 'Present', value: statusMap.present || 0 },
    { name: 'Absent', value: statusMap.absent || 0 },
    { name: 'Late', value: statusMap.late || 0 },
    { name: 'Half-Day', value: statusMap['half-day'] || 0 },
  ].filter(d => d.value > 0);

  // Build daily trend chart data
  const trendMap = {};
  analytics?.dailyTrend?.forEach(d => {
    const date = d._id.date;
    if (!trendMap[date]) trendMap[date] = { date, present: 0, absent: 0, late: 0 };
    trendMap[date][d._id.status] = d.count;
  });
  const trendData = Object.values(trendMap).slice(-14);

  const stats = [
    { icon: '🎓', label: 'Total Students', value: analytics?.totalStudents || 0, color: 'var(--accent)', bg: 'var(--accent-glow)' },
    { icon: '📅', label: 'Records (30 days)', value: analytics?.totalRecords || 0, color: 'var(--blue)', bg: 'var(--blue-bg)' },
    { icon: '✅', label: 'Attendance Rate', value: `${presentPct}%`, color: 'var(--green)', bg: 'var(--green-bg)' },
    { icon: '🚫', label: 'Total Absent', value: statusMap.absent || 0, color: 'var(--red)', bg: 'var(--red-bg)' },
  ];

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Dashboard</div>
          <div className="topbar-subtitle">Overview for the last 30 days — {format(new Date(), 'MMMM d, yyyy')}</div>
        </div>
      </div>
      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          {stats.map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginBottom: '24px' }}>
          {/* Area Chart */}
          <div className="card">
            <h3 style={{ marginBottom: '20px', fontSize: '15px', fontWeight: 700 }}>📈 Attendance Trend (Last 14 Days)</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Area type="monotone" dataKey="present" stroke="#10b981" fill="url(#gPresent)" strokeWidth={2} name="Present" />
                  <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="url(#gAbsent)" strokeWidth={2} name="Absent" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No attendance data yet.</p></div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="card">
            <h3 style={{ marginBottom: '20px', fontSize: '15px', fontWeight: 700 }}>🍩 Status Breakdown</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No data yet.</p></div>
            )}
          </div>
        </div>

        {/* Top Absent Students */}
        {analytics?.topAbsent?.length > 0 && (
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 700 }}>⚠️ Top Absent Students (Last 30 Days)</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Roll No.</th>
                    <th>Absent Days</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topAbsent.map((s, i) => (
                    <tr key={s._id}>
                      <td>{i + 1}</td>
                      <td>{s.student?.name}</td>
                      <td><code>{s.student?.rollNumber}</code></td>
                      <td style={{ color: 'var(--red)', fontWeight: 700 }}>{s.absentCount}</td>
                      <td><span className="badge" style={{ background: s.absentCount > 5 ? 'var(--red-bg)' : 'var(--yellow-bg)', color: s.absentCount > 5 ? 'var(--red)' : 'var(--yellow)' }}>{s.absentCount > 5 ? '🚨 Critical' : '⚠️ Warning'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
