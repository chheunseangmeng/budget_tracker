// --- Service Worker ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}

// --- LocalStorage Keys ---
const USERS_KEY = 'budget_users';
const STORAGE_KEY = 'budget_entries';
const CATEGORY_KEY = 'budget_categories';
const USER_KEY = 'budget_user';

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const emailInput = document.getElementById('email');
const facebookBtn = document.getElementById('facebookBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const headerTitle = document.getElementById('headerTitle');

// Facebook display username input
let fbUsernameInput = document.getElementById('fbUsernameInput');
if (!fbUsernameInput) {
    fbUsernameInput = document.createElement('input');
    fbUsernameInput.id = "fbUsernameInput";
    fbUsernameInput.placeholder = "Enter your name for tracker app";
    fbUsernameInput.className = "w-full p-2 border rounded hidden";
    fbUsernameInput.type = "text";
    authSection.insertBefore(fbUsernameInput, loginBtn);
}

// Logout modal
const logoutModal = document.getElementById("logoutModal");
const confirmLogout = document.getElementById("confirmLogout");
const cancelLogout = document.getElementById("cancelLogout");

const toggleCategoryBtn = document.getElementById('toggleCategoryBtn');
const categoryCard = document.getElementById('categoryCard');
const newCategoryInput = document.getElementById('newCategory');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const closeCategoryBtn = document.getElementById('closeCategoryBtn');
const categoriesList = document.getElementById('categoriesList');
const categorySelect = document.getElementById('categorySelect');

const typeInput = document.getElementById('type');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const noteInput = document.getElementById('note');
const addEntryBtn = document.getElementById('addEntryBtn');

const filterRange = document.getElementById('filterRange');
const refreshBtn = document.getElementById('refreshBtn');
const entriesTable = document.getElementById('entriesTable');
const entriesCards = document.getElementById('entriesCards');

const incomeCard = document.getElementById('incomeCard');
const expenseCard = document.getElementById('expenseCard');
const balanceCard = document.getElementById('balanceCard');

let summaryChart;
let editingId = null;
let fbLoginActive = false;

// --- Utility Functions ---
function showLoginError(msg){
    const loginError = document.getElementById('loginError');
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
}
function hideLoginError(){
    const loginError = document.getElementById('loginError');
    loginError.textContent = '';
    loginError.classList.add('hidden');
}

// --- Facebook Button Click ---
facebookBtn.addEventListener('click', () => {
    fbLoginActive = true;
    emailInput.classList.add('hidden');
    facebookBtn.classList.add('hidden');

    usernameInput.placeholder = "Phone Number";
    usernameInput.type = "tel";
    loginBtn.textContent = "Login with Facebook";

    fbUsernameInput.classList.remove('hidden');
});
// --- Login / Sign Up ---
loginBtn.addEventListener('click', () => {
    hideLoginError();

    let email, username, password;
    password = passwordInput.value.trim();

    if (fbLoginActive) {
        username = usernameInput.value.trim();
        let fbDisplayName = fbUsernameInput.value.trim();

        if (!username || !password || !fbDisplayName) return showLoginError("Fill phone, password, and username");

        email = `${username}@facebook.fake`;

        let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        let user = users.find(u => u.email === email);

        if (!user) {
            users.push({ email, username: fbDisplayName, password });
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        } else if (user.password !== password) return showLoginError("Incorrect password");

    } else {
        username = usernameInput.value.trim();
        email = emailInput.value.trim().toLowerCase();
        if (!username || !email || !password) return showLoginError("Fill all fields");

        let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        let user = users.find(u => u.email === email);
        if (!user) {
            users.push({ email, username, password });
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        } else if (user.password !== password) return showLoginError("Incorrect password");
    }

    localStorage.setItem(USER_KEY, email);
    showDashboard();
});

// --- Logout Button (Show Confirmation) ---
logoutBtn.addEventListener('click', () => {
    logoutModal.classList.remove('hidden');
    setTimeout(()=>{ 
        document.getElementById('logoutCard').classList.remove('scale-90','opacity-0'); 
    },10);
});

// Confirm logout
confirmLogout.addEventListener('click', ()=>{
    logoutModal.classList.add('hidden');
    localStorage.removeItem(USER_KEY);

    authSection.classList.remove('hidden');
    dashboard.classList.add('hidden');
    logoutBtn.classList.add('hidden');

    fbLoginActive = false;
    usernameInput.placeholder = "Username";
    usernameInput.type = "text";
    emailInput.classList.remove('hidden');
    facebookBtn.classList.remove('hidden');
    fbUsernameInput.classList.add('hidden');
    fbUsernameInput.value = '';
    loginBtn.textContent = "Login / Sign Up";

    headerTitle.textContent = "Budget Tracker";
});

// Cancel logout
cancelLogout.addEventListener('click', ()=>{
    logoutModal.classList.add('hidden');
});

// --- Show Dashboard ---
function showDashboard(){
    authSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');

    const email = localStorage.getItem(USER_KEY);
    const users = JSON.parse(localStorage.getItem(USERS_KEY)||'[]');
    const user = users.find(u => u.email===email);
    headerTitle.textContent = user ? user.username : 'User';

    renderCategories();
    renderEntries();
    renderSummaryChart();
}

// Show category card with animation
toggleCategoryBtn.addEventListener('click', () => {
    categoryCard.classList.remove('hidden', 'scale-95', 'opacity-0');
});

// Close category card with animation
closeCategoryBtn.addEventListener('click', () => {
    categoryCard.classList.add('scale-95', 'opacity-0');
    // Wait for transition to finish, then hide
    setTimeout(() => categoryCard.classList.add('hidden'), 200);
});


// --- Add Category ---
addCategoryBtn.addEventListener('click', ()=>{
    const email = localStorage.getItem(USER_KEY);
    const cat = newCategoryInput.value.trim();
    if(!cat) return;

    let allCats = JSON.parse(localStorage.getItem(CATEGORY_KEY)||'{}');
    if(!allCats[email]) allCats[email]=[];
    if(!allCats[email].includes(cat)) allCats[email].push(cat);

    localStorage.setItem(CATEGORY_KEY, JSON.stringify(allCats));
    newCategoryInput.value='';
    renderCategories();
});

// --- Render Categories ---
function renderCategories(){
    const email = localStorage.getItem(USER_KEY);
    const allCats = JSON.parse(localStorage.getItem(CATEGORY_KEY)||'{}');
    const categories = allCats[email]||[];

    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(cat=>{
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    categoriesList.innerHTML='';
    categories.forEach(cat=>{
        const span = document.createElement('span');
        span.textContent = cat;
        span.className='bg-green-100 text-green-800 px-2 py-1 rounded';
        categoriesList.appendChild(span);
    });
}

// --- Add / Edit Entry ---
addEntryBtn.addEventListener('click', ()=>{
    const email = localStorage.getItem(USER_KEY);
    const entry = {
        id: editingId||Date.now(),
        email,
        type: typeInput.value,
        category: categorySelect.value,
        amount: parseFloat(amountInput.value),
        date: dateInput.value,
        note: noteInput.value.trim()
    };
    if(!entry.type || !entry.category || !entry.amount || !entry.date) return alert('Fill all fields');

    let entries = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
    if(editingId){
        entries = entries.map(e=>e.id===editingId?entry:e);
        editingId=null;
        addEntryBtn.textContent='Add Entry';
    } else entries.push(entry);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    typeInput.value=''; categorySelect.value=''; amountInput.value=''; dateInput.value=''; noteInput.value='';
    renderEntries(); renderSummaryChart();
});

// --- Filter Logic ---
function getFilteredEntries(){
    const email = localStorage.getItem(USER_KEY);
    const allEntries = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]').filter(e=>e.email===email);
    const filter = filterRange.value;
    const now = new Date();

    return allEntries.filter(e=>{
        const d = new Date(e.date);
        switch(filter){
            case 'thisWeek':{
                const start = new Date(now); start.setDate(now.getDate()-now.getDay());
                return d>=start && d<=now;
            }
            case 'lastWeek':{
                const start = new Date(now); start.setDate(now.getDate()-now.getDay()-7);
                const end = new Date(now); end.setDate(now.getDate()-now.getDay()-1);
                return d>=start && d<=end;
            }
            case 'thisMonth':
                return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
            case 'lastMonth':{
                const m = now.getMonth()-1;
                const y = m<0?now.getFullYear()-1:now.getFullYear();
                const month = m<0?11:m;
                return d.getMonth()===month && d.getFullYear()===y;
            }
            case 'thisYear':
                return d.getFullYear()===now.getFullYear();
            case 'lastYear':
                return d.getFullYear()===now.getFullYear()-1;
            default: return true;
        }
    });
}

// --- Render Entries ---
function renderEntries(){
    const entries = getFilteredEntries();
    entriesTable.innerHTML='';
    entriesCards.innerHTML='';

    entries.forEach(entry=>{
        // Desktop Table Row
        const tr=document.createElement('tr');
        tr.className='transition duration-300 hover:bg-gray-100';
        tr.innerHTML=`
            <td class="border px-2 py-1">${entry.type}</td>
            <td class="border px-2 py-1">${entry.category}</td>
            <td class="border px-2 py-1">$${entry.amount.toFixed(2)}</td>
            <td class="border px-2 py-1">${entry.date}</td>
            <td class="border px-2 py-1">${entry.note}</td>
            <td class="border px-2 py-1">
                <button data-id="${entry.id}" class="text-blue-500 mr-2"><i class="fa-solid fa-pen-to-square"></i></button>
                <button data-id="${entry.id}" class="text-red-500"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        entriesTable.appendChild(tr);

        // Edit
        tr.querySelector('.text-blue-500').addEventListener('click', ()=>{
            editingId=entry.id;
            typeInput.value=entry.type;
            categorySelect.value=entry.category;
            amountInput.value=entry.amount;
            dateInput.value=entry.date;
            noteInput.value=entry.note;
            addEntryBtn.textContent='Update Entry';
        });

        // Delete
        tr.querySelector('.text-red-500').addEventListener('click', ()=>{
            let allEntries = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
            allEntries=allEntries.filter(e=>e.id!==entry.id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allEntries));
            renderEntries(); renderSummaryChart();
        });

        // Mobile Card
        const card = document.createElement('div');
        card.className='bg-white p-4 rounded shadow flex flex-col sm:hidden';
        card.innerHTML=`
            <div class="flex justify-between items-center border-b pb-2 mb-2">
                <h4 class="font-semibold">${entry.type}</h4>
                <div class="flex gap-2">
                    <button class="text-blue-500"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="text-red-500"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-2">
                <span class="font-semibold text-gray-500">Category:</span><span>${entry.category}</span>
                <span class="font-semibold text-gray-500">Amount:</span><span>$${entry.amount.toFixed(2)}</span>
                <span class="font-semibold text-gray-500">Date:</span><span>${entry.date}</span>
                <span class="font-semibold text-gray-500">Note:</span><span>${entry.note}</span>
            </div>
        `;
        entriesCards.appendChild(card);

        // Mobile Edit/Delete
        card.querySelector('.text-blue-500').addEventListener('click', ()=>{
            editingId=entry.id;
            typeInput.value=entry.type;
            categorySelect.value=entry.category;
            amountInput.value=entry.amount;
            dateInput.value=entry.date;
            noteInput.value=entry.note;
            addEntryBtn.textContent='Update Entry';
        });
        card.querySelector('.text-red-500').addEventListener('click', ()=>{
            let allEntries = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
            allEntries=allEntries.filter(e=>e.id!==entry.id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allEntries));
            renderEntries(); renderSummaryChart();
        });
    });
}

// --- Render Summary Chart ---
function renderSummaryChart(){
    const entries = getFilteredEntries();
    const totalIncome = entries.filter(e=>e.type==='income').reduce((a,b)=>a+b.amount,0);
    const totalExpense = entries.filter(e=>e.type==='expense').reduce((a,b)=>a+b.amount,0);
    const balance = totalIncome-totalExpense;

    incomeCard.textContent=`$${totalIncome.toFixed(2)}`;
    expenseCard.textContent=`$${totalExpense.toFixed(2)}`;
    balanceCard.textContent=`$${balance.toFixed(2)}`;

    const ctx = document.getElementById('summaryChart').getContext('2d');
    if(summaryChart) summaryChart.destroy();

    summaryChart = new Chart(ctx,{
        type:'polarArea',
        data:{
            labels:['Income','Expense','Balance'],
            datasets:[{
                data:[totalIncome,totalExpense,balance],
                backgroundColor:['rgba(34,197,94,0.7)','rgba(239,68,68,0.7)','rgba(59,130,246,0.7)'],
                borderColor:['rgba(34,197,94,1)','rgba(239,68,68,1)','rgba(59,130,246,1)'],
                borderWidth:1
            }]
        },
        options:{
            responsive:true,
            plugins:{
                legend:{position:'bottom',labels:{font:{size:14}}},
                tooltip:{callbacks:{label:ctx=>`$${ctx.raw.toFixed(2)}`}}
            },
            animation:{animateRotate:true,animateScale:true}
        }
    });
}

// --- Filter / Refresh ---
refreshBtn.addEventListener('click', ()=>{renderEntries(); renderSummaryChart();});

// --- Auto-login ---
if(localStorage.getItem(USER_KEY)) showDashboard();
