import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Settings, Key, Mail, User, Save, Eye, EyeOff, CheckCircle, Puzzle } from 'lucide-react'
import toast from 'react-hot-toast'
import modules from '../../moduleRegistry'

const SETTINGS_SCHEMA = [
  {
    section: 'Brevo Configuration',
    icon: Key,
    fields: [
      { key: 'brevo_key', label: 'Brevo API Key', placeholder: 'xkeysib-...', secret: true, hint: 'Found in Brevo → Settings → API Keys' },
      { key: 'sender_email', label: 'Sender Email', placeholder: 'you@yourdomain.com', hint: 'Must be a verified sender in Brevo' },
      { key: 'sender_name', label: 'Sender Name', placeholder: 'Your Name or Company', hint: 'Displayed as "From" name in emails' },
    ]
  },
]

export default function SettingsModule() {
  const [values, setValues] = useState({})
  const [saved, setSaved] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState({})
  const [activeModules] = useState(modules)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data, error } = await supabase.from('settings').select('*')
    if (error) { toast.error('Failed to load settings'); setLoading(false); return }
    const s = {}
    ;(data || []).forEach(r => (s[r.key] = r.value))
    setValues(s)
    setSaved(s)
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    const rows = Object.entries(values).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
    if (error) toast.error('Save failed: ' + error.message)
    else { toast.success('Settings saved ✓'); setSaved({ ...values }) }
    setSaving(false)
  }

  function hasChanges() {
    return JSON.stringify(values) !== JSON.stringify(saved)
  }

  if (loading) return <div className="page"><div className="empty-state"><span className="spinner" /></div></div>

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure API keys, sender info, and manage modules</p>
      </div>

      {/* Settings Sections */}
      {SETTINGS_SCHEMA.map(section => {
        const Icon = section.icon
        return (
          <div className="card" key={section.section} style={{ marginBottom: 20 }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={16} color="var(--accent)" /> {section.section}
            </h3>

            {section.fields.map(field => (
              <div className="form-group" key={field.key}>
                <label className="form-label">{field.label}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={field.secret && !showSecrets[field.key] ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={values[field.key] || ''}
                    onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                    style={{ paddingRight: field.secret ? 42 : 14 }}
                  />
                  {field.secret && (
                    <button
                      onClick={() => setShowSecrets(s => ({ ...s, [field.key]: !s[field.key] }))}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-3)', display: 'flex' }}
                    >
                      {showSecrets[field.key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
                {field.hint && <span className="form-hint">{field.hint}</span>}
              </div>
            ))}
          </div>
        )
      })}

      {/* Module Registry */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Puzzle size={16} color="var(--accent)" /> Active Modules
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
          To add a new module, create a new component and register it in <code style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>src/moduleRegistry.js</code> — it'll appear automatically.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeModules.map(mod => {
            const Icon = mod.icon
            return (
              <div key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color="var(--accent-2)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{mod.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{mod.description}</div>
                </div>
                <span className={`badge ${mod.enabled ? 'badge-success' : 'badge-danger'}`}>
                  {mod.enabled ? '● Active' : '● Disabled'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="btn btn-primary"
          onClick={saveSettings}
          disabled={saving || !hasChanges()}
        >
          {saving ? <><span className="spinner" /> Saving...</> : <><Save size={15} /> Save Settings</>}
        </button>
        {!hasChanges() && saved.brevo_key && (
          <span style={{ fontSize: 13, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle size={14} /> All settings saved
          </span>
        )}
        {hasChanges() && (
          <span style={{ fontSize: 13, color: 'var(--warning)' }}>Unsaved changes</span>
        )}
      </div>
    </div>
  )
}
