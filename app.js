const STORAGE_KEY = 'hessabkon_state_v1';

const defaultState = {
  settings: {
    companyName: 'شرکت نمونه',
    currency: 'IRR',
    theme: 'light'
  },
  user: {
    username: 'admin',
    password: 'admin123'
  },
  categories: [
    { id: 'cat-sale', name: 'فروش', type: 'income' },
    { id: 'cat-service', name: 'خدمات', type: 'income' },
    { id: 'cat-invest', name: 'سرمایه‌گذاری', type: 'income' },
    { id: 'cat-rent', name: 'اجاره', type: 'expense' },
    { id: 'cat-salary', name: 'حقوق', type: 'expense' },
    { id: 'cat-purchase', name: 'خرید', type: 'expense' },
    { id: 'cat-utility', name: 'هزینه‌های عمومی', type: 'expense' }
  ],
  accounts: [
    { id: 'acc-cash', name: 'صندوق', type: 'asset', openingBalance: 0 },
    { id: 'acc-bank', name: 'بانک', type: 'asset', openingBalance: 50000000 },
    { id: 'acc-customers', name: 'بدهکاران', type: 'asset', openingBalance: 15000000 },
    { id: 'acc-suppliers', name: 'بستانکاران', type: 'liability', openingBalance: 0 },
    { id: 'acc-income', name: 'درآمد فروش', type: 'income', openingBalance: 0 },
    { id: 'acc-rent', name: 'هزینه اجاره', type: 'expense', openingBalance: 0 },
    { id: 'acc-salary', name: 'حقوق کارکنان', type: 'expense', openingBalance: 0 },
    { id: 'acc-purchase', name: 'خرید کالا', type: 'expense', openingBalance: 0 }
  ],
  transactions: [
    {
      id: generateId(),
      title: 'فروش خدمات',
      type: 'income',
      date: todayString(),
      accountId: 'acc-bank',
      categoryId: 'cat-service',
      amount: 15000000,
      description: 'پیش‌فاکتور خدمات طراحی وب',
      createdAt: Date.now()
    },
    {
      id: generateId(),
      title: 'اجاره دفتر',
      type: 'expense',
      date: dateOffset(-2),
      accountId: 'acc-bank',
      categoryId: 'cat-rent',
      amount: 8500000,
      description: 'پرداخت اجاره ماهانه',
      createdAt: Date.now() - 86400000
    }
  ]
};

let state = loadState();
let editingTransactionId = null;

function generateId() {
  return 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return JSON.parse(JSON.stringify(defaultState));
    }
    const saved = JSON.parse(raw);
    return {
      settings: { ...defaultState.settings, ...saved.settings },
      user: { ...defaultState.user, ...saved.user },
      categories: saved.categories && Array.isArray(saved.categories) && saved.categories.length ? saved.categories : defaultState.categories,
      accounts: saved.accounts && Array.isArray(saved.accounts) && saved.accounts.length ? saved.accounts : defaultState.accounts,
      transactions: saved.transactions && Array.isArray(saved.transactions) ? saved.transactions : defaultState.transactions
    };
  } catch (e) {
    console.error('خطا در بارگذاری:', e);
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatMoney(value) {
  const num = Number(value || 0);
  const curr = state.settings.currency || 'IRR';

  if (curr === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  }
  if (curr === 'EUR') {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
  }
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(num) + ' ریال';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function getCategoryName(id) {
  const cat = state.categories.find(c => c.id === id);
  return cat ? cat.name : '-';
}

function getAccountName(id) {
  const acc = state.accounts.find(a => a.id === id);
  return acc ? acc.name : '-';
}

function getAccountBalance(accountId) {
  const account = state.accounts.find(a => a.id === accountId);
  if (!account) return 0;

  let balance = Number(account.openingBalance || 0);
  state.transactions.forEach(tx => {
    if (tx.accountId === accountId) {
      balance += tx.type === 'income' ? Number(tx.amount || 0) : -Number(tx.amount || 0);
    }
  });
  return balance;
}

function getSummary() {
  let income = 0;
  let expense = 0;
  state.transactions.forEach(tx => {
    if (tx.type === 'income') income += Number(tx.amount || 0);
    else expense += Number(tx.amount || 0);
  });
  return { income, expense, balance: income - expense, count: state.transactions.length };
}

function applyTheme() {
  document.body.classList.toggle('dark', state.settings.theme === 'dark');
}

function renderSummary() {
  const sum = getSummary();
  document.getElementById('totalIncome').textContent = formatMoney(sum.income);
  document.getElementById('totalExpense').textContent = formatMoney(sum.expense);
  document.getElementById('totalBalance').textContent = formatMoney(sum.balance);
  document.getElementById('txCount').textContent = sum.count;
}

function renderRecentTransactions() {
  const recent = [...state.transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const rows = recent.map(tx => {
    const badgeClass = tx.type === 'income' ? 'income' : 'expense';
    const badgeText = tx.type === 'income' ? 'درآمد' : 'هزینه';
    return `
      <tr>
        <td>${tx.title}</td>
        <td>${getCategoryName(tx.categoryId)}</td>
        <td>${getAccountName(tx.accountId)}</td>
        <td>${formatMoney(tx.amount)}</td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>${formatDate(tx.date)}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('recentBody').innerHTML = rows || '<tr><td colspan="6" style="text-align:center;color:var(--muted);">هیچ تراکنشی نیست</td></tr>';
}

function renderTransactionTable() {
  const filterType = document.getElementById('filterType').value;
  const filterCategory = document.getElementById('filterCategory').value;
  const filterAccount = document.getElementById('filterAccount').value;

  let filtered = state.transactions.filter(tx => {
    if (filterType && tx.type !== filterType) return false;
    if (filterCategory && tx.categoryId !== filterCategory) return false;
    if (filterAccount && tx.accountId !== filterAccount) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const rows = filtered.map(tx => {
    const badgeClass = tx.type === 'income' ? 'income' : 'expense';
    const badgeText = tx.type === 'income' ? 'درآمد' : 'هزینه';
    return `
      <tr>
        <td>${tx.title}</td>
        <td>${getCategoryName(tx.categoryId)}</td>
        <td>${getAccountName(tx.accountId)}</td>
        <td>${formatMoney(tx.amount)}</td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>${formatDate(tx.date)}</td>
        <td>
          <div class="inline-actions">
            <button type="button" class="action-btn" data-edit-id="${tx.id}">ویرایش</button>
            <button type="button" class="action-btn delete" data-delete-id="${tx.id}">حذف</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('txBody').innerHTML = rows || '<tr><td colspan="7" style="text-align:center;color:var(--muted);">هیچ تراکنشی مطاب�� فیلتر وجود ندارد</td></tr>';

  document.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.dataset.deleteId;
      if (confirm('آیا می‌خواهید این تراکنش را حذف کنید؟')) {
        state.transactions = state.transactions.filter(tx => tx.id !== id);
        saveState();
        renderAll();
      }
    });
  });

  document.querySelectorAll('[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.dataset.editId;
      const tx = state.transactions.find(t => t.id === id);
      if (!tx) return;
      
      editingTransactionId = id;
      document.getElementById('txType').value = tx.type;
      document.getElementById('txDate').value = tx.date;
      document.getElementById('txTitle').value = tx.title;
      document.getElementById('txCategory').value = tx.categoryId;
      document.getElementById('txAccount').value = tx.accountId;
      document.getElementById('txAmount').value = tx.amount;
      document.getElementById('txDescription').value = tx.description || '';
      
      switchView('transactions');
      document.querySelector('.tab-btn[data-view="transactions"]').click();
    });
  });
}

function renderAccountsList() {
  const html = state.accounts.map(account => {
    const balance = getAccountBalance(account.id);
    let typeLabel = '';
    if (account.type === 'asset') typeLabel = 'دارایی';
    else if (account.type === 'liability') typeLabel = 'بدهی';
    else if (account.type === 'income') typeLabel = 'درآمد';
    else if (account.type === 'expense') typeLabel = 'هزینه';

    return `
      <div class="account-box">
        <div class="account-meta">
          <strong>${account.name}</strong>
          <small>${typeLabel}</small>
        </div>
        <div class="account-balance">${formatMoney(balance)}</div>
      </div>
    `;
  }).join('');

  document.getElementById('accountList').innerHTML = html || '<p style="text-align:center;color:var(--muted);">هیچ حسابی وجود ندارد</p>';
}

function renderCategoriesList() {
  const html = state.categories.map(cat => `
    <div class="category-box">
      <div>
        <strong>${cat.name}</strong>
      </div>
      <div class="badge ${cat.type === 'income' ? 'income' : 'expense'}">${cat.type === 'income' ? 'درآمد' : 'هزینه'}</div>
    </div>
  `).join('');

  document.getElementById('categoryList').innerHTML = html || '<p style="text-align:center;color:var(--muted);">هیچ دسته‌ای وجود ندارد</p>';
}

function renderProfitReport() {
  const sum = getSummary();
  const profit = sum.income - sum.expense;
  const profitClass = profit >= 0 ? 'income' : 'expense';

  const html = `
    <tr>
      <td><strong>درآمد کل</strong></td>
      <td class="income">${formatMoney(sum.income)}</td>
    </tr>
    <tr>
      <td><strong>هزینه کل</strong></td>
      <td class="expense">${formatMoney(sum.expense)}</td>
    </tr>
    <tr style="border-top: 2px solid var(--line);">
      <td><strong>سود/زیان خالص</strong></td>
      <td class="${profitClass}" style="font-weight:800;">${formatMoney(profit)}</td>
    </tr>
  `;

  document.querySelector('#profitTable tbody').innerHTML = html;
}

function renderBalanceReport() {
  const html = state.accounts.map(account => {
    const balance = getAccountBalance(account.id);
    let typeLabel = '';
    if (account.type === 'asset') typeLabel = 'دارایی';
    else if (account.type === 'liability') typeLabel = 'بدهی';
    else if (account.type === 'income') typeLabel = 'درآمد';
    else if (account.type === 'expense') typeLabel = 'هزینه';

    return `
      <tr>
        <td>${account.name}</td>
        <td>${typeLabel}</td>
        <td>${formatMoney(balance)}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('balanceBody').innerHTML = html;
}

function renderMonthlyChart() {
  const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const monthData = months.map((month, idx) => {
    const income = state.transactions
      .filter(tx => new Date(tx.date).getMonth() === idx && tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const expense = state.transactions
      .filter(tx => new Date(tx.date).getMonth() === idx && tx.type === 'expense')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    return { month, income, expense };
  });

  const maxVal = Math.max(...monthData.flatMap(m => [m.income, m.expense]), 1);

  const html = monthData.map(item => `
    <div class="chart-bar income" style="height:${(item.income / maxVal) * 120 + 20}px"><span>${item.month}</span></div>
    <div class="chart-bar expense" style="height:${(item.expense / maxVal) * 120 + 20}px"><span></span></div>
  `).join('');

  document.getElementById('monthlyChart').classList.add('chart-box');
  document.getElementById('monthlyChart').innerHTML = html;
}

function populateSelects() {
  const catOpts = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const accOpts = state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

  document.getElementById('txCategory').innerHTML = catOpts;
  document.getElementById('txAccount').innerHTML = accOpts;
  document.getElementById('filterCategory').innerHTML = '<option value="">همه</option>' + catOpts;
  document.getElementById('filterAccount').innerHTML = '<option value="">همه</option>' + accOpts;
}

function setDefaults() {
  document.getElementById('txDate').value = todayString();
  document.getElementById('companyName').value = state.settings.companyName;
  document.getElementById('currency').value = state.settings.currency;
  document.getElementById('companyDisplay').textContent = state.settings.companyName;
}

function switchView(name) {
  document.querySelectorAll('.view').forEach(el => {
    el.classList.toggle('on', el.id === name);
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.view === name);
  });
}

function renderAll() {
  applyTheme();
  populateSelects();
  renderSummary();
  renderRecentTransactions();
  renderTransactionTable();
  renderAccountsList();
  renderCategoriesList();
  renderProfitReport();
  renderBalanceReport();
  renderMonthlyChart();
  setDefaults();
  saveState();
}

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (user === state.user.username && pass === state.user.password) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    renderAll();
    switchView('overview');
  } else {
    document.getElementById('loginError').textContent = 'نام کاربری یا رمز عبور اشتباه است.';
    setTimeout(() => { document.getElementById('loginError').textContent = ''; }, 3000);
  }
}

function handleLogout() {
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginForm').reset();
  document.getElementById('username').focus();
  editingTransactionId = null;
}

function handleTransactionSubmit(e) {
  e.preventDefault();

  const tx = {
    id: editingTransactionId || generateId(),
    type: document.getElementById('txType').value,
    date: document.getElementById('txDate').value || todayString(),
    title: document.getElementById('txTitle').value.trim(),
    categoryId: document.getElementById('txCategory').value,
    accountId: document.getElementById('txAccount').value,
    amount: Number(document.getElementById('txAmount').value || 0),
    description: document.getElementById('txDescription').value.trim(),
    createdAt: editingTransactionId ? state.transactions.find(t => t.id === editingTransactionId)?.createdAt : Date.now()
  };

  if (!tx.title || tx.amount <= 0) {
    alert('لطفاً عنوان و مبلغ معتبر وارد کنید.');
    return;
  }

  if (editingTransactionId) {
    state.transactions = state.transactions.map(t => t.id === editingTransactionId ? tx : t);
  } else {
    state.transactions.push(tx);
  }

  editingTransactionId = null;
  document.getElementById('txForm').reset();
  document.getElementById('txDate').value = todayString();
  saveState();
  renderAll();
  alert(editingTransactionId ? 'تراکنش بروزرسانی شد.' : 'تراکنش ثبت شد.');
}

function handleAccountSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('accName').value.trim();
  const type = document.getElementById('accType').value;
  const balance = Number(document.getElementById('accBalance').value || 0);

  if (!name) {
    alert('نام حساب را وارد کنید.');
    return;
  }

  if (state.accounts.some(a => a.name.toLowerCase() === name.toLowerCase())) {
    alert('این حساب قبلاً وجود دارد.');
    return;
  }

  state.accounts.push({
    id: generateId(),
    name,
    type,
    openingBalance: balance
  });

  document.getElementById('accountForm').reset();
  saveState();
  renderAll();
  alert('حساب اضافه شد.');
}

function handleCategorySubmit(e) {
  e.preventDefault();
  const name = document.getElementById('catName').value.trim();
  const type = document.getElementById('catType').value;

  if (!name) {
    alert('نام دسته را وارد کنید.');
    return;
  }

  if (state.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert('این دسته قبلاً وجود دارد.');
    return;
  }

  state.categories.push({
    id: generateId(),
    name,
    type
  });

  document.getElementById('categoryForm').reset();
  saveState();
  renderAll();
  alert('دسته اضافه شد.');
}

function handleSettingsSubmit(e) {
  e.preventDefault();
  state.settings.companyName = document.getElementById('companyName').value.trim() || 'شرکت نمونه';
  state.settings.currency = document.getElementById('currency').value;
  saveState();
  document.getElementById('companyDisplay').textContent = state.settings.companyName;
  renderAll();
  alert('تنظیمات ذخیره شد.');
}

function bindEvents() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('txForm').addEventListener('submit', handleTransactionSubmit);
  document.getElementById('accountForm').addEventListener('submit', handleAccountSubmit);
  document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);
  document.getElementById('settingsForm').addEventListener('submit', handleSettingsSubmit);

  document.getElementById('filterType').addEventListener('change', renderTransactionTable);
  document.getElementById('filterCategory').addEventListener('change', renderTransactionTable);
  document.getElementById('filterAccount').addEventListener('change', renderTransactionTable);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      switchView(this.dataset.view);
    });
  });

  document.getElementById('txType').value = 'income';
}

function setLogos() {
  const svg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g"><stop offset="0%" stop-color="#1e3a8a"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(#g)"/><text x="60" y="76" font-size="62" text-anchor="middle" fill="white" font-family="Tahoma" font-weight="700">ح</text></svg>`)}`;
  document.querySelectorAll('.lg, .logo-large').forEach(img => { img.src = svg; });
}

function init() {
  setLogos();
  bindEvents();
  renderAll();
  setDefaults();
  applyTheme();
}

init();
