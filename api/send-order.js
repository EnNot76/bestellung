const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const RECIPIENT = 'ad@pregel-deutschland.de';
let catalog;
function getCatalog() {
  if (!catalog) {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const match = html.match(/const CATALOG=(\[.*\]);const customerNameEl=/);
    if (!match) throw new Error('Catalog unavailable');
    catalog = new Map(JSON.parse(match[1]).flatMap(([category, items]) => items.map(item => [item.id, { ...item, category }])));
  }
  return catalog;
}
function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function table(headers, rows) {
  const cell = 'border:1px solid #aab8bb;padding:7px 10px;text-align:left;white-space:nowrap;';
  return '<table border="1" cellpadding="7" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px"><thead><tr>' + headers.map(value => '<th style="' + cell + 'background:#edf4f5">' + escape(value) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(value => '<td style="' + cell + '">' + escape(value) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
}
function buildOrder(body) {
  if (!body || typeof body !== 'object' || typeof body.salesRep !== 'string' || !body.salesRep.trim() || body.salesRep.length > 120 || /[\r\n]/.test(body.salesRep) || !/^K0\d{5}$/.test(body.customerCode) || typeof body.customerName !== 'string' || !body.customerName.trim() || body.customerName.length > 120 || /[\r\n]/.test(body.customerName) || typeof body.notes !== 'string' || body.notes.length > 1000 || !Array.isArray(body.lines) || body.lines.length < 1 || body.lines.length > 500) return null;
  const seen = new Set(), rows = [];
  let cartons = 0, weight = 0;
  for (const line of body.lines) {
    if (!line || typeof line.id !== 'string' || seen.has(line.id) || !Number.isSafeInteger(line.qty) || line.qty < 1 || line.qty > 10000) return null;
    const item = getCatalog().get(line.id);
    if (!item) return null;
    seen.add(line.id);
    cartons += line.qty;
    const kg = Number(item.gewKarton) * line.qty;
    weight += kg;
    rows.push([item.code, line.qty, item.name, kg.toFixed(2), Number(item.gewKarton).toFixed(2), body.customerCode, item.category, body.customerName.trim()]);
  }
  const headers = ['Artikelnummer', 'Menge_KT', 'Artikelbeschreibung', 'Gewicht_KG', 'Gewicht_pro_Karton_KG', 'Kundennummer', 'Kategorie', 'Kundenname'];
  const subject = 'PreGel Bestellung ' + body.customerCode + ' · ' + body.customerName.trim();
  const intro = 'PreGel Kundenbestellung\nAussendienstmitarbeiter: ' + body.salesRep.trim() + '\nKundennummer: ' + body.customerCode + '\nKundenname: ' + body.customerName.trim();
  const totals = 'Artikel: ' + rows.length + ' · Kartons: ' + cartons + ' · Gesamtgewicht: ' + weight.toFixed(2) + ' kg';
  const html = '<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;color:#193438"><h2>PreGel Kundenbestellung</h2><p><strong>Aussendienstmitarbeiter:</strong> ' + escape(body.salesRep.trim()) + '<br><strong>Kundennummer:</strong> ' + escape(body.customerCode) + '<br><strong>Kundenname:</strong> ' + escape(body.customerName.trim()) + '</p><h3>Für SAP: Artikelnummer und Menge</h3><p>Datenzeilen ohne Überschrift kopieren und in SAP einfügen.</p>' + table(headers.slice(0, 2), rows.map(row => row.slice(0, 2))) + '<h3>Alle Bestelldaten</h3>' + table(headers, rows) + '<p>' + totals + '</p>' + (body.notes ? '<h3>Notizen</h3><p>' + escape(body.notes).replace(/\r?\n/g, '<br>') + '</p>' : '') + '</body></html>';
  return { subject, html, text: intro + '\n\n' + headers.join('\t') + '\n' + rows.map(row => row.join('\t')).join('\n') + '\n\n' + totals + (body.notes ? '\n\nNotizen:\n' + body.notes : '') };
}
function authenticated(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string') return false;
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(actual).digest(), crypto.createHash('sha256').update(expected).digest());
}
async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Nur POST ist erlaubt.' }); }
  if (!process.env.RESEND_API_KEY || !process.env.ORDER_ACCESS_CODE) return res.status(503).json({ error: 'E-Mail-Versand ist noch nicht eingerichtet. Bitte den Administrator kontaktieren.' });
  if (!authenticated(req.headers['x-order-access-code'], process.env.ORDER_ACCESS_CODE)) return res.status(401).json({ error: 'Bestell-PIN ist ungültig.' });
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({ error: 'JSON erforderlich.' });
  if (Number(req.headers['content-length'] || 0) > 65536) return res.status(413).json({ error: 'Bestellung ist zu groß.' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: 'Bestellung ist ungültig.' }); }
  if (JSON.stringify(body || {}).length > 65536) return res.status(413).json({ error: 'Bestellung ist zu groß.' });
  const requestId = req.headers['x-order-request-id'];
  if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return res.status(400).json({ error: 'Anfrage-ID ist ungültig.' });
  let order;
  try { order = buildOrder(body); } catch { return res.status(500).json({ error: 'Artikelkatalog ist nicht verfügbar.' }); }
  if (!order) return res.status(400).json({ error: 'Bitte Kundendaten und Artikelmengen prüfen (max. 10000 Kartons pro Artikel).' });
  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'order-' + requestId },
      body: JSON.stringify({ from: 'PreGel Bestellportal <onboarding@resend.dev>', to: [RECIPIENT], ...order }), signal: AbortSignal.timeout(15000)
    });
    const data = await result.json();
    if (!result.ok || typeof data.id !== 'string') return res.status(502).json({ error: 'Resend konnte die E-Mail nicht annehmen. Bitte API-Key und Testempfänger prüfen.' });
    return res.status(200).json({ id: data.id, recipient: RECIPIENT });
  } catch { return res.status(502).json({ error: 'Keine bestätigte Antwort vom E-Mail-Dienst. Bitte denselben Auftrag erneut versuchen.' }); }
}
module.exports = handler;
module.exports.buildOrder = buildOrder;
