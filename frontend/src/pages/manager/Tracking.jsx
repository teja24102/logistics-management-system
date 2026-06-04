import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/api.js'
import { geocode, getRoute } from '../../services/geo.js'
import { Card, Badge, Empty, PageHeader } from '../../components/UI.jsx'

export default function Tracking() {
  const mapRef   = useRef(null)
  const leafRef  = useRef(null)
  const mrkRef   = useRef({})
  const rteRef   = useRef({})
  const geoCache = useRef({})
  const [dispatches, setDispatches] = useState([])
  const [drivers,    setDrivers]    = useState([])
  const [selected,   setSelected]   = useState(null)
  const [routeInfo,  setRouteInfo]  = useState(null)
  const [geocoding,  setGeocoding]  = useState(false)

  const load = async () => {
    try {
      const [d, dr] = await Promise.all([api.get('/dispatches/'), api.get('/drivers/')])
      setDispatches(d.data); setDrivers(dr.data)
    } catch(e) { console.error(e) }
  }

  useEffect(() => { load(); const id = setInterval(load, 8000); return () => clearInterval(id) }, [])

  useEffect(() => {
    const L = window.L
    if (!L || !mapRef.current || leafRef.current) return
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5)
    leafRef.current = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'© OpenStreetMap', maxZoom:18
    }).addTo(map)
    return () => { map.remove(); leafRef.current = null }
  }, [])

  useEffect(() => {
    const L = window.L; const map = leafRef.current
    if (!L || !map || !dispatches.length) return

    const active = dispatches.filter(d => ['accepted','in_transit','awaiting_driver'].includes(d.status))

    active.forEach(async d => {
      const drv   = drivers.find(dr => dr.id === d.assigned_driver)
      const color = d.status==='in_transit'?'#c084fc':d.status==='accepted'?'#818cf8':'#fbbf24'
      const dPos  = drv?.latitude ? { lat:drv.latitude, lng:drv.longitude } : { lat:20.5+Math.random()*.5, lng:78.9+Math.random()*.5 }

      const mKey = `drv-${d.id}`
      const dIcon = L.divIcon({ html:`<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2.5px solid #0f172a;box-shadow:0 0 10px ${color};cursor:pointer"></div>`, iconSize:[14,14], iconAnchor:[7,7], className:'' })
      if (mrkRef.current[mKey]) { mrkRef.current[mKey].setLatLng([dPos.lat,dPos.lng]).setIcon(dIcon) }
      else {
        mrkRef.current[mKey] = L.marker([dPos.lat,dPos.lng],{icon:dIcon}).addTo(map)
          .bindPopup(`<b style="color:#1e293b">${drv?.name||'Driver'}</b><br>${d.reference}<br>${d.status.replace('_',' ')}<br>→ ${d.destination}`)
          .on('click',()=>{ setSelected(d); setRouteInfo(null) })
      }

      const dstKey = `dst-${d.id}`
      if (!mrkRef.current[dstKey]) {
        let pos = geoCache.current[d.destination]
        if (!pos) {
          pos = await geocode(d.destination)
          if (pos) geoCache.current[d.destination] = pos
        }
        if (pos) {
          const dstIcon = L.divIcon({ html:`<div style="background:#f87171;width:12px;height:12px;border-radius:50%;border:2px solid #0f172a;box-shadow:0 0 8px #f87171"></div>`, iconSize:[12,12], iconAnchor:[6,6], className:'' })
          mrkRef.current[dstKey] = L.marker([pos.lat,pos.lng],{icon:dstIcon}).addTo(map)
            .bindPopup(`<b style="color:#1e293b">📍 ${d.reference}</b><br>${d.destination}`)
        }
      }

      if (d.status==='in_transit' && !rteRef.current[d.id]) {
        const pos = geoCache.current[d.destination]
        if (pos) {
          getRoute(dPos, pos).then(r => {
            if (r) rteRef.current[d.id] = L.polyline(r.coords,{ color, weight:3, opacity:.7 }).addTo(map)
          })
        }
      }
    })
  }, [dispatches, drivers])

  useEffect(() => {
    if (!selected) return
    setGeocoding(true)
    const drv  = drivers.find(d => d.id === selected.assigned_driver)
    const dPos = drv?.latitude ? { lat:drv.latitude, lng:drv.longitude } : { lat:20.5, lng:78.9 }
    geocode(selected.destination).then(pos => {
      setGeocoding(false)
      if (!pos) return
      geoCache.current[selected.destination] = pos
      getRoute(dPos, pos).then(setRouteInfo)
      const map = leafRef.current
      if (map) map.fitBounds([[dPos.lat,dPos.lng],[pos.lat,pos.lng]], { padding:[60,60] })
    })
  }, [selected])

  const active = dispatches.filter(d => ['awaiting_driver','accepted','in_transit'].includes(d.status))
  const SC = { awaiting_driver:'#fbbf24', accepted:'#818cf8', in_transit:'#c084fc', delivered:'#34d399', cancelled:'#f87171' }

  return (
    <div style={{ padding:28, color:'#fff' }}>
      <PageHeader title="Live Tracking" sub={`${active.length} active dispatch(es) · All India coverage · Real addresses via OpenStreetMap`}/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        <Card title="Live dispatch map — India-wide">
          <div ref={mapRef} style={{ height:520, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,.08)' }}/>
          <div style={{ display:'flex', gap:16, marginTop:10, fontSize:11, color:'rgba(255,255,255,.35)', flexWrap:'wrap' }}>
            <span>🟡 Awaiting driver</span><span>🟣 Accepted</span><span>💜 In transit</span><span>🔴 Destination</span>
          </div>
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Card title="Active dispatches">
            {active.length === 0 && <Empty icon="🚛" text="No active dispatches"/>}
            {active.map(d => (
              <div key={d.id} onClick={() => setSelected(selected?.id===d.id ? null : d)}
                style={{ padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.05)', cursor:'pointer', borderRadius: selected?.id===d.id?8:0, paddingLeft: selected?.id===d.id?8:0, background: selected?.id===d.id?'rgba(99,102,241,.1)':'transparent', transition:'all .15s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:SC[d.status]||'#94a3b8', boxShadow:`0 0 6px ${SC[d.status]||'#94a3b8'}` }}/>
                  <span style={{ fontWeight:600, fontSize:13, color:'#fff' }}>{d.reference}</span>
                  <Badge label={d.priority}/>
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>📍 {d.destination}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.25)', marginTop:2 }}>{d.driver_name||'Searching…'}</div>
              </div>
            ))}
          </Card>

          {selected && (
            <Card title={`${selected.reference}`}>
              {geocoding && <div style={{ fontSize:12, color:'#818cf8', marginBottom:8 }}>🌍 Geocoding address…</div>}
              <div style={{ fontSize:13, display:'flex', flexDirection:'column', gap:6, color:'rgba(255,255,255,.7)' }}>
                <div><span style={{ color:'rgba(255,255,255,.4)' }}>To:</span> {selected.destination}</div>
                <div><span style={{ color:'rgba(255,255,255,.4)' }}>Driver:</span> {selected.driver_name||'—'}</div>
                <div><span style={{ color:'rgba(255,255,255,.4)' }}>Status:</span> <Badge label={selected.status} text={selected.status.replace('_',' ')}/></div>
                {routeInfo && (
                  <div style={{ background:'rgba(99,102,241,.1)', borderRadius:8, padding:'8px 10px', marginTop:4, border:'1px solid rgba(99,102,241,.2)' }}>
                    <div style={{ fontSize:12, color:'#818cf8', fontWeight:600, marginBottom:4 }}>🗺 Route</div>
                    <div style={{ fontSize:12 }}>📏 {routeInfo.dist} km</div>
                    <div style={{ fontSize:12 }}>⏱ ~{routeInfo.dur} min ETA</div>
                  </div>
                )}
                <div style={{ marginTop:4 }}>
                  {selected.items.map((it,i) => (
                    <div key={i} style={{ fontSize:12, padding:'2px 0', color:'rgba(255,255,255,.5)' }}>• {it.quantity} {it.unit} × {it.stock_name}</div>
                  ))}
                </div>
              </div>
              <button onClick={()=>{setSelected(null);setRouteInfo(null)}} style={{ marginTop:10, fontSize:11, color:'rgba(255,255,255,.3)', background:'none', border:'none', cursor:'pointer' }}>✕ Close</button>
            </Card>
          )}

          <Card title="Drivers">
            {drivers.map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>
                  {d.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'#fff' }}>{d.name}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>★ {d.rating}</div>
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
