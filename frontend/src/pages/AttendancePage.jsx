import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AttendancePage() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/students/classes').then(r => setClasses(r.data.classes || []));
  }, []);

  useEffect(() => {
    if (!selectedClass) { setStudents([]); return; }
    setLoading(true);
    api.get(`/students?class=${selectedClass}&section=${selectedSection}&limit=200`)
      .then(r => {
        setStudents(r.data.students || []);
        const defaultMap = {};
        r.data.students.forEach(s => { defaultMap[s._id] = 'present'; });
        setStatusMap(defaultMap);
      })
      .finally(() => setLoading(false));
  }, [selectedClass, selectedSection]);

  const setAll = (status) => {
    const m = {};
    students.forEach(s => { m[s._id] = status; });
    setStatusMap(m);
  };

  const handleSubmit = async () => {
    if (!selectedClass) return toast.error('Select a class first.');
    if (students.length === 0) return toast.error('No students found.');
    setSubmitting(true);
    try {
      const records = students.map(s => ({ studentId: s._id, status: statusMap[s._id] || 'present' }));
      await api.post('/attendance', { records, date, class: selectedClass, section: selectedSection, subject });
      toast.success(`Attendance saved for ${students.length} students! 🎉`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const statuses = ['present', 'absent', 'late', 'half-day'];
  const counts = statuses.reduce((acc, s) => {
    acc[s] = Object.values(statusMap).filter(v => v === s).length;
    return acc;
  }, {});

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Mark Attendance</div>
          <div className="topbar-subtitle">Select a class and mark student attendance</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-secondary btn-sm" onClick={() => setAll('present')}>✅ All Present</button>
          <button className="btn btn-danger btn-sm" onClick={() => setAll('absent')}>❌ All Absent</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || students.length === 0}>
            {submitting ? <span className="spinner" /> : '💾'} Save Attendance
          </button>
        </div>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div className="card card-sm" style={{ marginBottom: '20px' }}>
          <div className="filter-row">
            <div className="form-group" style={{ marginBottom: 0, minWidth: '160px' }}>
              <label className="form-label">Class</label>
              <select className="form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '120px' }}>
              <label className="form-label">Section</label>
              <select className="form-select" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
              <label className="form-label">Subject (Optional)</label>
              <input className="form-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Summary counters */}
        {students.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {statuses.map(s => (
              <div key={s} className="badge" style={{ fontSize: '13px', padding: '6px 14px',
                background: s === 'present' ? 'var(--green-bg)' : s === 'absent' ? 'var(--red-bg)' : s === 'late' ? 'var(--yellow-bg)' : 'var(--blue-bg)',
                color: s === 'present' ? 'var(--green)' : s === 'absent' ? 'var(--red)' : s === 'late' ? 'var(--yellow)' : 'var(--blue)'
              }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}: <strong>{counts[s]}</strong>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center' }}>
              Total: <strong>{students.length}</strong> students
            </div>
          </div>
        )}

        {/* Attendance list */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : students.length === 0 ? (
            <div className="empty-state premium-empty-state">
              <div className="empty-state-icon-wrapper">
                <div className="glow-ring"></div>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="premium-icon">
                  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/><path d="M12 12v.01"/><path d="M16 10a4 4 0 0 0-8 0"/>
                </svg>
              </div>
              <h3>Select a class to begin</h3>
              <p>Choose a class and section from the filters above to load the student roster and start marking attendance.</p>
              <div className="pulse-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          ) : (
            <div className="att-grid">
              <div className="att-row" style={{ background: 'var(--bg-secondary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                <div className="att-index">#</div>
                <div>Student</div>
                <div>Status</div>
                <div></div>
              </div>
              {students.map((s, i) => (
                <div className="att-row" key={s._id}>
                  <div className="att-index">{i + 1}</div>
                  <div>
                    <div className="att-student-name">{s.name}</div>
                    <div className="att-student-roll">{s.rollNumber}</div>
                  </div>
                  <div className="status-pills">
                    {statuses.map(st => (
                      <button key={st} className={`status-pill ${statusMap[s._id] === st ? `selected-${st}` : ''}`}
                        onClick={() => setStatusMap(m => ({ ...m, [s._id]: st }))}>
                        {st === 'present' ? 'P' : st === 'absent' ? 'A' : st === 'late' ? 'L' : 'H'}
                      </button>
                    ))}
                  </div>
                  <div>
                    <span className={`badge badge-${statusMap[s._id] || 'present'}`}>{statusMap[s._id] || 'present'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
