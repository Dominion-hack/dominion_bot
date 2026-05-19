// server.js

const express = require("express");
const path = require("path");
const fs = require("fs");

const {
default: makeWASocket,
DisconnectReason,
useMultiFileAuthState,
fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("pino");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

const SESSIONS_PATH = path.join(__dirname, "sessions");

if (!fs.existsSync(SESSIONS_PATH)) {
fs.mkdirSync(SESSIONS_PATH);
}

const activeSockets = new Map();

async function createSession(phoneNumber) {

const sessionDir = `${SESSIONS_PATH}/${phoneNumber}`;

const { state, saveCreds } =
await useMultiFileAuthState(sessionDir);

const { version } =
await fetchLatestBaileysVersion();

const sock = makeWASocket({
version,
auth: state,
logger: P({ level: "silent" }),
printQRInTerminal: false,
browser: ["HACKER BOT", "Chrome", "1.0.0"],
markOnlineOnConnect: true
});

activeSockets.set(phoneNumber, sock);

sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", async (update) => {

const { connection, lastDisconnect } = update;

if (connection === "open") {
console.log(`CONNECTED => ${phoneNumber}`);
}

if (connection === "close") {

const statusCode =
lastDisconnect?.error?.output?.statusCode;

const shouldReconnect =
statusCode !== DisconnectReason.loggedOut;

if (shouldReconnect) {
createSession(phoneNumber);
} else {

activeSockets.delete(phoneNumber);

if (fs.existsSync(sessionDir)) {
fs.rmSync(sessionDir, {
recursive: true,
force: true
});
}

console.log(`LOGGED OUT => ${phoneNumber}`);
}
}
});

sock.ev.on("messages.upsert", async ({ messages }) => {

try {

const m = messages[0];

if (!m.message) return;

const msg =
m.message.conversation ||
m.message.extendedTextMessage?.text;

if (!msg) return;

const prefix = ".";

if (!msg.startsWith(prefix)) return;

const args =
msg.slice(prefix.length).trim().split(/ +/);

const cmd = args.shift().toLowerCase();

const from = m.key.remoteJid;

const Reply = async (text) => {
await sock.sendMessage(from, { text });
};

switch(cmd){

case "ping": {
Reply("pong");
}
break;

case "alive": {
Reply("I AM ACTIVE ⚡");
}
break;

case "menu": {
Reply(`
⚡ HACKER BOT MENU ⚡

.ping
.alive
.owner
.tagall
.bot
.time
.date
.runtime
.joke
.quote
.hi
.hack
.spam
.group
.link
.kick
.add
.promote
.demote
.open
.close
.mute
.unmute
.delete
.info
.script
.restart
.system
.speed
.test
.help
`);
}
break;

case "owner": {
Reply("OWNER: LAWRENCE 😎");
}
break;

case "tagall": {
Reply("@everyone");
}
break;

case "bot": {
Reply("HACKER BOT ONLINE ⚡");
}
break;

case "time": {
Reply(new Date().toLocaleTimeString());
}
break;

case "date": {
Reply(new Date().toDateString());
}
break;

case "runtime": {
Reply(process.uptime().toFixed(0) + " seconds");
}
break;

case "joke": {
Reply("Why hackers don't sleep? Because they keep debugging 😂");
}
break;

case "quote": {
Reply("Never give up 😎");
}
break;

case "hi": {
Reply("Hello Bro 👏");
}
break;

case "hack": {
Reply("ACCESS GRANTED ⚡");
}
break;

case "spam": {
for(let i = 0; i < 5; i++){
Reply("⚡ SPAM ⚡");
}
}
break;

case "group": {
Reply("GROUP COMMAND");
}
break;

case "link": {
Reply("GROUP LINK");
}
break;

case "kick": {
Reply("USER KICKED");
}
break;

case "add": {
Reply("USER ADDED");
}
break;

case "promote": {
Reply("USER PROMOTED");
}
break;

case "demote": {
Reply("USER DEMOTED");
}
break;

case "open": {
Reply("GROUP OPENED");
}
break;

case "close": {
Reply("GROUP CLOSED");
}
break;

case "mute": {
Reply("BOT MUTED");
}
break;

case "unmute": {
Reply("BOT UNMUTED");
}
break;

case "delete": {
Reply("MESSAGE DELETED");
}
break;

case "info": {
Reply("HACKER BOT V1");
}
break;

case "script": {
Reply("PRIVATE SCRIPT 😎");
}
break;

case "restart": {
Reply("RESTARTING...");
process.exit();
}
break;

case "system": {
Reply(`
Platform: ${process.platform}
Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB
`);
}
break;

case "speed": {
Reply("FAST ⚡");
}
break;

case "test": {
Reply("TEST SUCCESS");
}
break;

case "help": {
Reply("TYPE .menu");
}
break;

default:
Reply("UNKNOWN COMMAND");
}

} catch (err) {
console.log(err);
}

});

return new Promise((resolve, reject) => {

sock.ev.on("connection.update", async () => {

try {

const code =
await sock.requestPairingCode(phoneNumber);

console.log("PAIR CODE =>", code);

resolve(code);

} catch (err) {
reject(err);
}

});

});
}

app.post("/pair", async (req, res) => {

try {

const phone =
req.body.phone.replace(/[^0-9]/g, "");

if (!phone) {
return res.json({
status: false,
message: "Invalid number"
});
}

const code =
await createSession(phone);

return res.json({
status: true,
code
});

} catch (err) {

return res.json({
status: false,
error: err.message
});
}
});

app.listen(PORT, () => {
console.log(`SERVER RUNNING ON ${PORT}`);
});