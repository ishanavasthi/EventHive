const https = require('https');

const URL = 'https://eventhive-l9j5.onrender.com/health';
const INTERVAL = 10 * 60 * 1000; // 10 minutes (Render sleeps after 15)

console.log(`Starting Keep-Alive for: ${URL}`);
console.log('Press Ctrl+C to stop.');

const ping = () => {
    https.get(URL, (res) => {
        console.log(`[${new Date().toLocaleTimeString()}] Ping Status: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`[${new Date().toLocaleTimeString()}] Ping Error: ${e.message}`);
    });
};

// Initial ping
ping();

// Schedule
setInterval(ping, INTERVAL);
