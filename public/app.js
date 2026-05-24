let currentUser = '';
let budgetsDB = {}; 
let dailyExpensesDB = {};

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

async function syncData() {
    console.log("📡 Attempting to send data to server...");
    try {
        const payload = {
            username: currentUser,
            budget_data: budgetsDB[currentUser] || {},
            expense_data: dailyExpensesDB[currentUser] || {}
        };
        console.log("📦 Payload prepared:", payload);

        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log("✅ Server acknowledged save request!");
        } else {
            console.error("❌ Server rejected save request:", await response.text());
        }
    } catch (error) {
        console.error("❌ Fetch failed entirely:", error);
    }
}

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = document.getElementById('regUsername').value.trim();
    const pass = document.getElementById('regPassword').value;
    const confirmPass = document.getElementById('regConfirmPassword').value;
    const errorBox = document.getElementById('passwordError');
    
    // Reset error box on new submission attempt
    errorBox.style.display = 'none';
    errorBox.innerHTML = '';

    // 1. Industry Standard Password Security Checks (Regex)
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    // 2. Build the error message if the password is too weak
    if (!minLength || !hasUpper || !hasLower || !hasNum || !hasSpec) {
        errorBox.style.display = 'block';
        errorBox.innerHTML = `
            <strong>Password is too weak. It must contain:</strong>
            <ul style="margin-top: 5px; padding-left: 20px;">
                <li style="color: ${minLength ? '#2ecc71' : '#ff4757'}">At least 8 characters</li>
                <li style="color: ${hasUpper ? '#2ecc71' : '#ff4757'}">1 Uppercase letter</li>
                <li style="color: ${hasLower ? '#2ecc71' : '#ff4757'}">1 Lowercase letter</li>
                <li style="color: ${hasNum ? '#2ecc71' : '#ff4757'}">1 Number</li>
                <li style="color: ${hasSpec ? '#2ecc71' : '#ff4757'}">1 Special character</li>
            </ul>
        `;
        return; // Stop the registration process
    }

    // 3. Check if passwords match
    if (pass !== confirmPass) {
        errorBox.style.display = 'block';
        errorBox.innerHTML = '<strong>❌ Passwords do not match!</strong>';
        return; // Stop the registration process
    }

    // 4. If all checks pass, proceed with sending data to the server
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await response.json();
        
        if (response.ok) {
            alert("Account created! You can now log in.");
            document.getElementById('registerForm').reset(); // Clear the form
            showScreen('loginScreen');
        } else {
            errorBox.style.display = 'block';
            errorBox.innerHTML = `<strong>❌ ${data.message}</strong>`;
        }
    } catch (error) { 
        alert("Server error. Please try again later."); 
    }
});

// --- RESTORED LOGIN LOGIC ---
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // This stops the page from instantly refreshing!
    
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Load the user's saved data from the database into the app's memory
            budgetsDB[user] = data.budget_data || {};
            dailyExpensesDB[user] = data.expense_data || {};
            
            // Trigger the dashboard transition
            document.getElementById('loginForm').reset(); // Clear the form
            loginSuccess(user); 
        } else {
            alert(data.message || 'Invalid credentials.');
        }
    } catch (error) { 
        alert("Server error. Please check your connection."); 
    }
});

function loginSuccess(username) {
    currentUser = username;
    sessionStorage.setItem('loggedIn', 'true');
    sessionStorage.setItem('username', username);
    document.getElementById('userGreeting').textContent = `Welcome, ${username}!`;
    document.getElementById('welcomeMessage').textContent = `Ready to manage your budget? ✨`;
    showScreen('dashboardScreen');
}

function showRegister(event) {
    event.preventDefault();
    showScreen('registerScreen');
}

function logout() {
    sessionStorage.clear();
    location.reload(); 
}

document.addEventListener('DOMContentLoaded', () => { createParticles(); });

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    container.innerHTML = '';
    const numberOfParticles = window.innerWidth < 768 ? 25 : 40;
    
    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 6 + 2;
        const speed = Math.random() * 3 + 4;
        const delay = Math.random() * 5;
        
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = speed + 's';
        particle.style.animationDelay = delay + 's';
        particle.style.opacity = Math.random() * 0.6 + 0.4;
        
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.boxShadow = `0 0 10px ${particle.style.background}20`;
        container.appendChild(particle);
    }
}
window.addEventListener('resize', createParticles);

function budgetMoney() { showScreen('budgetingScreen'); }

function addNewCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const name = nameInput.value.trim();
    if (name === "") return alert("Please enter a category name.");

    const container = document.getElementById('categoryList');
    const div = document.createElement('div');
    div.className = 'input-group';
    div.innerHTML = `
        <i class="fas fa-tag icon"></i>
        <input type="number" class="category-input" data-name="${name}" placeholder="${name}" oninput="calculateRemaining()">
    `;
    container.appendChild(div);
    nameInput.value = ""; 
}

function calculateRemaining() {
    const totalMoney = parseFloat(document.getElementById('totalMonthlyMoney').value) || 0;
    let totalExpenses = 0;
    document.querySelectorAll('.category-input').forEach(input => totalExpenses += (parseFloat(input.value) || 0));

    const remaining = totalMoney - totalExpenses;
    const display = document.getElementById('remainingDisplay');
    display.textContent = `₱${remaining.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

    if (remaining < 0) {
        display.classList.add('negative-balance');
        display.classList.remove('positive-balance');
    } else {
        display.classList.add('positive-balance');
        display.classList.remove('negative-balance');
    }
}

async function saveBudget() {
    const totalMoney = parseFloat(document.getElementById('totalMonthlyMoney').value) || 0;
    if (totalMoney <= 0) return alert("Please enter your Total Monthly Money first.");

    let categories = {};
    document.querySelectorAll('.category-input').forEach(input => {
        const name = input.getAttribute('data-name');
        const limit = parseFloat(input.value) || 0;
        if (limit > 0) categories[name] = limit;
    });

    if (!budgetsDB[currentUser]) budgetsDB[currentUser] = {};
    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    budgetsDB[currentUser][monthKey] = { total: totalMoney, categories: categories };
    
    console.log("🛑 SAVE BUTTON CLICKED!");
    await syncData();
    alert("Budget saved successfully to Database! Your limits are now active.");
}

let selectedDateStr = '';

function openCalendar() {
    showScreen('calendarScreen');
    renderCalendar();
    populateCategoryDropdown();
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    document.getElementById('currentMonthDisplay').textContent = `${monthNames[month]} ${year}`;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = `${year}-${String(month+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = i;
        
        if (dailyExpensesDB[currentUser] && dailyExpensesDB[currentUser][dayStr] && dailyExpensesDB[currentUser][dayStr].length > 0) {
            dayEl.style.borderBottom = "3px solid #2ecc71";
        }
        dayEl.onclick = () => selectDate(dayStr, dayEl);
        grid.appendChild(dayEl);
    }
}

function selectDate(dateStr, element) {
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active-day'));
    element.classList.add('active-day');
    selectedDateStr = dateStr;
    document.getElementById('dailyExpenseSection').style.display = 'block';
    
    const dateObj = new Date(dateStr);
    document.getElementById('selectedDateDisplay').textContent = dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    renderDailyExpenses();
}

function renderDailyExpenses() {
    const list = document.getElementById('dailyExpenseList');
    list.innerHTML = '';
    let total = 0;
    
    const expenses = (dailyExpensesDB[currentUser] || {})[selectedDateStr] || [];
    
    expenses.forEach((exp, index) => {
        total += exp.cost;
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.innerHTML = `
            <div style="display: flex; flex-direction: column;">
                <strong>${exp.name}</strong>
                <span style="font-size: 0.75rem; color: #a29bfe;">${exp.category || 'General'}</span>
            </div>
            <span>₱${exp.cost.toLocaleString(undefined, {minimumFractionDigits: 2})} 
                <i class="fas fa-trash delete-btn" style="margin-left: 10px;" onclick="deleteExpense(${index})"></i>
            </span>
        `;
        list.appendChild(div);
    });
    
    document.getElementById('dailyTotalDisplay').textContent = total.toLocaleString(undefined, {minimumFractionDigits: 2});
    updateCategoryRemaining();
}

async function addDailyExpense() {
    const category = document.getElementById('dailyExpenseCategory').value;
    const nameInput = document.getElementById('dailyItemName');
    const costInput = document.getElementById('dailyItemCost');
    
    const name = nameInput.value.trim() || category;
    const cost = parseFloat(costInput.value);
    
    if (!category || isNaN(cost) || cost <= 0) return alert("Please fill out category and valid cost.");

    const dateObj = new Date(selectedDateStr);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const limit = budgetsDB[currentUser][monthKey].categories[category];
    const alreadySpent = getCategoryTotalSpent(category, monthKey);
    
    if (alreadySpent + cost > limit) return alert(`❌ Exceeds limit!`);

    if (!dailyExpensesDB[currentUser]) dailyExpensesDB[currentUser] = {};
    if (!dailyExpensesDB[currentUser][selectedDateStr]) dailyExpensesDB[currentUser][selectedDateStr] = [];
    
    dailyExpensesDB[currentUser][selectedDateStr].push({ category, name, cost });
    
    await syncData();
    nameInput.value = ''; costInput.value = '';
    renderDailyExpenses();
    renderCalendar();
}

async function deleteExpense(index) {
    dailyExpensesDB[currentUser][selectedDateStr].splice(index, 1);
    await syncData();
    renderDailyExpenses();
    renderCalendar();
}

function populateCategoryDropdown() {
    const dropdown = document.getElementById('dailyExpenseCategory');
    dropdown.innerHTML = '<option value="">Select Category</option>';
    
    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    if (budgetsDB[currentUser] && budgetsDB[currentUser][monthKey]) {
        const categories = budgetsDB[currentUser][monthKey].categories;
        for (const cat in categories) {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = `${cat} (Limit: ₱${categories[cat]})`;
            dropdown.appendChild(opt);
        }
    } else {
        dropdown.innerHTML = '<option value="">Go back to Budget Your Money and save first</option>';
    }
}   

function getCategoryTotalSpent(category, monthKey) {
    let total = 0;
    if (!dailyExpensesDB[currentUser]) return 0;
    for (const date in dailyExpensesDB[currentUser]) {
        if (date.startsWith(monthKey)) {
            dailyExpensesDB[currentUser][date].forEach(exp => {
                if (exp.category === category) total += exp.cost;
            });
        }
    }
    return total;
}

function updateCategoryRemaining() {
    const category = document.getElementById('dailyExpenseCategory').value;
    const display = document.getElementById('categoryRemainingText');
    if (!category) return display.textContent = '';
    
    const today = new Date(selectedDateStr || new Date());
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const limit = budgetsDB[currentUser][monthKey].categories[category];
    const spent = getCategoryTotalSpent(category, monthKey);
    const left = limit - spent;
    
    display.textContent = `Remaining: ₱${left.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    display.style.color = left < 0 ? '#ff4757' : '#2ecc71';
}

// --- DISCLAIMER MODAL LOGIC ---

function openDisclaimer() {
    // Changes the display from 'none' to 'flex' so it appears and centers
    document.getElementById('disclaimerModal').style.display = 'flex';
}

function closeDisclaimer() {
    // Hides the modal again
    document.getElementById('disclaimerModal').style.display = 'none';
}

// --- CREDITS MODAL LOGIC ---
function openCredits() {
    document.getElementById('creditsModal').style.display = 'flex';
}

function closeCredits() {
    document.getElementById('creditsModal').style.display = 'none';
}
