import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { BarChart2, Mail, MousePointer, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TrackingModule() {
  const [campaigns, setCampaigns] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [camps, lg] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('email_logs').select('*'),
    ])
    setCampaigns(camps.data || [])
    setLogs(lg.data || [])
    setLoading(false)
  }

  function getStats(campId) {
    const campLogs = logs.filter(l => l.campaign_id === campId)
    const total = campLogs.length
    const sent = campLogs.filter(l => l.status === 'sent' || l.status === 'opened' || l.status === 'clicked').length
    const opened = campLogs.filter(l => l.status === 'opened' || l.status === 'clicked').length
    const clicked = campLogs.filter(l => l.status === 'clicked').length
    const failed = campLogs.filter(l => l.status === 'failed').length
    return { total, sent, opened, clicked, failed }
  }

  const totalSent = campaigns.reduce((a, c) => a + (c.sent_count || 0), 0)
  const totalOpened = logs.filter(l => l.status === 'opened' || l.status === 'clicked').length
  const totalCampaigns = campaigns.length

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Tracking</h1>
        <p className="page-subtitle">Email opens, clicks and campaign performance</p>
      </div>

      {/* Global Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <span className="stat-label">Total Campaigns</span>
          <span className="stat-value">{totalCampaigns}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Emails Sent</span>
          <span className="stat-value">{totalSent}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Opens</span>
          <span className="stat-value">{totalOpened}</span>
          <span className="stat-sub">{totalSent ? Math.round((totalOpened / totalSent) * 100) : 0}% open rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Open Rate</span>
          <span className="stat-value">{totalSent ? Math.round((totalOpened / totalSent) * 100) : 0}%</span>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${totalSent ? Math.round((totalOpened / totalSent) * 100) : 0}%`, background: 'var(--success)' }} />
          </div>
        </div>
      </div>

      {/* Per Campaign */}
      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state">
          <BarChart2 size={48} />
          <h3>No campaigns yet</h3>
          <p>Send your first campaign to see tracking data here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {campaigns.map(camp => {
            const stats = getStats(camp.id)
            const openRate = stats.sent ? Math.round((stats.opened / stats.sent) * 100) : 0
            const isOpen = expanded === camp.id
            const campLogs = logs.filter(l => l.campaign_id === camp.id)

            return (
              <div className="card" key={camp.id} style={{ padding: 0, overflow: 'hidden' }}>
                {/* Campaign Header */}
                <div
                  style={{ padding: '18px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
                  onClick={() => setExpanded(isOpen ? null : camp.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{camp.name}</span>
                      <span className={`badge ${camp.status === 'sent' ? 'badge-success' : 'badge-warning'}`}>{camp.status}</span>
                    </div>
                    <div style={{ color: 'var(--text-3)', fontSize: 13 }}>{camp.subject}</div>
                  </div>

                  {/* Mini Stats */}
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{stats.sent}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Sent</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{stats.opened}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Opened</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-2)' }}>{openRate}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Rate</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>{stats.failed}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Failed</div>
                    </div>
                    {isOpen ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ height: 3, background: 'var(--bg-3)' }}>
                  <div style={{ height: '100%', width: `${openRate}%`, background: 'var(--success)', transition: 'width 0.4s' }} />
                </div>

                {/* Expanded Logs */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <div style={{ padding: '12px 24px 0', fontSize: 12, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email Log ({campLogs.length} recipients)
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Opened At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campLogs.map(log => (
                            <tr key={log.id}>
                              <td style={{ fontSize: 13 }}>{log.email}</td>
                              <td>
                                <span className={`badge ${log.status === 'opened' || log.status === 'clicked' ? 'badge-success' : log.status === 'sent' ? 'badge-accent' : 'badge-danger'}`}>
                                  {log.status}
                                </span>
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                {log.opened_at ? new Date(log.opened_at).toLocaleString() : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
