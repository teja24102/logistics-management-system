import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../services/api.js'
import { Card, Alert, Btn, Empty, PageHeader } from '../../components/UI.jsx'
import { Plus, Trash2, Cpu } from 'lucide-react'

const INP = {
  width:'100%', padding:'10px 14px', borderRadius:9,
  border:'1px solid rgba(255,255,255,.1)',
  background:'#1e293b', color:'#fff',
  fontSize:13, outline:'none', transition:'all .2s'
}
const OPT = { background:'#1e293b', color:'#fff' }

export default function NewDispatch() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [stock,    setStock]    = useState([])
  const [drivers,  setDrivers]  = useState([])
  const [items,    setItems]    = useState([])
  const [dest,     setDest]     = useState('')
  const [notes,    setNotes]    = useState('')
  const [priority, setPriority] = useState('normal')
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState('')
  const [success,  setSuccess]  = useState(null)

  useEffect(() => {
    api.get('/stock/').then(r => setStock(r.data))
    api.get('/drivers/').then(r => setDrivers(r.data))
  }, [])

  const addItem = () => {
    if (!stock.length) return
    const s = stock[0]
    setItems(p => [...p, { stock_item_id:s.id, quantity:1, _name:s.name, _unit:s.unit, _avail:s.quantity }])
  }

  const updateItem = (idx, field, val) => {
    setItems(p => p.map((it,i) => {
      if (i !== idx) return it
      if (field === 'stock_item_id') {
        const s = stock.find(s => s.id === +val)
        return { ...it, stock_item_id:+val, _name:s?.name, _unit:s?.unit, _avail:s?.quantity }
      }
      return { ...it, [field]: field==='quantity' ? +val||1 : val }
    }))
  }

  const submit = async () => {
    setErr('')
    if (!dest.trim()) return setErr('Enter a destination address.')
    if (!items.length) return setErr('Add at least one stock item.')
    for (const it of items) {
      if (it.quantity < 1) return setErr('Quantity must be at least 1.')
      if (it.quantity > it._avail) return setErr(`Not enough stock for "${it._name}" — only ${it._avail} ${it._unit} available.`)
    }
    setBusy(true)
    try {
      const { data } = await api.post('/dispatches/', {
        destination:dest, notes, priority, created_by:user.name,
        items: items.map(it => ({ stock_item_id:it.stock_item_id, quantity:it.quantity }))
      })
      setSuccess(data)
    } catch(e) { setErr(e.response?.data?.detail || 'Failed to create dispatch.') }
    finally { setBusy(false) }
  }

  const avail = drivers.filter(d => d.availability)

  if (success) return (
    <div style={{ padding:28, color:'#fff', maxWidth:640, margin:'0 auto' }}>
      <div style={{ background:'rgba(52,211,153,.1)', border:'1px solid rgba(52,211,153,.3)', borderRadius:16, padding:32, textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#34d399', marginBottom:8 }}>{success.reference} Created!</h2>
        <p style={{ color:'rgba(255,255,255,.5)', fontSize:14 }}>
          {success.status === 'awaiting_driver'
            ? `AI assigned ${success.driver_name || 'a driver'} — waiting for acceptance.`
            : 'No drivers available — dispatch queued.'}
        </p>
      </div>
      <Card title="Summary">
        <div style={{ fontSize:13, display:'flex', flexDirection:'column', gap:8, color:'rgba(255,255,255,.7)' }}>
          <div><span style={{ color:'rgba(255,255,255,.4)' }}>Reference:</span> <strong style={{ color:'#fff' }}>{success.reference}</strong></div>
          <div><span style={{ color:'rgba(255,255,255,.4)' }}>Destination:</span> {success.destination}</div>
          <div><span style={{ color:'rgba(255,255,255,.4)' }}>Priority:</span> {success.priority}</div>
          <div><span style={{ color:'rgba(255,255,255,.4)' }}>Driver:</span> {success.driver_name || 'Pending assignment'}</div>
          <div><span style={{ color:'rgba(255,255,255,.4)' }}>Items:</span>
            <ul style={{ marginTop:4, paddingLeft:16 }}>
              {success.items.map((it,i) => <li key={i} style={{ fontSize:12 }}>{it.quantity} {it.unit} × {it.stock_name}</li>)}
            </ul>
          </div>
        </div>
      </Card>
      <div style={{ display:'flex', gap:10, marginTop:16 }}>
        <Btn onClick={() => setSuccess(null)}><Plus size={14}/> Create another</Btn>
        <Btn onClick={() => nav('/manager/tracking')} outline color="#6366f1">View on map</Btn>
        <Btn onClick={() => nav('/manager')} outline color="#94a3b8">Dashboard</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ padding:28, color:'#fff', maxWidth:840, margin:'0 auto' }}>
      <PageHeader title="Create New Dispatch" sub="Select stock items, set destination — AI assigns the best driver automatically"/>

      {err && <Alert type="error">{err}</Alert>}
      <Alert type={avail.length > 0 ? 'ok' : 'warn'}>
        {avail.length > 0
          ? `🤖 AI ready — ${avail.length} driver(s) available: ${avail.map(d=>d.name).join(', ')}`
          : '⚠️ No drivers available — dispatch will be queued.'}
      </Alert>

      <Card title="Delivery destination" style={{ marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Full address *</div>
            <input style={INP} placeholder="e.g. Connaught Place, New Delhi" value={dest} onChange={e => setDest(e.target.value)}/>
          </div>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Priority</div>
            <select style={INP} value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="normal" style={OPT}>Normal</option>
              <option value="high"   style={OPT}>🟡 High</option>
              <option value="urgent" style={OPT}>🔴 Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Notes (optional)</div>
          <textarea style={{ ...INP, height:60, resize:'vertical' }} placeholder="Special instructions, contact person, gate number…" value={notes} onChange={e => setNotes(e.target.value)}/>
        </div>
      </Card>

      <Card title="Stock items to dispatch"
        action={<Btn size="sm" onClick={addItem}><Plus size={13}/> Add item</Btn>}
        style={{ marginBottom:20 }}>
        {items.length === 0 && <Empty icon="📦" text='Click "Add item" to select stock'/>}
        {items.map((it,idx) => {
          const over = it.quantity > it._avail
          return (
            <div key={idx} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 80px 40px', gap:10, alignItems:'end', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
              <div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:5 }}>Stock item</div>
                <select style={INP} value={it.stock_item_id} onChange={e => updateItem(idx,'stock_item_id',e.target.value)}>
                  {stock.map(s => (
                    <option key={s.id} value={s.id} style={OPT}>{s.name} ({s.quantity} {s.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color: over?'#f87171':'rgba(255,255,255,.4)', marginBottom:5 }}>
                  Qty ({it._unit}) {over && '— over!'}
                </div>
                <input style={{ ...INP, borderColor: over?'#f87171':undefined }} type="number" min="1" value={it.quantity} onChange={e => updateItem(idx,'quantity',e.target.value)}/>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:5 }}>Available</div>
                <div style={{ fontSize:14, fontWeight:700, padding:'10px 0', color: it._avail<=10?'#f87171':'#34d399' }}>{it._avail}</div>
              </div>
              <div style={{ paddingTop:20 }}>
                <button onClick={() => setItems(p=>p.filter((_,i)=>i!==idx))} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.3)', padding:6 }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          )
        })}
        {items.length > 0 && (
          <div style={{ marginTop:12, padding:'8px 12px', background:'rgba(99,102,241,.08)', borderRadius:8, fontSize:12, color:'rgba(255,255,255,.5)' }}>
            📦 {items.length} item type(s) · Total: {items.reduce((a,b)=>a+b.quantity,0)} units
          </div>
        )}
      </Card>

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <Btn onClick={submit} disabled={busy} size="lg" style={{ background:'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow:'0 8px 32px rgba(99,102,241,.4)' }}>
          <Cpu size={16}/> {busy ? 'Creating & assigning driver…' : 'Create dispatch — AI assigns driver'}
        </Btn>
        <Btn onClick={() => nav('/manager')} outline color="#94a3b8">Cancel</Btn>
        <span style={{ fontSize:12, color:'rgba(255,255,255,.25)', marginLeft:'auto' }}>Stock deducted on creation</span>
      </div>
    </div>
  )
}