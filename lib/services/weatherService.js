/**
 * Live Environmental Weather Service (GPS-Based)
 *
 * Automatically detects device geolocation via HTML5 Geolocation API
 * and queries Open-Meteo for real-time ambient Temperature (°C) and Relative Humidity (% RH).
 * Completely keyless, free, and accurate worldwide.
 */

export async function getLiveEnvironmentalData() {
  if (typeof window === 'undefined') {
    throw new Error('Weather detection is only available in browser')
  }

  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser/device')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          const accuracy = position.coords.accuracy

          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m`
          const res = await fetch(url)
          if (!res.ok) {
            throw new Error(`Weather API returned status ${res.status}`)
          }
          const data = await res.json()

          if (!data.current) {
            throw new Error('No current weather reading received')
          }

          resolve({
            success: true,
            temperatureC: Math.round(data.current.temperature_2m * 10) / 10,
            relativeHumidity: Math.round(data.current.relative_humidity_2m),
            latitude: Math.round(lat * 1000) / 1000,
            longitude: Math.round(lon * 1000) / 1000,
            accuracyMeters: Math.round(accuracy),
            timestamp: data.current.time || new Date().toISOString(),
            source: 'GPS_LIVE',
          })
        } catch (err) {
          reject(err)
        }
      },
      (geoError) => {
        let msg = 'Could not retrieve device GPS location'
        if (geoError.code === geoError.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser to auto-detect ambient temperature and humidity.'
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          msg = 'Location position is unavailable on this device.'
        } else if (geoError.code === geoError.TIMEOUT) {
          msg = 'GPS location request timed out.'
        }
        reject(new Error(msg))
      },
      {
        timeout: 10000,
        maximumAge: 60000,
        enableHighAccuracy: true,
      }
    )
  })
}
