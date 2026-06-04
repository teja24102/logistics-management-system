import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { api } from '../../services/api.js'
import { Card, StatCard, Alert, PageHeader } from '../../components/UI.jsx'

const COLORS = ['#6366f1','#22d3ee','#34d399','#fbbf24','#f87171']

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1e293b', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#fff' }}>
      <div style={{ fontWeight:600, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color }}>{p.name}: {p.value}</div>)}
    </div>
  )
}

export default function Analytics() {
  const [dispatches, setDispatches] = useState([])
  const [stock,      setStock]      = useState([])
  const [drivers,    setDrivers]    = useState([])

  useEffect(() => {
    Promise.all([api.get('/dispatches/'), api.get('/stock/'), api.get('/drivers/')])
      .then(([d,s,dr]) => { setDispatches(d.data); setStock(s.data); setDrivers(dr.data) })
  }, [])

  const delivered = dispatches.filter(d => d.status==='delivered')
  const active    = dispatches.filter(d => ['awaiting_driver','accepted','in_transit'].includes(d.status))
  const cancelled = dispatches.filter(d => d.status==='cancelled')
  const lowStock  = stock.filter(s => s.quantity <= s.low_stock_threshold)

  const statusData = [
    { name:'Delivered',       value:delivered.length },
    { name:'In transit',      value:active.filter(d=>d.status==='in_transit').length },
    { name:'Accepted',        value:active.filter(d=>d.status==='accepted').length },
    { name:'Awaiting driver', value:active.filter(d=>d.status==='awaiting_driver').length },
    { name:'Cancelled',       value:cancelled.length },
  ].filter(d => d.value > 0)

  const priorityData = ['normal','high','urgent'].map(p => ({
    priority:p, count:dispatches.filter(d=>d.priority===p).length
  }))

  const catMap = {}
  stock.forEach(s => { catMap[s.category] = (catMap[s.category]||0) + s.quantity })
  const stockData = Object.entries(catMap).map(([cat,qty]) => ({ cat, qty }))

  const recs = []
  if (lowStock.length > 0) recs.push({ type:'warn', msg:`Restock needed: ${lowStock.map(s=>s.name).join(', ')}` })
  const top = [...drivers].sort((a,b)=>b.total_deliveries-a.total_deliveries)[0]
  if (top) recs.push({ type:'ok', msg:`Top driver: ${top.name} · ${top.total_deliveries} deliveries · ★ ${top.rating}` })

  return (
    <div style={{ padding:28, color:'#fff' }}>
      <PageHeader title="Analytics" sub="Operations overview and AI insights"/>
      {recs.map((r,i) => <Alert key={i} type={r.type}>🤖 {r.msg}</Alert>)}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatCard label="Total dispatches" value={dispatches.length} color="#6366f1" icon="📦"/>
        <StatCard label="Delivered"        value={delivered.length}  color="#34d399" icon="✅"/>
        <StatCard label="Active now"       value={active.length}     color="#c084fc" icon="🚛"/>
        <StatCard label="On-time rate"     value={dispatches.length>0?`${Math.round(delivered.length/Math.max(dispatches.length,1)*100)}%`:'—'} color="#22d3ee" icon="📈"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title="Dispatch status">
          {statusData.length === 0
            ? <div style={{ textAlign:'center', color:'rgba(255,255,255,.2)', padding:'32px 0' }}>No data yet</div>
            : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" paddingAngle={3}>
                    {statusData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip content={customTooltip}/>
                  <Legend iconSize={10} wrapperStyle={{ fontSize:12, color:'rgba(255,255,255,.5)' }}/>
                </PieChart>
              </ResponsiveContainer>}
        </Card>

        <Card title="By priority">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData} barSize={40}>
              <XAxis dataKey="priority" tick={{ fontSize:12, fill:'rgba(255,255,255,.5)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:'rgba(255,255,255,.3)' }} axisLine={false} tickLine={false} width={25}/>
              <Tooltip content={customTooltip}/>
              <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Stock by category">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stockData} barSize={28} layout="vertical">
              <XAxis type="number" tick={{ fontSize:11, fill:'rgba(255,255,255,.3)' }} axisLine={false} tickLine={false}/>
              <YAxis dataKey="cat" type="category" tick={{ fontSize:11, fill:'rgba(255,255,255,.4)' }} axisLine={false} tickLine={false} width={80}/>
              <Tooltip content={customTooltip}/>
              <Bar dataKey="qty" fill="#22d3ee" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Driver leaderboard">
          {[...drivers].sort((a,b)=>b.total_deliveries-a.total_deliveries).map((d,i) => (
            <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,.25)', minWidth:20 }}>#{i+1}</span>
              <div style={{ width:28, height:28, borderRadius:'50%', background:`linear-gradient(135deg,${COLORS[i%COLORS.length]},${COLORS[(i+1)%COLORS.length]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>
                {d.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, color:'#fff' }}>{d.name}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{d.current_location}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#fbbf24' }}>★ {d.rating}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{d.total_deliveries} deliveries</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
