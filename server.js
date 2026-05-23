const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Added MYSQLPORT so Railway can find the database
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'budgetwise_db',
    port: process.env.MYSQL_PORT || 3306 
});

db.connect((err) => {
    if (err) throw err;
    console.log('✅ Connected to MySQL Database!');
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (results.length > 0) return res.status(400).json({ message: 'Username already exists!' });
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertQuery = "INSERT INTO users (username, password, budget_data, expense_data) VALUES (?, ?, '{}', '{}')";
            db.query(insertQuery, [username, hashedPassword], (err) => {
                if (err) return res.status(500).json({ message: 'Database error' });
                res.status(200).json({ message: 'Account created successfully!' });
            });
        } catch (error) { res.status(500).json({ message: 'Server error' }); }
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (results.length > 0) {
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const parsedBudgets = typeof user.budget_data === 'string' ? JSON.parse(user.budget_data) : user.budget_data;
                const parsedExpenses = typeof user.expense_data === 'string' ? JSON.parse(user.expense_data) : user.expense_data;
                res.status(200).json({ username: user.username, budget_data: parsedBudgets || {}, expense_data: parsedExpenses || {} });
            } else res.status(401).json({ message: 'Invalid credentials.' });
        } else res.status(401).json({ message: 'Invalid credentials.' });
    });
});

app.post('/api/sync', (req, res) => {
    const { username, budget_data, expense_data } = req.body;
    const safeBudgets = budget_data || {};
    const safeExpenses = expense_data || {};
    const updateQuery = "UPDATE users SET budget_data = ?, expense_data = ? WHERE username = ?";
    db.query(updateQuery, [JSON.stringify(safeBudgets), JSON.stringify(safeExpenses), username], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to save data' });
        res.status(200).json({ message: 'Data synced successfully!' });
    });
});

// Added process.env.PORT and '0.0.0.0' so Railway can open the site to the internet
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server is actively listening on port ${PORT}`);
});
