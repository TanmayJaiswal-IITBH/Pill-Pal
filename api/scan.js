// Stub: returns a sample result so the deployed app works end to end.
// The real version sends the photo to Gemma and validates the JSON it returns.
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  res.status(200).json({
    name: 'Paracetamol',
    strength: '500 mg',
    expiry_date: '2027-06',
    purpose: 'For fever and mild pain.',
    how_to_take: 'Follow the label or your doctor. Swallow with water.',
    warnings: ['Do not take more than the label says.'],
    confidence: 'high',
  })
}
