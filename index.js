const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) start();
    } else if (connection === 'open') {
      console.log('✅ البوت اشتغل!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    if (text === '.ping' || text === 'ping') {
      await sock.sendMessage(from, { text: '🏓 Pong! البوت شغال' });
    }
    if (text === '.menu' || text === 'menu' || text === '.اوامر') {
      await sock.sendMessage(from, { text: '🤖 قائمة البوت:\n\n.ping - فحص البوت\n.menu - القائمة\n.وقت - الوقت الحالي' });
    }
    if (text === '.وقت' || text === '.time') {
      await sock.sendMessage(from, { text: '⏰ الوقت: ' + new Date().toLocaleString('ar-YE') });
    }
  });
}

start();
