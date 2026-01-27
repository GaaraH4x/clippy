const cron = require('node-cron');
const { 
  getInactiveUsers, 
  updatePoints, 
  resetStreak,
  getDevMessages,
  getMostReactedMessages,
  getTodayActiveUsers,
  getTodayMessages,
  getAllUsers,
  getTopUsers,
  updateDailyStats,
  updateStreak,
  saveWeeklyWinner
} = require('./database');
const { generateSummary } = require('./summarizer');
const { sendImageWithCaption } = require('./commands');
const path = require('path');
const fs = require('fs');

let bot = null;
let groupChatId = null;
let hfToken = null;

function initScheduler(botInstance, chatId, huggingfaceToken) {
  bot = botInstance;
  groupChatId = chatId;
  hfToken = huggingfaceToken;

  // Daily Recap - 8 PM WAT
  cron.schedule('0 20 * * *', async () => {
    await sendDailyRecap();
  }, {
    timezone: "Africa/Lagos"
  });

  // Weekly Top Engager - Sunday 12 PM WAT
  cron.schedule('0 12 * * 0', async () => {
    await sendWeeklyTopEngager();
  }, {
    timezone: "Africa/Lagos"
  });

  // Decay Warning - 6 PM WAT (6 hours before 8 PM recap check)
  cron.schedule('0 18 * * *', async () => {
    await sendDecayWarning();
  }, {
    timezone: "Africa/Lagos"
  });

  // Process Decay - 8:05 PM WAT (right after recap)
  cron.schedule('5 20 * * *', async () => {
    await processDecay();
  }, {
    timezone: "Africa/Lagos"
  });

  // Check and update streaks - 11:59 PM WAT
  cron.schedule('59 23 * * *', async () => {
    await updateStreaks();
  }, {
    timezone: "Africa/Lagos"
  });

  // Milestone check - every hour
  cron.schedule('0 * * * *', async () => {
    await checkMilestones();
  }, {
    timezone: "Africa/Lagos"
  });

  console.log('✅ Scheduler initialized (WAT timezone)');
}

async function sendDailyRecap() {
  try {
    updateDailyStats();

    const { db } = require('./database');
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's messages for summary
    const todayMessages = db.prepare(`
      SELECT * FROM messages 
      WHERE date(timestamp) = ?
      ORDER BY reactions DESC
    `).all(today);

    // Generate AI summary
    const summary = await generateSummary(todayMessages, hfToken);

    // Get dev activity
    const devMessages = getDevMessages();
    let devActivity = "Building in silence today.";
    
    if (devMessages.length > 0) {
      const devSummary = devMessages.map(m => m.message_text).join(' ').slice(0, 200);
      devActivity = devSummary || "Dev team was active today.";
    }

    // Get stats
    const newMembers = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE date(join_date) = ?
    `).get(today).count;

    const totalMembers = getAllUsers().length;
    const todayMsgCount = getTodayMessages();
    const activeToday = getTodayActiveUsers();

    const caption = `📊 *CLIPCASH DAILY DIGEST* – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}

💬 *TODAY'S HIGHLIGHTS*
${summary}

📢 *DEV ACTIVITY*
${devActivity}

👥 *NEW MEMBERS*
• +${newMembers} joined today
• ${totalMembers} total members now

📈 *ACTIVITY*
• ${todayMsgCount} messages sent today
• ${activeToday} active members

---

📊 Want details?
/engagement - Today's top contributors
/streak - Who's on fire 🔥
/leaderboard - Top 10 point holders

Keep building. 🟢`;

    const imagePath = path.join(__dirname, 'images', 'recap.jpg');
    
    if (fs.existsSync(imagePath)) {
      await bot.telegram.sendPhoto(
        groupChatId,
        { source: imagePath },
        { caption, parse_mode: 'Markdown' }
      );
    } else {
      await bot.telegram.sendMessage(groupChatId, caption, { parse_mode: 'Markdown' });
    }

    console.log('✅ Daily recap sent');
  } catch (error) {
    console.error('❌ Daily recap error:', error);
  }
}

async function sendWeeklyTopEngager() {
  try {
    const { db } = require('./database');
    
    // Get top engager from last 7 days
    const topEngager = db.prepare(`
      SELECT u.user_id, u.username, u.first_name, u.points, u.streak, COUNT(m.id) as msg_count
      FROM users u
      JOIN messages m ON u.user_id = m.user_id
      WHERE m.timestamp > datetime('now', '-7 days')
      GROUP BY u.user_id
      ORDER BY msg_count DESC, u.points DESC
      LIMIT 1
    `).get();

    if (!topEngager) {
      return console.log('No top engager this week');
    }

    // Save to history
    saveWeeklyWinner(topEngager.user_id, topEngager.username, topEngager.points);

    // Give bonus points
    updatePoints(topEngager.user_id, 500);

    const caption = `🏆 *WEEKLY TOP ENGAGER*

👑 *${topEngager.first_name}*

This week's champion:
📊 ${topEngager.points} total points
💬 ${topEngager.msg_count} messages
🔥 ${topEngager.streak} day streak

*Reward:* +500 bonus points + 2x multiplier next week

Next Sunday, who's taking the crown? 💪

Let's see those /leaderboard rankings! 🚀`;

    const imagePath = path.join(__dirname, 'images', 'top-engager.jpg');
    
    if (fs.existsSync(imagePath)) {
      await bot.telegram.sendPhoto(
        groupChatId,
        { source: imagePath },
        { caption, parse_mode: 'Markdown' }
      );
    } else {
      await bot.telegram.sendMessage(groupChatId, caption, { parse_mode: 'Markdown' });
    }

    console.log('✅ Weekly top engager announced');
  } catch (error) {
    console.error('❌ Weekly top engager error:', error);
  }
}

async function sendDecayWarning() {
  try {
    const inactiveUsers = getInactiveUsers();

    if (inactiveUsers.length === 0) {
      return console.log('No inactive users to warn');
    }

    // Tag users publicly
    const userTags = inactiveUsers
      .slice(0, 20) // Limit to 20 to avoid message too long
      .map(u => `@${u.username || u.first_name}`)
      .join(', ');

    const caption = `⚠️ *DECAY WARNING*

These members will lose 30% points in 2 hours if they don't engage:

${userTags}

${inactiveUsers.length > 20 ? `...and ${inactiveUsers.length - 20} more` : ''}

Drop a message to save your points! 💪`;

    const imagePath = path.join(__dirname, 'images', 'decay-warning.jpg');
    
    if (fs.existsSync(imagePath)) {
      await bot.telegram.sendPhoto(
        groupChatId,
        { source: imagePath },
        { caption, parse_mode: 'Markdown' }
      );
    } else {
      await bot.telegram.sendMessage(groupChatId, caption, { parse_mode: 'Markdown' });
    }

    console.log(`✅ Decay warning sent to ${inactiveUsers.length} users`);
  } catch (error) {
    console.error('❌ Decay warning error:', error);
  }
}

async function processDecay() {
  try {
    const inactiveUsers = getInactiveUsers();

    if (inactiveUsers.length === 0) {
      return console.log('No users to decay');
    }

    let decayCount = 0;

    inactiveUsers.forEach(user => {
      const pointsLost = Math.floor(user.points * 0.3);
      updatePoints(user.user_id, -pointsLost);
      resetStreak(user.user_id);
      decayCount++;
    });

    console.log(`✅ Processed decay for ${decayCount} users`);
  } catch (error) {
    console.error('❌ Decay processing error:', error);
  }
}

async function updateStreaks() {
  try {
    const { db } = require('./database');
    const today = new Date().toISOString().split('T')[0];

    // Get users who were active today
    const activeToday = db.prepare(`
      SELECT DISTINCT user_id FROM messages 
      WHERE date(timestamp) = ?
    `).all(today).map(row => row.user_id);

    // Update streaks for active users
    activeToday.forEach(userId => {
      updateStreak(userId, 1);
    });

    // Reset streaks for inactive users
    const allUsers = getAllUsers();
    const inactiveToday = allUsers.filter(u => !activeToday.includes(u.user_id));
    
    inactiveToday.forEach(user => {
      if (user.streak > 0) {
        resetStreak(user.user_id);
      }
    });

    console.log(`✅ Streaks updated: ${activeToday.length} continued, ${inactiveToday.length} reset`);
  } catch (error) {
    console.error('❌ Streak update error:', error);
  }
}

async function checkMilestones() {
  try {
    const { db } = require('./database');
    const totalMembers = getAllUsers().length;
    
    // Check if we just hit a milestone
    const milestones = [500, 1000, 5000, 10000];
    
    // Get last milestone we celebrated
    const lastCelebrated = db.prepare(`
      SELECT MAX(milestone) as last FROM (
        SELECT 500 as milestone WHERE EXISTS (SELECT 1 FROM users LIMIT 500)
        UNION SELECT 1000 WHERE EXISTS (SELECT 1 FROM users LIMIT 1000)
        UNION SELECT 5000 WHERE EXISTS (SELECT 1 FROM users LIMIT 5000)
        UNION SELECT 10000 WHERE EXISTS (SELECT 1 FROM users LIMIT 10000)
      )
    `).get()?.last || 0;

    const currentMilestone = milestones.find(m => totalMembers >= m && m > lastCelebrated);

    if (currentMilestone) {
      const caption = `🎉 *${currentMilestone} MEMBERS!*

We just hit ${currentMilestone} builders in ClipCash!

Every person here is early. Every person matters.

Keep building. The snapshot is coming.

Let's go. 🟢`;

      const imagePath = path.join(__dirname, 'images', `milestone-${currentMilestone}.jpg`);
      
      if (fs.existsSync(imagePath)) {
        await bot.telegram.sendPhoto(
          groupChatId,
          { source: imagePath },
          { caption, parse_mode: 'Markdown' }
        );
      } else {
        await bot.telegram.sendMessage(groupChatId, caption, { parse_mode: 'Markdown' });
      }

      console.log(`🎉 Milestone celebrated: ${currentMilestone} members`);
    }
  } catch (error) {
    console.error('❌ Milestone check error:', error);
  }
}

module.exports = { initScheduler };