/**
 * Main Application Logic
 */

const i18n = {
    es: {
        homeSubtitle: "Escanea una bicicleta para ver su estado o puntuarla",
        btnScan: "Escanear QR",
        scanningTitle: "Escaneando...",
        scannerHint: "Apunta la cámara al código QR de la bicicleta",
        bikeTitle: "Bicicleta",
        statsTitle: "Estadísticas Medias",
        brakes: "Frenos",
        motor: "Motor",
        generalCondition: "Estado Gral",
        rateTitle: "Puntuar esta bicicleta",
        bikeType: "Tipo de bici",
        typeMechanical: "Mecánica",
        typeElectric: "Eléctrica",
        submitRating: "Enviar Puntuación",
        loadingStats: "Cargando estadísticas...",
        basedOnReviews: "Basado en {n} reseña(s)",
        noReviews: "Sin reseñas previas. ¡Sé el primero!",
        thankYou: "¡Gracias por tu valoración!",
        submitting: "Enviando..."
    },
    en: {
        homeSubtitle: "Scan a bicycle to see its status or rate it",
        btnScan: "Scan QR",
        scanningTitle: "Scanning...",
        scannerHint: "Point your camera at the bike's QR code",
        bikeTitle: "Bicycle",
        statsTitle: "Average Stats",
        brakes: "Brakes",
        motor: "Motor",
        generalCondition: "General Cond.",
        rateTitle: "Rate this bicycle",
        bikeType: "Bike type",
        typeMechanical: "Mechanical",
        typeElectric: "Electric",
        submitRating: "Submit Rating",
        loadingStats: "Loading stats...",
        basedOnReviews: "Based on {n} review(s)",
        noReviews: "No reviews yet. Be the first!",
        thankYou: "Thank you for your rating!",
        submitting: "Submitting..."
    },
    ca: {
        homeSubtitle: "Escaneja una bicicleta per veure'n l'estat o puntuar-la",
        btnScan: "Escanejar QR",
        scanningTitle: "Escanejant...",
        scannerHint: "Apunta la càmera al codi QR de la bicicleta",
        bikeTitle: "Bicicleta",
        statsTitle: "Estadístiques Mitjanes",
        brakes: "Frens",
        motor: "Motor",
        generalCondition: "Estat Gral",
        rateTitle: "Puntuar aquesta bicicleta",
        bikeType: "Tipus de bici",
        typeMechanical: "Mecànica",
        typeElectric: "Elèctrica",
        submitRating: "Enviar Puntuació",
        loadingStats: "Carregant estadístiques...",
        basedOnReviews: "Basat en {n} ressenya(es)",
        noReviews: "Sense ressenyes prèvies. Sigues el primer!",
        thankYou: "Gràcies per la teva valoració!",
        submitting: "Enviant..."
    }
};

let currentLang = 'es';

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();

    const viewHome = document.getElementById('view-home');
    const viewScanner = document.getElementById('view-scanner');
    const viewDetails = document.getElementById('view-details');
    
    const btnStartScan = document.getElementById('btn-start-scan');
    const btnCancelScan = document.getElementById('btn-cancel-scan');
    const btnBackHome = document.getElementById('btn-back-home');
    
    const displayBikeId = document.getElementById('display-bike-id');
    const statTotalReviews = document.getElementById('stat-total-reviews');
    
    const ratingForm = document.getElementById('rating-form');
    const btnSubmitRating = document.getElementById('btn-submit-rating');
    const starInputs = document.querySelectorAll('.star-rating-input span');

    const langSelect = document.getElementById('lang-select');
    const bikeTypeSelect = document.getElementById('bike-type-select');
    const ratingGroupMotor = document.getElementById('rating-group-motor');
    const statRowMotor = document.getElementById('stat-row-motor');

    let html5QrcodeScanner = null;
    let currentBikeId = null;
    let isElectric = false;
    
    let currentRating = { frenos: 0, motor: 0, estado: 0 };

    // --- i18n Logic ---
    const updateLanguage = (lang) => {
        currentLang = lang;
        const dict = i18n[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });
        
        // Re-render dynamic text
        if (currentBikeId) {
            checkFormValidity();
        }
    };

    langSelect.addEventListener('change', (e) => {
        updateLanguage(e.target.value);
    });

    // --- Bike Type Logic ---
    bikeTypeSelect.addEventListener('change', (e) => {
        isElectric = e.target.value === 'electrica';
        if (isElectric) {
            ratingGroupMotor.style.display = 'flex';
        } else {
            ratingGroupMotor.style.display = 'none';
            currentRating.motor = 0; // Reset
            updateStarUI();
        }
        checkFormValidity();
    });

    const showView = (viewElement) => {
        [viewHome, viewScanner, viewDetails].forEach(el => el.classList.add('hidden'));
        viewElement.classList.remove('hidden');
    };

    const onScanSuccess = async (decodedText, decodedResult) => {
        stopScanner();
        currentBikeId = decodedText.substring(0, 10);
        await loadBikeDetails(currentBikeId);
        showView(viewDetails);
    };

    const startScanner = () => {
        showView(viewScanner);
        if (!html5QrcodeScanner) {
            html5QrcodeScanner = new Html5Qrcode("reader");
        }
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrcodeScanner.start({ facingMode: "environment" }, config, onScanSuccess)
            .catch(err => {
                console.error(err);
                alert("No se pudo iniciar la cámara.");
                showView(viewHome);
            });
    };

    const stopScanner = () => {
        if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
            html5QrcodeScanner.stop().catch(console.error);
        }
    };

    const renderStars = (containerId, value) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        const fullStars = Math.round(value);
        for(let i = 1; i <= 5; i++) {
            const span = document.createElement('span');
            span.textContent = '★';
            if (i > fullStars) span.classList.add('empty');
            container.appendChild(span);
        }
    };

    const loadBikeDetails = async (bikeId) => {
        displayBikeId.textContent = `#${bikeId}`;
        statTotalReviews.textContent = i18n[currentLang].loadingStats;
        renderStars('stat-frenos', 0);
        renderStars('stat-motor', 0);
        renderStars('stat-estado', 0);

        const stats = await window.DB.getBikeStats(bikeId);
        
        if (stats) {
            renderStars('stat-frenos', stats.frenos);
            renderStars('stat-motor', stats.motor);
            renderStars('stat-estado', stats.estado);
            
            // Si el motor tiene promedio 0 y es mecánica, ocultamos el stat row motor
            if (stats.motor === 0) {
                statRowMotor.style.display = 'none';
            } else {
                statRowMotor.style.display = 'flex';
            }

            statTotalReviews.textContent = i18n[currentLang].basedOnReviews.replace('{n}', stats.totalReviews);
        } else {
            statTotalReviews.textContent = i18n[currentLang].noReviews;
            statRowMotor.style.display = 'none';
        }

        currentRating = { frenos: 0, motor: 0, estado: 0 };
        bikeTypeSelect.value = 'mecanica';
        isElectric = false;
        ratingGroupMotor.style.display = 'none';

        updateStarUI();
        checkFormValidity();
    };

    starInputs.forEach(star => {
        star.addEventListener('click', (e) => {
            const container = e.target.parentElement;
            const category = container.dataset.category;
            const value = parseInt(e.target.dataset.value);
            currentRating[category] = value;
            updateStarUI();
            checkFormValidity();
        });
    });

    const updateStarUI = () => {
        document.querySelectorAll('.star-rating-input').forEach(container => {
            const category = container.dataset.category;
            const value = currentRating[category];
            container.querySelectorAll('span').forEach(s => {
                if (parseInt(s.dataset.value) <= value) {
                    s.classList.add('selected');
                } else {
                    s.classList.remove('selected');
                }
            });
        });
    };

    const checkFormValidity = () => {
        const isValid = isElectric 
            ? (currentRating.frenos > 0 && currentRating.motor > 0 && currentRating.estado > 0)
            : (currentRating.frenos > 0 && currentRating.estado > 0);
            
        btnSubmitRating.disabled = !isValid;
    };

    ratingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        btnSubmitRating.disabled = true;
        btnSubmitRating.querySelector('span').textContent = i18n[currentLang].submitting;

        await window.DB.addBikeRating(currentBikeId, currentRating.frenos, currentRating.motor, currentRating.estado);
        alert(i18n[currentLang].thankYou);
        
        btnSubmitRating.querySelector('span').textContent = i18n[currentLang].submitRating;
        btnSubmitRating.disabled = false;

        await loadBikeDetails(currentBikeId);
        setTimeout(() => showView(viewHome), 1500);
    });

    btnStartScan.addEventListener('click', startScanner);
    btnCancelScan.addEventListener('click', () => { stopScanner(); showView(viewHome); });
    btnBackHome.addEventListener('click', () => showView(viewHome));

    // Init language
    updateLanguage('es');
});
