const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const express = require('express');

// ===== CONFIG =====
const TELEGRAM_TOKEN = "8638010782:AAGgfbsL-fDFshnIzclvD35IkrAxnQbTImw";
const OWNER = "+2348056408043@c.us"; // replace with your WhatsApp number
const GROUP_LINK = "https://chat.whatsapp.com/KXmfveO8ngyHxiIQ5j7pEJ?mode=gi_t";

// ===== FILES =====
if (!fs.existsSync('./commands.json')) fs.writeFileSync('./commands.json', '{}');
if (!fs.existsSync('./users.json')) fs.writeFileSync('./users.json', '{}');
if (!fs.existsSync('./groups.json')) fs.writeFileSync('./groups.json', '{}');

let commands = JSON.parse(fs.readFileSync('./commands.json'));
let users = JSON.parse(fs.readFileSync('./users.json'));
let groupSettings = JSON.parse(fs.readFileSync('./groups.json'));

// ===== EXPRESS SERVER (KEEP BOT ALIVE) =====
const app = express();
app.get('/', (req, res) => res.send('🌚 DOMINION_XX_MD is alive'));
app.listen(3000, () => console.log('🌐 Server running'));

// ===== WHATSAPP CLIENT =====
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('🌚 DOMINION_XX_MD is ONLINE!'));
client.on('disconnected', () => { console.log('⚠️ Disconnected! Reconnecting...'); client.initialize(); });

// ===== TELEGRAM BOT =====
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
bot.onText(/\/pair/, msg => {
    const id = msg.from.id;
    if (!users[id]) {
        users[id] = true;
        fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
        bot.sendMessage(msg.chat.id, `✅ Paired successfully!\nJoin: ${GROUP_LINK}`);
    } else bot.sendMessage(msg.chat.id, '🔹 Already paired');
});

// ===== HELPERS =====
const prefixes = ['.', '?', '!', '&', '@', '*'];
function getCommand(text) {
    for (let p of prefixes) if (text.startsWith(p)) return text.slice(1).toLowerCase().trim();
    return null;
}
async function sendVV(chat) {
    try {
        const media = MessageMedia.fromFilePath('./media/sample.jpg');
        await chat.sendMessage(media, { viewOnce: true });
    } catch { chat.sendMessage('❌ Error sending VV'); }
}

// ===== MESSAGE HANDLER =====
client.on('message', async msg => {
    try {
        const chat = await msg.getChat();
        const cmd = getCommand(msg.body);
        if (!cmd) return;

        // ===== BASIC =====
        if (cmd === 'ping') return msg.reply('🏓 Pong!');
        if (cmd === 'alive') return msg.reply('🌚 DOMINION_XX_MD is alive and running!');
        if (cmd === 'time') return msg.reply(new Date().toLocaleTimeString());
        if (cmd === 'date') return msg.reply(new Date().toDateString());

        // ===== MENU =====
        if (cmd === 'menu') {
            return msg.reply(`
┌══════════════════════┐
│ ☠️ DOMINION_XX_MD ☠️ │
└══════════════════════┘

⚡ GENERAL
🌚 ping
🌚 alive
🌚 menu
🌚 vv
🌚 sticker

⚡ GROUP COMMANDS
🌚 tagall
🌚 hidetag
🌚 groupinfo
🌚 welcome on/off
🌚 goodbye on/off
🌚 antilink on/off
🌚 kick
🌚 add
🌚 promote
🌚 demote

😂 FUN COMMANDS
🌚 joke
🌚 insult
🌚 truth
🌚 dare
🌚 ship
🌚 love
🌚 rate
🌚 cry
🌚 laugh
🌚 kiss

🖼 IMAGE COMMANDS
🌚 cat
🌚 dog
🌚 meme
🌚 fox

📥 DOWNLOADERS
🌚 tiktok
🌚 yt
🌚 ytmp3
🌚 play
            `);
        }

        // ===== STICKER & VV =====
        if (cmd === 'sticker') {
            if (!msg.hasMedia) return msg.reply('❌ Send image');
            const media = await msg.downloadMedia();
            return client.sendMessage(msg.from, media, { sendMediaAsSticker: true });
        }
        if (cmd === 'vv') return sendVV(chat);

        // ===== GROUP PROTECTION & WELCOME =====
        if (cmd === 'welcome on') { groupSettings[msg.from] = groupSettings[msg.from] || {}; groupSettings[msg.from].welcome = true; fs.writeFileSync('./groups.json', JSON.stringify(groupSettings)); return msg.reply('✅ Welcome enabled'); }
        if (cmd === 'welcome off') { groupSettings[msg.from].welcome = false; fs.writeFileSync('./groups.json', JSON.stringify(groupSettings)); return msg.reply('❌ Welcome disabled'); }
        if (cmd === 'goodbye on') { groupSettings[msg.from] = groupSettings[msg.from] || {}; groupSettings[msg.from].goodbye = true; fs.writeFileSync('./groups.json', JSON.stringify(groupSettings)); return msg.reply('✅ Goodbye enabled'); }
        if (cmd === 'goodbye off') { groupSettings[msg.from].goodbye = false; fs.writeFileSync('./groups.json', JSON.stringify(groupSettings)); return msg.reply('❌ Goodbye disabled'); }
        if (cmd === 'antilink on') { groupSettings[msg.from] = groupSettings[msg.from] || {}; groupSettings[msg.from].antilink = true; fs.writeFileSync('./groups.json', JSON.stringify(groupSettings)); return msg.reply('🚫 Antilink ON'); }
        if (cmd === 'antilink off') { groupSettings[msg.from].antilink = false; fs.writeFileSync('./groups.json', JSON.stringify(groupSettings)); return msg.reply('✅ Antilink OFF'); }

        // ===== REAL ADMIN COMMANDS =====
        if (cmd === 'kick') return chat.removeParticipants(msg.mentionedIds);
        if (cmd === 'promote') return chat.promoteParticipants(msg.mentionedIds);
        if (cmd === 'demote') return chat.demoteParticipants(msg.mentionedIds);

        // ===== FUN COMMANDS =====
        const funReplies = {
            joke: "😂 Why chicken cross road? To escape you!",
            insult: "🤣 You dey craze small",
            truth: "😏 Who you like secretly?",
            dare: "🔥 Send your gallery screenshot",
            ship: "❤️ 78% match",
            love: "💖 Love level: 92%",
            rate: "⭐ 8/10",
            cry: "😭😭😭",
            laugh: "😂😂😂",
            kiss: "😘💋"
        };
        if (funReplies[cmd]) return msg.reply(funReplies[cmd]);

        // ===== IMAGE COMMANDS =====
        const images = {
            cat: 'https://cataas.com/cat',
            dog: 'https://random.dog/woof.jpg',
            meme: 'https://meme-api.com/gimme',
            fox: 'https://randomfox.ca/images/1.jpg'
        };
        if (images[cmd]) return msg.reply(images[cmd]);

        // ===== DOWNLOAD PLACEHOLDERS =====
        if (['tiktok','yt','ytmp3','play'].includes(cmd)) return msg.reply('📥 Downloader coming soon');

        // ===== OWNER COMMAND =====
        if (cmd.startsWith('broadcast') && msg.from === OWNER) {
            let text = msg.body.slice(10);
            for (let u of Object.keys(users)) if (u.includes('@c.us')) client.sendMessage(u, text);
            return msg.reply('✅ Broadcast sent');
        }

        // ===== DEFAULT =====
        msg.reply('❌ Command not found');

    } catch (err) { console.log(err); }
});

// ===== AUTO WELCOME & GOODBYE HANDLER =====
client.on('group_join', async notification => {
    const chat = await notification.getChat();
    if (groupSettings[chat.id]?.welcome) chat.sendMessage(`👋 Welcome @${notification.recipientIds[0].split('@')[0]}!`, { mentions: notification.recipientIds });
});
client.on('group_leave', async notification => {
    const chat = await notification.getChat();
    if (groupSettings[chat.id]?.goodbye) chat.sendMessage(`😢 Goodbye @${notification.recipientIds[0].split('@')[0]}`, { mentions: notification.recipientIds });
});

// ===== ANTI-LINK =====
client.on('message', async msg => {
    if (!msg.from.endsWith('@g.us')) return;
    const chat = await msg.getChat();
    if (groupSettings[chat.id]?.antilink && msg.body.includes('chat.whatsapp.com')) {
        await msg.delete(true);
        chat.sendMessage('🚫 Link not allowed!');
    }
});

client.initialize();
