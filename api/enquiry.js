const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, printer, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
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
        from: 'Print Express <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });

  try {
    await sendEmail(
      'jonas.mohlala@gmail.com',
      `New Enquiry from ${name}`,
      `
        <h2 style="color:#E11D2E">New Print Express Enquiry</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px;font-family:Inter,sans-serif">
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Full Name</td><td style="padding:8px">${name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Phone</td><td style="padding:8px">${phone || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Email</td><td style="padding:8px">${email}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Printer Model</td><td style="padding:8px">${printer || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Enquiry</td><td style="padding:8px">${message}</td></tr>
        </table>
      `
    );

    await sendEmail(
      email,
      `Thanks for your enquiry, ${name}!`,
      `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px">
          <h2 style="color:#E11D2E">We've received your enquiry!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for contacting <strong>Print Express</strong>. We've received your message and will get back to you as soon as possible.</p>
          <p><strong>Your enquiry:</strong></p>
          <blockquote style="border-left:3px solid #E11D2E;padding-left:12px;color:#444">${message}</blockquote>
          <p>In the meantime, feel free to reach us on WhatsApp at <strong>060 848 1691</strong>.</p>
          <p>Kind regards,<br/><strong>The Print Express Team</strong></p>
        </div>
      `
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Enquiry email error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
