import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../services/api.js'
import { geocode, getRoute } from '../../services/geo.js'
import { Badge, Alert } from '../../components/UI.jsx'
import {
  LogOut, CheckCircle, XCircle, Navigation, MapPin, Package,
  Route, ChevronDown, ChevronUp, Clock, AlertOctagon, Wifi, WifiOff
} from 'lucide-react'

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function Countdown({ distKm, startedAt }) {
  const [elapsed, setElapsed] = useState(0)
  const totalMin = Math.ceil((distKm / 45) * 60)

  useEffect(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now()
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000 / 60))
    }, 10000)
    return () => clearInterval(id)
  }, [startedAt])

  const remaining = Math.max(0, totalMin - elapsed)
  const pct = Math.min(100, (elapsed / totalMin) * 100)

  return (
    <div style={{ background:'rgba(192,132,252,.08)', border:'1px solid rgba(192,132,252,.2)', borderRadius:12, padding:'14px 16px', marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Clock size={15} color="#c084fc"/>
          <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>ETA Countdown</span>
        </div>
        <span style={{ fontSize:20, fontWeight:800, color: remaining < 10 ? '#f87171' : '#c084fc' }}>
          {remaining} min
        </span>
      </div>
      <div style={{ background:'rgba(255,255,255,.08)', borderRadius:99, height:6, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:99, width:`${pct}%`, background:'linear-gradient(90deg,#6366f1,#c084fc)', transition:'width .5s' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11, color:'rgba(255,255,255,.35)' }}>
        <span>📏 {distKm} km total</span>
        <span>{Math.round(pct)}% complete</span>
      </div>
    </div>
  )
}

// ─── Navigation Panel ─────────────────────────────────────────────────────────
function NavPanel({ steps, currentStep }) {
  const step = steps[currentStep] || steps[0]
  if (!step) return null
  const turnIcon = t => ({ turn:'↱', 'new name':'→', depart:'🚀', arrive:'🏁', merge:'⤵', roundabout:'🔄' }[t] || '→')

  return (
    <div style={{ background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.25)', borderRadius:12, padding:'14px 16px', marginBottom:12 }}>
      <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Next turn</div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
        <div style={{ width:44, height:44, borderRadius:10, background:'rgba(99,102,241,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
          {turnIcon(step.type)}
        </div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{step.inst || 'Continue straight'}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:2 }}>
            {step.dist >= 1000 ? `${(step.dist/1000).toFixed(1)} km` : `${step.dist} m`}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
        {steps.slice(0, 5).map((s, i) => (
          <div key={i} style={{ flexShrink:0, background: i===currentStep ? 'rgba(99,102,241,.4)' : 'rgba(255,255,255,.05)', borderRadius:8, padding:'4px 10px', fontSize:11, color: i===currentStep ? '#a5b4fc' : 'rgba(255,255,255,.3)', border: i===currentStep ? '1px solid rgba(99,102,241,.4)' : '1px solid transparent' }}>
            {turnIcon(s.type)} {s.dist >= 1000 ? `${(s.dist/1000).toFixed(1)}km` : `${s.dist}m`}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Delivery Proof Modal ─────────────────────────────────────────────────────
function DeliveryProofModal({ dispatch, onConfirm, onClose }) {
  const canvasRef = useRef(null)
  const [drawing,  setDrawing]  = useState(false)
  const [receiver, setReceiver] = useState('')
  const [hasSig,   setHasSig]   = useState(false)
  const [busy,     setBusy]     = useState(false)

  const startDraw = e => {
    setDrawing(true)
    const c = canvasRef.current
    const r = c.getBoundingClientRect()
    const ctx = c.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top)
  }
  const draw = e => {
    if (!drawing) return
    const c = canvasRef.current
    const r = c.getBoundingClientRect()
    const ctx = c.getContext('2d')
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top)
    ctx.strokeStyle = '#818cf8'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.stroke()
    setHasSig(true)
  }
  const stopDraw = () => setDrawing(false)
  const clearSig = () => {
    const c = canvasRef.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    setHasSig(false)
  }

  const confirm = async () => {
    if (!receiver.trim()) return alert('Enter receiver name')
    if (!hasSig) return alert('Please get a signature')
    setBusy(true)
    await onConfirm(receiver)
    setBusy(false)
  }

  const INP = { width:'100%', padding:'10px 14px', borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'#1e293b', color:'#fff', fontSize:13, outline:'none' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#1e293b', borderRadius:20, width:'100%', maxWidth:460, border:'1px solid rgba(255,255,255,.1)', boxShadow:'0 40px 80px rgba(0,0,0,.8)', overflow:'hidden' }}>
        <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(52,211,153,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <CheckCircle size={18} color="#34d399"/>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:'#fff' }}>Confirm Delivery</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.4)' }}>{dispatch.reference} · {dispatch.destination}</div>
          </div>
        </div>
        <div style={{ padding:20 }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Receiver's name *</div>
            <input style={INP} placeholder="Name of person who received" value={receiver} onChange={e => setReceiver(e.target.value)}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.05em' }}>Receiver's signature *</div>
              <button onClick={clearSig} style={{ fontSize:11, color:'rgba(255,255,255,.3)', background:'none', border:'none', cursor:'pointer' }}>Clear</button>
            </div>
            <canvas ref={canvasRef} width={380} height={120}
              style={{ width:'100%', height:120, borderRadius:10, background:'rgba(255,255,255,.03)', border:`1px solid ${hasSig ? 'rgba(129,140,248,.4)' : 'rgba(255,255,255,.1)'}`, cursor:'crosshair', display:'block' }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}/>
            {!hasSig && <div style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,.2)', marginTop:6 }}>Draw signature above</div>}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={confirm} disabled={busy}
              style={{ flex:1, padding:'12px 0', borderRadius:10, border:'none', background: busy ? 'rgba(52,211,153,.3)' : 'linear-gradient(135deg,#34d399,#10b981)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <CheckCircle size={15}/> {busy ? 'Confirming…' : 'Confirm delivery'}
            </button>
            <button onClick={onClose}
              style={{ padding:'12px 20px', borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'rgba(255,255,255,.5)', fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Route Map Modal ──────────────────────────────────────────────────────────
function RouteMapModal({ dispatch, onClose }) {
  const mapRef  = useRef(null)
  const leafRef = useRef(null)
  const [info,      setInfo]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [geoErr,    setGeoErr]    = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [destLabel, setDestLabel] = useState('')

  useEffect(() => {
    const L = window.L
    if (!L || !mapRef.current || leafRef.current) return
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5)
    leafRef.current = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'© OpenStreetMap', maxZoom:18
    }).addTo(map)

    const fromPos = { lat:17.385, lng:78.486 }
    const warehouseIcon = L.divIcon({ html:`<div style="background:#34d399;width:16px;height:16px;border-radius:50%;border:3px solid #0f172a;box-shadow:0 0 12px #34d399"></div>`, iconSize:[16,16], iconAnchor:[8,8], className:'' })
    const destIcon      = L.divIcon({ html:`<div style="background:#f87171;width:16px;height:16px;border-radius:50%;border:3px solid #0f172a;box-shadow:0 0 12px #f87171"></div>`, iconSize:[16,16], iconAnchor:[8,8], className:'' })
    const driverIcon    = L.divIcon({ html:`<div style="background:#818cf8;width:22px;height:22px;border-radius:50%;border:3px solid #0f172a;box-shadow:0 0 16px #818cf8;display:flex;align-items:center;justify-content:center;font-size:11px">🚛</div>`, iconSize:[22,22], iconAnchor:[11,11], className:'' })

    L.marker([fromPos.lat,fromPos.lng],{icon:warehouseIcon}).addTo(map).bindPopup('<b>📦 Main Warehouse</b>')
    const driverMarker = L.marker([fromPos.lat,fromPos.lng],{icon:driverIcon}).addTo(map).bindPopup('<b>🚛 You</b>')

    geocode(dispatch.destination).then(pos => {
      setLoading(false)
      if (!pos) { setGeoErr(true); return }
      setDestLabel(pos.label?.substring(0,80) || dispatch.destination)
      L.marker([pos.lat,pos.lng],{icon:destIcon}).addTo(map)
        .bindPopup(`<b>🏁 Destination</b><br>${dispatch.destination}`).openPopup()

      getRoute(fromPos, pos).then(r => {
        if (!r) {
          L.polyline([[fromPos.lat,fromPos.lng],[pos.lat,pos.lng]],{color:'#818cf8',weight:3,dashArray:'8,5'}).addTo(map)
          map.fitBounds([[fromPos.lat,fromPos.lng],[pos.lat,pos.lng]],{padding:[60,60]})
          return
        }
        setInfo(r)
        const poly = L.polyline(r.coords,{color:'#818cf8',weight:5,opacity:.85}).addTo(map)
        map.fitBounds(poly.getBounds(),{padding:[60,60]})
        let i = 0
        const step = Math.max(1, Math.ceil(r.coords.length/100))
        const anim = setInterval(() => {
          i += step
          if (i >= r.coords.length) { clearInterval(anim); return }
          driverMarker.setLatLng(r.coords[Math.min(i, r.coords.length-1)])
        }, 600)
      })
    })
    return () => { map.remove(); leafRef.current = null }
  }, [dispatch])

  const turnIcon = t => ({ turn:'↱','new name':'→',depart:'🚀',arrive:'🏁',merge:'⤵',roundabout:'🔄' }[t]||'→')

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#1e293b', borderRadius:20, width:'100%', maxWidth:860, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', border:'1px solid rgba(255,255,255,.1)', boxShadow:'0 40px 80px rgba(0,0,0,.8)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(129,140,248,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Route size={18} color="#818cf8"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#fff' }}>{dispatch.reference} — Delivery Route</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.4)' }}>Main Warehouse → {dispatch.destination}</div>
          </div>
          {loading && <span style={{ fontSize:12, color:'#818cf8' }}>🌍 Geocoding…</span>}
          {geoErr  && <span style={{ fontSize:12, color:'#f87171' }}>⚠ Address not found</span>}
          <button onClick={onClose} style={{ padding:'6px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.6)', cursor:'pointer', fontSize:12 }}>✕ Close</button>
        </div>
        <div ref={mapRef} style={{ flex:1, minHeight:420 }}/>
        <div style={{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.08)', background:'rgba(255,255,255,.02)' }}>
          {destLabel && <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', marginBottom:8 }}>📍 {destLabel}</div>}
          {info ? (
            <>
              <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'#fff' }}>📏 <strong>{info.dist} km</strong></span>
                <span style={{ fontSize:13, color:'#fbbf24' }}>⏱ <strong>~{info.dur} min ETA</strong></span>
                <button onClick={() => setShowSteps(v=>!v)} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#818cf8', fontWeight:500, marginLeft:'auto' }}>
                  {showSteps ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                  {showSteps?'Hide':'Show'} directions ({info.steps.length} steps)
                </button>
              </div>
              {showSteps && (
                <div style={{ maxHeight:160, overflowY:'auto', borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:8 }}>
                  {info.steps.map((s,i) => (
                    <div key={i} style={{ display:'flex', gap:10, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:12 }}>
                      <span style={{ minWidth:20 }}>{turnIcon(s.type)}</span>
                      <span style={{ flex:1, color:'rgba(255,255,255,.6)' }}>{s.inst||'Continue'}</span>
                      <span style={{ color:'rgba(255,255,255,.25)', whiteSpace:'nowrap' }}>{s.dist>=1000?`${(s.dist/1000).toFixed(1)}km`:`${s.dist}m`}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize:12, color:'rgba(255,255,255,.3)' }}>
              {loading ? '🌍 Finding location via OpenStreetMap…' : geoErr ? '⚠ Try adding city/state/pincode' : 'Calculating road route…'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SOS Modal ────────────────────────────────────────────────────────────────
function SOSModal({ onClose }) {
  const [sent,   setSent]   = useState(false)
  const [reason, setReason] = useState('')

  const send = () => { setSent(true); setTimeout(onClose, 3000) }

  const reasons = ['Vehicle breakdown','Accident','Flat tyre','Medical emergency','Road blocked','Other']

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.9)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#1e293b', borderRadius:20, width:'100%', maxWidth:400, border:'1px solid rgba(239,68,68,.3)', boxShadow:'0 0 60px rgba(239,68,68,.3)', overflow:'hidden' }}>
        <div style={{ background:'linear-gradient(135deg,rgba(239,68,68,.2),rgba(239,68,68,.05))', padding:'20px', textAlign:'center', borderBottom:'1px solid rgba(239,68,68,.2)' }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🆘</div>
          <div style={{ fontSize:18, fontWeight:800, color:'#f87171' }}>Emergency Alert</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.5)', marginTop:4 }}>Manager will be notified immediately</div>
        </div>
        {sent ? (
          <div style={{ padding:24, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#34d399' }}>Alert sent!</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginTop:6 }}>Manager notified. Help is on the way.</div>
          </div>
        ) : (
          <div style={{ padding:20 }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:10, textTransform:'uppercase', letterSpacing:'.05em' }}>Select reason</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {reasons.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  style={{ padding:'9px 12px', borderRadius:9, border:`1px solid ${reason===r?'rgba(239,68,68,.5)':'rgba(255,255,255,.1)'}`, background: reason===r?'rgba(239,68,68,.15)':'rgba(255,255,255,.03)', color: reason===r?'#f87171':'rgba(255,255,255,.5)', fontSize:12, cursor:'pointer', textAlign:'left' }}>
                  {r}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={send} disabled={!reason}
                style={{ flex:1, padding:'12px 0', borderRadius:10, border:'none', background: reason?'linear-gradient(135deg,#ef4444,#dc2626)':'rgba(255,255,255,.1)', color:'#fff', fontSize:14, fontWeight:700, cursor: reason?'pointer':'not-allowed', boxShadow: reason?'0 8px 24px rgba(239,68,68,.4)':'' }}>
                🆘 Send SOS alert
              </button>
              <button onClick={onClose}
                style={{ padding:'12px 18px', borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'rgba(255,255,255,.4)', fontSize:13, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Driver App ──────────────────────────────────────────────────────────
export default function DriverApp() {
  const { user, logout } = useAuth()
  const [dispatches,    setDispatches]    = useState([])
  const [history,       setHistory]       = useState([])
  const [profile,       setProfile]       = useState(null)
  const [msg,           setMsg]           = useState(null)
  const [busy,          setBusy]          = useState(null)
  const [mapDispatch,   setMapDispatch]   = useState(null)
  const [proofDispatch, setProofDispatch] = useState(null)
  const [showSOS,       setShowSOS]       = useState(false)
  const [tab,           setTab]           = useState('active')
  const [gpsActive,     setGpsActive]     = useState(false)
  const [routeData,     setRouteData]     = useState({})
  const [navStep,       setNavStep]       = useState({})
  const [startTimes,    setStartTimes]    = useState({})
  const gpsRef = useRef(null)

  const load = async () => {
    try {
      const [d, h, p] = await Promise.all([
        api.get('/dispatches/'),
        api.get('/dispatches/history/').catch(() => ({ data:[] })),
        api.get('/drivers/me/').catch(() => ({ data:null }))
      ])
      setDispatches(d.data)
      setHistory(h.data)
      setProfile(p.data)
    } catch(e) { console.error(e) }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 7000)
    return () => clearInterval(id)
  }, [])

  // Fetch route for in_transit dispatches
  useEffect(() => {
    dispatches.filter(d => d.status === 'in_transit').forEach(async d => {
      if (routeData[d.id]) return
      const pos = await geocode(d.destination)
      if (!pos) return
      const r = await getRoute({ lat:17.385, lng:78.486 }, pos)
      if (r) setRouteData(prev => ({ ...prev, [d.id]: r }))
    })
  }, [dispatches])

  // GPS tracking
  const toggleGPS = () => {
    if (gpsActive) {
      if (gpsRef.current) navigator.geolocation.clearWatch(gpsRef.current)
      setGpsActive(false)
    } else {
      if (!navigator.geolocation) { alert('GPS not supported'); return }
      gpsRef.current = navigator.geolocation.watchPosition(
        pos => {
          const active = dispatches.find(d => ['accepted','in_transit'].includes(d.status))
          if (active) api.post(`/dispatches/${active.id}/location/?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`).catch(()=>{})
        },
        () => setGpsActive(false),
        { enableHighAccuracy:true, maximumAge:10000, timeout:15000 }
      )
      setGpsActive(true)
    }
  }

  useEffect(() => () => { if (gpsRef.current) navigator.geolocation.clearWatch(gpsRef.current) }, [])

  const action = async (id, endpoint, successMsg) => {
    setBusy(`${id}-${endpoint}`)
    try {
      await api.post(`/dispatches/${id}/${endpoint}/`)
      if (endpoint === 'start') setStartTimes(p => ({ ...p, [id]: new Date().toISOString() }))
      setMsg({ type:'ok', text:successMsg })
      load()
    } catch(e) { setMsg({ type:'error', text: e.response?.data?.detail || 'Action failed' }) }
    finally { setBusy(null); setTimeout(() => setMsg(null), 4000) }
  }

  const handleProof = async (receiver) => {
    await action(proofDispatch.id, 'deliver', `🎉 Delivered to ${receiver}! Great work.`)
    setProofDispatch(null)
  }

  const pending  = dispatches.filter(d => d.status === 'awaiting_driver')
  const active   = dispatches.filter(d => ['accepted','in_transit'].includes(d.status))
  const delivered = history.filter(d => d.status === 'delivered')
  const totalEarnings = delivered.length * 850
  const SC = { awaiting_driver:'#fbbf24', accepted:'#818cf8', in_transit:'#c084fc', delivered:'#34d399', cancelled:'#f87171' }

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', color:'#fff' }}>
      <style>{`
        @keyframes slide-down { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 8px #fbbf24} 50%{box-shadow:0 0 24px #fbbf24} }
        @keyframes sos-pulse  { 0%,100%{box-shadow:0 0 8px #ef4444} 50%{box-shadow:0 0 24px #ef4444} }
        @keyframes gps-blink  { 0%,100%{opacity:1} 50%{opacity:.3} }
        .abtn { transition:all .2s; } .abtn:hover { transform:translateY(-2px); }
      `}</style>

      {/* Header */}
      <div style={{ background:'rgba(255,255,255,.02)', borderBottom:'1px solid rgba(255,255,255,.06)', padding:'14px 24px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🚚</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:16 }}>Driver Portal</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.name}{profile && ` · ★ ${profile.rating} · ${profile.total_deliveries} deliveries · ${profile.vehicle_type}`}
          </div>
        </div>
        <button className="abtn" onClick={toggleGPS}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:`1px solid ${gpsActive?'rgba(52,211,153,.4)':'rgba(255,255,255,.1)'}`, background:gpsActive?'rgba(52,211,153,.1)':'transparent', color:gpsActive?'#34d399':'rgba(255,255,255,.4)', fontSize:12, cursor:'pointer' }}>
          {gpsActive ? <Wifi size={13} style={{ animation:'gps-blink 1.5s infinite' }}/> : <WifiOff size={13}/>}
          {gpsActive ? 'GPS On' : 'GPS Off'}
        </button>
        <button className="abtn" onClick={() => setShowSOS(true)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:'1px solid rgba(239,68,68,.4)', background:'rgba(239,68,68,.1)', color:'#f87171', fontSize:12, cursor:'pointer', fontWeight:600, animation:'sos-pulse 3s infinite' }}>
          <AlertOctagon size={13}/> SOS
        </button>
        {pending.length > 0 && (
          <div style={{ background:'rgba(251,191,36,.15)', border:'1px solid rgba(251,191,36,.3)', borderRadius:8, padding:'6px 14px', fontSize:12, color:'#fbbf24', fontWeight:600, animation:'pulse-glow 2s infinite' }}>
            🔔 {pending.length} new
          </div>
        )}
        <button onClick={logout} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'rgba(255,255,255,.5)', fontSize:12, cursor:'pointer' }}>
          <LogOut size={13}/> Logout
        </button>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 20px' }}>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Pending',   val:pending.length,         color:'#fbbf24', icon:'🔔' },
            { label:'Active',    val:active.length,          color:'#818cf8', icon:'🚛' },
            { label:'Completed', val:delivered.length,       color:'#34d399', icon:'✅' },
            { label:'Earnings',  val:`₹${totalEarnings.toLocaleString()}`, color:'#22d3ee', icon:'💰' },
          ].map(m => (
            <div key={m.label} style={{ background:'rgba(255,255,255,.03)', border:`1px solid ${m.color}25`, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:24 }}>{m.icon}</div>
              <div>
                <div style={{ fontSize:20, fontWeight:800, color:m.color, lineHeight:1 }}>{m.val}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:3 }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:2, background:'rgba(255,255,255,.03)', borderRadius:12, padding:4, marginBottom:20, border:'1px solid rgba(255,255,255,.06)' }}>
          {[['active','🚚 Active'],['performance','📊 Performance'],['earnings','💰 Earnings'],['history','📋 History']].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex:1, padding:'9px 0', border:'none', borderRadius:9, fontSize:12, fontWeight:tab===key?700:400, cursor:'pointer', background:tab===key?'rgba(99,102,241,.3)':'transparent', color:tab===key?'#a5b4fc':'rgba(255,255,255,.4)', transition:'all .2s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── ACTIVE TAB ── */}
        {tab === 'active' && (
          <>
            {/* Pending requests */}
            {pending.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:'#fbbf24', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600, marginBottom:12 }}>🔔 New dispatch requests</div>
                {pending.map(d => (
                  <div key={d.id} style={{ background:'rgba(251,191,36,.05)', border:'1px solid rgba(251,191,36,.2)', borderRadius:16, padding:20, marginBottom:12, animation:'slide-down .3s ease' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                      <span style={{ fontSize:16, fontWeight:800 }}>{d.reference}</span>
                      <Badge label={d.priority}/>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginLeft:'auto' }}>{new Date(d.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ background:'rgba(255,255,255,.03)', borderRadius:10, padding:'12px 14px', marginBottom:12, border:'1px solid rgba(255,255,255,.06)' }}>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', fontWeight:600, marginBottom:8, textTransform:'uppercase', letterSpacing:'.05em' }}>📦 Cargo manifest</div>
                      {d.items.map((it,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', fontSize:13, borderBottom: i<d.items.length-1?'1px solid rgba(255,255,255,.04)':'none' }}>
                          <Package size={13} color="#818cf8" style={{ flexShrink:0 }}/>
                          <span style={{ fontWeight:500 }}>{it.stock_name}</span>
                          <span style={{ color:'rgba(255,255,255,.5)' }}>· {it.quantity} {it.unit}</span>
                          <span style={{ fontSize:11, color:'rgba(255,255,255,.25)', fontFamily:'monospace', marginLeft:'auto' }}>{it.sku}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:d.notes?10:14, padding:'10px 12px', background:'rgba(248,113,113,.06)', borderRadius:10, border:'1px solid rgba(248,113,113,.15)' }}>
                      <MapPin size={15} color="#f87171" style={{ flexShrink:0, marginTop:1 }}/>
                      <div>
                        <div style={{ fontSize:11, color:'#f87171', fontWeight:600, marginBottom:2 }}>DELIVER TO</div>
                        <div style={{ fontSize:14, fontWeight:500 }}>{d.destination}</div>
                      </div>
                    </div>
                    {d.notes && (
                      <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginBottom:14, padding:'8px 12px', background:'rgba(251,191,36,.06)', borderRadius:8, border:'1px solid rgba(251,191,36,.1)' }}>
                        📝 {d.notes}
                      </div>
                    )}
                    <div style={{ display:'flex', gap:10 }}>
                      <button className="abtn" onClick={() => action(d.id,'accept','✓ Accepted!')} disabled={busy===`${d.id}-accept`}
                        style={{ flex:1, padding:'11px 0', borderRadius:10, border:'none', background:'linear-gradient(135deg,#34d399,#10b981)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:'0 4px 16px rgba(52,211,153,.3)' }}>
                        <CheckCircle size={15}/> {busy===`${d.id}-accept`?'Accepting…':'Accept delivery'}
                      </button>
                      <button className="abtn" onClick={() => action(d.id,'reject','Rejected. AI will reassign.')} disabled={busy===`${d.id}-reject`}
                        style={{ padding:'11px 20px', borderRadius:10, border:'1px solid rgba(248,113,113,.3)', background:'rgba(248,113,113,.08)', color:'#f87171', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                        <XCircle size={14}/> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active deliveries */}
            {active.length > 0 && (
              <div>
                <div style={{ fontSize:11, color:'#818cf8', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600, marginBottom:12 }}>🚛 Active deliveries</div>
                {active.map(d => {
                  const route = routeData[d.id]
                  const step  = navStep[d.id] || 0
                  return (
                    <div key={d.id} style={{ background:'rgba(129,140,248,.05)', border:'1px solid rgba(129,140,248,.2)', borderRadius:16, padding:20, marginBottom:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:SC[d.status], boxShadow:`0 0 8px ${SC[d.status]}` }}/>
                        <span style={{ fontSize:15, fontWeight:800 }}>{d.reference}</span>
                        <Badge label={d.status} text={d.status.replace('_',' ')}/>
                        <Badge label={d.priority}/>
                      </div>
                      <div style={{ background:'rgba(255,255,255,.03)', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
                        {d.items.map((it,i) => (
                          <div key={i} style={{ display:'flex', gap:8, padding:'3px 0', fontSize:12 }}>
                            <Package size={12} color="#818cf8" style={{ flexShrink:0 }}/>
                            <span style={{ fontWeight:500 }}>{it.stock_name}</span>
                            <span style={{ color:'rgba(255,255,255,.5)' }}>{it.quantity} {it.unit}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:6, marginBottom:12, fontSize:13, color:'rgba(255,255,255,.6)' }}>
                        <MapPin size={13} color="#f87171" style={{ flexShrink:0, marginTop:2 }}/>
                        <span>{d.destination}</span>
                      </div>

                      {/* Countdown */}
                      {d.status === 'in_transit' && route && (
                        <Countdown distKm={parseFloat(route.dist)} startedAt={startTimes[d.id]}/>
                      )}

                      {/* Navigation panel */}
                      {d.status === 'in_transit' && route?.steps?.length > 0 && (
                        <>
                          <NavPanel steps={route.steps} currentStep={step}/>
                          <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
                            <button onClick={() => setNavStep(p => ({ ...p, [d.id]: Math.max(0,(p[d.id]||0)-1) }))}
                              style={{ padding:'5px 12px', borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.5)', fontSize:11, cursor:'pointer' }}>← Prev</button>
                            <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>Step {step+1}/{route.steps.length}</span>
                            <button onClick={() => setNavStep(p => ({ ...p, [d.id]: Math.min(route.steps.length-1,(p[d.id]||0)+1) }))}
                              style={{ padding:'5px 12px', borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.5)', fontSize:11, cursor:'pointer' }}>Next →</button>
                          </div>
                        </>
                      )}

                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <button className="abtn" onClick={() => setMapDispatch(d)}
                          style={{ padding:'8px 16px', borderRadius:9, border:'1px solid rgba(129,140,248,.4)', background:'rgba(129,140,248,.1)', color:'#818cf8', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                          <Route size={13}/> View map
                        </button>
                        {d.status === 'accepted' && (
                          <button className="abtn" onClick={() => action(d.id,'start','Delivery started!')} disabled={busy===`${d.id}-start`}
                            style={{ padding:'8px 16px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#c084fc,#9333ea)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 4px 12px rgba(192,132,252,.3)' }}>
                            <Navigation size={13}/> {busy===`${d.id}-start`?'Starting…':'Start delivery'}
                          </button>
                        )}
                        {d.status === 'in_transit' && (
                          <button className="abtn" onClick={() => setProofDispatch(d)}
                            style={{ padding:'8px 16px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#34d399,#10b981)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 4px 12px rgba(52,211,153,.3)' }}>
                            <CheckCircle size={13}/> Mark delivered
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {pending.length === 0 && active.length === 0 && (
              <div style={{ textAlign:'center', padding:'48px 0', color:'rgba(255,255,255,.2)' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                <div style={{ fontSize:14 }}>No active deliveries right now.</div>
                <div style={{ fontSize:12, marginTop:6 }}>New requests appear here automatically.</div>
              </div>
            )}
          </>
        )}

        {/* ── PERFORMANCE TAB ── */}
        {tab === 'performance' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
              {[
                { label:'On-time rate',     val:'94%',  color:'#34d399', icon:'⏱', sub:'Last 30 days' },
                { label:'Acceptance rate',  val:'88%',  color:'#818cf8', icon:'✅', sub:'Requests accepted' },
                { label:'Customer rating',  val:`★ ${profile?.rating||4.5}`, color:'#fbbf24', icon:'⭐', sub:'Average score' },
                { label:'Total deliveries', val:profile?.total_deliveries||0, color:'#22d3ee', icon:'📦', sub:'All time' },
              ].map(m => (
                <div key={m.label} style={{ background:'rgba(255,255,255,.03)', border:`1px solid ${m.color}25`, borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-10, right:-10, width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle,${m.color}20,transparent)` }}/>
                  <div style={{ fontSize:32, marginBottom:8 }}>{m.icon}</div>
                  <div style={{ fontSize:32, fontWeight:800, color:m.color }}>{m.val}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', marginTop:4 }}>{m.label}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:2 }}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:20 }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:16 }}>Performance breakdown</div>
              {[
                { label:'Deliveries this week', val:Math.min(delivered.length,10), max:10, color:'#818cf8' },
                { label:'Avg delivery time',    val:72,  max:120, color:'#34d399', unit:'min' },
                { label:'Distance covered',     val:340, max:500, color:'#22d3ee', unit:'km' },
                { label:'Customer satisfaction',val:94,  max:100, color:'#fbbf24', unit:'%' },
              ].map(m => (
                <div key={m.label} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>{m.label}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:m.color }}>{m.val}{m.unit||''}</span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,.07)', borderRadius:99, height:7, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:99, width:`${(m.val/m.max)*100}%`, background:m.color, transition:'width 1s' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EARNINGS TAB ── */}
        {tab === 'earnings' && (
          <div>
            <div style={{ background:'linear-gradient(135deg,rgba(34,211,238,.1),rgba(99,102,241,.1))', border:'1px solid rgba(34,211,238,.2)', borderRadius:16, padding:24, textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.5)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Total earnings</div>
              <div style={{ fontSize:48, fontWeight:900, color:'#22d3ee' }}>₹{totalEarnings.toLocaleString()}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginTop:6 }}>{delivered.length} deliveries × ₹850/delivery</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
              {[
                { label:'Per delivery',    val:'₹850', color:'#fbbf24' },
                { label:'Pending payout', val:`₹${Math.round(totalEarnings*0.9).toLocaleString()}`, color:'#22d3ee' },
                { label:'Bonus eligible', val: delivered.length >= 10 ? 'Yes ✓' : `${10-delivered.length} more`, color:'#818cf8' },
                { label:'This month',     val:`₹${(delivered.length*850).toLocaleString()}`, color:'#34d399' },
              ].map(m => (
                <div key={m.label} style={{ background:'rgba(255,255,255,.03)', border:`1px solid ${m.color}25`, borderRadius:12, padding:'16px 18px' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:m.color }}>{m.val}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:4 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:20 }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:14 }}>Delivery earnings</div>
              {delivered.length === 0 && <div style={{ textAlign:'center', color:'rgba(255,255,255,.2)', padding:'20px 0', fontSize:13 }}>No completed deliveries yet</div>}
              {delivered.slice(0,8).map(d => (
                <div key={d.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#34d399', flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{d.reference}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.35)' }}>→ {d.destination}</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#34d399' }}>₹850</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.25)' }}>{new Date(d.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div>
            {history.length === 0 && (
              <div style={{ textAlign:'center', padding:'48px 0', color:'rgba(255,255,255,.2)' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
                <div style={{ fontSize:14 }}>No delivery history yet.</div>
              </div>
            )}
            {history.map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:12, marginBottom:8 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, background:SC[d.status]||'#94a3b8', boxShadow:`0 0 6px ${SC[d.status]||'#94a3b8'}` }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{d.reference}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.35)' }}>→ {d.destination}</div>
                </div>
                <Badge label={d.status} text={d.status.replace('_',' ')}/>
                {d.status === 'delivered' && <span style={{ fontSize:12, fontWeight:700, color:'#34d399' }}>₹850</span>}
                <span style={{ fontSize:11, color:'rgba(255,255,255,.25)' }}>{new Date(d.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {mapDispatch   && <RouteMapModal dispatch={mapDispatch} onClose={() => setMapDispatch(null)}/>}
      {proofDispatch && <DeliveryProofModal dispatch={proofDispatch} onConfirm={handleProof} onClose={() => setProofDispatch(null)}/>}
      {showSOS       && <SOSModal onClose={() => setShowSOS(false)}/>}
    </div>
  )
}