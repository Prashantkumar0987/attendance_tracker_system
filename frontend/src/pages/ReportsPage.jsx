import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { format, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function ReportsPage() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/students/classes').then(r => setClasses(r.data.classes || [])); }, []);
  useEffect(() => {
    if (!selectedClass) { setStudents([]); return; }
    api.get(`/students?class=${selectedClass}&limit=200`).then(r => setStudents(r.data.students || []));
  }, [selectedClass]);

  const fetchReport = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const r = await api.get(`/attendance/report/${selectedStudent}?startDate=${startDate}&endDate=${endDate}`);
      setReport(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const pct = report?.summary?.percentage || 0;
  const pctColor = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';
  const pctClass = pct >= 75 ? 'high' : pct >= 50 ? 'medium' : 'low';

  // Chart data per day
  const dayMap = {};
  report?.records?.forEach(r => {
    const d = format(new Date(r.date), 'MM/dd');
    if (!dayMap[d]) dayMap[d] = { date: d, present: 0, absent: 0, late: 0 };
    dayMap[d][r.status === 'half-day' ? 'late' : r.status]++;
  });
  const chartData = Object.values(dayMap);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Attendance Reports</div>
          <div className="topbar-subtitle">Generate individual student reports</div>
        </div>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div className="card card-sm" style={{ marginBottom: '20px' }}>
          <div className="filter-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Class</label>
              <select className="form-select" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudent(''); setReport(null); }}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
              <label className="form-label">Student</label>
              <select className="form-select" value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); setReport(null); }}>
                <option value="">-- Select Student --</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From</label>
              <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To</label>
              <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button className="btn btn-primary" onClick={fetchReport} disabled={!selectedStudent || loading}>
                {loading ? <span className="spinner" /> : '🔍'} Generate Report
              </button>
            </div>
          </div>
        </div>

        {report && (
          <>
            {/* Student Info + Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="card">
                <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 700 }}>👤 Student Info</h3>
                <table style={{ width: '100%' }}>
                  <tbody>
                    {[['Name', report.student?.name], ['Roll No.', report.student?.rollNumber], ['Email', report.student?.email], ['Class', `${report.student?.class} - ${report.student?.section}`]].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: 'none' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)', fontSize: '13px', width: '80px' }}>{k}</td>
                        <td style={{ padding: '6px 0', fontWeight: 600, fontSize: '14px' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 700 }}>📊 Attendance Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '36px', fontWeight: 800, color: pctColor }}>{pct}%</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total days: {report.summary.total}</div>
                      <div style={{ fontSize: '13px', color: 'var(--green)' }}>Present: {report.summary.present}</div>
                      <div style={{ fontSize: '13px', color: 'var(--red)' }}>Absent: {report.summary.absent}</div>
                      <div style={{ fontSize: '13px', color: 'var(--yellow)' }}>Late: {report.summary.late}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Attendance Rate</span><span style={{ color: pctColor }}>{pct}%</span>
                    </div>
                    <div className="progress-bar"><div className={`progress-fill ${pctClass}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div className={`alert ${pct >= 75 ? 'alert-success' : pct >= 50 ? 'alert-warning' : 'alert-error'}`} style={{ margin: 0 }}>
                    {pct >= 75 ? '✅ Good attendance' : pct >= 50 ? '⚠️ Needs improvement' : '🚨 Critical — below 50%'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            {chartData.length > 0 && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 700 }}>📅 Daily Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Bar dataKey="present" fill="var(--green)" name="Present" radius={[4,4,0,0]} />
                    <Bar dataKey="absent" fill="var(--red)" name="Absent" radius={[4,4,0,0]} />
                    <Bar dataKey="late" fill="var(--yellow)" name="Late" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Records Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '15px' }}>📋 Attendance Records ({report.records.length})</div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>#</th><th>Date</th><th>Day</th><th>Status</th><th>Subject</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {report.records.map((r, i) => (
                      <tr key={r._id}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{format(new Date(r.date), 'MMM d, yyyy')}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{format(new Date(r.date), 'EEEE')}</td>
                        <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.subject || '—'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{r.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!report && !loading && (
          <div className="empty-state premium-empty-state">
            <div className="empty-state-icon-wrapper">
              <div className="glow-ring"></div>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="premium-icon">
                <path d="M21 21H4.6A1.6 1.6 0 0 1 3 19.4V3M7 14l3-3 4 4 6-6M17 9h4v4"/>
              </svg>
            </div>
            <h3>Ready to generate insights?</h3>
            <p>Select a class, a student, and a specific date range above to dive deep into attendance analytics and performance trends.</p>
            <div className="pulse-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
