import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === KONFIGURASI CLOUDINARY (GANTI DI SINI) ===
const CLOUD_NAME = "dddjueqrh"; 
const UPLOAD_PRESET = "gudang_gacor_preset"; 

// Elements
const adminAppList = document.getElementById('admin-app-list');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const btnSeed = document.getElementById('btnSeed');
const previewImg = document.getElementById('logo-preview');
const logoInputHidden = document.getElementById('app-logo'); // Sekarang id="app-logo" adalah hidden
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');

// --- 1. LOGIC UPLOAD CLOUDINARY ---
fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadStatus.innerText = "⏳ Sedang mengunggah...";
    uploadStatus.style.color = "var(--gold)";

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.secure_url) {
            logoInputHidden.value = data.secure_url; // Simpan URL ke hidden input
            previewImg.src = data.secure_url;
            previewImg.style.display = "block";
            uploadStatus.innerText = "✅ Berhasil diunggah!";
            uploadStatus.style.color = "#2ecc71";
        }
    } catch (err) {
        uploadStatus.innerText = "❌ Gagal Upload!";
        uploadStatus.style.color = "#f44336";
    }
};

// --- 2. Realtime List ---
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
        
        item.querySelector('.btn-edit').onclick = () => prepareEdit(d.id, apk);
        item.querySelector('.btn-del').onclick = () => {
            if (confirm(`⚠️ Yakin hapus "${apk.name}"?`)) hapusData(d.id);
        };
        adminAppList.appendChild(item);
    });
});

async function hapusData(id) {
    try {
        await deleteDoc(doc(db, "apps", id));
        alert("✅ Dihapus");
    } catch (e) { alert("Gagal: " + e.message); }
}

// --- 3. Simpan & Edit ---
btnSave.onclick = async () => {
    const id = document.getElementById('edit-id').value;
    const data = {
        name: document.getElementById('app-name').value,
        developer: document.getElementById('app-dev').value,
        description: document.getElementById('app-desc').value,
        logo_url: logoInputHidden.value, // Ngambil dari hasil upload Cloudinary
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
    logoInputHidden.value = apk.logo_url;
    document.getElementById('app-link').value = apk.download_url;
    
    document.getElementById('form-title').innerText = "📝 Edit Data APK";
    btnSave.innerText = "UPDATE DATA";
    btnCancel.style.display = "block";
    
    if(apk.logo_url) {
        previewImg.src = apk.logo_url;
        previewImg.style.display = "block";
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function resetForm() {
    document.getElementById('edit-id').value = "";
    document.getElementById('app-name').value = "";
    document.getElementById('app-dev').value = "";
    document.getElementById('app-desc').value = "";
    logoInputHidden.value = "";
    document.getElementById('app-link').value = "";
    document.getElementById('form-title').innerText = "🚀 Tambah APK Baru";
    btnSave.innerText = "SIMPAN DATA";
    btnCancel.style.display = "none";
    previewImg.style.display = "none";
    uploadStatus.innerText = "Format: JPG, PNG, WEBP";
    uploadStatus.style.color = "#888";
}

btnCancel.onclick = resetForm;

// --- 4. Statistik ---
onSnapshot(doc(db, "analytics", "stats"), (d) => {
    if(d.exists()) {
        const s = d.data();
        document.getElementById('total-visitors').innerText = s.total_visitors || 0;
        document.getElementById('total-clicks').innerText = s.total_clicks || 0;
        document.getElementById('today-visitors').innerText = s.today_visitors || 0;
        document.getElementById('today-clicks').innerText = s.today_clicks || 0;
    }
});

// --- 5. Seed Data ---
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
