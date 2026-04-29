import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, Trash2, Users, Search, RefreshCw, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

export default function ContactsModule() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const fileRef = useRef()

  useEffect(() => { fetchContacts() }, [])

  async function fetchContacts() {
    setLoading(true)
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Failed to load contacts')
    else setContacts(data || [])
    setLoading(false)
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)

    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)

      // Normalize headers (case-insensitive)
      const normalized = rows.map(r => {
        const lower = {}
        Object.keys(r).forEach(k => lower[k.toLowerCase().trim()] = r[k])
        return {
          name: lower['name'] || lower['full name'] || lower['fullname'] || '',
          email: lower['email'] || lower['email id'] || lower['emailid'] || lower['email address'] || '',
          website: lower['website'] || lower['url'] || lower['site'] || '',
          phone: lower['phone'] || lower['phone number'] || lower['mobile'] || lower['contact'] || '',
        }
      }).filter(r => r.name && r.email && r.email.includes('@'))

      if (normalized.length === 0) {
        toast.error('No valid contacts found. Need at least Name & Email columns.')
        setUploading(false)
        return
      }

      // Upsert on email
      const { error } = await supabase.from('contacts').upsert(normalized, { onConflict: 'email' })
      if (error) throw error

      toast.success(`✓ Imported ${normalized.length} contacts`)
      fetchContacts()
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    }

    setUploading(false)
    e.target.value = ''
  }

  async function deleteSelected() {
    if (!selected.length) return
    if (!confirm(`Delete ${selected.length} contact(s)?`)) return

    const { error } = await supabase.from('contacts').delete().in('id', selected)
    if (error) toast.error('Delete failed')
    else {
      toast.success(`Deleted ${selected.length} contact(s)`)
      setSelected([])
      fetchContacts()
    }
  }

  async function deleteContact(id) {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { toast.success('Contact deleted'); fetchContacts() }
  }

  function exportCSV() {
    const data = filtered.map(c => ({ Name: c.name, Email: c.email, Website: c.website || '', Phone: c.phone || '' }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
    XLSX.writeFile(wb, 'contacts.xlsx')
  }

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(c => c.id))
  const filtered = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Contacts</h1>
        <p className="page-subtitle">Upload your Excel file — Name & Email required, Website & Phone optional</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Contacts</span>
          <span className="stat-value">{contacts.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">With Website</span>
          <span className="stat-value">{contacts.filter(c => c.website).length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">With Phone</span>
          <span className="stat-value">{contacts.filter(c => c.phone).length}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={() => fileRef.current.click()} disabled={uploading}>
          {uploading ? <span className="spinner" /> : <Upload size={15} />}
          {uploading ? 'Importing...' : 'Upload Excel'}
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />

        <button className="btn btn-secondary" onClick={exportCSV} disabled={!filtered.length}>
          <Download size={15} /> Export
        </button>

        <button className="btn btn-secondary" onClick={fetchContacts}>
          <RefreshCw size={15} /> Refresh
        </button>

        {selected.length > 0 && (
          <button className="btn btn-danger" onClick={deleteSelected}>
            <Trash2 size={15} /> Delete ({selected.length})
          </button>
        )}

        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      {/* Template Download */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Need a template?</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Your Excel must have columns: Name, Email (required) · Website, Phone (optional)</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => {
          const ws = XLSX.utils.json_to_sheet([{ Name: 'John Doe', Email: 'john@example.com', Website: 'https://example.com', Phone: '+1234567890' }])
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
          XLSX.writeFile(wb, 'contacts_template.xlsx')
        }}>
          <Download size={13} /> Download Template
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty-state"><span className="spinner" /><p>Loading contacts...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>{search ? 'No contacts match' : 'No contacts yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Upload an Excel file to get started'}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ width: 'auto', cursor: 'pointer' }} />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Website</th>
                <th>Phone</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} style={{ width: 'auto', cursor: 'pointer' }} />
                  </td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-2)' }}>{c.email}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 13 }}>{c.website || '—'}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 13 }}>{c.phone || '—'}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteContact(c.id)}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
