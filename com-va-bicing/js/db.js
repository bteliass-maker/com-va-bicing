/**
 * Cloud Database Service using Firebase Firestore
 * Includes a fallback to LocalStorage if Firebase is not configured.
 */

const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef12345"
};

// Check if it's the placeholder config
const isDummyConfig = firebaseConfig.apiKey === "TU_API_KEY_AQUI";
let db = null;

if (!isDummyConfig) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} else {
    console.warn("Using LocalStorage fallback. Configure Firebase to save to the cloud.");
    const DB_KEY = 'com_va_bicing_db_fallback';
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify({}));
    }
}

// --- LocalStorage Fallback Methods ---
const getLocalDB = () => JSON.parse(localStorage.getItem('com_va_bicing_db_fallback'));
const saveLocalDB = (data) => localStorage.setItem('com_va_bicing_db_fallback', JSON.stringify(data));

const getLocalBikeStats = (bikeId) => {
    const localDb = getLocalDB();
    if (!localDb[bikeId] || localDb[bikeId].length === 0) return null;
    const reviews = localDb[bikeId];
    const totalReviews = reviews.length;
    let sumFrenos = 0, sumMotor = 0, sumEstado = 0;
    
    // Count only reviews that have motor rating for motor average
    let motorReviews = 0;

    reviews.forEach(review => {
        sumFrenos += review.frenos;
        sumEstado += review.estado;
        if (review.motor > 0) {
            sumMotor += review.motor;
            motorReviews++;
        }
    });

    return {
        frenos: Math.round((sumFrenos / totalReviews) * 10) / 10,
        motor: motorReviews > 0 ? Math.round((sumMotor / motorReviews) * 10) / 10 : 0,
        estado: Math.round((sumEstado / totalReviews) * 10) / 10,
        totalReviews
    };
};

const addLocalBikeRating = (bikeId, frenos, motor, estado) => {
    const localDb = getLocalDB();
    if (!localDb[bikeId]) localDb[bikeId] = [];
    localDb[bikeId].push({ frenos, motor, estado, timestamp: new Date().toISOString() });
    saveLocalDB(localDb);
};

// --- Exported Methods ---
const getBikeStats = async (bikeId) => {
    if (isDummyConfig) return getLocalBikeStats(bikeId);

    try {
        const snapshot = await db.collection('bikes').doc(bikeId).collection('ratings').get();
        if (snapshot.empty) return null;

        const totalReviews = snapshot.size;
        let sumFrenos = 0, sumMotor = 0, sumEstado = 0;
        let motorReviews = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            sumFrenos += data.frenos;
            sumEstado += data.estado;
            if (data.motor > 0) {
                sumMotor += data.motor;
                motorReviews++;
            }
        });

        return {
            frenos: Math.round((sumFrenos / totalReviews) * 10) / 10,
            motor: motorReviews > 0 ? Math.round((sumMotor / motorReviews) * 10) / 10 : 0,
            estado: Math.round((sumEstado / totalReviews) * 10) / 10,
            totalReviews
        };
    } catch (error) {
        console.error("Error getting bike stats:", error);
        return null;
    }
};

const addBikeRating = async (bikeId, frenos, motor, estado) => {
    if (isDummyConfig) {
        addLocalBikeRating(bikeId, frenos, motor, estado);
        return;
    }

    try {
        await db.collection('bikes').doc(bikeId).collection('ratings').add({
            frenos,
            motor,
            estado,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding rating:", error);
    }
};

window.DB = {
    getBikeStats,
    addBikeRating
};
