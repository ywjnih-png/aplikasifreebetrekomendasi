import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, updateDoc, increment, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const USERS = [
    "Budi_S", "Ahmad_J", "Rina_M", "Dika_P", "Sari_D", "Agus_W", "Maya_S", "Rizky_F", 
    "Dian_P", "Hendra_K", "Lina_W", "Fajar_S", "Nina_H", "Eko_S", "Andre_G", "Siska_K", 
    "Robby_T", "Putri_V", "Kevin_Z", "Dewi_A", "Taufik_R", "Bayu_N", "Indah_L", "Arif_C", 
    "Yudha_X", "Santi_Q", "Giri_M", "Zaki_P", "Vina_O", "Ferry_B", "Doni_K", "Ratna_J",
    "Joko_Slot", "Maman_K", "Haji_Lulung", "Sultan_01", "Cici_Gemoy", "Bang_Jago"
];

const TEXTS = [
    "Lagi pecah bgt main {game}!", 
    "WD cair mulu pake {game}.", 
    "Gila {game} ngasih scatter terus.", 
    "RTP {game} beneran akurat.", 
    "Link {game} paling stabil ya cuma disini.",
    "Baru deposit langsung dapet perkalian gede di {game}!",
    "Bener-bener gak pelit ya si {game} hari ini.",
    "Lagi hoki di {game}, maxwin tipis-tipis!",
    "Siapa tadi yang bilang {game} lagi merah? Gue barusan WD kok.",
    "Absen dulu yang udah cair di {game} hari ini!",
    "Gak nyangka, iseng main {game} malah dapet jackpot.",
    "Server {game} emang paling enteng sih menurut gue.",
    "Rekomendasi temen bener juga, {game} lagi gacor parah.",
    "Situs mantap, WD di {game} gak pake lama langsung landing.",
    "Auto buy scatter di {game} langsung dapet naga!",
    "Jangan sampe nyesel, mumpung {game} lagi bagi-bagi saldo.",
    "Adminnya ramah, nanya RTP {game} langsung dikasih yang bener.",
    "Gak sia-sia pindah ke sini, di {game} modal receh jadi naga.",
    "Sensational mulu di {game}, emang gila!",
    "Lagi rtp 98% tuh si {game}, gas keun!"
];

// INI NOMINALS MANUAL SESUAI REQUEST
const NOMINALS = [
    "250.000", "450.000", "725.000", "1.200.000", "2.550.000", 
    "3.800.000", "5.250.000", "7.000.000", "8.450.000", "10.000.000", 
    "12.300.000", "14.500.000", "15.750.000", "16.200.000", "17.000.000"
];

let dbApps = [];
const display = document.getElementById('main-display');
const chatBox = document.getElementById('chat-display');

// === 1. MODAL WELCOME FUNCTIONS ===
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('welcome-modal');
    const closeBtn = document.getElementById('close-modal');
    const enterBtn = document.getElementById('enter-site');
    
    // Tampilkan modal jika belum pernah ditutup di session ini
    if (!sessionStorage.getItem('welcomeModalShown')) {
        setTimeout(() => {
            modal.style.display = 'flex';
            // Acak posisi APK saat modal muncul
            if (dbApps.length > 0) {
                shuffleApps();
            }
        }, 800);
    }
    
    // Fungsi tutup modal
    const closeModal = () => {
        modal.style.display = 'none';
        sessionStorage.setItem('welcomeModalShown', 'true');
        // Track visitor setelah modal ditutup
        trackVisitor();
    };
    
    if (closeBtn) closeBtn.onclick = closeModal;
    if (enterBtn) enterBtn.onclick = closeModal;
    
    // Tutup modal jika klik di luar konten
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
});

// === 2. FUNGSI SHUFFLE/RANDOMIZE POSITION ===
function shuffleApps() {
    if (dbApps.length === 0) return;
    
    const shuffled = [...dbApps];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Render dengan posisi acak
    renderList(shuffled);
}

// === 3. UPDATE RENDER LIST UNTUK CLICK SELURUH CARD ===
function renderList(items) {
    display.innerHTML = "";
    items.forEach(apk => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.setAttribute('data-id', apk.id);
        
        // Buat card dengan event click di seluruh area
        card.innerHTML = `
            <img src="${apk.logo_url || 'https://via.placeholder.com/100'}" 
                 onerror="this.src='https://via.placeholder.com/100'">
            <div class="app-name">${apk.name}</div>
            <button class="btn-dl" onclick="event.stopPropagation(); handleDL('${apk.id}', '${apk.download_url}')">
                <i class="fas fa-download" style="margin-right: 4px;"></i> DOWNLOAD
            </button>
        `;
        
        // Klik di mana saja di card akan trigger download
        card.onclick = (e) => {
            if (!e.target.classList.contains('btn-dl') && !e.target.closest('.btn-dl')) {
                handleDL(apk.id, apk.download_url);
            }
        };
        
        display.appendChild(card);
    });
}

// === 4. FUNGSI AVATAR ===
function getAvatar(name) {
    const colors = ['#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c'];
    const char = name.charAt(0).toUpperCase();
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `<div class="letter-avatar" style="background:${color}">${char}</div>`;
}

// === 5. SCANNING & DOWNLOAD ===
window.handleDL = (id, url) => {
    const overlay = document.getElementById('scan-overlay');
    const bar = document.getElementById('scan-bar');
    const pct = document.getElementById('scan-percent');
    const status = document.getElementById('scan-status');
    
    overlay.style.display = 'flex';
    let progress = 0;
    const msg = ["CONNECTING...", "SCANNING VIRUS...", "SECURITY BYPASS...", "CLEAN! OPENING..."];

    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress > 100) progress = 100;
        
        bar.style.width = progress + '%';
        pct.innerText = progress + '%';
        status.innerText = progress < 30 ? msg[0] : progress < 60 ? msg[1] : progress < 90 ? msg[2] : msg[3];

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(async () => {
                overlay.style.display = 'none';
                try { 
                    await updateDoc(doc(db, "analytics", "stats"), { 
                        total_clicks: increment(1),
                        today_clicks: increment(1) 
                    }, { merge: true }); 
                } catch(e){}
                window.open(url, "_blank");
            }, 800);
        }
    }, 150);
};

// === 6. RENDER DATA (FIRESTORE) ===
onSnapshot(collection(db, "apps"), (snap) => {
    dbApps = [];
    snap.forEach(d => dbApps.push({ id: d.id, ...d.data() }));
    
    // Acak posisi setiap kali data dimuat
    shuffleApps();
});

// === 7. CHAT SYSTEM ===
function pushChat(user, msg) {
    const div = document.createElement('div');
    div.className = "comment-item";
    
    const nameColors = ['#FFD700', '#FF69B4', '#00FF7F', '#FFA500', '#F0E68C', '#ADFF2F', '#FFFFFF'];
    const randomNameColor = nameColors[Math.floor(Math.random() * nameColors.length)];

    div.innerHTML = `
        ${getAvatar(user)}
        <div class="comment-content" style="background: var(--sky); border: none; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);">
            <b style="color: ${randomNameColor}; font-size: 10px; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">${user}</b>
            <p style="color: #ffffff; margin: 0; font-size: 10px; line-height: 1.4;">${msg}</p>
        </div>
    `;
    
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

setInterval(() => {
    if(dbApps.length === 0) return;
    const user = USERS[Math.floor(Math.random() * USERS.length)];
    const randomGame = dbApps[Math.floor(Math.random() * dbApps.length)].name;
    const text = TEXTS[Math.floor(Math.random() * TEXTS.length)].replace("{game}", randomGame);
    pushChat(user, text);
}, 6000);

document.getElementById('chat-btn').onclick = () => {
    const inp = document.getElementById('chat-in');
    if(!inp.value.trim()) return;
    pushChat("Anda", inp.value);
    inp.value = "";
};

// === 8. WD TOAST ===
setInterval(() => {
    if(dbApps.length === 0) return;
    const toast = document.getElementById('wd-toast');
    
    const user = USERS[Math.floor(Math.random() * USERS.length)];
    const nominal = NOMINALS[Math.floor(Math.random() * NOMINALS.length)];
    const apk = dbApps[Math.floor(Math.random() * dbApps.length)].name;

    toast.innerHTML = `
        <i class="fas fa-check-circle" style="color: var(--green);"></i> 
        User <b>${user}***</b> Withdraw <b style="color: var(--sky);">Rp ${nominal}</b> di <b>${apk}</b>
    `;

    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 5000);
}, 12000);

// === 9. SEARCH ===
document.getElementById('search-input').oninput = (e) => {
    const key = e.target.value.toLowerCase();
    const filtered = dbApps.filter(a => a.name.toLowerCase().includes(key));
    renderList(filtered);
};

// === 10. SORT & SHUFFLE ON BADGE CLICK ===
window.sortData = (type, btn) => {
    document.querySelectorAll('.badge-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Acak posisi APK saat badge filter diklik
    shuffleApps();
};

// === 11. TRACK VISITOR ===
async function trackVisitor() {
    try {
        await setDoc(doc(db, "analytics", "stats"), {
            total_visitors: increment(1),
            today_visitors: increment(1),
            updated_at: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.log("Error tracking visitor:", e);
    }
}

// === 12. AUTO SHUFFLE POSITION EVERY 30 SECONDS ===
setInterval(() => {
    if (dbApps.length > 0 && !document.getElementById('welcome-modal').style.display) {
        shuffleApps();
    }
}, 30000);
