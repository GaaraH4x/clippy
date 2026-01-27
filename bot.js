require('dotenv').config();
const { Telegraf } = require('telegraf');
const {
  getUser,
  createUser,
  updatePoints,
  updateLastActive,
  incrementMessages,
  logMessage,
  getAllUsers
} = require('./database');
const {
  whatCommand,
  earnCommand,
  referralCommand,
  raidersCommand,
  safeCommand,
  tokenomicsCommand,
  mypointsCommand,
  inviteCommand,
  leaderboardCommand,
  engagementCommand,
  streakCommand,
  statsCommand,
  addbonusCommand,
  broadcastCommand,
  resetuserCommand,
  topusersCommand,
  backupCommand,
  isAdmin,
  sendImageWithCaption
} = require('./commands');
const { initScheduler } = require('./scheduler');
const path = require('path');
const fs = require('fs');

// Validate environment variables
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required in .env');
  process.exit(1);
}

if (!process.env.GROUP_CHAT_ID) {
  console.error('❌ GROUP_CHAT_ID is required in .env');
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

const ADMIN_IDS = [
  parseInt(process.env.ADMIN_ID_1),
  parseInt(process.env.ADMIN_ID_2),
  parseInt(process.env.ADMIN_ID_3),
  parseInt(process.env.ADMIN_ID_4)
].filter(id => !isNaN(id));

console.log(`✅ Admin IDs loaded: ${ADMIN_IDS.join(', ')}`);

// Spam detection
const userMessageTracker = new Map();

function isSpam(userId) {
  const now = Date.now();
  const userMessages = userMessageTracker.get(userId) || [];
  
  // Remove messages older than 1 minute
  const recentMessages = userMessages.filter(time => now - time < 60000);
  
  // If more than 10 messages in 1 minute = spam
  if (recentMessages.length >= 10) {
    return true;
  }
  
  recentMessages.push(now);
  userMessageTracker.set(userId, recentMessages);
  return false;
}

// Welcome new members
bot.on('new_chat_members', async (ctx) => {
  try {
    const newMembers = ctx.message.new_chat_members;
    
    for (const member of newMembers) {
      if (member.is_bot) continue;
      
      const userId = member.id;
      const username = member.username || '';
      const firstName = member.first_name || 'User';
      
      let user = getUser(userId);
      
      if (!user) {
        createUser(userId, username, firstName);
        
        const caption = `Welcome to ClipCash, ${firstName}! 🟢

We're building a fair, community-driven token on Solana - and you're early.

*What you need to know:*
✅ Join Pre-Access at clipcash.site
✅ Engage in chat to earn points
✅ Build streaks for multipliers
✅ Climb the leaderboard

*Important:*
🚫 Admins NEVER DM first
🚫 Never share your PIN or seed phrase
✅ All updates posted here in TG + on X

*Get started:*
Type /what to learn more

Build with us. Early supporters win. 💪`;

        const imagePath = path.join(__dirname, 'images', 'welcome.jpg');
        
        if (fs.existsSync(imagePath)) {
          await ctx.replyWithPhoto(
            { source: imagePath },
            { caption, parse_mode: 'Markdown' }
          );
        } else {
          await ctx.reply(caption, { parse_mode: 'Markdown' });
        }
      }
    }
  } catch (error) {
    console.error('Error handling new member:', error);
  }
});

// Track all messages
bot.on('text', async (ctx) => {
  try {
    // Only track group messages
    if (ctx.chat.type === 'private') return;
    if (ctx.chat.id.toString() !== GROUP_CHAT_ID) return;

    const userId = ctx.from.id;
    const username = ctx.from.username || '';
    const firstName = ctx.from.first_name || 'User';
    const messageText = ctx.message.text;

    // Check if spam
    if (isSpam(userId)) {
      const { db } = require('./database');
      const user = getUser(userId);
      
      if (user && user.warnings < 1) {
        db.prepare('UPDATE users SET warnings = warnings + 1 WHERE user_id = ?').run(userId);
        return ctx.reply(`⚠️ @${username || firstName}, slow down! Quality > Quantity. Your points for this session have been removed.`);
      }
      return; // Ignore spam messages
    }

    // Get or create user
    let user = getUser(userId);
    
    if (!user) {
      createUser(userId, username, firstName);
      user = getUser(userId);
    }

    // Check if this is a dev message
    const isDev = ADMIN_IDS.includes(userId) || 
                  (ctx.message.sender_chat && ctx.message.sender_chat.id.toString() === GROUP_CHAT_ID);

    // Award points for engagement
    let pointsEarned = 5; // Base points per message
    
    // Streak multiplier
    if (user.streak >= 30) {
      pointsEarned *= 3;
    } else if (user.streak >= 14) {
      pointsEarned *= 2;
    } else if (user.streak >= 7) {
      pointsEarned *= 1.5;
    }

    pointsEarned = Math.floor(pointsEarned);

    // Update user data
    updatePoints(userId, pointsEarned);
    updateLastActive(userId);
    incrementMessages(userId);
    logMessage(userId, messageText, isDev);

    console.log(`💬 ${firstName}: +${pointsEarned} points (streak: ${user.streak}d)`);

  } catch (error) {
    console.error('Error tracking message:', error);
  }
});

// Register commands
bot.command('what', whatCommand);
bot.command('earn', earnCommand);
bot.command('referral', referralCommand);
bot.command('raiders', raidersCommand);
bot.command('safe', safeCommand);
bot.command('tokenomics', tokenomicsCommand);
bot.command('mypoints', mypointsCommand);
bot.command('invite', inviteCommand);
bot.command('leaderboard', leaderboardCommand);
bot.command('engagement', engagementCommand);
bot.command('streak', streakCommand);

// Admin commands
bot.command('stats', statsCommand);
bot.command('addbonus', addbonusCommand);
bot.command('broadcast', broadcastCommand);
bot.command('resetuser', resetuserCommand);
bot.command('topusers', topusersCommand);
bot.command('backup', backupCommand);

// Help command
bot.command('help', (ctx) => {
  const userId = ctx.from.id;
  
  let helpText = `*ClipCash Bot Commands*

*📊 User Commands:*
/what - What is ClipCash?
/earn - How to earn points
/referral - Referral system info
/raiders - Raiders Console info
/safe - Security & safety
/tokenomics - Token distribution

/mypoints - Check your stats
/invite - Get your referral link
/leaderboard - Top 10 holders
/engagement - Today's top engagers
/streak - Active streak leaderboard`;

  if (isAdmin(userId)) {
    helpText += `\n\n*🔧 Admin Commands:*
/stats - Dashboard stats
/addbonus @user points - Award bonus
/broadcast message - Send announcement
/resetuser @user - Reset user data
/topusers - Detailed user list`;
  }

  ctx.reply(helpText, { parse_mode: 'Markdown' });
});

// Start command (for referrals)
bot.command('start', async (ctx) => {
  const args = ctx.message.text.split(' ');
  const referralCode = args[1];

  if (referralCode && referralCode.startsWith('CLIP')) {
    // Handle referral signup
    const { db } = require('./database');
    const referrer = db.prepare('SELECT * FROM users WHERE referral_code = ?').get(referralCode);
    
    if (referrer) {
      const userId = ctx.from.id;
      const username = ctx.from.username || '';
      const firstName = ctx.from.first_name || 'User';
      
      let user = getUser(userId);
      
      if (!user) {
        createUser(userId, username, firstName, referrer.user_id);
        
        // Log referral
        db.prepare(`
          INSERT INTO referrals (referrer_id, referred_id, timestamp)
          VALUES (?, ?, ?)
        `).run(referrer.user_id, userId, new Date().toISOString());
        
        ctx.reply(`✅ Welcome! You were referred by ${referrer.first_name}.\n\nJoin the group to start earning: ${GROUP_CHAT_ID}`);
      }
    }
  } else {
    ctx.reply('Welcome to ClipCash Bot! Join our group to start earning points: ' + GROUP_CHAT_ID);
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
});

// Initialize scheduler
initScheduler(bot, GROUP_CHAT_ID, HF_TOKEN);

// Launch bot
bot.launch()
  .then(() => {
    console.log('🚀 ClipCash Bot is running!');
    console.log(`📊 Tracking group: ${GROUP_CHAT_ID}`);
    console.log(`👥 Admin IDs: ${ADMIN_IDS.join(', ')}`);
  })
  .catch(err => {
    console.error('❌ Failed to launch bot:', err);
    process.exit(1);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Keep-alive HTTP server for Render
const http = require('http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('🚀 Clippy is running!\n');
});

server.listen(PORT, () => {
  console.log(`✅ HTTP server listening on port ${PORT}`);
});
