# ClipCash Engagement Bot

Automated Telegram bot for tracking and rewarding community engagement in ClipCash.

## Features

- **Auto Point System**: Awards points for messages, replies, reactions
- **Streak Multipliers**: 7d/14d/30d streaks give bonus multipliers
- **Decay Mechanics**: 30% point loss after 24h inactivity
- **Daily Recap**: AI-generated summary at 8 PM WAT
- **Weekly Top Engager**: Announced every Sunday 12 PM WAT
- **Leaderboards**: Track top contributors
- **Referral System**: Invite tracking with rewards
- **Admin Tools**: Stats dashboard, bonus points, broadcasts
- **Anti-Spam**: Detects and penalizes farming behavior

## Installation

### 1. Clone/Download Code

```bash
git clone <your-repo-url>
cd clipcash-bot
2. Install Dependencies
npm install
3. Set Up Environment Variables
Create a .env file:
BOT_TOKEN=your_telegram_bot_token
ADMIN_ID_1=first_admin_user_id
ADMIN_ID_2=second_admin_user_id
ADMIN_ID_3=third_admin_user_id
ADMIN_ID_4=fourth_admin_user_id
HUGGINGFACE_API_TOKEN=your_huggingface_token
GROUP_CHAT_ID=your_group_chat_id
TZ=Africa/Lagos
How to get these:
BOT_TOKEN: Message @BotFather on Telegram, create new bot
ADMIN_IDs: Get user IDs from @userinfobot
HUGGINGFACE_API_TOKEN: Sign up at huggingface.co → Settings → Access Tokens
GROUP_CHAT_ID: Add bot to group, send message, check logs for chat ID
4. Add Images
Create images/ folder and add these files:
images/
├── recap.jpg
├── welcome.jpg
├── leaderboard.jpg
├── engagement.jpg
├── streak.jpg
├── top-engager.jpg
├── decay-warning.jpg
├── milestone-500.jpg
├── milestone-1000.jpg
├── milestone-5000.jpg
├── milestone-10000.jpg
├── faq-what.jpg
├── faq-earn.jpg
├── faq-referral.jpg
├── faq-raiders.jpg
├── faq-safe.jpg
└── faq-tokenomics.jpg
5. Test Locally
npm start
Bot should connect and log: "🚀 ClipCash Bot is running!"
Deployment to Render
1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
2. Connect to Render
Go to https://render.com
Click New + → Web Service
Connect your GitHub repo
Configure:
Name: clipcash-bot
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free
3. Add Environment Variables
In Render dashboard, add all variables from your .env file:
BOT_TOKEN
ADMIN_ID_1, ADMIN_ID_2, ADMIN_ID_3, ADMIN_ID_4
HUGGINGFACE_API_TOKEN
GROUP_CHAT_ID
TZ (set to Africa/Lagos)
4. Deploy
Click Create Web Service. Render will:
Pull your code
Install dependencies
Start the bot
Check logs to confirm it's running.
Bot Commands
User Commands
/what - What is ClipCash?
/earn - How to earn points
/referral - Referral system
/raiders - Raiders Console info
/safe - Security info
/tokenomics - Token distribution
/mypoints - Check your stats
/invite - Get referral link
/leaderboard - Top 10 holders
/engagement - Today's top engagers
/streak - Streak leaderboard
/help - Show all commands
Admin Commands
/stats - Dashboard overview
/addbonus @user 500 - Award bonus points
/broadcast message - Send announcement
/resetuser @user - Reset user data
/topusers - Detailed top 20 list
Scheduled Tasks
All times in WAT (West Africa Time):
8:00 PM - Daily recap with AI summary
12:00 PM Sunday - Weekly top engager announcement
6:00 PM - Decay warning (6 hours before decay)
8:05 PM - Process point decay
11:59 PM - Update streaks
Every hour - Check for milestones
Point System
Earning Points
Message: 5 points (base)
7-day streak: 1.5x multiplier
14-day streak: 2x multiplier
30-day streak: 3x multiplier
Losing Points
24h inactivity: -30% of total points + streak reset
Spam detected: Points removed for that session + warning
Anti-Spam
More than 10 messages per minute = flagged as spam
First offense: Warning + points removed
Repeat offense: Flagged for admin review
Troubleshooting
Bot not responding
Check Render logs for errors
Verify BOT_TOKEN is correct
Ensure bot has admin rights in group
Check GROUP_CHAT_ID matches your group
Images not showing
Verify images/ folder exists
Check all image files are named correctly
Ensure images uploaded to server
Daily recap not posting
Check timezone is set to Africa/Lagos
Verify HUGGINGFACE_API_TOKEN is valid
Check Render logs at 8 PM WAT for errors
Points not awarding
Check bot has permission to read messages
Verify user is in database: check logs
Test with /mypoints command
Database
Bot uses SQLite (clipcash.db) to store:
User data (points, streaks, messages)
Message history
Referrals
Daily stats
Weekly winners
Database is created automatically on first run.
Maintenance
Backup Database
Download clipcash.db from Render periodically:
Render Dashboard → Shell
Run: cat clipcash.db and save output
Monitor Performance
Check Render logs daily for:
Error messages
Memory usage
Scheduled task execution
Update Bot
Make changes locally
Test with npm start
Push to GitHub: git push
Render auto-deploys
Support
For issues:
Check logs first
Verify environment variables
Test commands in group
Review code comments
Built for ClipCash by [Your Name]
---

## **That's Everything! 🎉**

You now have:

1. ✅ package.json
2. ✅ .env.example
3. ✅ .gitignore
4. ✅ database.js
5. ✅ summarizer.js
6. ✅ commands.js (complete)
7. ✅ scheduler.js
8. ✅ bot.js (complete)
9. ✅ README.md

---

## **Next Steps:**

1. **Create folder** `clipcash-bot`
2. **Create all files** with the code I gave you
3. **Create `images/` folder** with 17 image files
4. **Get your tokens** (new ones, not the leaked ones)
5. **Test locally** with `npm start`
6. **Push to GitHub**
7. **Deploy to Render**
8. **Show dev the working bot**
9. **Get paid** 💰

---

**Need help with any step? Let me know!** 🚀