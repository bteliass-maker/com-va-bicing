/**
 * Main Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Icons
    lucide.createIcons();

    // Elements
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

    let html5QrcodeScanner = null;
    let currentBikeId = null;
    
    // Rating state
    let currentRating = {
        frenos: 0,
        motor: 0,
        estado: 0
    };

    // View Navigation
    const showView = (viewElement) => {
        [viewHome, viewScanner, viewDetails].forEach(el => el.classList.add('hidden'));
        viewElement.classList.remove('hidden');
    };

    // --- Scanner Logic ---
    const onScanSuccess = async (decodedText, decodedResult) => {
        // Assume decoded text is a bike ID or URL containing it. Let's just use the text as ID.
        stopScanner();
        currentBikeId = decodedText.substring(0, 10); // truncate if it's a long URL
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
                console.error("Error starting scanner", err);
                alert("No se pudo iniciar la cámara. Comprueba los permisos.");
                showView(viewHome);
            });
    };

    const stopScanner = () => {
        if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
            html5QrcodeScanner.stop().catch(console.error);
        }
    };

    // --- Bike Details & Rating Logic ---
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
        
        // Show loading state
        statTotalReviews.textContent = "Cargando estadísticas...";
        renderStars('stat-frenos', 0);
        renderStars('stat-motor', 0);
        renderStars('stat-estado', 0);

        const stats = await window.DB.getBikeStats(bikeId);
        
        if (stats) {
            renderStars('stat-frenos', stats.frenos);
            renderStars('stat-motor', stats.motor);
            renderStars('stat-estado', stats.estado);
            statTotalReviews.textContent = `Basado en ${stats.totalReviews} reseña(s)`;
        } else {
            statTotalReviews.textContent = `Sin reseñas previas. ¡Sé el primero!`;
        }

        // Reset form
        currentRating = { frenos: 0, motor: 0, estado: 0 };
        updateStarUI();
        checkFormValidity();
    };

    // Rating Input Interaction
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
        if (currentRating.frenos > 0 && currentRating.motor > 0 && currentRating.estado > 0) {
            btnSubmitRating.disabled = false;
        } else {
            btnSubmitRating.disabled = true;
        }
    };

    ratingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // UI feedback while saving
        btnSubmitRating.disabled = true;
        btnSubmitRating.textContent = "Enviando...";

        await window.DB.addBikeRating(currentBikeId, currentRating.frenos, currentRating.motor, currentRating.estado);
        alert("¡Gracias por tu valoración!");
        
        // Restore button state
        btnSubmitRating.textContent = "Enviar Puntuación";
        btnSubmitRating.disabled = false;

        // Reload details to show updated stats
        await loadBikeDetails(currentBikeId);
        
        // Return home after short delay
        setTimeout(() => showView(viewHome), 1500);
    });

    // --- Event Listeners ---
    btnStartScan.addEventListener('click', startScanner);
    
    btnCancelScan.addEventListener('click', () => {
        stopScanner();
        showView(viewHome);
    });

    btnBackHome.addEventListener('click', () => {
        showView(viewHome);
    });
});
