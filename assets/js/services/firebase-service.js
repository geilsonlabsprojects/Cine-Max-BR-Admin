/**
 * Firebase initialization and database services.
 * Credentials are now externalized for security.
 */

const firebaseConfig = {
    apiKey: window.CINE_MAX_CONFIG?.FIREBASE_API_KEY || "",
    authDomain: window.CINE_MAX_CONFIG?.FIREBASE_AUTH_DOMAIN || "",
    projectId: window.CINE_MAX_CONFIG?.FIREBASE_PROJECT_ID || "",
    databaseURL: window.CINE_MAX_CONFIG?.FIREBASE_DATABASE_URL || "",
    storageBucket: window.CINE_MAX_CONFIG?.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: window.CINE_MAX_CONFIG?.FIREBASE_SENDER_ID || "",
    appId: window.CINE_MAX_CONFIG?.FIREBASE_APP_ID || ""
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length && firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);
} else if (!firebaseConfig.apiKey) {
    console.error("Firebase Configuration missing! Please check config.js or environment variables.");
}

export const db = firebase.database();

export async function saveMediaItem(id, data) {
    return db.ref('media/' + id).set(data);
}

export async function deleteMediaItem(id, isOld = false) {
    const path = isOld ? 'movies/' : 'media/';
    return db.ref(path + id).remove();
}

export async function saveFranchiseItem(id, data) {
    return db.ref('franchises/' + id).set(data);
}

export async function deleteFranchiseItem(id) {
    return db.ref('franchises/' + id).remove();
}

export function subscribeToMedia(callback) {
    db.ref('media').on('value', snap => {
        const data = {};
        snap.forEach(child => {
            data[child.key] = { ...child.val(), id: child.key };
        });
        callback(data, false);
    });
}

export function subscribeToOldMovies(callback) {
    db.ref('movies').on('value', snap => {
        const data = {};
        snap.forEach(child => {
            data[child.key] = { ...child.val(), id: child.key, isOld: true };
        });
        callback(data, true);
    });
}

export function subscribeToFranchises(callback) {
    db.ref('franchises').on('value', snap => {
        const franchises = [];
        snap.forEach(child => {
            franchises.push({ ...child.val(), id: child.key });
        });
        callback(franchises);
    });
}

// Access Control Services
export async function createAccessCode(code, label = "User") {
    return db.ref('access_codes/' + code).set({
        createdAt: Date.now(),
        label: label
    });
}

export async function deleteAccessCode(code) {
    return db.ref('access_codes/' + code).remove();
}

export function subscribeToAccessCodes(callback) {
    db.ref('access_codes').on('value', snap => {
        const codes = [];
        snap.forEach(child => {
            codes.push({ code: child.key, ...child.val() });
        });
        callback(codes);
    });
}
