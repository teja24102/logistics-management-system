import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import { Card, StatCard, Badge, Alert, Empty, PageHeader } from '../../components/UI.jsx'
import { AlertTriangle, PlusCircle } from 'lucide-react'

export default function Dashboard() {
  const [dispatches, setDispatches] = useState([])
  const [stock,      setStock]      = useState([])
  const [drivers,    setDrivers]    = useState([])
  const nav = useNavigate()

  const load = async () => {
    try {
      const [d, s, dr] = await Promise.all([
        api.get('/dispatches/'), api.get('/stock/'), api.get('/drivers/')
      ])
      setDispatches(d.data); setStock(s.data); setDrivers(dr.data)
    } catch(e) { console.error(e) }
  }

  useEffect(() => { load(); const id = setInterval(load, 8000); return () => clearInterval(id) }, [])

  const active    = dispatches.filter(d => ['awaiting_driver','accepted','in_transit'].includes(d.status))
  const delivered = dispatches.filter(d => d.status === 'delivered')
  const lowStock  = stock.filter(s => s.quantity <= s.low_stock_threshold)
  const available = drivers.filter(d => d.availability)

  const recs = []
  if (lowStock.length > 0) recs.push({ type:'warn', msg:`⚠️ ${lowStock.length} item(s) critically low: ${lowStock.slice(0,2).map(s=>s.name).join(', ')}` })
  if (available.length === 0) recs.push({ type:'error', msg:'🚨 No drivers available — new dispatches will be queued.' })
  if (dispatches.filter(d=>d.status==='pending').length > 0) recs.push({ type:'info', msg:`🤖 ${dispatches.filter(d=>d.status==='pending').length} dispatch(es) pending driver assignment.` })
  if (recs.length === 0) recs.push({ type:'ok', msg:'✅ All systems normal. Deliveries on track.' })

  const STATUS_DOT = { pending:'#94a3b8', awaiting_driver:'#fbbf24', accepted:'#818cf8', in_transit:'#c084fc', delivered:'#34d399', cancelled:'#f87171' }

  return (
    <div style={{ padding:28, color:'#fff' }}>
      <style>{`@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <PageHeader title="Dashboard" sub="Live overview of warehouse operations"
        action={
          <button onClick={() => nav('/manager/dispatch')}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366f1,#818cf8)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 20px rgba(99,102,241,.4)' }}>
            <PlusCircle size={15}/> New Dispatch
          </button>
        }/>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>🤖 AI Recommendations</div>
        {recs.map((r,i) => <Alert key={i} type={r.type}>{r.msg}</Alert>)}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatCard label="Active dispatches" value={active.length}    color="#6366f1" icon="🚛" sub={`${active.filter(d=>d.status==='in_transit').length} in transit`}/>
        <StatCard label="Delivered today"   value={delivered.length} color="#34d399" icon="✅"/>
        <StatCard label="Low stock alerts"  value={lowStock.length}  color="#f87171" icon="⚠️"/>
        <StatCard label="Drivers available" value={available.length} color="#22d3ee" icon="👨‍✈️" sub={`of ${drivers.length} total`}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16 }}>
        <Card title="Recent dispatches">
          {dispatches.length === 0 && <Empty text="No dispatches yet" icon="📦"/>}
          {dispatches.slice(0,8).map(d => (
            <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background:STATUS_DOT[d.status]||'#94a3b8', boxShadow:`0 0 8px ${STATUS_DOT[d.status]||'#94a3b8'}`, animation:d.status==='in_transit'?'pulse-dot 2s infinite':'' }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{d.reference}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>→ {d.destination}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <Badge label={d.status} text={d.status.replace('_',' ')}/>
                <Badge label={d.priority}/>
              </div>
            </div>
          ))}
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Card title="Stock alerts">
            {lowStock.length === 0
              ? <Alert type="ok">All stock levels healthy ✓</Alert>
              : lowStock.slice(0,5).map(s => (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                  <AlertTriangle size={13} color="#f87171"/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:'#fff' }}>{s.name}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{s.sku}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#f87171' }}>{s.quantity}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>{s.unit}</div>
                  </div>
                </div>
              ))
            }
          </Card>

          <Card title="Driver roster">
            {drivers.map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {d.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'#fff' }}>{d.name}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>★ {d.rating} · {d.vehicle_type}</div>
                </div>
                <Badge label={d.availability ? 'available' : 'busy'}/>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
