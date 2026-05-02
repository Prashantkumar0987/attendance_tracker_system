import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function StudentModal({ student, onClose, onSave, classes }) {
  const [form, setForm] = useState(student || { name: '', email: '', rollNumber: '', class: '', section: 'A', department: '', phone: '', guardianName: '', guardianPhone: '' });
  const [loading, setLoading] = useState(false);
  const isEdit = !!student?._id;

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/students/${student._id}`, form);
        toast.success('Student updated!');
      } else {
        await api.post('/students', form);
        toast.success('Student added!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '✏️ Edit Student' : '➕ Add Student'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name *</label><input name="name" className="form-input" value={form.name} onChange={handleChange} required /></div>
            <div className="form-group"><label className="form-label">Roll Number *</label><input name="rollNumber" className="form-input" value={form.rollNumber} onChange={handleChange} required placeholder="BCA001" /></div>
          </div>
          <div className="form-group"><label className="form-label">Email *</label><input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} required /></div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Class *</label>
              <input name="class" className="form-input" value={form.class} onChange={handleChange} required list="classes-list" placeholder="BCA-1" />
              <datalist id="classes-list">{classes.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Section</label>
              <select name="section" className="form-select" value={form.section} onChange={handleChange}>
                {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Department</label><input name="department" className="form-input" value={form.department} onChange={handleChange} placeholder="Computer Science" /></div>
            <div className="form-group"><label className="form-label">Phone</label><input name="phone" className="form-input" value={form.phone} onChange={handleChange} placeholder="9876543210" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Guardian Name</label><input name="guardianName" className="form-input" value={form.guardianName} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Guardian Phone</label><input name="guardianPhone" className="form-input" value={form.guardianPhone} onChange={handleChange} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : null}{isEdit ? 'Update' : 'Add Student'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'add' | student object

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(search && { search }), ...(filterClass && { class: filterClass }) });
      const r = await api.get(`/students?${params}`);
      setStudents(r.data.students);
      setTotal(r.data.total);
    } catch (err) { toast.error('Failed to load students.'); }
    finally { setLoading(false); }
  }, [page, search, filterClass]);

  useEffect(() => { api.get('/students/classes').then(r => setClasses(r.data.classes || [])); }, []);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleDelete = async (id) => {
    if (!confirm('Remove this student?')) return;
    await api.delete(`/students/${id}`);
    toast.success('Student removed.');
    fetchStudents();
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">Students</div>
          <div className="topbar-subtitle">{total} students registered</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>➕ Add Student</button>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: '220px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search by name, roll number, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-select" style={{ width: '160px' }} value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Name</th><th>Roll No.</th><th>Email</th><th>Class</th><th>Section</th><th>Phone</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" /></td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan="8"><div className="empty-state"><div style={{ fontSize: '40px' }}>🎓</div><h3>No students found</h3><p>Add students or adjust your search</p></div></td></tr>
                ) : students.map((s, i) => (
                  <tr key={s._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 20 + i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td><code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{s.rollNumber}</code></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                    <td><span className="badge badge-teacher">{s.class}</span></td>
                    <td>{s.section}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.phone || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setModal(s)} title="Edit">✏️</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(s._id)} title="Remove">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ alignSelf: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>Page {page} of {Math.ceil(total / 20)}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
      {modal && (
        <StudentModal
          student={modal === 'add' ? null : modal}
          classes={classes}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchStudents(); }}
        />
      )}
    </div>
  );
}
