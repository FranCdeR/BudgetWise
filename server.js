const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'budgetwise_db'
});

db.connect((err) => {
    if (err) throw err;
    console.log('✅ Connected to MySQL Database!');
});

app.post('/api/register', async (req, res) => {
    console.log(`\n📝 Registration attempt for: ${req.body.username}`);
    const { username, password } = req.body;
    
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (results.length > 0) return res.status(400).json({ message: 'Username already exists!' });
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertQuery = "INSERT INTO users (username, password, budget_data, expense_data) VALUES (?, ?, '{}', '{}')";
            db.query(insertQuery, [username, hashedPassword], (err) => {
                if (err) return res.status(500).json({ message: 'Database error' });
                console.log(`✅ User ${username} registered successfully!`);
                res.status(200).json({ message: 'Account created successfully!' });
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error during registration' });
        }
    });
});

app.post('/api/login', (req, res) => {
    console.log(`\n🔐 Login attempt for: ${req.body.username}`);
    const { username, password } = req.body;
    
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (results.length > 0) {
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (isMatch) {
                const parsedBudgets = typeof user.budget_data === 'string' ? JSON.parse(user.budget_data) : user.budget_data;
                const parsedExpenses = typeof user.expense_data === 'string' ? JSON.parse(user.expense_data) : user.expense_data;
                
                console.log(`✅ Login successful! Sending this data back to browser:`, { budgets: parsedBudgets });
                
                res.status(200).json({ 
                    username: user.username,
                    budget_data: parsedBudgets || {},
                    expense_data: parsedExpenses || {}
                });
            } else {
                res.status(401).json({ message: 'Invalid username or password.' });
            }
        } else {
            res.status(401).json({ message: 'Invalid username or password.' });
        }
    });
});

app.post('/api/sync', (req, res) => {
    console.log(`\n💾 SYNC REQUEST RECEIVED from ${req.body.username}`);
    console.log(`Payload Data:`, JSON.stringify(req.body.budget_data));
    
    const { username, budget_data, expense_data } = req.body;
    const safeBudgets = budget_data || {};
    const safeExpenses = expense_data || {};
    
    const updateQuery = "UPDATE users SET budget_data = ?, expense_data = ? WHERE username = ?";
    db.query(updateQuery, [JSON.stringify(safeBudgets), JSON.stringify(safeExpenses), username], (err, results) => {
        if (err) {
            console.error("❌ DB ERROR:", err);
            return res.status(500).json({ message: 'Failed to save data' });
        }
        
        if (results.affectedRows === 0) {
            console.log("⚠️ WARNING: DB query ran, but no user was found to update!");
        } else {
            console.log("✅ DB SUCCESS: Data saved to MySQL.");
        }
        
        res.status(200).json({ message: 'Data synced successfully!' });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server is actively listening on http://localhost:${PORT}`);
});