// Firebase ES6 Module imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, get, child, update, push } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDX882cvhwQgfhbsLFn69Q2l-TUQUR5IBk",
  authDomain: "codingkan-factory-apps.firebaseapp.com",
  databaseURL: "https://codingkan-factory-apps-default-rtdb.firebaseio.com",
  projectId: "codingkan-factory-apps",
  storageBucket: "codingkan-factory-apps.firebasestorage.app",
  messagingSenderId: "188856222342",
  appId: "1:188856222342:android:ae0e1873684da414cec707"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Firebase references
const usersRef = ref(database, 'users');
const casesRef = ref(database, 'cases');

// DOM elements
const registrationForm = document.getElementById('registrationForm');
const successScreen = document.getElementById('successScreen');
const registerForm = document.getElementById('registerForm');
const namaInput = document.getElementById('nama');
const nisnInput = document.getElementById('nisn');
const registerBtn = document.getElementById('registerBtn');
const notification = document.getElementById('notification');
const namaPengguna = document.getElementById('namaPengguna');
const editNameBtn = document.getElementById('editNameBtn');
const continueBtn = document.getElementById('continueBtn');
const nameModal = document.getElementById('nameModal');
const newNameInput = document.getElementById('newName');
const cancelNameBtn = document.getElementById('cancelNameBtn');
const saveNameBtn = document.getElementById('saveNameBtn');

// Global variables
let currentUID = null;
let currentCaseId = null;

// Utility functions
function showNotification(message, type) {
  notification.textContent = message;
  notification.className = `notification p-3 rounded-xl mb-5 text-sm font-medium ${type}`;
  notification.classList.remove('hidden');

  setTimeout(() => {
    notification.classList.add('hidden');
  }, 5000);
}

function showLoading(button, text = 'Loading...') {
  button.innerHTML = `<span class="loading"></span>${text}`;
  button.disabled = true;
}

function hideLoading(button, text) {
  button.innerHTML = text;
  button.disabled = false;
}

function showNameModal() {
  nameModal.classList.remove('hidden');
  newNameInput.value = namaPengguna.value;
  newNameInput.focus();
}

function hideNameModal() {
  nameModal.classList.add('hidden');
}

function updateNameInFirebase(newName) {
  if (!currentUID || !currentCaseId) return;

  showLoading(saveNameBtn, 'Menyimpan...');

  const userUpdateRef = ref(database, `users/${currentUID}`);
  const caseUpdateRef = ref(database, `cases/${currentCaseId}`);

  const userUpdate = update(userUpdateRef, {
    name: newName
  });

  const caseUpdate = update(caseUpdateRef, {
    name: newName
  });

  Promise.all([userUpdate, caseUpdate])
    .then(() => {
      namaPengguna.value = newName;
      showNotification('Nama berhasil diubah', 'success');
      hideNameModal();
    })
    .catch((error) => {
      showNotification('Gagal mengubah nama: ' + error.message, 'error');
    })
    .finally(() => {
      hideLoading(saveNameBtn, 'Simpan');
    });
}

// Event listeners
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const nama = namaInput.value.trim();
  const nisn = nisnInput.value.trim();

  // Validation
  if (!nama || !nisn) {
    showNotification('Semua field harus diisi', 'error');
    return;
  }

  if (nisn.length !== 10 || !/^\d+$/.test(nisn)) {
    showNotification('NISN harus 10 digit angka', 'error');
    return;
  }

  showLoading(registerBtn, 'Mendaftar...');

  // Use NISN as UID
  currentUID = nisn;

  // Check if NISN already exists
  const userCheckRef = ref(database, `users/${currentUID}`);
  
  get(userCheckRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        throw new Error('NISN sudah terdaftar');
      }

      // User data for users collection
      const userData = {
        name: nama,
        uid: currentUID,
        nisn: nisn,
        points: 100,
        poin: 0,
        jenisKasus: "",
        tanggalKasus: new Date().toISOString().split('T')[0]
      };

      // Generate case ID
      const newCaseRef = push(casesRef);
      currentCaseId = newCaseRef.key;

      // Case data for cases collection
      const caseData = {
        name: nama,
        uid: currentUID,
        nisn: nisn,
        poin: 100,
        caseType: "Anda Bersih",
        date: new Date().toISOString().split('T')[0],
        details: "",
        finalPoints: 100,
        initialPoints: 100,
        pointsDeducted: 0,
        timestamp: Date.now()
      };

      // Save to both collections
      const userSaveRef = ref(database, `users/${currentUID}`);
      const caseSaveRef = ref(database, `cases/${currentCaseId}`);
      
      const userSave = set(userSaveRef, userData);
      const caseSave = set(caseSaveRef, caseData);

      return Promise.all([userSave, caseSave]);
    })
    .then(() => {
      // Show success screen
      registrationForm.classList.add('hidden');
      successScreen.classList.remove('hidden');
      namaPengguna.value = nama;
      showNotification('Akun berhasil dibuat dan data tersimpan', 'success');
    })
    .catch((error) => {
      showNotification(error.message, 'error');
    })
    .finally(() => {
      hideLoading(registerBtn, 'Daftar Akun Anda');
    });
});

editNameBtn.addEventListener('click', showNameModal);
cancelNameBtn.addEventListener('click', hideNameModal);

saveNameBtn.addEventListener('click', () => {
  const newName = newNameInput.value.trim();

  if (!newName) {
    showNotification('Nama tidak boleh kosong', 'error');
    return;
  }

  updateNameInFirebase(newName);
});

continueBtn.addEventListener('click', () => {
  window.location.href = 'login.html';
});

// Close modal when clicking outside
nameModal.addEventListener('click', (e) => {
  if (e.target === nameModal) {
    hideNameModal();
  }
});

// Handle Enter key in modal
newNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveNameBtn.click();
  }
});
