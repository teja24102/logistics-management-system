const cache = {}

export async function geocode(address) {
  if (!address) return null
  const key = address.toLowerCase().trim()
  if (cache[key]) return cache[key]
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=in`
    const res  = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'LMS/2.0' } })
    const data = await res.json()
    if (data?.length > 0) {
      const r = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name }
      cache[key] = r
      return r
    }
  } catch (e) { console.warn('Geocode failed:', address) }
  return null
}

export async function getRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`
    const d = await (await fetch(url)).json()
    if (d.code !== 'Ok') return null
    return {
      coords:   d.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      dist:     (d.routes[0].distance / 1000).toFixed(1),
      dur:      Math.ceil(d.routes[0].duration / 60),
      steps:    d.routes[0].legs[0].steps
                  .map(s => ({ inst: s.name || 'Continue', dist: Math.round(s.distance), type: s.maneuver.type }))
                  .filter(s => s.dist > 0)
    }
  } catch { return null }
}
