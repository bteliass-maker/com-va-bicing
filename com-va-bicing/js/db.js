/**
 * Cloud Database Service using Firebase Firestore
 * Stores bicycle ratings globally.
 */

// TODO: Reemplaza esta configuración con la de tu proyecto en Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDOCAbCdEfGhIjKlMnOpQrStUvWxYz12",
  authDomain: "tu-proyecto-123.firebaseapp.com",
  projectId: "tu-proyecto-123",
  storageBucket: "tu-proyecto-123.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123def456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/**
 * Get average stats for a specific bike from Firestore
 * @param {string} bikeId 
 * @returns {Promise<object|null>}
 */
const getBikeStats = async (bikeId) => {
    try {
        const snapshot = await db.collection('bikes').doc(bikeId).collection('ratings').get();
        
        if (snapshot.empty) return null;

        const totalReviews = snapshot.size;
        let sumFrenos = 0, sumMotor = 0, sumEstado = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            sumFrenos += data.frenos;
            sumMotor += data.motor;
            sumEstado += data.estado;
        });

        return {
            frenos: Math.round((sumFrenos / totalReviews) * 10) / 10,
            motor: Math.round((sumMotor / totalReviews) * 10) / 10,
            estado: Math.round((sumEstado / totalReviews) * 10) / 10,
            totalReviews
        };
    } catch (error) {
        console.error("Error getting bike stats:", error);
        return null; // Return null if not configured properly yet
    }
};

/**
 * Add a new rating for a bike to Firestore
 * @param {string} bikeId 
 * @param {number} frenos 
 * @param {number} motor 
 * @param {number} estado 
 * @returns {Promise<void>}
 */
const addBikeRating = async (bikeId, frenos, motor, estado) => {
    try {
        await db.collection('bikes').doc(bikeId).collection('ratings').add({
            frenos,
            motor,
            estado,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding rating:", error);
        alert("Aún no has configurado Firebase. Revisa el archivo db.js");
    }
};

window.DB = {
    getBikeStats,
    addBikeRating
};
