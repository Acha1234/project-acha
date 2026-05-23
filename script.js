// =============================================
// IMPORT FIREBASE
// =============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// =============================================
// KONFIGURASI FIREBASE — isi databaseURL kamu
// =============================================
const firebaseConfig = {
    apiKey: "AIzaSyAGiaQfeWAYUB6qP9W3Mb2Tt8SXVB4kgg4",
    authDomain: "sistem-inventaris-barang-222ba.firebaseapp.com",
    projectId: "sistem-inventaris-barang-222ba",
    storageBucket: "sistem-inventaris-barang-222ba.firebasestorage.app",
    messagingSenderId: "904109610019",
    appId: "1:904109610019:web:1ba0bee3037f0f422b8d96",
    databaseURL: "https://sistem-inventaris-barang-222ba-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =============================================
// DATA AWAL (hanya dipakai jika Firebase kosong)
// =============================================
let items = [
    { name: "CPU COOLER", stock: 100, price: 150000 },
    { name: "Casing PC", stock: 100, price: 400000 },
    { name: "Flashdisk", stock: 100, price: 60000 },
    { name: "Harddisk", stock: 100, price: 323000 },
    { name: "Headphone", stock: 100, price: 200000 },
    { name: "Keyboard", stock: 100, price: 179000 },
    { name: "Microphone", stock: 100, price: 189000 },
    { name: "Monitor", stock: 100, price: 660000 },
    { name: "Motherboard", stock: 100, price: 1600000 },
    { name: "Mouse", stock: 100, price: 83000 },
    { name: "MIC", stock: 100, price: 130000 },
    { name: "Power Supply / PSU", stock: 100, price: 350000 },
    { name: "Printer", stock: 100, price: 2250000 },
    { name: "Processor / CPU", stock: 100, price: 480000 },
    { name: "RAM", stock: 100, price: 800000 },
    { name: "Speaker", stock: 100, price: 198000 },
    { name: "SSD", stock: 100, price: 1100000 },
    { name: "VGA", stock: 100, price: 480000 },
    { name: "Webcam", stock: 100, price: 140000 },
    { name: "Wireless Router", stock: 100, price: 165000 }
];

items.sort((a, b) => a.name.localeCompare(b.name));

let financeData = [];
let currentBalance = 0;
let buyerQueue = [];
let currentBuyer = null;
let buyerInputs = {};

// =============================================
// SIMPAN KE FIREBASE (menggantikan localStorage)
// =============================================
function saveAllData() {
    set(ref(db, "inventaris"), {
        items: items,
        financeData: financeData,
        currentBalance: currentBalance,
        buyerQueue: buyerQueue,
        currentBuyer: currentBuyer
    }).catch(err => console.error("Gagal simpan:", err));
}

// =============================================
// LOAD REALTIME DARI FIREBASE
// onValue() = otomatis update ke SEMUA pengguna
// setiap ada perubahan data di database
// =============================================
onValue(ref(db, "inventaris"), (snapshot) => {
    const data = snapshot.val();

    if (data) {
        // Jika data sudah ada di Firebase, pakai itu
        if (data.items)        items        = data.items;
        if (data.financeData)  financeData  = data.financeData;
        if (data.currentBalance !== undefined) currentBalance = data.currentBalance;
        if (data.buyerQueue)   buyerQueue   = data.buyerQueue;
        if (data.currentBuyer) currentBuyer = data.currentBuyer;
    } else {
        // Jika Firebase masih kosong, upload data awal
        saveAllData();
    }

    // Refresh semua tampilan setelah data masuk
    renderSellerItems();
    renderBuyerItems();
    renderFinanceTable();
    renderQueue();
});

// =============================================
// FORMAT RUPIAH
// =============================================
function formatRupiah(number) {
    return "Rp " + number.toLocaleString('id-ID');
}

// =============================================
// GANTI HALAMAN
// =============================================
window.goToPage = function(pageId) {
    const loader = document.getElementById("loader");

    loader.style.display = "flex";

    setTimeout(() => {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        document.getElementById(pageId).classList.add('active');

        loader.style.display = "none";
    }, 500);
}

// =============================================
// PASSWORD PENJUAL
// =============================================
function checkPassword() {
    let password = document.getElementById('sellerPassword').value;
    if (password === "KELOMPOK1") {
        alert("Selamat Datang KELOMPOK 1");
        goToPage('sellerDashboardPage');
    } else {
        alert("Password Salah!");
    }
}
window.checkPassword = checkPassword;

// =============================================
// RENDER DATA BARANG PENJUAL
// =============================================
function renderSellerItems() {
    let container = document.getElementById('sellerItemList');
    if (!container) return;
    let keyword = document.getElementById('searchSeller')?.value.toLowerCase() || "";
    container.innerHTML = "";
    let filtered = items.filter(item => item.name.toLowerCase().includes(keyword));
    filtered.forEach((item, index) => {
        let realIndex = items.indexOf(item);
        container.innerHTML += `
            <div class="table-row">
                <span>${index + 1}</span>
                <span>${item.name}</span>
                <input type="number" value="${item.stock}"
                    onchange="updateStock(${realIndex}, this.value)">
                <input type="number" value="${item.price}"
                    onchange="updatePrice(${realIndex}, this.value)">
            </div>
        `;
    });
}
window.renderSellerItems = renderSellerItems;

function updateStock(index, value) {
    items[index].stock = parseInt(value);
    saveAllData(); // langsung simpan ke Firebase
}
window.updateStock = updateStock;

function updatePrice(index, value) {
    items[index].price = parseInt(value);
    saveAllData();
}
window.updatePrice = updatePrice;

function saveItems() {
    saveAllData();
    alert("BERHASIL DISIMPAN");
}
window.saveItems = saveItems;

function clearSellerSearch() {
    document.getElementById('searchSeller').value = "";
    renderSellerItems();
}
window.clearSellerSearch = clearSellerSearch;

// =============================================
// DATA BARANG PEMBELI
// =============================================
function openBuyerPage() {
    renderBuyerItems();
    goToPage('buyerItemsPage');
}
window.openBuyerPage = openBuyerPage;

function saveBuyerInput(itemName, value) {
    buyerInputs[itemName] = value;
}
window.saveBuyerInput = saveBuyerInput;

function renderBuyerItems() {
    let container = document.getElementById('buyerItemList');
    if (!container) return;
    let keyword = document.getElementById('searchBuyer')?.value.toLowerCase() || "";
    container.innerHTML = "";
    let filtered = items.filter(item => item.name.toLowerCase().includes(keyword));
    filtered.forEach((item, index) => {
        let savedQty = buyerInputs[item.name] || "";
        container.innerHTML += `
            <div class="table-row buyer-grid">
                <span>${index + 1}</span>
                <span>${item.name}</span>
                <span>${item.stock}</span>
                <span>${formatRupiah(item.price)}</span>
                <input type="number" min="0" value="${savedQty}"
                    oninput="saveBuyerInput('${item.name}', this.value)">
            </div>
        `;
    });
}
window.renderBuyerItems = renderBuyerItems;

function clearBuyerSearch() {
    document.getElementById('searchBuyer').value = "";
    renderBuyerItems();
}
window.clearBuyerSearch = clearBuyerSearch;

function resetAllBuyerInputs() {
    document.getElementById('buyerName').value = "";
    document.getElementById('searchBuyer').value = "";
    buyerInputs = {};
    renderBuyerItems();
    alert("Semua input pembeli berhasil direset");
}
window.resetAllBuyerInputs = resetAllBuyerInputs;

// =============================================
// KONFIRMASI PEMBELIAN
// =============================================
function confirmPurchase() {
    let buyerName = document.getElementById('buyerName').value;
    if (buyerName === "") { alert("Nama Pembeli Harus Diisi"); return; }
    let selectedItems = [];
    let total = 0;
    items.forEach((item) => {
        let qty = parseInt(buyerInputs[item.name]) || 0;
        if (qty > 0) {
            selectedItems.push({ name: item.name, qty, price: item.price, subtotal: qty * item.price });
            total += qty * item.price;
        }
    });
    if (selectedItems.length === 0) { alert("Pilih barang terlebih dahulu"); return; }
    currentBuyer = { buyerName, items: selectedItems, total };
    saveAllData();
    renderPayment();
    alert("SILAHKAN MELAKUKAN PEMBAYARAN");
    goToPage('paymentPage');
}
window.confirmPurchase = confirmPurchase;

function renderPayment() {
    let paymentItems = document.getElementById('paymentItems');
    paymentItems.innerHTML = "";
    currentBuyer.items.forEach(item => {
        paymentItems.innerHTML += `
    <div class="payment-row">
        <span class="payment-name">${item.name}</span>
        <span class="payment-qty">${item.qty}x</span>
        <span class="payment-price">${formatRupiah(item.subtotal)}</span>
    </div>
    `;
    });
    document.getElementById('paymentTotal').innerHTML = `
    <div class="payment-total-box">
        <span>Total Bayar</span>
        <span>${formatRupiah(currentBuyer.total)}</span>
    </div>
    `;
}
window.renderPayment = renderPayment;

// =============================================
// BAYAR
// =============================================
function payNow() {
    let money = parseInt(document.getElementById('paymentMoney').value);
    if (isNaN(money)) { alert("Masukkan angka yang benar"); return; }
    if (money < currentBuyer.total) {
        alert(`UANG ANDA KURANG SEBANYAK ${formatRupiah(currentBuyer.total - money)}`);
        return;
    }
    let queueNumber = buyerQueue.length + 1;
    currentBuyer.money = money;
    currentBuyer.change = money - currentBuyer.total;
    currentBuyer.queueNumber = queueNumber;

    currentBuyer.items.forEach(buyItem => {
        let foundItem = items.find(item => item.name === buyItem.name);
        if (foundItem) {
            foundItem.stock -= buyItem.qty;
            if (foundItem.stock < 0) foundItem.stock = 0;
        }
    });

    buyerQueue.push(currentBuyer);
    saveAllData(); // ← semua orang langsung melihat stok berkurang & antrian bertambah
    alert("BERHASIL MELAKUKAN PEMBAYARAN, TERIMA KASIH");
    renderBuyerReceipt();
    goToPage('buyerReceiptPage');
}
window.payNow = payNow;

// =============================================
// STRUK PEMBELI
// =============================================
function renderBuyerReceipt() {
    let box = document.getElementById('buyerReceiptContent');
    let html = `
    <div class="receipt-header">

        <div>
            <h2>Toko Komputer K1</h2>
            <p>Jl. Lamacca</p>
            <p>No. Telp = 08123456789</p>
        </div>

        <img src="images/toko.png" class="toko-logo">

    </div>

    <br>

    <h3 style="color:green;">
        TERIMA KASIH SELAMAT DATANG KEMBALI
    </h3>

    <br>

    <p>Nama : ${currentBuyer.buyerName}</p>
    <p>No Antrian : ${currentBuyer.queueNumber}</p>

    <div class="receipt-blue">
    `;
    currentBuyer.items.forEach(item => {
        html += `<p>${item.name} ${item.qty}x : ${formatRupiah(item.subtotal)}</p>`;
    });
    html += `
        </div>
        <div class="receipt-blue">
            <p>Sub Total : ${formatRupiah(currentBuyer.total)}</p>
            <p>Total : ${formatRupiah(currentBuyer.total)}</p>
        </div>
        <div class="receipt-blue">
            <p>Tunai : ${formatRupiah(currentBuyer.money)}</p>
            <p>Kembalian : ${formatRupiah(currentBuyer.change)}</p>
        </div>
    `;
    box.innerHTML = html;
}
window.renderBuyerReceipt = renderBuyerReceipt;

// =============================================
// QUEUE & STRUK PENJUAL
// =============================================
function renderQueue() {
    let container = document.getElementById('queueList');
    if (!container) return;
    container.innerHTML = "";
    if (!buyerQueue || buyerQueue.length === 0) return;
    buyerQueue.forEach((buyer, index) => {
        container.innerHTML += `
            <div class="table-row">
                <span>${index + 1}</span>
                <span>${buyer.buyerName}</span>
                <span>${formatRupiah(buyer.total)}</span>
                <span>${formatRupiah(buyer.money)}</span>
                <button onclick="showSellerReceipt(${index})">Lihat</button>
            </div>
        `;
    });
}
window.renderQueue = renderQueue;

function showSellerReceipt(index) {
    let buyer = buyerQueue[index];
    let box = document.getElementById('sellerReceiptContent');
    let html = `
        <h2>Toko Komputer K1</h2><p>Jl. Lamacca</p>
        <p>No. Telp = 08123456789</p><br>
        <h3 style="color:green;">TERIMA KASIH SELAMAT DATANG KEMBALI</h3><br>
        <p>Nama : ${buyer.buyerName}</p>
        <p>No Antrian : ${buyer.queueNumber}</p>
        <div class="receipt-blue">
    `;
    buyer.items.forEach(item => {
        html += `<p>${item.name} ${item.qty}x : ${formatRupiah(item.subtotal)}</p>`;
    });
    html += `
        </div>
        <div class="receipt-blue">
            <p>Sub Total : ${formatRupiah(buyer.total)}</p>
            <p>Total : ${formatRupiah(buyer.total)}</p>
        </div>
        <div class="receipt-blue">
            <p>Tunai : ${formatRupiah(buyer.money)}</p>
            <p>Kembalian : ${formatRupiah(buyer.change)}</p>
        </div>
    `;
    box.innerHTML = html;
    goToPage('sellerReceiptPage');
}
window.showSellerReceipt = showSellerReceipt;

function processQueue() {
    if (!buyerQueue || buyerQueue.length === 0) { alert("Antrian kosong"); return; }
    let buyer = buyerQueue.shift();
    currentBalance += buyer.total;
    let now = new Date();
    let hari = now.toLocaleDateString('id-ID', { weekday: 'long' });
    financeData.push({
        type: "Pemasukkan",
        date: `${hari}, ${now.toLocaleString('id-ID')}`,
        desc: "Penjualan Produk",
        income: buyer.total,
        expense: 0,
        balance: currentBalance
    });
    saveAllData(); // ← antrian & keuangan update di semua device
    renderFinanceTable();
    renderQueue();
    alert("BERHASIL DI INPUT");
}
window.processQueue = processQueue;

// =============================================
// KEUANGAN
// =============================================
function renderFinanceTable() {
    let tbody = document.getElementById('financeTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!financeData || financeData.length === 0) return;
    financeData.forEach(data => {
        tbody.innerHTML += `
            <tr>
                <td style="color:${data.type === 'Pemasukkan' ? 'green' : 'red'}">${data.type}</td>
                <td>${data.date}</td>
                <td>${data.desc}</td>
                <td>${data.income ? formatRupiah(data.income) : '-'}</td>
                <td>${data.expense ? formatRupiah(data.expense) : '-'}</td>
                <td>${formatRupiah(data.balance)}</td>
            </tr>
        `;
    });
}
window.renderFinanceTable = renderFinanceTable;

function addIncome() {
    let amount = parseInt(document.getElementById('incomeAmount').value);
    currentBalance += amount;
    financeData.push({
        type: "Pemasukkan",
        date: `${document.getElementById('incomeDay').value}, ${document.getElementById('incomeDate').value} ${document.getElementById('incomeTime').value}`,
        desc: document.getElementById('incomeDesc').value,
        income: amount, expense: 0, balance: currentBalance
    });
    saveAllData();
    renderFinanceTable();
    alert("DATA BERHASIL DITAMBAHKAN");
    goToPage('financePage');
}
window.addIncome = addIncome;

function addExpense() {
    let amount = parseInt(document.getElementById('expenseAmount').value);
    currentBalance -= amount;
    financeData.push({
        type: "Pengeluaran",
        date: `${document.getElementById('expenseDay').value}, ${document.getElementById('expenseDate').value} ${document.getElementById('expenseTime').value}`,
        desc: document.getElementById('expenseDesc').value,
        income: 0, expense: amount, balance: currentBalance
    });
    saveAllData();
    renderFinanceTable();
    alert("DATA BERHASIL DITAMBAHKAN");
    goToPage('financePage');
}
window.addExpense = addExpense;

function deleteFinanceData() {
    if (confirm("Yakin ingin menghapus semua data keuangan?")) {
        financeData = [];
        currentBalance = 0;
        saveAllData();
        renderFinanceTable();
        alert("DATA KEUANGAN BERHASIL DIHAPUS");
    }
}
window.deleteFinanceData = deleteFinanceData;

function saveFinance() {
    saveAllData();
    alert("Berhasil Disimpan");
}
window.saveFinance = saveFinance;
window.onload = function() {
    document.getElementById("loader").style.display = "none";
}