const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, business, goal } = req.body || {};

  if (!name || !email || !business || !goal) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const sendEmail = (to, subject, html) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GrowthAgency+ <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });

  try {
    await sendEmail(
      'jonas.mohlala@gmail.com',
      `New Lead: ${name} (${business})`,
      `
        <h2>New Lead Submission</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px">
          <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Full Name</td><td style="padding:8px">${name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Email</td><td style="padding:8px">${email}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Business Type</td><td style="padding:8px">${business}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Biggest Challenge</td><td style="padding:8px">${goal}</td></tr>
        </table>
      `
    );

    await sendEmail(
      email,
      `Thanks for reaching out, ${name}!`,
      `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px">
          <h2 style="color:#3B82F6">We've received your message!</h2>
          <p>Hi ${name},</p>
          <p>Thanks for reaching out to <strong>GrowthAgency+</strong>. We've received your submission and our team will be in touch within <strong>24 hours</strong>.</p>
          <p>Here's a summary of what you shared with us:</p>
          <ul>
            <li><strong>Business Type:</strong> ${business}</li>
            <li><strong>Your Challenge:</strong> ${goal}</li>
          </ul>
          <p>In the meantime, feel free to reply to this email if you have any questions.</p>
          <p>Looking forward to helping you grow,<br/><strong>The GrowthAgency+ Team</strong></p>
        </div>
      `
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Lead email error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
