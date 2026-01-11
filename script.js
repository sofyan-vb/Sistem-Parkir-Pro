// ===================================
// 1. DATABASE & CONFIG
// ===================================
class Kendaraan {
    constructor(plat, jenis, slot) {
        this.plat = plat;
        this.jenis = jenis;
        this.slot = slot;
        this.waktuMasuk = new Date().getTime();
        this.status = "Parkir"; // 'Parkir' atau 'Ingin Keluar'
    }
    formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
    }
}

class Mobil extends Kendaraan { hitungBiaya(durasi) { return durasi * 5000; } }
class Motor extends Kendaraan { hitungBiaya(durasi) { return durasi * 2000; } }

let parkiran = JSON.parse(localStorage.getItem('dataParkir')) || [];
let riwayat = JSON.parse(localStorage.getItem('riwayatParkir')) || [];
let antrean = []; // Array sementara untuk antrean masuk
let simulasiInterval;
let isSimulasiOn = false;

// ===================================
// 2. FUNGSI SIMULASI OTOMATIS (AI SEDERHANA)
// ===================================

// Generator Plat Nomor Acak
function generatePlat() {
    const huruf = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const area = huruf[Math.floor(Math.random() * huruf.length)];
    const belakang = huruf[Math.floor(Math.random() * huruf.length)] + huruf[Math.floor(Math.random() * huruf.length)];
    const nomor = Math.floor(Math.random() * 9000) + 1000;
    return `${area} ${nomor} ${belakang}`;
}

// Logika Kendaraan Datang
function kendaraanDatang() {
    const jenis = Math.random() > 0.5 ? "Mobil" : "Motor";
    const plat = generatePlat();
    
    // Masukkan ke antrean
    antrean.push({ plat, jenis });
    renderAntrean();
}

// Logika Kendaraan Ingin Keluar (Random trigger)
function cekKendaraanKeluar() {
    if (parkiran.length > 0) {
        // 30% kemungkinan ada yang mau keluar setiap detik
        if (Math.random() > 0.7) {
            // Pilih satu mobil acak yang masih status 'Parkir'
            let parkirAktif = parkiran.filter(k => k.status === 'Parkir');
            if (parkirAktif.length > 0) {
                let indexAcak = Math.floor(Math.random() * parkirAktif.length);
                let targetPlat = parkirAktif[indexAcak].plat;
                
                // Ubah status di database asli
                let realIndex = parkiran.findIndex(k => k.plat === targetPlat);
                parkiran[realIndex].status = "Ingin Keluar";
                simpanKeStorage();
                renderTabel();
            }
        }
    }
}

function toggleSimulasi() {
    const btn = document.getElementById('btn-simulasi');
    isSimulasiOn = !isSimulasiOn;

    if (isSimulasiOn) {
        btn.innerHTML = `<i class="fa-solid fa-stop"></i> Stop Simulasi`;
        btn.classList.remove('paused');
        btn.classList.add('playing');
        
        // Interval: Kendaraan datang setiap 3 detik, Cek keluar setiap 2 detik
        simulasiInterval = setInterval(() => {
            kendaraanDatang();
            cekKendaraanKeluar();
        }, 3000);

    } else {
        btn.innerHTML = `<i class="fa-solid fa-play"></i> Lanjutkan Simulasi`;
        btn.classList.remove('playing');
        btn.classList.add('paused');
        clearInterval(simulasiInterval);
    }
}

// ===================================
// 3. FUNGSI ADMIN (INTERAKSI)
// ===================================

function pilihDariAntrean(index) {
    const item = antrean[index];
    document.getElementById('selected-plat').value = item.plat;
    document.getElementById('selected-jenis').value = item.jenis;
    document.getElementById('btn-masuk').disabled = false;
    
    // Highlight UI
    document.querySelectorAll('.queue-item').forEach(el => el.classList.remove('selected'));
    document.getElementById(`q-${index}`).classList.add('selected');
}

function prosesMasuk() {
    const plat = document.getElementById('selected-plat').value;
    const jenis = document.getElementById('selected-jenis').value;
    const slot = document.getElementById('slot-parkir').value;

    if (!slot) { alert("Admin harus menetapkan Slot Parkir!"); return; }

    tampilkanLoading("Mencetak Tiket & Membuka Palang...", () => {
        // Buat Object
        let k = (jenis === "Mobil") ? new Mobil(plat, "Mobil", slot) : new Motor(plat, "Motor", slot);
        parkiran.push(k);
        simpanKeStorage();

        // Hapus dari Antrean
        antrean = antrean.filter(item => item.plat !== plat);
        
        // Reset Form
        document.getElementById('selected-plat').value = "";
        document.getElementById('slot-parkir').value = "";
        document.getElementById('btn-masuk').disabled = true;

        renderAntrean();
        renderTabel();
    });
}

function prosesBayar(platTarget) {
    let index = parkiran.findIndex(k => k.plat === platTarget);
    if (index === -1) return;

    tampilkanLoading("Memproses Pembayaran & Menyimpan Data...", () => {
        let data = parkiran[index];
        
        // Re-create object
        let obj;
        if (data.jenis === "Mobil") obj = new Mobil(data.plat, data.jenis);
        else obj = new Motor(data.plat, data.jenis);
        
        let durasi = Math.floor(Math.random() * 8) + 1; 
        let total = obj.hitungBiaya(durasi);
        let waktuKeluar = new Date().getTime(); // Catat waktu keluar sekarang

        // Tampilkan Struk (Sama seperti sebelumnya)
        document.getElementById('isiStruk').innerHTML = `
            <div class="struk-row"><span>Kendaraan</span><strong>${obj.jenis}</strong></div>
            <div class="struk-row"><span>Plat Nomor</span><strong>${obj.plat}</strong></div>
            <div class="struk-row"><span>Durasi</span><strong>${durasi} Jam</strong></div>
            <div class="struk-total"><span>TOTAL</span><h2>${obj.formatRupiah(total)}</h2></div>
        `;
        document.getElementById('modalStruk').classList.remove('hidden');

        // --- BAGIAN BARU: SIMPAN KE RIWAYAT ---
        riwayat.push({
            plat: obj.plat,
            jenis: obj.jenis,
            waktuMasuk: data.waktuMasuk,
            waktuKeluar: waktuKeluar,
            durasi: durasi,
            biaya: total
        });
        localStorage.setItem('riwayatParkir', JSON.stringify(riwayat));

        // Hapus dari parkiran aktif
        parkiran.splice(index, 1);
        simpanKeStorage();
        
        renderTabel();
        renderRiwayat(); // Refresh tabel riwayat
    });
}

function renderRiwayat() {
    const tbody = document.getElementById('tabel-riwayat');
    const inputDate = document.getElementById('filter-date');
    const statTotal = document.getElementById('stat-total');
    const statPendapatan = document.getElementById('stat-pendapatan');

    tbody.innerHTML = "";
    
    // Default tanggal hari ini jika belum dipilih
    if (!inputDate.value) {
        inputDate.valueAsDate = new Date();
    }
    
    let selectedDate = new Date(inputDate.value).toDateString();
    let totalKendaraan = 0;
    let totalUang = 0;

    // Filter data berdasarkan tanggal yang dipilih
    let dataHarian = riwayat.filter(item => {
        let itemDate = new Date(item.waktuKeluar).toDateString();
        return itemDate === selectedDate;
    });

    // Urutkan dari yang paling baru keluar
    dataHarian.reverse().forEach(d => {
        totalKendaraan++;
        totalUang += d.biaya;

        let masuk = new Date(d.waktuMasuk).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
        let keluar = new Date(d.waktuKeluar).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
        
        // Format Rupiah Manual
        let biayaFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(d.biaya);

        tbody.innerHTML += `
            <tr>
                <td><b>${d.plat}</b></td>
                <td>${d.jenis}</td>
                <td>${masuk}</td>
                <td>${keluar}</td>
                <td>${d.durasi} Jam</td>
                <td style="color:#10b981; font-weight:bold;">${biayaFormat}</td>
            </tr>
        `;
    });

    if (totalKendaraan === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">Tidak ada riwayat parkir pada tanggal ini.</td></tr>`;
    }

    // Update Angka Statistik
    statTotal.innerText = totalKendaraan + " Unit";
    statPendapatan.innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalUang);
}

// Panggil renderRiwayat saat aplikasi dibuka
// Tambahkan ini di dalam fungsi bukaAplikasi() atau di paling bawah file script.js
renderRiwayat();

// ===================================
// 6. FITUR MODE MANUAL
// ===================================

function gantiModeInput(mode) {
    // Update Tab UI
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${mode}`).classList.add('active');

    // Update View
    document.getElementById('view-auto').classList.add('hidden');
    document.getElementById('view-manual').classList.add('hidden');
    document.getElementById(`view-${mode}`).classList.remove('hidden');

    // Jika pindah ke manual, refresh list mini
    if (mode === 'manual') renderAntrean();
}

function tambahManual() {
    const platInput = document.getElementById('manual-plat');
    const jenisInput = document.getElementById('manual-jenis');
    
    const plat = platInput.value.toUpperCase().trim();
    const jenis = jenisInput.value;

    // Validasi
    if (!plat) { alert("Plat nomor wajib diisi!"); return; }

    // Cek Duplikasi
    const cekAntrean = antrean.find(k => k.plat === plat);
    const cekParkir = parkiran.find(k => k.plat === plat);

    if (cekAntrean || cekParkir) {
        alert("Kendaraan dengan Plat ini sudah ada!");
        return;
    }

    // Tambahkan ke Array Antrean
    antrean.push({ plat, jenis });
    
    // Reset Input
    platInput.value = "";
    platInput.focus();

    // Refresh Tampilan
    renderAntrean();
}

// ===================================
// 5. FITUR JAM & TANGGAL REAL-TIME
// ===================================

function updateClock() {
    const now = new Date();

    // Format Tanggal (Contoh: Senin, 10 Januari 2026)
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('id-ID', dateOptions);

    // Format Waktu (Contoh: 14:30:45)
    // Pakai padStart biar angka 1 jadi 01
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    // Template HTML untuk Jam
    const htmlContent = `
        <span class="time">${timeString}</span>
        <span class="date">${dateString}</span>
    `;

    // Update Landing Page
    const landingClock = document.getElementById('clock-landing');
    if (landingClock) landingClock.innerHTML = htmlContent;

    // Update Dashboard
    const dashboardClock = document.getElementById('clock-dashboard');
    if (dashboardClock) dashboardClock.innerHTML = htmlContent;
}

// Jalankan fungsi setiap 1 detik
setInterval(updateClock, 1000);

// Panggil sekali saat pertama kali load biar gak nunggu 1 detik
updateClock();


// ===================================
// 4. RENDERING & UTILITY
// ===================================

function renderAntrean() {
    const container = document.getElementById('queue-list'); // Tab Auto
    const containerMini = document.getElementById('queue-list-mini'); // Tab Manual
    
    // Bersihkan dulu
    if(container) container.innerHTML = "";
    if(containerMini) containerMini.innerHTML = "";
    
    const emptyHTML = `<div class="empty-state" style="text-align:center; color:#999; padding:20px; font-size:0.9rem;">Antrean Kosong</div>`;

    if (antrean.length === 0) {
        if(container) container.innerHTML = emptyHTML;
        if(containerMini) containerMini.innerHTML = emptyHTML;
        return;
    }

    antrean.forEach((item, index) => {
        let icon = item.jenis === "Mobil" ? '<i class="fa-solid fa-car"></i>' : '<i class="fa-solid fa-motorcycle"></i>';
        let cssClass = item.jenis.toLowerCase();
        
        // Template Item Antrean
        const itemHTML = `
            <div id="q-${index}" class="queue-item ${cssClass}" onclick="pilihDariAntrean(${index})">
                <div class="queue-info">
                    <strong>${item.plat}</strong>
                    <small>${icon} ${item.jenis}</small>
                </div>
                <i class="fa-solid fa-chevron-right" style="color:#ccc;"></i>
            </div>
        `;

        // Masukkan ke kedua container
        if(container) container.innerHTML += itemHTML;
        if(containerMini) containerMini.innerHTML += itemHTML;
    });
}

function renderTabel() {
    const tbody = document.getElementById('tabel-body');
    tbody.innerHTML = "";

    if (parkiran.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Parkiran Kosong</td></tr>`;
        return;
    }

    parkiran.forEach(d => {
        let jam = new Date(d.waktuMasuk).toLocaleTimeString('id-ID');
        let statusBadge = d.status === 'Ingin Keluar' 
            ? `<span class="status-keluar"><i class="fa-solid fa-bell"></i> Minta Keluar</span>` 
            : `<span class="status-parkir">Parkir</span>`;
        
        let tombolBayar = d.status === 'Ingin Keluar' 
            ? `<button class="btn-bayar" onclick="prosesBayar('${d.plat}')">Terima Pembayaran</button>`
            : `<button class="btn-bayar" disabled>Parkir</button>`;

        tbody.innerHTML += `
            <tr>
                <td>
                    <b>${d.plat}</b><br>
                    <small>${d.jenis}</small>
                </td>
                <td><span class="badge-slot">${d.slot}</span></td>
                <td>${statusBadge}<br><small>${jam}</small></td>
                <td>${tombolBayar}</td>
            </tr>
        `;
    });
}

function tampilkanLoading(text, callback) {
    const loader = document.getElementById('loading-screen');
    document.getElementById('loading-text').innerText = text;
    loader.classList.remove('hidden');
    setTimeout(() => {
        loader.classList.add('hidden');
        if (callback) callback();
    }, 2000);
}

function simpanKeStorage() { localStorage.setItem('dataParkir', JSON.stringify(parkiran)); }
function bukaAplikasi() { tampilkanLoading("Menyiapkan Sistem...", () => { document.getElementById('landing-page').classList.add('hidden'); document.getElementById('main-app').classList.remove('hidden'); renderTabel(); }); }
function kembaliKeHome() { 
    clearInterval(simulasiInterval); isSimulasiOn = false;
    tampilkanLoading("Menutup Sesi...", () => { document.getElementById('main-app').classList.add('hidden'); document.getElementById('landing-page').classList.remove('hidden'); }); 
}
function tutupModal() { document.getElementById('modalStruk').classList.add('hidden'); }

// Init
renderTabel();

/// ===================================
// LOGIKA GANTI MODE (MANUAL <-> LIVE)
// ===================================

function setAppMode(mode) {
    // 1. Ambil Elemen Layout Grid
    const grid = document.getElementById('dashboard-grid');
    
    // 2. Ambil Komponen
    const compManual = document.getElementById('component-manual');
    const compLiveQueue = document.getElementById('component-live-queue');
    const compLiveProcess = document.getElementById('component-live-process');
    
    // 3. Ambil Tombol & Header
    const btnManual = document.getElementById('btn-mode-manual');
    const btnLive = document.getElementById('btn-mode-live');
    const controlsSimulasi = document.getElementById('control-simulasi-wrapper');
    const headerText = document.getElementById('mode-indicator');

    if (mode === 'manual') {
        // --- AKTIFKAN MODE MANUAL ---
        
        // Atur Grid jadi 2 Kolom
        grid.classList.remove('mode-live');
        grid.classList.add('mode-manual');

        // Tampilkan Form Manual, SEMBUNYIKAN Komponen Live
        compManual.classList.remove('hidden');
        compLiveQueue.classList.add('hidden');
        compLiveProcess.classList.add('hidden');

        // Update Tombol Aktif & Teks
        btnManual.classList.add('active');
        btnLive.classList.remove('active');
        headerText.innerText = "Mode: Input Manual";
        headerText.style.color = "#1f2937"; // Hitam

        // HILANGKAN Tombol Simulasi (Agar tidak bisa dipencet)
        controlsSimulasi.classList.add('hidden');
        
        if(isSimulasiOn) toggleSimulasi();

        setTimeout(() => {
            const inputPlat = document.getElementById('direct-plat');
            if(inputPlat) inputPlat.focus();
        }, 100);

    } else {
        

        grid.classList.remove('mode-manual');
        grid.classList.add('mode-live');

        compManual.classList.add('hidden');
        compLiveQueue.classList.remove('hidden');
        compLiveProcess.classList.remove('hidden');

        btnLive.classList.add('active');
        btnManual.classList.remove('active');
        headerText.innerText = "Mode: Simulasi Live";
        headerText.style.color = "#ef4444"; 

        controlsSimulasi.classList.remove('hidden');
    }
}

// ===================================
// INPUT MANUAL LANGSUNG (DIRECT)
// ===================================

function prosesMasukDirect() {
    let platInput = document.getElementById('direct-plat');
    let slotInput = document.getElementById('direct-slot');
    
    let plat = platInput.value.toUpperCase().trim();
    let jenis = document.getElementById('direct-jenis').value;
    let slot = slotInput.value.toUpperCase().trim(); 

    if(!plat) return alert("Plat Nomor wajib diisi!");
    if(!slot) return alert("Slot Parkir wajib diisi!");

    // Cek Duplikasi
    if(parkiran.find(k => k.plat === plat)) return alert("Plat nomor ini sudah parkir!");

    tampilkanLoading("Menyimpan Data...", () => {
        let k = (jenis === "Mobil") ? new Mobil(plat, "Mobil", slot) : new Motor(plat, "Motor", slot);
        parkiran.push(k);
        simpanKeStorage();
        renderTabel();

        // Reset
        platInput.value = "";
        slotInput.value = "";
        platInput.focus();
    });
}

// ... (Class Kendaraan, Mobil, Motor tetap sama) ...
// ... (Variabel global parkiran, riwayat, dll tetap sama) ...

// Variabel Sementara untuk Checkout Manual
let kendaraanCheckout = null; 

// ===================================
// LOGIKA MODE & TAB
// ===================================
function setAppMode(mode) {
    const grid = document.getElementById('dashboard-grid');
    const compManual = document.getElementById('component-manual');
    const compLiveQueue = document.getElementById('component-live-queue');
    const compLiveProcess = document.getElementById('component-live-process');
    const btnManual = document.getElementById('btn-mode-manual');
    const btnLive = document.getElementById('btn-mode-live');
    const controlsSimulasi = document.getElementById('control-simulasi-wrapper');
    const headerText = document.getElementById('mode-indicator');

    if (mode === 'manual') {
        grid.classList.remove('mode-live');
        grid.classList.add('mode-manual');
        compManual.classList.remove('hidden');
        compLiveQueue.classList.add('hidden');
        compLiveProcess.classList.add('hidden');
        btnManual.classList.add('active');
        btnLive.classList.remove('active');
        headerText.innerText = "Mode: Input Manual";
        headerText.style.color = "#1f2937";
        controlsSimulasi.classList.add('hidden');
        if(isSimulasiOn) toggleSimulasi();
        setTimeout(() => document.getElementById('direct-plat').focus(), 100);
    } else {
        grid.classList.remove('mode-manual');
        grid.classList.add('mode-live');
        compManual.classList.add('hidden');
        compLiveQueue.classList.remove('hidden');
        compLiveProcess.classList.remove('hidden');
        btnLive.classList.add('active');
        btnManual.classList.remove('active');
        headerText.innerText = "Mode: Simulasi Live";
        headerText.style.color = "#ef4444";
        controlsSimulasi.classList.remove('hidden');
    }
}

// Fungsi Pindah Tab di dalam Mode Manual (Masuk / Keluar)
function switchManualTab(tab) {
    const formMasuk = document.getElementById('form-manual-masuk');
    const formKeluar = document.getElementById('form-manual-keluar');
    const tabMasuk = document.getElementById('tab-mn-masuk');
    const tabKeluar = document.getElementById('tab-mn-keluar');

    if (tab === 'masuk') {
        formMasuk.classList.remove('hidden');
        formKeluar.classList.add('hidden');
        tabMasuk.classList.add('active');
        tabKeluar.classList.remove('active');
        setTimeout(() => document.getElementById('direct-plat').focus(), 100);
    } else {
        formMasuk.classList.add('hidden');
        formKeluar.classList.remove('hidden');
        tabKeluar.classList.add('active');
        tabMasuk.classList.remove('active');
        setTimeout(() => document.getElementById('cari-plat').focus(), 100);
    }
}

// ===================================
// LOGIKA INPUT MANUAL (MASUK)
// ===================================
function prosesMasukDirect() {
    let platInput = document.getElementById('direct-plat');
    let slotInput = document.getElementById('direct-slot');
    
    let plat = platInput.value.toUpperCase().trim();
    let jenis = document.getElementById('direct-jenis').value;
    let slot = slotInput.value.toUpperCase().trim(); 

    if(!plat) return alert("Plat Nomor wajib diisi!");
    if(!slot) return alert("Slot Parkir wajib diisi!");

    if(parkiran.find(k => k.plat === plat)) return alert("Plat nomor ini sudah parkir!");

    tampilkanLoading("Mencetak Karcis...", () => {
        let k = (jenis === "Mobil") ? new Mobil(plat, "Mobil", slot) : new Motor(plat, "Motor", slot);
        parkiran.push(k);
        simpanKeStorage();
        renderTabel();

        platInput.value = "";
        slotInput.value = "";
        platInput.focus();
    });
}

// ===================================
// LOGIKA INPUT MANUAL (KELUAR / CHECKOUT)
// ===================================
function cekTiketKeluar() {
    let inputCari = document.getElementById('cari-plat');
    let platCari = inputCari.value.toUpperCase().trim();
    let resultBox = document.getElementById('tiket-result');

    if(!platCari) return alert("Masukkan Plat Nomor!");

    // Cari di database parkir
    let data = parkiran.find(k => k.plat === platCari);

    if (!data) {
        alert("Data tidak ditemukan! Pastikan kendaraan sudah masuk.");
        resultBox.classList.add('hidden');
        return;
    }

    // Hitung Biaya Real-time
    let obj = (data.jenis === "Mobil") ? new Mobil(data.plat, "Mobil") : new Motor(data.plat, "Motor");
    // Simulasi durasi (kalau real app pakai selisih waktu sekarang - waktu masuk)
    // Disini kita pakai random 1-5 jam biar ada angkanya
    let durasi = Math.floor(Math.random() * 5) + 1; 
    let total = obj.hitungBiaya(durasi);

    // Simpan di variabel sementara
    kendaraanCheckout = { index: parkiran.indexOf(data), obj: obj, durasi: durasi, total: total, dataAsli: data };

    // Tampilkan di UI
    document.getElementById('res-plat').innerText = data.plat;
    document.getElementById('res-jenis').innerText = data.jenis;
    document.getElementById('res-masuk').innerText = new Date(data.waktuMasuk).toLocaleTimeString('id-ID');
    document.getElementById('res-durasi').innerText = durasi + " Jam";
    document.getElementById('res-total').innerText = obj.formatRupiah(total);

    resultBox.classList.remove('hidden');
}

function prosesBayarManual() {
    if (!kendaraanCheckout) return;

    tampilkanLoading("Memproses Pembayaran...", () => {
        // Tampilkan Struk Akhir
        document.getElementById('isiStruk').innerHTML = `
            <div class="struk-row"><span>Kendaraan</span><strong>${kendaraanCheckout.obj.jenis}</strong></div>
            <div class="struk-row"><span>Plat Nomor</span><strong>${kendaraanCheckout.obj.plat}</strong></div>
            <div class="struk-row"><span>Durasi</span><strong>${kendaraanCheckout.durasi} Jam</strong></div>
            <div class="struk-total"><span>TOTAL</span><h2>${kendaraanCheckout.obj.formatRupiah(kendaraanCheckout.total)}</h2></div>
        `;
        document.getElementById('modalStruk').classList.remove('hidden');

        // Simpan ke Riwayat
        riwayat.push({
            plat: kendaraanCheckout.obj.plat,
            jenis: kendaraanCheckout.obj.jenis,
            waktuMasuk: kendaraanCheckout.dataAsli.waktuMasuk,
            waktuKeluar: new Date().getTime(),
            biaya: kendaraanCheckout.total
        });
        localStorage.setItem('riwayatParkir', JSON.stringify(riwayat));

        // Hapus dari Parkiran
        parkiran.splice(kendaraanCheckout.index, 1);
        simpanKeStorage();
        renderTabel();
        renderRiwayat();

        // Reset Form Keluar
        document.getElementById('tiket-result').classList.add('hidden');
        document.getElementById('cari-plat').value = "";
        kendaraanCheckout = null;
    });
}

// ... (Sisa fungsi simulasi, renderTabel, dll tetap sama) ...
// ... (Pastikan init di bawah) ...
document.addEventListener("DOMContentLoaded", () => {
    setAppMode('manual'); 
    renderTabel();
});

// ===================================
// INIT (Jalan saat pertama kali load)
// ===================================

document.addEventListener("DOMContentLoaded", () => {
    setAppMode('manual'); 
    renderTabel();
});

// ===================================
// NAVIGASI HALAMAN (LANDING -> DASHBOARD)
// ===================================

function bukaAplikasi() { 
    tampilkanLoading("Menyiapkan Sistem...", () => { 
        document.getElementById('landing-page').classList.add('hidden'); 
        document.getElementById('main-app').classList.remove('hidden'); 
        
        // Set Default ke Manual saat masuk
        setAppMode('manual'); 
        renderTabel(); 
    }); 
}

function kembaliKeHome() { 
    clearInterval(simulasiInterval); 
    isSimulasiOn = false;
    tampilkanLoading("Menutup Sesi...", () => { 
        document.getElementById('main-app').classList.add('hidden'); 
        document.getElementById('landing-page').classList.remove('hidden'); 
    }); 
}

// ===================================
// INIT (Jalan saat pertama kali load)
// ===================================

// Jangan langsung masuk dashboard. Biarkan user di Landing Page dulu.
document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    // Pastikan Landing Page muncul, Dashboard hidden
    document.getElementById('landing-page').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
});