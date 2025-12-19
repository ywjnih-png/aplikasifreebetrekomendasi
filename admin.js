import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Elements
const adminAppList = document.getElementById('admin-app-list');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const btnSeed = document.getElementById('btnSeed');
const previewImg = document.getElementById('logo-preview');
const logoInput = document.getElementById('app-logo');

// --- 1. Realtime List & Hapus dengan Konfirmasi ---
onSnapshot(query(collection(db, "apps"), orderBy("name")), (snap) => {
    adminAppList.innerHTML = "";
    snap.forEach(d => {
        const apk = d.data();
        const item = document.createElement('div');
        item.className = 'app-list-item';
        item.innerHTML = `
            <img src="${apk.logo_url || 'https://via.placeholder.com/50'}" onerror="this.src='https://via.placeholder.com/50'">
            <div class="app-info">
                <div style="font-weight:600">${apk.name}</div>
                <div style="font-size:10px; opacity:0.6">${apk.developer || 'Tanpa Dev'}</div>
            </div>
            <div class="actions">
                <button class="btn-edit" data-id="${d.id}">EDIT</button>
                <button class="btn-del" data-id="${d.id}" data-name="${apk.name}">HAPUS</button>
            </div>
        `;
        
        // Event Edit
        item.querySelector('.btn-edit').onclick = () => prepareEdit(d.id, apk);
        
        // Event Hapus (FITUR BATAL ADA DI SINI)
        item.querySelector('.btn-del').onclick = () => {
            const confirmHapus = confirm(`⚠️ Yakin ingin menghapus APK "${apk.name}"?\nData yang sudah dihapus tidak bisa dikembalikan.`);
            if (confirmHapus) {
                hapusData(d.id);
            } else {
                console.log("Penghapusan dibatalkan.");
            }
        };

        adminAppList.appendChild(item);
    });
});

// Fungsi Hapus
async function hapusData(id) {
    try {
        await deleteDoc(doc(db, "apps", id));
        alert("✅ Berhasil Dihapus");
    } catch (e) { alert("Gagal hapus: " + e.message); }
}

// --- 2. Simpan & Edit ---
btnSave.onclick = async () => {
    const id = document.getElementById('edit-id').value;
    const data = {
        name: document.getElementById('app-name').value,
        developer: document.getElementById('app-dev').value,
        description: document.getElementById('app-desc').value,
        logo_url: document.getElementById('app-logo').value,
        download_url: document.getElementById('app-link').value
    };

    if(!data.name || !data.download_url) return alert("Wajib isi Nama & Link!");

    try {
        if(id) {
            await updateDoc(doc(db, "apps", id), data);
            alert("✅ Update Berhasil");
        } else {
            await addDoc(collection(db, "apps"), data);
            alert("✅ Berhasil Ditambah");
        }
        resetForm();
    } catch (e) { alert("Error: " + e.message); }
};

function prepareEdit(id, apk) {
    document.getElementById('edit-id').value = id;
    document.getElementById('app-name').value = apk.name;
    document.getElementById('app-dev').value = apk.developer;
    document.getElementById('app-desc').value = apk.description;
    document.getElementById('app-logo').value = apk.logo_url;
    document.getElementById('app-link').value = apk.download_url;
    
    document.getElementById('form-title').innerText = "📝 Edit Data APK";
    btnSave.innerText = "UPDATE DATA";
    btnCancel.style.display = "block";
    
    if(apk.logo_url) {
        previewImg.src = apk.logo_url;
        previewImg.style.display = "inline-block";
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function resetForm() {
    document.getElementById('edit-id').value = "";
    document.getElementById('app-name').value = "";
    document.getElementById('app-dev').value = "";
    document.getElementById('app-desc').value = "";
    document.getElementById('app-logo').value = "";
    document.getElementById('app-link').value = "";
    document.getElementById('form-title').innerText = "🚀 Tambah APK Baru";
    btnSave.innerText = "SIMPAN DATA";
    btnCancel.style.display = "none";
    previewImg.style.display = "none";
}

btnCancel.onclick = resetForm;

// --- 3. Preview Logo Otomatis ---
logoInput.oninput = () => {
    if(logoInput.value) {
        previewImg.src = logoInput.value;
        previewImg.style.display = "inline-block";
    } else {
        previewImg.style.display = "none";
    }
};

// --- 4. Statistik (Dummy Integration) ---
onSnapshot(doc(db, "analytics", "stats"), (d) => {
    if(d.exists()) {
        const s = d.data();
        document.getElementById('total-visitors').innerText = s.total_visitors || 0;
        document.getElementById('total-clicks').innerText = s.total_clicks || 0;
        document.getElementById('today-visitors').innerText = s.today_visitors || 0;
        document.getElementById('today-clicks').innerText = s.today_clicks || 0;
    }
});

// --- 5. Seed Data (Optional) ---
btnSeed.onclick = async () => {
    if(!confirm("Seed 30 data sekarang?")) return;
    for(let i=1; i<=30; i++) {
        await addDoc(collection(db, "apps"), {
            name: "App Gacor " + i,
            developer: "Provider " + i,
            description: "Deskripsi APK gacor ke-" + i,
            logo_url: "https://via.placeholder.com/100",
            download_url: "https://google.com"
        });
    }
    alert("Seed Selesai!");
};