let currentLatitude;
let currentLongitude;
let currentRayonKm = 10;

// ==========================
// Compteur animé pour les stats
// ==========================
function animateCount(id, target, duration = 2000) {
  const element = document.getElementById(id);
  let start = 1;
  const frameRate = 0.5;
  const stepTime = 100 / frameRate;
  const totalSteps = Math.ceil(duration / stepTime);
  const increment = Math.ceil(target / totalSteps);

  const counter = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(counter);
    } else {
      element.textContent = start;
    }
  }, stepTime);
}

// ==========================
// Images des types de véhicules
// ==========================
const typeImages = {
  berline: "/front/html/images/index/sedan.png",
  suv: "/front/html/images/index/suv.png",
  sportive: "/front/html/images/index/sport-car.png",
  citadine: "/front/html/images/index/city-car.png",
  cabriolet: "/front/html/images/index/convertible-car.png",
  break: "/front/html/images/index/station-wagon.png",
};

// ==========================
// Filtres actifs globaux
// ==========================
const filtresActifs = {
  type: [],
  ville: '',
  prixMax: 200,
  disponibilite: false,
};

// ==========================
// Gestion des filtres "Type de véhicule"
// ==========================
const typeElements = document.querySelectorAll('#filter-type .filter-details p');
const imageContainer = document.getElementById('vehicleImageContainer');

typeElements.forEach(p => {
  p.addEventListener('click', () => {
    const type = p.textContent.trim().toLowerCase();

    if (type === 'tout') {
      // Réinitialiser filtres types
      typeElements.forEach(el => el.classList.remove('active'));
      p.classList.add('active');
      filtresActifs.type = [];
      imageContainer.innerHTML = '';
    } else {
      // Désactive "Tout"
      const tout = Array.from(typeElements).find(el => el.textContent.trim().toLowerCase() === 'tout');
      if (tout) tout.classList.remove('active');

      // Toggle actif sur ce type
      p.classList.toggle('active');

      // Met à jour filtres actifs types
      filtresActifs.type = Array.from(typeElements)
        .filter(el => el.classList.contains('active') && el.textContent.trim().toLowerCase() !== 'tout')
        .map(el => el.textContent.trim());

      // Affiche images correspondantes
      imageContainer.innerHTML = '';
      filtresActifs.type.forEach(t => {
        const key = t.toLowerCase();
        const src = typeImages[key];
        if (src) {
          const img = document.createElement('img');
          img.src = src;
          img.alt = key;
          img.width = 60;
          imageContainer.appendChild(img);
        }
      });
    }
    fetchVehicules();
  });
});

// ==========================
// Animation des stats (appel API)
// ==========================
fetch('http://127.0.0.1:8000/admin/stats')
  .then(res => res.json())
  .then(data => {
    animateCount('vehicleCount', data.vehicules);
    animateCount('garageCount', data.garages);
  })
  .catch(err => console.error('Erreur stats:', err));

// ==========================
// Chargement initial et gestion des filtres UI
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  const prixRange = document.getElementById('prix-range');
  const prixValeur = document.getElementById('prix-valeur');
  const checkboxDisponibilite = document.getElementById('disponibilite');
  const inputVille = document.querySelector('#filter-localisation none');

  if (prixRange && prixValeur) {
    prixValeur.textContent = prixRange.value;
    prixRange.addEventListener('input', () => {
      const val = parseFloat(prixRange.value);
      prixValeur.textContent = val;
      filtresActifs.prixMax = val;
      filtrerCartes();
    });
  }

  if (checkboxDisponibilite) {
    checkboxDisponibilite.addEventListener('change', () => {
      filtresActifs.disponibilite = checkboxDisponibilite.checked;
      fetchVehicules();
    });
  }

  if (inputVille) {
    inputVille.addEventListener('None', () => {
      filtresActifs.ville = inputVille.value.trim();
      fetchVehicules();
    });
  }

  // Boutons de tri
  const sortAsc = document.getElementById('sort-asc');
  const sortDesc = document.getElementById('sort-desc');
  const selectedSort = document.getElementById('selected-sort');

  function showSelectedSort() {
    selectedSort.classList.add('visible');
  }
  function setActiveSort(selected) {
    if (selected === 'asc') {
      sortAsc.classList.add('active');
      sortDesc.classList.remove('active');
      selectedSort.textContent = "Prix croissant";
    } else if (selected === 'desc') {
      sortDesc.classList.add('active');
      sortAsc.classList.remove('active');
      selectedSort.textContent = "Prix décroissant";
    }
    showSelectedSort();
  }

  if (sortAsc) {
    sortAsc.addEventListener('click', e => {
      e.preventDefault();
      trierCartesParPrix('asc');
      setActiveSort('asc');
    });
  }
  if (sortDesc) {
    sortDesc.addEventListener('click', e => {
      e.preventDefault();
      trierCartesParPrix('desc');
      setActiveSort('desc');
    });
  }

  // Reset filtres
  const btnReset = document.getElementById('reset-filtres');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      filtresActifs.type = [];
      filtresActifs.ville = '';
      filtresActifs.prixMax = 200;
      filtresActifs.disponibilite = false;
       filtresActifs.rayonKm = 10;

      if(inputVille) inputVille.value = '';
      if(prixRange) prixRange.value = 200;
      if(prixValeur) prixValeur.textContent = 200;
      if(checkboxDisponibilite) checkboxDisponibilite.checked = false;

      // Réinitialiser la localisation
  const searchLocation = document.getElementById('search-location');
  if (searchLocation) searchLocation.value = '';
  const distanceRadius = document.getElementById('distance-radius');
  if (distanceRadius) distanceRadius.value = 10;

  currentLatitude = undefined;
  currentLongitude = undefined;
  currentRayonKm = 10;

      typeElements.forEach(p => {
        p.classList.remove('active');
        if (p.textContent.trim().toLowerCase() === 'tout') {
          p.classList.add('active');
        }
      });
      imageContainer.innerHTML = '';
      fetchVehicules();
    });
  }

  // Requête initiale
  fetchVehicules();

  // Bouton rechercher localisation
  const btnRechercher = document.getElementById('btn-rechercher');
  if (btnRechercher) {
    btnRechercher.addEventListener('click', onClickRechercher);
    
  }
});

// ==========================
// Géocodage Google Maps
// ==========================
async function geocodeAdresseGoogle(adresse) {
  const apiKey = 'AIzaSyAWImduOCcCeKmbRwWqaitVXxTkLwnH7iE'; 
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(adresse)}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK' && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return { lat: location.lat, lon: location.lng };
  } else {
    throw new Error('Adresse introuvable');
  }
}

// ==========================
// Fonction de recherche par localisation
// ==========================
async function onClickRechercher() {
  const adresseInput = document.getElementById('search-location').value.trim();
  const rayonSelect = document.getElementById('distance-radius');
  const rayon_km = parseFloat(rayonSelect.value);

   

  if (!adresseInput) {
    
    showFlashMessage("Veuillez saisir une adresse ou une ville.");
    return;
  }

  try {
    const { lat, lon } = await geocodeAdresseGoogle(adresseInput);

    currentLatitude = lat;
    currentLongitude = lon;
    currentRayonKm = rayon_km;

    // Appelle fetchVehicules avec localisation mise à jour
    fetchVehicules();

  } catch (error) {
    alert(`Erreur lors de la recherche : ${error.message}`);
  }
}

// ==========================
// Récupération des véhicules via API
// ==========================

async function fetchVehicules() {
  try {
    const requestBody = {
      marque: '',
      modele: '',
      carburant: '',
      ville: filtresActifs.ville || undefined,
      prix_min: 1,
      prix_max: filtresActifs.prixMax,
      disponibilite: filtresActifs.disponibilite ? true : undefined,
      lat: currentLatitude || undefined,
      lon: currentLongitude || undefined,
      rayon_km: currentRayonKm || undefined,
      type_vehicule: (Array.isArray(filtresActifs.type) && filtresActifs.type.length > 0)
        ? filtresActifs.type
        : undefined,
    };

    // Nettoyage des clés undefined
    Object.keys(requestBody).forEach(key => requestBody[key] === undefined && delete requestBody[key]);

    

    const resultatsContainer = document.getElementById('resultats');
    resultatsContainer.innerHTML = "";

    const response = await fetch('http://127.0.0.1:8000/Vehicules/RechercheVehicule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

    const vehicules = await response.json();

    const messageAucun = document.getElementById('message-aucun');
    const nbResultats = document.getElementById('nb-resultats');
    if (vehicules.length === 0) {
      if (messageAucun) messageAucun.style.display = 'block';
      if (nbResultats) nbResultats.textContent = '';
      return;
    } else {
      if (nbResultats) nbResultats.textContent = 'block';
      if (messageAucun) messageAucun.style.display = 'none';
    }

    vehicules.forEach(async (vehicule) => {
      const vehiculeCard = document.createElement('div');
      vehiculeCard.classList.add('vehicule-card');

      const isUserConnected = !!localStorage.getItem('access_token');

      // Vérifier forte demande
  let forteDemande = false;
  try {
    const response = await fetch(`http://127.0.0.1:8000/reservations/ForteDemande/${vehicule.vehicule_id}`);
    if (response.ok) {
      const data = await response.json();
      console.log('data reçue pour forte demande :', data);
      forteDemande = data.forte_demande === true; // ou data.forte_demande si tu renvoies un objet
      console.log('forteDemande =', forteDemande);
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de la forte demande :", error);
  }

      const imagesHTML = vehicule.images && vehicule.images.length > 0
  ? `<div class="vehicule-image-container">
        <img src="${vehicule.images[0]}" alt="Image de ${vehicule.modele}" class="vehicule-image" />
        ${forteDemande ? `<div class="badge-forte-demande">🔥 Forte demande</div>` : ''}
     </div>
     `
  : '<p>Aucune image disponible pour ce véhicule.</p>';

        

      vehiculeCard.innerHTML = `
        <div class="vehicule-card-content">
          <div class="vehicule-images">
            ${imagesHTML}
            <button class="voir-plus-btn" onclick="voirPlus(${vehicule.vehicule_id})">Plus d'infos</button>
          </div>
          <div class="vehicule-description">
            <h3 class="vehicule-marque">Marque: <span class="marque">${vehicule.marque}</span></h3>
            <p class="vehicule-modele">Modèle: <span class="modele">${vehicule.modele}</span></p>
            <p class="vehicule-prix">Prix par jour: <span class="prix-par-jour">${vehicule.prix_par_jour}</span> €</p>
            <p class="vehicule-carburant">Carburant: <span class="carburant">${vehicule.carburant}</span></p>
            <p class="vehicule-type">Type de véhicule: <span class="type-vehicule">${vehicule.type_vehicule}</span></p>
            <p class="vehicule-ville">Ville du garage: <span class="garage-ville">${vehicule.ville}</span></p>
            <p><strong>Disponibilité :</strong> 
  ${vehicule.disponibilite 
    ? (vehicule.date_disponibilite ? vehicule.date_disponibilite : "Disponible immédiatement") 
    : "Indisponible"}
</p>

${vehicule.disponibilite ? `
  ${isUserConnected ? `
    <button class="reserver-btn" onclick="reserverVehicule(${vehicule.vehicule_id}, ${vehicule.garage_id})">
      Réserver ce véhicule
    </button>
  ` : ''}
` : `
  <button class="reserver-btn" disabled>
    Véhicule indisponible
  </button>
`}

      </div>
    </div>
  `;

      resultatsContainer.appendChild(vehiculeCard);
    });

    filtrerCartes(); // Filtrage après affichage

  } catch (error) {
    alert('Une erreur est survenue lors de la récupération des véhicules.');
  }
}

// ==========================
// Voir plus (redirection fiche véhicule)
// ==========================
function voirPlus(vehiculeId) {
  window.location.href = `/front/html/fiche_vehicule.html?id=${vehiculeId}`;
}

// ==========================
// Filtrage combiné côté frontend
// ==========================
function filtrerCartes() {
  const cards = document.querySelectorAll('.vehicule-card');
  let visibleCount = 0;

  cards.forEach(card => {
    let visible = true;

    const type = card.querySelector('.type-vehicule')?.textContent.trim().toLowerCase();

    if (Array.isArray(filtresActifs.type) && filtresActifs.type.length > 0) {
      const typesSelectionnes = filtresActifs.type.map(t => t.toLowerCase());
      if (!typesSelectionnes.includes(type)) visible = false;
    }

    const ville = card.querySelector('.garage-ville')?.textContent.trim().toLowerCase();
    if (ville && filtresActifs.ville && !ville.includes(filtresActifs.ville.toLowerCase())) visible = false;

    const prix = parseFloat(card.querySelector('.prix-par-jour').textContent);
    if (prix > filtresActifs.prixMax) visible = false;

    card.style.display = visible ? 'block' : 'none';
    if (visible) visibleCount++;
  });

  const messageAucun = document.getElementById('message-aucun');
  const nbResultats = document.getElementById('nb-resultats');
  

   if (visibleCount === 0) {
    if (messageAucun) messageAucun.style.display = 'block';
    if (nbResultats) nbResultats.textContent = '';  // <-- On vide le texte quand rien n'est visible
  } else {
    if (messageAucun) messageAucun.style.display = 'none';
    if (nbResultats) {
      nbResultats.textContent = `${visibleCount} véhicule${visibleCount > 0 ? 's' : ''} trouvé${visibleCount > 0 ? 's' : ''}`;
    }
  }
}

// ==========================
// Tri des cartes par prix
// ==========================
function trierCartesParPrix(ordre = 'asc') {
  const container = document.getElementById('resultats');
  const cards = Array.from(container.getElementsByClassName('vehicule-card'));

  const cartesTriees = cards.sort((a, b) => {
    const prixA = parseFloat(a.querySelector('.prix-par-jour').textContent);
    const prixB = parseFloat(b.querySelector('.prix-par-jour').textContent);
    return ordre === 'asc' ? prixA - prixB : prixB - prixA;
  });

  container.innerHTML = '';
  cartesTriees.forEach(card => container.appendChild(card));
}

  // ==========================
// Creer une reservation 
// ==========================

async function reserverVehicule(vehiculeId, garageId) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert("Vous devez être connecté pour effectuer une réservation.");
        return;
    }

    // Vérifier si l'élément modal est présent dans le DOM
    const modal = document.getElementById("reservation-modal");
    if (modal) {
        openModal();
    } else {
        console.log("Erreur : L'élément modal n'est pas trouvé !");
        return;
    }

    let selectedStartDate = null;
    let selectedEndDate = null;
    let datesDisponibles = false;

    const confirmBtn = document.getElementsByClassName("confirm-btn")[0];
    confirmBtn.disabled = true; // Désactiver par défaut

    function openModal() {
        modal.style.display = "block";

        // Fermer le modal si l'utilisateur clique sur la croix
        const closeBtn = document.getElementsByClassName("close-btn")[0];
        if (closeBtn) {
            closeBtn.addEventListener("click", function () {
                modal.style.display = "none";
            });
        }

        // Fermer le modal si l'utilisateur clique sur le bouton Annuler
        const cancelBtn = document.getElementsByClassName("cancel-btn")[0];
        if (cancelBtn) {
            cancelBtn.addEventListener("click", function () {
                modal.style.display = "none";
            });
        }

        // Nettoyer le calendrier avant de l'initialiser
        $('#calendar').html('');
        $('#calendar').fullCalendar('destroy');  // Si un calendrier précédent existe, le détruire

        // Charger et configurer FullCalendar
        $('#calendar').fullCalendar({
          locale: 'fr',
            events: async function(start, end, timezone, callback) {
                const response = await fetch(`http://127.0.0.1:8000/reservations/DatesReservées/${vehiculeId}`);
                const data = await response.json();
                const events = data.map(reservation => ({
                    title: reservation.statut,
                    start: reservation.date_debut,
                    end: reservation.date_fin,
                    color: reservation.color
                }));
                callback(events);
            },
            selectable: true,
            select: async function(startDate, endDate) {
                console.log("Sélection des dates :", startDate.format("YYYY-MM-DD"), endDate.format("YYYY-MM-DD"));

                // FullCalendar donne end exclusif, donc on soustrait 1 jour pour l'affichage
                const start = startDate.format("YYYY-MM-DD");
                const end = endDate.clone().subtract(1, 'days').format("YYYY-MM-DD");

                // Sauvegarder les dates sélectionnées
                selectedStartDate = start;
                selectedEndDate = end;

                console.log("Dates sélectionnées:", selectedStartDate, selectedEndDate);
                // Vérification de la disponibilité des dates
                const isAvailable = await checkAvailability(selectedStartDate, selectedEndDate);

                 datesDisponibles = isAvailable;

                if (isAvailable) {
    
                confirmBtn.disabled = false;
                } else {
    
                confirmBtn.disabled = true;
}
            }
        });

        // Lier le bouton Confirmer
        const confirmBtn = document.getElementsByClassName("confirm-btn")[0];
        if (confirmBtn) {
            confirmBtn.addEventListener("click", function () {
                if (selectedStartDate && selectedEndDate) {
                  
                    // Soumettre la réservation avec les dates sélectionnées
                    submitReservation(selectedStartDate, selectedEndDate, garageId)
                        .then(() => {
                            modal.style.display = "none"; // Fermer le modal après la réservation
                            
                            
                        })
                        .catch(error => {
                            console.error("Erreur lors de la soumission de la réservation :", error);
                            alert("Une erreur est survenue lors de la réservation. Veuillez réessayer.");
                        });
                } else {
                  
                    showFlashMessage(`Une erreur est survenue lors de la réservation. Veuillez réessayer.`);
                }
            });
        }
    }

    async function checkAvailability(start, end) {
        const response = await fetch(`http://127.0.0.1:8000/reservations/DatesReservées/${vehiculeId}`);
        const data = await response.json();

        for (let reservation of data) {
            const reservedStart = reservation.date_debut;
            const reservedEnd = reservation.date_fin;
            
            if ((start >= reservedStart && start <= reservedEnd) || (end >= reservedStart && end <= reservedEnd) || (start <= reservedStart && end >= reservedEnd)) {
                return false;
            }
        }
        return true;
    }

    async function submitReservation(start, end, garageId) {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert("Vous devez être connecté pour effectuer une réservation.");
            return;
        }
       
        const reservation = {
            vehicule_id: vehiculeId,
            garage_id: garageId,
            date_debut: start,
            date_fin: end
        };

        const response = await fetch('http://127.0.0.1:8000/reservations/CreerReservations/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: JSON.stringify(reservation)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur dans la réponse du serveur:', errorData);
            throw new Error(`Erreur ${response.status}: ${JSON.stringify(errorData.detail, null, 2)} `);
        }

        const reservationData = await response.json();
        console.log("Réservation réussie :", reservationData);
        showFlashMessage(`Réservation réussie : Du ${start} au ${end}`);
        
        
    }
}




function showFlashMessage(message, color = "#4CAF50") {
  const flash = document.getElementById("message-flash");
  flash.textContent = message;
  flash.style.backgroundColor = color;
  flash.style.display = "block";

  // Forcer l'animation à se rejouer à chaque affichage
  flash.classList.remove("flash-message");
  void flash.offsetWidth; // Trick to reflow/restart animation
  flash.classList.add("flash-message");

  // Masquer le message après l'animation (~2s)
  setTimeout(() => {
    flash.style.display = "none";
  }, 7000);
}
  