/**
 * Bridge HTTP ligero para Baileys (@whiskeysockets/baileys).
 * Ejecutar en desarrollo: npm run whatsapp:bridge
 * Escanear QR en terminal la primera vez; sesión en auth_info/
 */
import http from 'node:http';
import { default as makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

const PORT = Number(process.env.WHATSAPP_BRIDGE_PORT || 3001);
const SECRET = process.env.WHATSAPP_BRIDGE_SECRET || '';

let sock = null;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n Escanea este QR en WhatsApp → Dispositivos vinculados:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log('Conexión cerrada, reconectando:', shouldReconnect);
      if (shouldReconnect) connectToWhatsApp();
    } else if (connection === 'open') {
      console.log('WhatsApp conectado (Baileys). Bridge en puerto', PORT);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg?.key?.fromMe && m.type === 'notify') {
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      const from = msg.key.remoteJid;
      if (text?.toLowerCase() === 'hola' && from) {
        await enviarMensaje(from.split('@')[0], '¡Hola! Mensaje recibido de forma automática (RentNow).');
      }
    }
  });
}

async function enviarMensaje(numero, texto) {
  if (!sock) {
    return { success: false, error: 'Cliente WhatsApp no inicializado' };
  }
  try {
    const digits = numero.replace(/\D/g, '');
    const jid = `${digits}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: texto });
    console.log(`Mensaje enviado a ${digits}`);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar:', error);
    return { success: false, error: error?.message || 'Error al enviar' };
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (SECRET && req.headers['x-bridge-secret'] !== SECRET) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: 'No autorizado' }));
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, connected: Boolean(sock) }));
    return;
  }

  if (req.method === 'POST' && req.url === '/send') {
    try {
      const body = await readBody(req);
      const { numero, texto } = body;
      if (!numero || !texto) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'numero y texto requeridos' }));
        return;
      }
      const result = await enviarMensaje(numero, texto);
      res.writeHead(result.success ? 200 : 500);
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

connectToWhatsApp().then(() => {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`WhatsApp bridge: http://127.0.0.1:${PORT}`);
  });
});
