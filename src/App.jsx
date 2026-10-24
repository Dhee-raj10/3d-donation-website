import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight, CheckCircle2, Heart, Menu, ShieldCheck, Sparkles, X } from 'lucide-react'
import DonationScene from './DonationScene.jsx'

const amounts = [500, 1000, 2500, 5000]

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function App() {
  const [amount, setAmount] = useState(1000)
  const [custom, setCustom] = useState('')
  const [donorName, setDonorName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const finalAmount = custom !== '' ? Number(custom) : amount
  const validAmount = Number.isFinite(finalAmount) && finalAmount >= 1 && finalAmount <= 1000000

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(null), 6500)
    return () => clearTimeout(id)
  }, [notice])

  async function donate(event) {
    event.preventDefault()
    if (!validAmount) {
      setNotice({ type: 'error', text: 'Enter an amount between ₹1 and ₹10,00,000.' })
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotice({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }
    setBusy(true)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) throw new Error('Could not load Razorpay Checkout. Check your connection and try again.')

      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(finalAmount * 100),
          donorName: donorName.trim().slice(0, 100),
          email: email.trim().slice(0, 200)
        })
      })
      const order = await orderResponse.json()
      if (!orderResponse.ok) throw new Error(order.error || 'Unable to start payment.')

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Orbit Giving',
        description: 'A contribution for a brighter future',
        order_id: order.orderId,
        prefill: { name: donorName.trim(), email: email.trim() },
        theme: { color: '#8b7cff' },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            })
            const result = await verifyResponse.json()
            if (!verifyResponse.ok || !result.verified) throw new Error(result.error || 'Payment verification failed.')
            setNotice({ type: 'success', text: `Thank you! Your ₹${finalAmount.toLocaleString('en-IN')} contribution was verified. Payment ID: ${response.razorpay_payment_id}` })
            setCustom('')
            setAmount(1000)
          } catch (error) {
            setNotice({ type: 'error', text: `${error.message} If money was deducted, please contact the donation team with your payment ID.` })
          } finally {
            setBusy(false)
          }
        }
      })
      checkout.on('payment.failed', (response) => {
        setNotice({ type: 'error', text: response.error?.description || 'Payment failed. You can try again.' })
        setBusy(false)
      })
      checkout.open()
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Something went wrong. Please try again.' })
      setBusy(false)
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Orbit home"><span className="brand-mark"><Heart size={17} fill="currentColor" /></span> orbit<span className="brand-dot">.</span></a>
        <nav className={menuOpen ? 'nav nav-open' : 'nav'}>
          <a href="#mission" onClick={() => setMenuOpen(false)}>Our mission</a>
          <a href="#impact" onClick={() => setMenuOpen(false)}>Your impact</a>
          <a href="#donate" className="nav-cta" onClick={() => setMenuOpen(false)}>Make a donation <ArrowRight size={15} /></a>
        </nav>
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {notice && <div role="status" className={`notice ${notice.type}`}><span>{notice.type === 'success' ? <CheckCircle2 size={19} /> : <ShieldCheck size={19} />}</span><p>{notice.text}</p><button onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={16}/></button></div>}

      <section className="hero" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> SMALL ACTS. WIDER IMPACT.</div>
          <h1>A little good<br />goes <span className="gradient-text">a long way.</span></h1>
          <p className="hero-description">The future is something we build together. Your kindness can help create a world where every person has a chance to thrive.</p>
          <div className="hero-actions">
            <a href="#donate" className="button button-primary">Make a difference <ArrowRight size={17} /></a>
            <a href="#mission" className="text-link">Discover our mission <ArrowDown size={15} /></a>
          </div>
          <div className="trust-row"><span className="avatar-stack"><i>✳</i><i>♡</i><i>✦</i></span><span>Every contribution matters.</span><span className="trust-divider" /><ShieldCheck size={15} /><span>Secure checkout</span></div>
        </div>
        <div className="hero-art">
          <DonationScene />
          <div className="orbit-label label-top"><span className="label-dot" /> ONE PLANET, ONE COMMUNITY</div>
          <div className="floating-note"><span className="note-icon"><Sparkles size={17} /></span><div><strong>Hope starts here</strong><span>Be part of the change</span></div></div>
          <div className="planet-caption">A brighter future, together <span>✳</span></div>
        </div>
        <div className="hero-index"><span>01</span><span className="index-line" /><span>GIVE WITH PURPOSE</span></div>
      </section>

      <section className="mission-section" id="mission">
        <div className="section-kicker">WHY WE GIVE <span>✳</span></div>
        <div className="mission-grid">
          <h2>Kindness is small.<br /><span className="muted-heading">Its ripple isn't.</span></h2>
          <div className="mission-copy"><p>We believe meaningful change begins when people come together. Every donation is a gesture of hope — a reminder that the world can be more thoughtful, more equitable, and more human.</p><a href="#donate" className="underlined-link">Be part of the story <ArrowRight size={15}/></a></div>
        </div>
        <div className="impact-cards" id="impact">
          <article className="impact-card"><span className="impact-number">01 / CARE</span><div className="impact-symbol violet">✳</div><h3>Support people</h3><p>Help strengthen communities and bring care where it can make a difference.</p></article>
          <article className="impact-card"><span className="impact-number">02 / POSSIBILITY</span><div className="impact-symbol blue">↗</div><h3>Open possibilities</h3><p>Help create opportunities for a more hopeful and inclusive future.</p></article>
          <article className="impact-card"><span className="impact-number">03 / TOGETHER</span><div className="impact-symbol mint">∞</div><h3>Multiply kindness</h3><p>Small acts add up. Your generosity can inspire others to join in.</p></article>
        </div>
      </section>

      <section className="donation-section" id="donate">
        <div className="donation-backdrop" />
        <div className="donation-intro">
          <div className="section-kicker">YOUR TURN TO MAKE AN IMPACT <span>✳</span></div>
          <h2>Give what you can.<br /><span className="gradient-text">It all adds up.</span></h2>
          <p>Choose a contribution that feels right for you. Every act of generosity moves us forward.</p>
          <div className="secure-note"><ShieldCheck size={18}/><span>Payments are securely processed by Razorpay.</span></div>
        </div>
        <form className="donation-panel" onSubmit={donate}>
          <div className="panel-heading"><div><span className="panel-kicker">MAKE A CONTRIBUTION</span><h3>Your donation</h3></div><span className="heart-badge"><Heart size={18}/></span></div>
          <label className="field-label">SELECT AN AMOUNT <span>INR (₹)</span></label>
          <div className="amount-grid">
            {amounts.map(value => <button type="button" key={value} className={`amount-option ${custom === '' && amount === value ? 'selected' : ''}`} onClick={() => { setAmount(value); setCustom('') }}>₹{value.toLocaleString('en-IN')}</button>)}
          </div>
          <label className="field-label custom-label" htmlFor="custom-amount">OR ENTER YOUR OWN</label>
          <div className="input-wrap amount-input"><span>₹</span><input id="custom-amount" inputMode="numeric" type="number" min="1" max="1000000" step="1" placeholder="Custom amount" value={custom} onChange={e => setCustom(e.target.value)} /></div>
          <div className="form-fields">
            <div className="form-field"><label className="field-label" htmlFor="donor-name">YOUR NAME <span>OPTIONAL</span></label><input id="donor-name" type="text" autoComplete="name" maxLength="100" placeholder="How should we call you?" value={donorName} onChange={e => setDonorName(e.target.value)} /></div>
            <div className="form-field"><label className="field-label" htmlFor="donor-email">EMAIL ADDRESS</label><input id="donor-email" type="email" autoComplete="email" required maxLength="200" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
          </div>
          <button className="button button-primary donate-button" type="submit" disabled={busy || !validAmount}>{busy ? <><span className="spinner" /> Preparing secure checkout…</> : <>Donate ₹{validAmount ? finalAmount.toLocaleString('en-IN') : '—'} <ArrowRight size={17}/></>}</button>
          <p className="panel-footnote"><ShieldCheck size={14}/> Secure checkout · Your payment details are handled by Razorpay</p>
          <p className="test-warning">Demo project: use Razorpay test keys until you are ready to accept real donations.</p>
        </form>
      </section>

      <footer className="footer"><a className="brand" href="#home"><span className="brand-mark"><Heart size={15} fill="currentColor" /></span> orbit<span className="brand-dot">.</span></a><p>Made with intention. Built around kindness.</p><a href="#home" className="back-top">BACK TO TOP ↑</a><span className="copyright">© {new Date().getFullYear()} Orbit Giving</span></footer>
    </main>
  )
}
