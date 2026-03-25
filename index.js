const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

// ======= CONFIG =======
const TELEGRAM_TOKEN = "8638010782:AAGgfbsL-fDFshnIzclvD35IkrAxnQbTImw"; // Telegram bot token
const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/KXmfveO8ngyHxiIQ5j7pEJ?mode=gi_t';

// ======= LOAD COMMANDS =======
const commands = JSON.parse(fs.readFileSync('./commands.json'));

// ======= INIT WHATSAPP =======
const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', qr => {
    console.log('Scan this QR code in your terminal to login:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('🌚 DOMINION_XX_MD WhatsApp bot is online!'));

const prefixes = ['.', '?', '!', '&', '@', '*'];

function parseCommand(message) {
    for (let p of prefixes) {
        if (message.startsWith(p)) return message.slice(1).trim().toLowerCase();
    }
    return null;
}

// ======= SEND VIEW-ONCE MEDIA =======
async function sendViewOnce(chat, path) {
    const media = MessageMedia.fromFilePath(path);
    await chat.sendMessage(media, { viewOnce: true });
}

// ======= USERS TRACKING =======
const usersFile = './users.json';
let users = {};
if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile));
}

async function addUser(userId, chat) {
    if (!users[userId]) {
        users[userId] = { paired: true };
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        await chat.sendMessage(`✅ You are now paired! Join the WhatsApp group: ${WHATSAPP_GROUP_LINK}`);
    } else {
        await chat.sendMessage(`🔹 You are already paired!`);
    }
}

// ======= WHATSAPP COMMAND HANDLER =======
client.on('message', async msg => {
    const chat = await msg.getChat();
    const command = parseCommand(msg.body);
    if (!command) return;

    if (commands[command]) {
        const cmd = commands[command];

        if (cmd.media) await sendViewOnce(chat, cmd.media);
        if (cmd.reply) await msg.reply(cmd.reply);

        if (command === 'menu') {
            const allCommands = Object.keys(commands)
                .map(c => `🌚${c.charAt(0).toUpperCase() + c.slice(1)}`);
            const chunkSize = 50;
            for (let i = 0; i < allCommands.length; i += chunkSize) {
                const chunk = allCommands.slice(i, i + chunkSize).join('\n');
                await msg.reply(chunk);
            }
        }
    } else {
        msg.reply('❌ Command not found!');
    }
});

// ======= TELEGRAM BOT FOR SELF-PAIRING =======
const telegramBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

telegramBot.onText(/\/pair/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (!users[userId]) {
        users[userId] = { paired: true };
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

        telegramBot.sendMessage(chatId, `✅ You are now paired! Join the WhatsApp group: ${WHATSAPP_GROUP_LINK}`);

        // Optionally notify all WhatsApp users
        for (let waId of Object.keys(users)) {
            if (waId.includes('@c.us')) { // only WhatsApp IDs
                client.sendMessage(waId, `📢 New Telegram user paired: @${msg.from.username || msg.from.first_name}`);
            }
        }

    } else {
        telegramBot.sendMessage(chatId, `🔹 You are already paired!`);
    }
});

// ======= START WHATSAPP BOT =======
client.initialize();
