import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Users, ChevronDown, ChevronUp, Eye, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const VARIABLE_HINTS = ['{{name}}', '{{email}}', '{{website}}', '{{phone}}']

export default function CampaignsModule() {
  const [view, setView] = useState('list') // list | compose
  const [campaigns, setCampaigns] = useState([])
  const [contacts, setContacts] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState('all')
  const [preview, setPreview] = useState(null)

  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
  })

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [camps, conts, setts] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('contacts').select('*'),
      supabase.from('settings').select('*'),
    ])
    setCampaigns(camps.data || [])
    setContacts(conts.data || [])
    const s = {}
    ;(setts.data || []).forEach(r => (s[r.key] = r.value))
    setSettings(s)
    setLoading(false)
  }

  function insertVariable(v) {
    const ta = document.getElementById('email-body')
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newBody = form.body.slice(0, start) + v + form.body.slice(end)
    setForm(f => ({ ...f, body: newBody }))
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + v.length, start + v.length) }, 0)
  }

  function renderPreview(contact) {
    const replace = (str) => str
      .replace(/\{\{name\}\}/g, contact.name || '')
      .replace(/\{\{email\}\}/g, contact.email || '')
      .replace(/\{\{website\}\}/g, contact.website || '')
      .replace(/\{\{phone\}\}/g, contact.phone || '')
    return { subject: replace(form.subject), body: replace(form.body) }
  }

  async function sendCampaign() {
    if (!form.name || !form.subject || !form.body) {
      toast.error('Please fill in all fields')
      return
    }
    if (!settings.brevo_key) {
      toast.error('Add your Brevo API key in Settings first')
      return
    }
    if (!settings.sender_email) {
      toast.error('Add a Sender Email in Settings first')
      return
    }
    if (contacts.length === 0) {
      toast.error('No contacts found. Upload contacts first.')
      return
    }

    setSending(true)

    // Save campaign to DB
    const { data: camp, error: campErr } = await supabase
      .from('campaigns')
      .insert({ name: form.name, subject: form.subject, body: form.body, status: 'sending', total: contacts.length })
      .select()
      .single()

    if (campErr) { toast.error('Failed to create campaign'); setSending(false); return }

    let sent = 0
    let failed = 0

    for (const contact of contacts) {
      const { subject, body } = renderPreview(contact)
      const htmlBody = body.replace(/\n/g, '<br>')

      try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': settings.brevo_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: settings.sender_name || 'MailFlow', email: settings.sender_email },
            to: [{ email: contact.email, name: contact.name }],
            subject,
            htmlContent: `<html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px">${htmlBody}<br><br><img src="${window.location.origin}/track/open/${camp.id}/${contact.id}" width="1" height="1" style="display:none"/></body></html>`,
          }),
        })

        if (res.ok) {
          sent++
          await supabase.from('email_logs').insert({
            campaign_id: camp.id,
            contact_id: contact.id,
            email: contact.email,
            status: 'sent',
          })
        } else {
          failed++
          await supabase.from('email_logs').insert({
            campaign_id: camp.id,
            contact_id: contact.id,
            email: contact.email,
            status: 'failed',
          })
        }
      } catch {
        failed++
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 100))
    }

    // Update campaign status
    await supabase.from('campaigns').update({ status: 'sent', sent_count: sent, failed_count: failed }).eq('id', camp.id)

    toast.success(`Campaign sent! ✓ ${sent} delivered · ${failed} failed`)
    setForm({ name: '', subject: '', body: '' })
    setView('list')
    fetchAll()
    setSending(false)
  }

  async function deleteCampaign(id) {
    if (!confirm('Delete this campaign?')) return
    await supabase.from('email_logs').delete().eq('campaign_id', id)
    await supabase.from('campaigns').delete().eq('id', id)
    toast.success('Campaign deleted')
    fetchAll()
  }

  const sampleContact = contacts[0] || { name: 'John Doe', email: 'john@example.com', website: 'example.com', phone: '+1234567890' }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">{contacts.length} contacts available · Sent via Brevo</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {view === 'compose' ? (
            <button className="btn btn-secondary" onClick={() => setView('list')}>← Back</button>
          ) : (
            <button className="btn btn-primary" onClick={() => setView('compose')}>
              <Plus size={15} /> New Campaign
            </button>
          )}
        </div>
      </div>

      {view === 'list' ? (
        loading ? (
          <div className="empty-state"><span className="spinner" /></div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <Send size={48} />
            <h3>No campaigns yet</h3>
            <p>Create your first email campaign to get started</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Failed</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{c.subject}</td>
                    <td>
                      <span className={`badge ${c.status === 'sent' ? 'badge-success' : c.status === 'sending' ? 'badge-warning' : 'badge-accent'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--success)' }}>{c.sent_count || 0}</td>
                    <td style={{ color: 'var(--danger)' }}>{c.failed_count || 0}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteCampaign(c.id)}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          {/* Compose Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <h3 className="card-title">Compose Email</h3>

              <div className="form-group">
                <label className="form-label">Campaign Name (internal)</label>
                <input placeholder="e.g. October Outreach" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Subject Line</label>
                <input placeholder="e.g. Hey {{name}}, let's connect!" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Email Body</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                  {VARIABLE_HINTS.map(v => (
                    <button key={v} className="btn btn-secondary btn-sm" onClick={() => insertVariable(v)} style={{ fontSize: 12, padding: '4px 8px' }}>{v}</button>
                  ))}
                </div>
                <textarea
                  id="email-body"
                  placeholder={`Hi {{name}},\n\nI came across your work at {{website}} and wanted to reach out...\n\nBest,\n[Your Name]`}
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  style={{ minHeight: 280, resize: 'vertical' }}
                />
                <span className="form-hint">Click variable buttons to insert at cursor position</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn btn-primary" onClick={sendCampaign} disabled={sending || !form.subject || !form.body}>
                  {sending ? <><span className="spinner" /> Sending...</> : <><Send size={15} /> Send to {contacts.length} contacts</>}
                </button>
                {sending && <span style={{ fontSize: 13, color: 'var(--text-2)' }}>This may take a moment...</span>}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 20 }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={15} /> Live Preview
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
              Preview with: {sampleContact.name} ({sampleContact.email})
            </div>
            <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: 16, fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                {renderPreview(sampleContact).subject || <span style={{ color: 'var(--text-3)' }}>Subject line preview</span>}
              </div>
              <div style={{ color: 'var(--text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {renderPreview(sampleContact).body || <span style={{ color: 'var(--text-3)' }}>Email body preview</span>}
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--accent-glow)', borderRadius: 8, fontSize: 12, color: 'var(--accent-2)' }}>
              📊 Open tracking pixel will be auto-added to each email
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
