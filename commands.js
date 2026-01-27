const fs = require('fs');
const path = require('path');
const {
  getUser,
  getTopUsers,
  getTodayActiveUsers,
  getAllUsers
} = require('./database');

const sendImageWithCaption = async (ctx, imageName, caption) => {
  const imagePath = path.join(__dirname, 'images', imageName);
  
  if (fs.existsSync(imagePath)) {
    await ctx.replyWithPhoto(
      { source: imagePath },
      { caption, parse_mode: 'Markdown' }
    );
  } else {
    await ctx.reply(caption, { parse_mode: 'Markdown' });
  }
};

// Command: /what
const whatCommand = async (ctx) => {
  const caption = `*What is ClipCash?*

ClipCash is a community-driven token on Solana that rewards participation, creativity, and long-term engagement.

We're building a transparent ecosystem where early supporters earn $CLIP tokens through real activity - not speculation.

Currently in Pre-Access phase. Join → Earn Points → Get Qualified → Receive Allocation.

Fair launch. No VCs. No private sales. Community-first.

🔗 Join: clipcash.site`;

  await sendImageWithCaption(ctx, 'faq-what.jpg', caption);
};

// Command: /earn
const earnCommand = async (ctx) => {
  const caption = `*How to Earn Points*

You earn points through:

🎯 *Engagement* - Post messages, reply, react (real participation only)
👥 *Referrals* - Invite builders with /invite
📊 *Consistency* - Build daily streaks for multipliers
⏱️ *Early Support* - Being active now matters most

*Streak Multipliers:*
• 7 days = 1.5x points
• 14 days = 2x points
• 30 days = 3x points + OG Builder badge

*Warning:* 24 hours inactive = lose 30% of points

Check your stats: /mypoints
Get referral link: /invite`;

  await sendImageWithCaption(ctx, 'faq-earn.jpg', caption);
};

// Command: /referral
const referralCommand = async (ctx) => {
  const caption = `*Referral System*

Bring real builders, earn rewards.

*How it works:*
1. Get your unique link: /invite
2. Share with real people (not bots)
3. They join and engage
4. You earn bonus points for qualified referrals

*What makes a referral qualified:*
✅ Stays active 3+ days
✅ Earns minimum 50 points
✅ Real engagement (not spam)

Quality > Quantity. Real builders get rewarded.`;

  await sendImageWithCaption(ctx, 'faq-referral.jpg', caption);
};

// Command: /raiders
const raidersCommand = async (ctx) => {
  const caption = `*Raiders Console*

Complete tasks, earn badges, climb ranks.

Access your dashboard at clipcash.site and navigate to Raiders Console.

*How it works:*
• Complete daily/weekly tasks
• Earn Raider Score
• Unlock badges: Raider → Raider+ → Elite
• Higher badges = better allocation

Streaks and consistency matter. Show up, do the work, earn rewards.`;

  await sendImageWithCaption(ctx, 'faq-raiders.jpg', caption);
};

// Command: /safe
const safeCommand = async (ctx) => {
  const caption = `*Is ClipCash Safe?*

Built with transparency:

🔒 *Mint authority disabled* - fixed 1B supply
📊 *Public dev logs* - daily proof of work
🧾 *Transparent tokenomics* - documented allocation
🚫 *No private sales* - fair launch only
⚠️ *Admins never DM first* - anyone DMing you is a scammer

Everything is public. Every step is documented.

Questions? Ask in the group.`;

  await sendImageWithCaption(ctx, 'faq-safe.jpg', caption);
};

// Command: /tokenomics
const tokenomicsCommand = async (ctx) => {
  const caption = `*$CLIP Tokenomics*

Total Supply: 1,000,000,000 (Fixed)

*Distribution:*
• 40% Rewards Pool (community)
• 20% Liquidity (locked)
• 20% Sale (vested release)
• 20% Team (24mo vesting, 0% at launch)

*Launch:*
Phase 1: Pre-Access (now)
Phase 2: Snapshot + Qualification
Phase 3: Token airdrop
Phase 4: Public launch

Build now. Earn later.`;

  await sendImageWithCaption(ctx, 'faq-tokenomics.jpg', caption);
};

// Command: /mypoints
const mypointsCommand = async (ctx) => {
  const userId = ctx.from.id;
  const user = getUser(userId);

  if (!user) {
    return ctx.reply('You haven\'t joined yet. Start engaging to earn points!');
  }

  const allUsers = getAllUsers();
  const rank = allUsers
    .sort((a, b) => b.points - a.points)
    .findIndex(u => u.user_id === userId) + 1;

  const streakMultiplier = user.streak >= 30 ? '3x 🔥' : 
                           user.streak >= 14 ? '2x 🔥' : 
                           user.streak >= 7 ? '1.5x ⚡' : '1x';

  const caption = `*Your ClipCash Stats*

👤 ${user.first_name}
📊 Points: *${user.points}*
🏆 Rank: *#${rank}* of ${allUsers.length}
🔥 Streak: *${user.streak} days* (${streakMultiplier})
💬 Messages: ${user.total_messages}

${user.streak >= 7 ? '💪 Keep the streak alive!' : '📈 Build a 7-day streak for bonus multiplier!'}

Commands: /invite | /leaderboard`;

  ctx.reply(caption, { parse_mode: 'Markdown' });
};

// Command: /invite
const inviteCommand = async (ctx) => {
  const userId = ctx.from.id;
  const user = getUser(userId);

  if (!user) {
    return ctx.reply('Join the community first by engaging in the chat!');
  }

  const inviteLink = `https://t.me/${ctx.botInfo.username}?start=${user.referral_code}`;

  const caption = `*Your Referral Link*

Share this link to invite builders:
\`${inviteLink}\`

Every qualified referral earns you bonus points.

*Your referral stats:*
Coming soon in next update.

Keep building! 💪`;

  ctx.reply(caption, { parse_mode: 'Markdown' });
};

// Command: /leaderboard
const leaderboardCommand = async (ctx) => {
  const topUsers = getTopUsers(10);

  if (topUsers.length === 0) {
    return ctx.reply('No users yet. Be the first to earn points!');
  }

  let caption = `*🏆 TOP 10 POINT HOLDERS*\n\n`;

  topUsers.forEach((user, index) => {
    const medal = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    const streakEmoji = user.streak >= 30 ? '🔥🔥🔥' : 
                        user.streak >= 14 ? '🔥🔥' : 
                        user.streak >= 7 ? '🔥' : '';
    
    caption += `${medal} *${user.first_name}* - ${user.points} pts ${streakEmoji}\n`;
  });

  caption += `\n💡 Check your rank: /mypoints`;

  await sendImageWithCaption(ctx, 'leaderboard.jpg', caption);
};

// Command: /engagement
const engagementCommand = async (ctx) => {
  const today = new Date().toISOString().split('T')[0];
  const { db } = require('./database');
  
  const topToday = db.prepare(`
    SELECT u.user_id, u.first_name, u.username, COUNT(m.id) as msg_count
    FROM users u
    JOIN messages m ON u.user_id = m.user_id
    WHERE date(m.timestamp) = ?
    GROUP BY u.user_id
    ORDER BY msg_count DESC
    LIMIT 10
  `).all(today);

  if (topToday.length === 0) {
    return ctx.reply('No activity yet today. Be the first!');
  }

  let caption = `*📊 TODAY'S TOP ENGAGERS*\n\n`;

  topToday.forEach((user, index) => {
    const emoji = index === 0 ? '🔥' : index === 1 ? '⚡' : index === 2 ? '💪' : '•';
    caption += `${emoji} *${user.first_name}* - ${user.msg_count} messages\n`;
  });

  caption += `\nKeep engaging to climb the ranks! 💪`;

  await sendImageWithCaption(ctx, 'engagement.jpg', caption);
};

// Command: /backup (Admin only)
const backupCommand = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('⛔ Admin only command.');
  }

  try {
    const { db } = require('./database');
    const fs = require('fs');
    const path = require('path');
    
    // Force database to write all changes
    db.pragma('wal_checkpoint(TRUNCATE)');
    
    const dbPath = path.join(__dirname, 'clipcash.db');
    
    // Send database file to admin
    await ctx.replyWithDocument(
      { source: dbPath },
      { caption: `📦 Database Backup\n${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}` }
    );
    
    ctx.reply('✅ Database backup sent. Save this file securely.');
    
  } catch (error) {
    ctx.reply(`❌ Backup failed: ${error.message}`);
  }
};

// Command: /streak
const streakCommand = async (ctx) => {
  const { db } = require('./database');
  
  const topStreaks = db.prepare(`
    SELECT * FROM users 
    WHERE streak > 0 
    ORDER BY streak DESC 
    LIMIT 10
  `).all();

  if (topStreaks.length === 0) {
    return ctx.reply('No active streaks yet. Start yours today!');
  }

  let caption = `*🔥 TOP STREAKS*\n\n`;

  topStreaks.forEach((user, index) => {
    const emoji = user.streak >= 30 ? '🔥🔥🔥' : 
                  user.streak >= 14 ? '🔥🔥' : 
                  user.streak >= 7 ? '🔥' : '⚡';
    
    caption += `${emoji} *${user.first_name}* - ${user.streak} days\n`;
  });

  caption += `\n💡 Miss a day = streak resets. Stay active!`;

  await sendImageWithCaption(ctx, 'streak.jpg', caption);
};

/*

module.exports = {
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
  sendImageWithCaption
};

*/

// ============================================
// ADMIN COMMANDS
// ============================================

const ADMIN_IDS = [
  parseInt(process.env.ADMIN_ID_1),
  parseInt(process.env.ADMIN_ID_2),
  parseInt(process.env.ADMIN_ID_3),
  parseInt(process.env.ADMIN_ID_4)
].filter(id => !isNaN(id));

const isAdmin = (userId) => ADMIN_IDS.includes(userId);

// Command: /stats (Admin only)
const statsCommand = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('⛔ Admin only command.');
  }

  const allUsers = getAllUsers();
  const activeToday = getTodayActiveUsers();
  const todayMessages = getTodayMessages();
  const totalPoints = allUsers.reduce((sum, user) => sum + user.points, 0);
  
  const { db } = require('./database');
  const weeklyActive = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM messages
    WHERE timestamp > datetime('now', '-7 days')
  `).get().count;

  const caption = `*📊 ADMIN DASHBOARD*

*Community Stats:*
👥 Total Members: ${allUsers.length}
⚡ Active Today: ${activeToday}
📈 Active This Week: ${weeklyActive}

*Today's Activity:*
💬 Messages: ${todayMessages}
📊 Engagement Rate: ${((activeToday / allUsers.length) * 100).toFixed(1)}%

*Points Distribution:*
💎 Total Points: ${totalPoints}
📊 Avg per User: ${(totalPoints / allUsers.length).toFixed(0)}

*Top 3 Users:*
${getTopUsers(3).map((u, i) => `${i + 1}. ${u.first_name} - ${u.points} pts`).join('\n')}

Last updated: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}`;

  ctx.reply(caption, { parse_mode: 'Markdown' });
};

// Command: /addbonus (Admin only)
const addbonusCommand = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('⛔ Admin only command.');
  }

  const args = ctx.message.text.split(' ');
  
  if (args.length < 3) {
    return ctx.reply('Usage: /addbonus @username points\nExample: /addbonus @john 500');
  }

  const username = args[1].replace('@', '');
  const points = parseInt(args[2]);

  if (isNaN(points)) {
    return ctx.reply('❌ Points must be a number.');
  }

  const { db } = require('./database');
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return ctx.reply(`❌ User @${username} not found.`);
  }

  updatePoints(user.user_id, points);

  ctx.reply(`✅ Added ${points} points to @${username}\nNew balance: ${user.points + points} points`);
};

// Command: /broadcast (Admin only)
const broadcastCommand = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('⛔ Admin only command.');
  }

  const message = ctx.message.text.replace('/broadcast', '').trim();

  if (!message) {
    return ctx.reply('Usage: /broadcast Your announcement here');
  }

  const groupChatId = process.env.GROUP_CHAT_ID;

  try {
    await ctx.telegram.sendMessage(groupChatId, `📢 *ANNOUNCEMENT*\n\n${message}`, { parse_mode: 'Markdown' });
    ctx.reply('✅ Broadcast sent to group.');
  } catch (error) {
    ctx.reply(`❌ Failed to send broadcast: ${error.message}`);
  }
};

// Command: /resetuser (Admin only)
const resetuserCommand = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('⛔ Admin only command.');
  }

  const args = ctx.message.text.split(' ');
  
  if (args.length < 2) {
    return ctx.reply('Usage: /resetuser @username');
  }

  const username = args[1].replace('@', '');

  const { db } = require('./database');
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return ctx.reply(`❌ User @${username} not found.`);
  }

  db.prepare('UPDATE users SET points = 0, streak = 0, warnings = 0 WHERE user_id = ?').run(user.user_id);

  ctx.reply(`✅ Reset @${username}\nPoints, streak, and warnings cleared.`);
};

// Command: /topusers (Admin only)
const topusersCommand = async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('⛔ Admin only command.');
  }

  const topUsers = getTopUsers(20);

  let caption = `*📊 TOP 20 USERS (ADMIN VIEW)*\n\n`;

  topUsers.forEach((user, index) => {
    caption += `${index + 1}. *${user.first_name}* (@${user.username || 'no_username'})\n`;
    caption += `   💎 ${user.points} pts | 🔥 ${user.streak}d | 💬 ${user.total_messages} msgs\n\n`;
  });

  ctx.reply(caption, { parse_mode: 'Markdown' });
};

// Export all commands
module.exports = {
  // User commands
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
  sendImageWithCaption,
  
  // Admin commands
  isAdmin,
  statsCommand,
  addbonusCommand,
  broadcastCommand,
  resetuserCommand,
  topusersCommand,
  backupCommand
};