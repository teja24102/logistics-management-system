import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { Card, Alert, Btn, Empty, PageHeader } from '../../components/UI.jsx'
import { Plus, AlertTriangle } from 'lucide-react'

const INP = {
  width:'100%', padding:'10px 14px', borderRadius:9,
  border:'1px solid rgba(255,255,255,.1)',
  background:'#1e293b', color:'#fff',
  fontSize:13, outline:'none'
}
const OPT = { background:'#1e293b', color:'#fff' }

export default function Inventory() {
  const [stock,    setStock]   = useState([])
  const [form,     setForm]    = useState({ name:'', sku:'', category:'General', quantity:0, unit:'units', low_stock_threshold:10 })
  const [editing,  setEditing] = useState(null)
  const [showForm, setShowForm]= useState(false)
  const [msg,      setMsg]     = useState(null)
  const [busy,     setBusy]    = useState(false)

  const load = () => api.get('/stock/').then(r => setStock(r.data))
  useEffect(() => { load() }, [])

  const save = async () => {
    setBusy(true)
    try {
      if (editing) {
        await api.patch(`/stock/${editing}/`, { quantity:+form.quantity, name:form.name, low_stock_threshold:+form.low_stock_threshold, category:form.category })
        setMsg({ type:'ok', text:'Updated ✓' })
      } else {
        await api.post('/stock/', { ...form, quantity:+form.quantity, low_stock_threshold:+form.low_stock_threshold })
        setMsg({ type:'ok', text:'Added ✓' })
      }
      setShowForm(false); setEditing(null)
      setForm({ name:'', sku:'', category:'General', quantity:0, unit:'units', low_stock_threshold:10 })
      load(); setTimeout(() => setMsg(null), 3000)
    } catch(e) { setMsg({ type:'error', text: e.response?.data?.detail || 'Error' }) }
    finally { setBusy(false) }
  }

  const startEdit = s => {
    setEditing(s.id); setShowForm(true)
    setForm({ name:s.name, sku:s.sku, category:s.category, quantity:s.quantity, unit:s.unit, low_stock_threshold:s.low_stock_threshold })
  }

  const lowStock = stock.filter(s => s.quantity <= s.low_stock_threshold)

  return (
    <div style={{ padding:28, color:'#fff' }}>
      <PageHeader title="Warehouse Inventory" sub={`${stock.length} items · Main Warehouse`}
        action={<Btn onClick={() => { setShowForm(true); setEditing(null); setForm({ name:'', sku:'', category:'General', quantity:0, unit:'units', low_stock_threshold:10 }) }}><Plus size={14}/> Add item</Btn>}/>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}
      {lowStock.length > 0 && <Alert type="warn">⚠️ Low stock: {lowStock.map(s=>`${s.name} (${s.quantity} ${s.unit})`).join(' · ')}</Alert>}

      {showForm && (
        <Card style={{ marginBottom:20 }} title={editing ? 'Edit stock item' : 'Add new stock item'}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Item name *</div>
              <input style={INP} placeholder="e.g. Rice Bags 25kg" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>SKU *</div>
              <input style={INP} placeholder="e.g. RICE-25" value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} disabled={!!editing}/>
            </div>
            <div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Category</div>
              <input style={INP} placeholder="e.g. Grains" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}/>
            </div>
            <div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Unit</div>
              <select style={INP} value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
                {['units','bags','boxes','pallets','kg','litres','cans','bottles','bundles','packets'].map(u => (
                  <option key={u} value={u} style={OPT}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Quantity in stock</div>
              <input style={INP} type="number" min="0" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))}/>
            </div>
            <div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Low stock threshold</div>
              <input style={INP} type="number" min="1" value={form.low_stock_threshold} onChange={e=>setForm(f=>({...f,low_stock_threshold:e.target.value}))}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <Btn onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Update item' : 'Add item'}</Btn>
            <Btn onClick={() => { setShowForm(false); setEditing(null) }} outline color="#94a3b8">Cancel</Btn>
          </div>
        </Card>
      )}

      <Card>
        {stock.length === 0 && <Empty icon="📦" text="No items yet — click Add item to get started"/>}
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          {stock.length > 0 && (
            <thead>
              <tr style={{ color:'rgba(255,255,255,.3)', fontSize:11, textTransform:'uppercase', letterSpacing:'.05em' }}>
                {['SKU','Name','Category','Qty','Unit','Status','Action'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'8px 10px', borderBottom:'1px solid rgba(255,255,255,.07)', fontWeight:500 }}>{h}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {stock.map(s => {
              const low = s.quantity <= s.low_stock_threshold
              return (
                <tr key={s.id} style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding:'11px 10px', color:'rgba(255,255,255,.35)', fontFamily:'monospace', fontSize:11 }}>{s.sku}</td>
                  <td style={{ padding:'11px 10px', color:'#fff', fontWeight:500 }}>
                    {low && <AlertTriangle size={12} color="#f87171" style={{ marginRight:6, verticalAlign:'middle' }}/>}
                    {s.name}
                  </td>
                  <td style={{ padding:'11px 10px', color:'rgba(255,255,255,.45)' }}>{s.category}</td>
                  <td style={{ padding:'11px 10px', fontWeight:700, fontSize:14, color: low ? '#f87171' : s.quantity > s.low_stock_threshold*3 ? '#34d399' : '#fff' }}>{s.quantity}</td>
                  <td style={{ padding:'11px 10px', color:'rgba(255,255,255,.45)' }}>{s.unit}</td>
                  <td style={{ padding:'11px 10px' }}>
                    {low
                      ? <span style={{ fontSize:11, color:'#f87171', fontWeight:600, background:'rgba(248,113,113,.1)', padding:'3px 8px', borderRadius:6 }}>⚠ Low</span>
                      : <span style={{ fontSize:11, color:'#34d399', fontWeight:600, background:'rgba(52,211,153,.1)', padding:'3px 8px', borderRadius:6 }}>✓ OK</span>
                    }
                  </td>
                  <td style={{ padding:'11px 10px' }}>
                    <button onClick={() => startEdit(s)} style={{ color:'#818cf8', background:'rgba(129,140,248,.1)', border:'1px solid rgba(129,140,248,.2)', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:500, padding:'4px 10px' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}