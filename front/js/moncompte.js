const token = localStorage.getItem('access_token');

// Message flash 
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

// --- Charger les infos utilisateur ---
async function fetchUserInfo() {
  try {
    const res = await fetch('http://127.0.0.1:8000/users/Utilisateurs/VoirMesInformations', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Erreur lors de la récupération des informations');
    const user = await res.json();
    document.getElementById('username').textContent = user.username;
    document.getElementById('first_name').textContent = user.first_name;
    document.getElementById('email').textContent = user.email;
    document.getElementById('city').value = user.city || '';
  } catch (e) {
    alert(e.message);
  }
}

// --- Mettre à jour infos utilisateur ---
document.getElementById('update-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = document.getElementById('city').value.trim();
  const password = document.getElementById('password').value;

  const body = {};
  if (city) body.city = city;
  if (password) body.password = password;

  if (Object.keys(body).length === 0) {
    showUpdateMessage('Aucune modification détectée.', 'error');
    return;
  }

  try {
    const res = await fetch('http://127.0.0.1:8000/users/Utilisateurs/UpdateUser', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
  const err = await res.json();
  
  // Pour gérer le 422 venant de Pydantic
  if (err.detail && Array.isArray(err.detail)) {
    const firstError = err.detail[0];
    const message = firstError.msg || 'Erreur lors de la mise à jour.';
    showFlashMessage(message, '#f44336'); // rouge pour erreur
  } else {
    showFlashMessage(err.detail || 'Erreur lors de la mise à jour.', '#f44336');
  }
  return;
}
    showFlashMessage('Informations mises à jour avec succès.');
    document.getElementById('password').value = '';
    fetchUserInfo();
  } catch {
    showUpdateMessage('Erreur réseau.', 'error');
  }
});

function showUpdateMessage(msg, type) {
  const el = document.getElementById('update-msg');
  el.textContent = msg;
  el.className = type;
}

// --- Liste des réservations ---
async function fetchReservations() {
  try {
    const res = await fetch('http://127.0.0.1:8000/reservations/ListerReservations/', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Erreur lors de la récupération des réservations');
    const reservations = await res.json();
    const tbody = document.getElementById('reservations-list');
    tbody.innerHTML = '';
    
	const today = new Date();
    reservations.forEach(r => {
  const tr = document.createElement('tr');

  let actions = '';
  const dateFin = new Date(r.date_fin);

  if (r.statut.toLowerCase() === 'confirmée') {
     if (dateFin < today) {
          // Location terminée
          actions = `
            <div>
              <p><strong>Location terminée.</strong></p>
            </div>
          `;
        } else {
          // Location en cours ou future
          actions = `
            <div>
              <p><strong>Réservation confirmée.</strong><br>Merci de contacter le garage :</p>
              <p><strong>Email</strong> : ${r.garage.email || 'Non disponible'}</p>
              <p><strong>Téléphone</strong> : ${r.garage.telephone || 'Non disponible'}</p>
              <p><strong>Adresse</strong> : ${r.garage.adresse || 'Non disponible'}</p>
              <p><strong>Ville</strong> : ${r.garage.ville || 'Non disponible'}</p>
            </div>
          `;
        }
      } else {
        // Non confirmée, actions possibles
        actions = `
          <button onclick="editReservation(${r.reservation_id})">Modifier</button>
          <button onclick="deleteReservation(${r.reservation_id})" class="danger-btn">Supprimer</button>
        `;
      }
  const vehicule = r.vehicule;
  const imagesHTML = vehicule && vehicule.images && vehicule.images.length > 0
        ? `<img src="${vehicule.images[0]}" alt="Image de ${vehicule.modele}" class="vehicule-image"/>`
        : '<span>Aucune image</span>';

  tr.innerHTML = `
    <td>${imagesHTML}</td>
    <td>${new Date(r.date_debut).toLocaleDateString()}</td>
    <td>${new Date(r.date_fin).toLocaleDateString()}</td>
    <td>${r.statut}</td>
    <td>${actions}</td>
  `;

  tbody.appendChild(tr);
});
  } catch (e) {
    alert(e.message);
  }
}

// --- Suppression réservation ---
async function deleteReservation(reservation_id) {
  if (!confirm("Voulez-vous vraiment supprimer cette réservation ?")) return;
  try {
    const res = await fetch(`http://127.0.0.1:8000/reservations/SupprimerReservations/${reservation_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || 'Erreur lors de la suppression.');
      return;
    }
    
    showFlashMessage('Réservation supprimée.');
    fetchReservations();
  } catch {
    alert('Erreur réseau.');
  }
}

// --- Modifier réservation (à compléter selon ton UI) ---
// Soumission formulaire modification
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editReservationId = document.getElementById('editReservationId');
const dateDebutInput = document.getElementById('dateDebut');
const dateFinInput = document.getElementById('dateFin');
const closeModalBtn = document.getElementById('closeModal');

// Fonction pour ouvrir la modale et préremplir les champs
async function editReservation(reservation_id) {
  try {
    const res = await fetch('http://127.0.0.1:8000/reservations/ListerReservations/', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Erreur lors de la récupération des réservations');
    const reservations = await res.json();
    const reservation = reservations.find(r => r.reservation_id === reservation_id);
    if (!reservation) throw new Error('Réservation introuvable');

    // Remplir le formulaire avec les données de la réservation
    editReservationId.value = reservation.reservation_id;
    dateDebutInput.value = reservation.date_debut.split('T')[0]; // Format YYYY-MM-DD
    dateFinInput.value = reservation.date_fin.split('T')[0];

    // Afficher la modale
    editModal.style.display = 'flex';

  } catch (e) {
    alert(e.message);
  }
}

// Fermer la modale quand on clique sur la croix
closeModalBtn.addEventListener('click', () => {
  editModal.style.display = 'none';
});

// Fermer la modale quand on clique à l'extérieur du contenu
window.addEventListener('click', (event) => {
  if (event.target === editModal) {
    editModal.style.display = 'none';
  }
});

// Soumission du formulaire de modification
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = editReservationId.value;
  const data = {
    date_debut: dateDebutInput.value,
    date_fin: dateFinInput.value,
  };

  // Validation simple
  if (!data.date_debut || !data.date_fin) {
    
    showFlashMessage('Veuillez remplir toutes les dates.');
    
    return;
  }

  if (data.date_debut >= data.date_fin) {
    
    showFlashMessage('La date de début doit être avant la date de fin.');
    return;
  }

  const submitBtn = editForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch(`http://127.0.0.1:8000/reservations/ModifierReservations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      let errMsg = 'Erreur lors de la modification.';
      try {
        const err = await res.json();
        errMsg = err.detail || errMsg;
      } catch {}
      alert(errMsg);
      submitBtn.disabled = false;
      return;
    }

   
    showFlashMessage('Réservation modifiée avec succès.');
    editModal.style.display = 'none';
    fetchReservations(); // actualiser la liste

  } catch (error) {
    alert('Erreur réseau : ' + error.message);
  } finally {
    submitBtn.disabled = false;
  }
});



// --- Supprimer compte ---
document.getElementById('delete-account-btn').addEventListener('click', async () => {
  if (!confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.")) return;
  try {
    const res = await fetch('http://127.0.0.1:8000/users/Utilisateurs/SupprimerMonCompte', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      const err = await res.json();
      showFlashMessage(data.detail || 'Erreur lors de la suppression.');
      return;
    }
    showFlashMessage('Compte supprimé. Vous allez être déconnecté.');
    localStorage.clear();
    window.location.href = '/';
  } catch {
    showFlashMessage('Impossible de supprimer le compte : vous avez des réservations confirmées.', '#f44336');
  }
});

// Initialisation
fetchUserInfo();
fetchReservations();


// Message flash 
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