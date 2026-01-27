const Database = require('better-sqlite3');
const db = new Database('clipcash.db');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    points INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_active TEXT,
    referral_code TEXT UNIQUE,
    referred_by INTEGER,
    join_date TEXT,
    total_messages INTEGER DEFAULT 0,
    warnings INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message_text TEXT,
    timestamp TEXT,
    is_dev BOOLEAN DEFAULT 0,
    reactions INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER,
    referred_id INTEGER,
    timestamp TEXT,
    qualified BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,
    total_messages INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_members INTEGER DEFAULT 0,
    points_distributed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS weekly_winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    points INTEGER,
    week_start TEXT,
    week_end TEXT
  );
`);

// Helper functions
const getUser = (userId) => {
  return db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
};

const createUser = (userId, username, firstName, referredBy = null) => {
  const referralCode = `CLIP${userId}${Date.now().toString(36).toUpperCase()}`;
  const joinDate = new Date().toISOString();
  
  return db.prepare(`
    INSERT INTO users (user_id, username, first_name, referral_code, referred_by, join_date, last_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, username, firstName, referralCode, referredBy, joinDate, joinDate);
};

const updatePoints = (userId, pointsChange) => {
  return db.prepare('UPDATE users SET points = points + ? WHERE user_id = ?').run(pointsChange, userId);
};

const updateLastActive = (userId) => {
  return db.prepare('UPDATE users SET last_active = ? WHERE user_id = ?').run(new Date().toISOString(), userId);
};

const updateStreak = (userId, streakChange) => {
  return db.prepare('UPDATE users SET streak = streak + ? WHERE user_id = ?').run(streakChange, userId);
};

const resetStreak = (userId) => {
  return db.prepare('UPDATE users SET streak = 0 WHERE user_id = ?').run(userId);
};

const incrementMessages = (userId) => {
  return db.prepare('UPDATE users SET total_messages = total_messages + 1 WHERE user_id = ?').run(userId);
};

const logMessage = (userId, messageText, isDev = false) => {
  return db.prepare(`
    INSERT INTO messages (user_id, message_text, timestamp, is_dev)
    VALUES (?, ?, ?, ?)
  `).run(userId, messageText, new Date().toISOString(), isDev ? 1 : 0);
};

const getTopUsers = (limit = 10) => {
  return db.prepare('SELECT * FROM users ORDER BY points DESC LIMIT ?').all(limit);
};

const getTodayActiveUsers = () => {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count 
    FROM messages 
    WHERE date(timestamp) = ?
  `).get(today).count;
};

const getTodayMessages = () => {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT COUNT(*) as count 
    FROM messages 
    WHERE date(timestamp) = ?
  `).get(today).count;
};

const getInactiveUsers = () => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  return db.prepare(`
    SELECT * FROM users 
    WHERE last_active < ? AND points > 0
  `).all(twentyFourHoursAgo);
};

const getDevMessages = () => {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT * FROM messages 
    WHERE is_dev = 1 AND date(timestamp) = ?
  `).all(today);
};

const getMostReactedMessages = (limit = 5) => {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT * FROM messages 
    WHERE date(timestamp) = ? 
    ORDER BY reactions DESC 
    LIMIT ?
  `).all(today, limit);
};

const getAllUsers = () => {
  return db.prepare('SELECT * FROM users').all();
};

const updateDailyStats = () => {
  const today = new Date().toISOString().split('T')[0];
  const messages = getTodayMessages();
  const activeUsers = getTodayActiveUsers();
  const newMembers = db.prepare(`
    SELECT COUNT(*) as count 
    FROM users 
    WHERE date(join_date) = ?
  `).get(today).count;

  db.prepare(`
    INSERT OR REPLACE INTO daily_stats (date, total_messages, active_users, new_members)
    VALUES (?, ?, ?, ?)
  `).run(today, messages, activeUsers, newMembers);
};

const saveWeeklyWinner = (userId, username, points) => {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0];
  const weekEnd = new Date(now.setDate(now.getDate() + 6)).toISOString().split('T')[0];
  
  return db.prepare(`
    INSERT INTO weekly_winners (user_id, username, points, week_start, week_end)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, username, points, weekStart, weekEnd);
};

module.exports = {
  db,
  getUser,
  createUser,
  updatePoints,
  updateLastActive,
  updateStreak,
  resetStreak,
  incrementMessages,
  logMessage,
  getTopUsers,
  getTodayActiveUsers,
  getTodayMessages,
  getInactiveUsers,
  getDevMessages,
  getMostReactedMessages,
  getAllUsers,
  updateDailyStats,
  saveWeeklyWinner
};