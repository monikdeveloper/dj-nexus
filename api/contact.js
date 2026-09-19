'use strict';

/**
 * Booking inquiries over Gmail SMTP.
 * Vercel Hobby allows SMTP on ports 465 and 587 (port 25 is blocked).
 * Set GMAIL_USER and GMAIL_APP_PASSWORD in the Vercel project env.
 */
var nodemailer = require('nodemailer');

var MAX_NAME = 120;
var MAX_EMAIL = 160;
var MAX_PHONE = 40;
var MAX_DATE = 40;
var MAX_MESSAGE = 4000;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clip(value, max, keepLines) {
  var text = String(value || '');
  if (!keepLines) text = text.replace(/[\r\n]+/g, ' ');
  else text = text.replace(/\r/g, '');
  return text.trim().slice(0, max);
}

function formatDate(value) {
  if (!value) return 'Not specified';
  var parts = String(value).split('-');
  if (parts.length !== 3) return value;
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function readJsonSync(value) {
  if (value == null) return null;
  if (typeof value === 'string') {
    var trimmed = value.trim();
    if (!trimmed) return {};
    return JSON.parse(trimmed);
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return JSON.parse(value.toString('utf8') || '{}');
  }
  if (typeof value === 'object' && !value.readable) return value;
  return null;
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    try {
      var parsed = readJsonSync(req.body);
      if (parsed) {
        resolve(parsed);
        return;
      }
    } catch (err) {
      resolve({});
      return;
    }

    if (req.readableEnded || req.complete) {
      resolve({});
      return;
    }

    var chunks = [];
    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      resolve({});
    }, 2500);

    function finish(value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    }

    req.on('data', function (chunk) {
      chunks.push(chunk);
    });
    req.on('end', function () {
      try {
        if (!chunks.length) {
          finish({});
          return;
        }
        finish(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (err) {
        finish({});
      }
    });
    req.on('error', function (err) {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method not allowed' });
      return;
    }

    var body = await readBody(req);
    if (body.honey) {
      res.status(200).json({ ok: true });
      return;
    }

    var name = clip(body.name, MAX_NAME);
    var email = clip(body.email, MAX_EMAIL);
    var phone = clip(body.phone, MAX_PHONE);
    var date = clip(body.date, MAX_DATE);
    var message = clip(body.message, MAX_MESSAGE, true);

    if (!name || !EMAIL_RE.test(email) || phone.replace(/\D/g, '').length < 7 || !date || !message) {
      res.status(400).json({ ok: false, error: 'Please fill in every field.' });
      return;
    }

    var user = String(process.env.GMAIL_USER || '').trim();
    var pass = String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
    var to = String(process.env.BOOKING_TO || user || 'monik.developer@gmail.com').trim();

    if (!user || !pass) {
      res.status(503).json({
        ok: false,
        error: 'Mail is not configured yet. Add GMAIL_USER and GMAIL_APP_PASSWORD on Vercel.'
      });
      return;
    }

    var transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
      disableFileAccess: true,
      disableUrlAccess: true,
      auth: { user: user, pass: pass }
    });

    var safeName = escapeHtml(name);
    var safeEmail = escapeHtml(email);
    var safePhone = escapeHtml(phone);
    var safeDate = escapeHtml(formatDate(date));
    var safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    await transporter.sendMail({
      from: '"DJ NEXUS bookings" <' + user + '>',
      to: to,
      replyTo: email,
      subject: 'DJ NEXUS booking inquiry from ' + name,
      text: [
        'New booking inquiry from the NEXUS site.',
        '',
        'Name: ' + name,
        'Email: ' + email,
        'Mobile: ' + phone,
        'Event date: ' + formatDate(date),
        '',
        'Message:',
        message
      ].join('\n'),
      html:
        '<p>New booking inquiry from the NEXUS site.</p>' +
        '<p><strong>Name:</strong> ' + safeName + '<br>' +
        '<strong>Email:</strong> ' + safeEmail + '<br>' +
        '<strong>Mobile:</strong> ' + safePhone + '<br>' +
        '<strong>Event date:</strong> ' + safeDate + '</p>' +
        '<p><strong>Message:</strong><br>' + safeMessage + '</p>'
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    if (res.headersSent) return;
    res.status(500).json({
      ok: false,
      error: 'Could not send mail through Gmail SMTP. Check the App Password and try again.'
    });
  }
};
