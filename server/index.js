import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Razorpay from 'razorpay'
import crypto from 'node:crypto'

const app = express()
const port = Number(process.env.PORT || 4242)
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: clientOrigin }))
app.use(express.json({ limit: '20kb' }))

const keyId = process.env.RAZORPAY_KEY_ID
const keySecret = process.env.RAZORPAY_KEY_SECRET
const razorpay = keyId && keySecret
  ? new Razorpay({ key_id: keyId, key_secret: keySecret })
  : null

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, paymentConfigured: Boolean(razorpay), mode: keyId?.startsWith('rzp_test_') ? 'test' : 'check-config' })
})

app.post('/api/create-order', async (req, res) => {
  if (!razorpay) return res.status(503).json({ error: 'Payment is not configured. Add Razorpay test keys to the server .env file.' })
  const amount = Number(req.body?.amount)
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
  const donorName = typeof req.body?.donorName === 'string' ? req.body.donorName.trim().slice(0, 100) : ''

  // Amount is in paise. Validate server-side; never trust a client-calculated total blindly.
  if (!Number.isSafeInteger(amount) || amount < 100 || amount > 100000000) {
    return res.status(400).json({ error: 'Donation amount must be between ₹1 and ₹10,00,000.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return res.status(400).json({ error: 'A valid email address is required.' })
  }

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `orbit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      notes: { donorName, email, purpose: 'Donation' }
    })
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId })
  } catch (error) {
    console.error('Razorpay order creation failed:', error?.error?.description || error.message)
    res.status(502).json({ error: 'Could not create a payment order. Please try again.' })
  }
})

app.post('/api/verify-payment', (req, res) => {
  if (!keySecret) return res.status(503).json({ verified: false, error: 'Payment verification is not configured.' })
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {}
  if (![orderId, paymentId, signature].every(v => typeof v === 'string' && v.length > 0)) {
    return res.status(400).json({ verified: false, error: 'Missing payment verification fields.' })
  }

  // Standard Checkout signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret).
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest()
  let received
  try { received = Buffer.from(signature, 'hex') } catch { received = Buffer.alloc(0) }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(400).json({ verified: false, error: 'The payment signature could not be verified.' })
  }

  // For production, also fetch the payment/order from Razorpay or reconcile via signed webhooks,
  // persist the verified order, and check captured status before issuing donation receipts.
  res.json({ verified: true, paymentId })
})

app.listen(port, () => {
  console.log(`Orbit donation payment service listening on http://localhost:${port}`)
  if (!razorpay) console.warn('Razorpay keys missing: add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env')
})
