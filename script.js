// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    doc,
    increment
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCx8l5QZZbexnKrXXgS7fBFW1f6VTVIl6U",
    authDomain: "confesiones-47913.firebaseapp.com",
    projectId: "confesiones-47913",
    storageBucket: "confesiones-47913.firebasestorage.app",
    messagingSenderId: "226996541250",
    appId: "1:226996541250:web:9fda048509066580949adb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const confessionsRef = collection(db, "confessions");

// State
let activeTag = 'General';

// DOM Elements
const form = document.getElementById('confession-form');
const input = document.getElementById('confession-text');
const charCount = document.querySelector('.char-count');
const feed = document.getElementById('confessions-feed');
const tagOptions = document.querySelectorAll('.tag-option');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Listen for real-time updates
    const q = query(confessionsRef, orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        feed.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            renderConfession(docSnap.id, data);
        });
    });
});

// Tag Selection
tagOptions.forEach(option => {
    option.addEventListener('click', () => {
        tagOptions.forEach(t => t.classList.remove('active'));
        option.classList.add('active');
        activeTag = option.dataset.tag;
    });
});

// Character Count
input.addEventListener('input', () => {
    const len = input.value.length;
    charCount.textContent = `${len}/500`;
    if (len >= 500) {
        charCount.style.color = 'var(--color-accent)';
    } else {
        charCount.style.color = 'var(--color-text-muted)';
    }
});

// Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    try {
        await addDoc(confessionsRef, {
            text: text,
            tag: activeTag,
            likes: 0,
            timestamp: serverTimestamp() // Use server timestamp for consistency
        });

        // Reset form
        input.value = '';
        charCount.textContent = '0/500';
    } catch (error) {
        console.error("Error adding confession: ", error);
        alert("Hubo un error al enviar tu confesión. Inténtalo de nuevo.");
    }
});

// Render Single Confession
function renderConfession(id, confession) {
    const card = document.createElement('div');
    card.className = 'glass-card confession-card';

    // Handle timestamp (it might be null immediately for local latency writes, or a Firestore Timestamp)
    let dateStr = "Justo ahora";
    if (confession.timestamp) {
        // .toDate() works if it's a Firestore timestamp object
        const date = confession.timestamp.toDate ? confession.timestamp.toDate() : new Date(confession.timestamp);
        dateStr = date.toLocaleDateString('es-ES', {
            day: 'numeric', month: 'short'
        });
    }

    card.innerHTML = `
        <div class="card-header">
            <span class="card-tag">${escapeHTML(confession.tag || 'General')}</span>
            <span class="card-time">${dateStr}</span>
        </div>
        <div class="card-body">
            ${escapeHTML(confession.text || '')}
        </div>
        <div class="card-footer">
            <button class="action-btn" id="btn-${id}" onclick="window.handleLike('${id}')">
                <i class="fa-regular fa-heart"></i>
                <span>${confession.likes || 0}</span>
            </button>
        </div>
    `;

    feed.appendChild(card);
}

// Like Functionality (Attached to window for inline onclick access)
window.handleLike = async (id) => {
    const btn = document.getElementById(`btn-${id}`);

    // Optimistic UI update (optional, but good for feedback)
    // For now we rely on the realtime listener update

    const docRef = doc(db, "confessions", id);
    try {
        await updateDoc(docRef, {
            likes: increment(1)
        });
    } catch (error) {
        console.error("Error updating likes: ", error);
    }
};

// Helpers
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}
