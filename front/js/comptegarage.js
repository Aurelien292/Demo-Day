let currentGarageData = null;
let currentGarageId = null;
let vehicules = [];

// Récupérer les infos du garage (dont l'id)
async function fetchGarageInfo() {
  
  try {
    const tokenGarage = localStorage.getItem('garage_access_token');
    if (!tokenGarage) {
      alert('Vous devez vous connecter.');
      return;
    }

    const res = await fetch('http://127.0.0.1:8000/garages/MonGarage', {
      headers: {
        'Authorization': `Bearer ${tokenGarage}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error('Erreur réseau lors du chargement des infos du garage');
    const data = await res.json();

    currentGarageData = data;
    currentGarageId = data.garage_id; // Supposons que ce champ existe dans la réponse
    if (!currentGarageId) {
      console.warn("garage_id non trouvé dans la réponse garage");
      
    }

    // Afficher description et infos
    updateGarageDescription(data.description);
    updateGarageInfos(data);

    // Mettre à jour header
    updateHeaderStatus(data);

    // Charger les véhicules du garage
    if (currentGarageId) {
      await fetchVehicules(currentGarageId);
    }
  } catch (err) {
    console.error(err);
    alert(err.message || 'Erreur inconnue lors du chargement du garage');
  }
}

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

// Mise à jour affichage description
function updateGarageDescription(description) {
  const descContainer = document.getElementById('garage-description-container');
  if (descContainer) {
    descContainer.textContent = description || "Aucune description fournie";
  }
}

// Mise à jour affichage infos garage
function updateGarageInfos(data) {
  const garageInfoDiv = document.getElementById('garage-info');
  if (!garageInfoDiv) return;

  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const dateCreation = data.date_creation ? new Date(data.date_creation).toLocaleDateString('fr-FR', options) : "";
  const prochaineFacturation = data.prochaine_facturation ? new Date(data.prochaine_facturation).toLocaleDateString('fr-FR', options) : "";


  const titleH2 = document.getElementById('garage-title');
if (titleH2 && data.nom) {
  titleH2.textContent = data.nom;}


  garageInfoDiv.innerHTML = `
    <div class="info-row"><span class="label">Email :</span><span class="value">${data.email || ''}</span></div>
    <div class="info-row"><span class="label">Ville :</span><span class="value">${data.ville || ''}</span></div>
    <div class="info-row"><span class="label">Adresse :</span><span class="value">${data.adresse || ''}</span></div>
    <div class="info-row"><span class="label">Téléphone :</span><span class="value">${data.telephone || ''}</span></div>
    <div class="info-row"><span class="label">Création du compte le :</span><span class="value">${dateCreation}</span></div>
    <div class="info-row"><span class="label">Coût mensuel :</span><span class="value">${data.tarif_mensuel || 0} €</span></div>
    <div class="info-row"><span class="label">Prochaine facturation :</span><span class="value">${prochaineFacturation}</span></div>
    <div class="info-row"><span class="label">Jours restants Freemium :</span><span class="value">${data.jours_restants_gratuits || 0}</span></div>
  `;
}




// Mise à jour header status
function updateHeaderStatus(data) {
  const freemiumStatusDiv = document.getElementById('freemium-status');
  const nbVehiculesDiv = document.getElementById('nb-vehicules');

  if (freemiumStatusDiv) {
    if (data.jours_restants_gratuits > 0) {
      freemiumStatusDiv.textContent = "Freemium activé";
      freemiumStatusDiv.style.display = "block";
    } else {
      freemiumStatusDiv.style.display = "none";
    }
  }

  if (nbVehiculesDiv && typeof data.nb_vehicules === 'number') {
    nbVehiculesDiv.textContent = `Véhicules : ${data.nb_vehicules}`;
    nbVehiculesDiv.style.display = "block";
  }
}

// Affichage de la liste des véhicules
async function fetchVehicules(garageId) {
  try {
    const tokenGarage = localStorage.getItem('garage_access_token');
    if (!tokenGarage) {
      alert('Vous devez vous connecter.');
      return;
    }

    const res = await fetch(`http://127.0.0.1:8000/garages/ListerVehicules/${garageId}/vehicules/`, {
      headers: {
        'Authorization': `Bearer ${tokenGarage}`,
        'Content-Type': 'application/json',
      },
    });

    

    const fetchedVehicules = await res.json();
    vehicules = fetchedVehicules; 
    
    // Vider la liste des véhicules existante avant de la réafficher
    const vehiculeList = document.getElementById('vehicule-list');
    vehiculeList.innerHTML = '';  // Vider le conteneur
    

    renderVehicules(fetchedVehicules);
  } catch (err) {
    console.error(err);
    alert(err.message || 'Erreur inconnue lors du chargement des véhicules');
  }
}

// Générer HTML pour les véhicules dans la colonne gauche
async function renderVehicules(vehiculesList) {
  const container = document.getElementById('vehicule-list');
  if (!container) return;

  container.innerHTML = ''; // Vider le container

  if (!vehiculesList || vehiculesList.length === 0) {
    container.innerHTML = "<p>Aucun véhicule trouvé.</p>";
    return;
  }


  

  // Fonction interne pour fetcher les détails d'un véhicule
  async function fetchVehiculeDetails(vehicule_id) {
    try {
      const response = await fetch(`http://127.0.0.1:8000/Vehicules/ConsulterFicheVehicules/${vehicule_id}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data.vehicule;
    } catch (error) {
      console.error(`Erreur lors de la récupération du véhicule ${vehicule_id}:`, error);
      return null;
    }
  }

  // Parcours de la liste, fetch détails et affichage
  for (const vehiculeSummary of vehiculesList) {
    // Extraction de l'ID (assume que vehiculeSummary a la propriété vehicule_id)
    const vehicule_id = vehiculeSummary.vehicule_id;
    if (!vehicule_id) {
      console.warn('Vehicule sans ID dans la liste:', vehiculeSummary);
      continue;
    }





    const vehicule = await fetchVehiculeDetails(vehicule_id);
    if (!vehicule) continue; // En cas d'erreur on skip

    // Création du HTML images
    const imageHTML = vehicule.images && vehicule.images.length > 0
  ? vehicule.images.map((fileName, index) => 
      `<div class="vehicule-image-wrapper">
         <img src="${fileName}" class="vehicule-image"/>
         <button class="btn-delete-image" 
                 data-vehicule-id="${vehicule.vehicule_id}" 
                 data-image-url="${fileName}" 
                 title="Supprimer l'image">&times;</button>
       </div>`
    ).join('')
  : `<p>Aucune image disponible pour ce véhicule.</p>`;

    const dispoText = vehicule.disponibilite ? "Disponible" : "Indisponible";
    const dispoClass = vehicule.disponibilite ? "dispo-true" : "dispo-false";

    const vehiculeCard = document.createElement('div');
    vehiculeCard.classList.add('vehicule-card');
    vehiculeCard.dataset.vehiculeId = vehicule.vehicule_id;

    vehiculeCard.innerHTML = `
      <div class="vehicule-card-content">
        <div class="vehicule-images">
          ${imageHTML}
          
        </div>
        
        <div class="vehicule-description">
        
          <h3>${vehicule.marque} ${vehicule.modele}</h3>
          <p>Prix/jour : ${vehicule.prix_par_jour} €</p>
          <p>Carburant : ${vehicule.carburant}</p>
          <p>Type : ${vehicule.type_vehicule}</p>
          <p>Ville : ${vehicule.ville}</p>
          <p class="${dispoClass}">Statut : ${dispoText}</p>
        </div>
        <div class="vehicule-actions">
          <button class="btn-modifier">Modifier</button>
          <button class="btn-supprimer">Supprimer</button>
          <button class="btn-voirplus">Voir plus</button>
          <button class="btn-toggle-dispo">${vehicule.disponibilite ? "Désactiver" : "Activer"}</button>
        </div>
    </div>
      </div>
    `;

    container.appendChild(vehiculeCard);
  }

    document.querySelectorAll('.btn-delete-image').forEach(btn => {
  btn.onclick = async (e) => {
    e.preventDefault();
    
    // Récupérer l'ID du véhicule et l'URL de l'image
    const vehiculeId = btn.getAttribute('data-vehicule-id');
    const imageUrl = btn.getAttribute('data-image-url');
    
    // Vérification des données
    if (!vehiculeId || !imageUrl) {
      return alert("Véhicule ou image non trouvée.");
    }

    // Demander confirmation pour supprimer l'image
    if (!confirm("Supprimer cette image ?")) {
      return;
    }

    try {
      // Récupérer le token d'accès du garage
      const tokenGarage = localStorage.getItem('garage_access_token');
      if (!tokenGarage) {
        throw new Error("Vous devez être connecté.");
      }

      // Encoder correctement l'URL de l'image pour éviter des erreurs avec les caractères spéciaux
      const encodedImageUrl = encodeURIComponent(imageUrl);
      // Construire l'URL de suppression
      const deleteUrl = `http://127.0.0.1:8000/garages/garages/${vehiculeId}/delete_image?image_url=${encodeURIComponent(imageUrl)}`;

      console.log("Delete URL:", deleteUrl);  // Affiche l'URL de suppression pour vérification

      // Faire la requête DELETE à FastAPI
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenGarage}`,
          'Content-Type': 'application/json', // Envoi de contenu en JSON
        },
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la suppression de l'image.");
      }

      // Message de succès
      showFlashMessage("Image supprimée avec succès !");
      
      // Rafraîchir la liste des véhicules après suppression
      await fetchVehicules(currentGarageId); 

    } catch (err) {
      alert(err.message);
    }
  };
});


  setupVehiculeActions(); // Ta fonction d'ajout d'events aux boutons
}




// Attacher listeners aux boutons des véhicules
function setupVehiculeActions() {
 

// Fonction pour afficher le modal avec un message dynamique
function showConfirmationModal(message, actionType, vehiculeId) {
  const modal = document.getElementById('confirmationModal');
  const confirmationMessage = document.getElementById('confirmationMessage');
  const btnOui = document.getElementById('btnOui');
  const btnNon = document.getElementById('btnNon');

  // Affichage du message dynamique
  confirmationMessage.textContent = message;

  // Afficher le modal
  modal.style.display = 'flex';

  // Fonction de confirmation "Oui"
  btnOui.onclick = async () => {
    switch (actionType) {
      case 'supprimer':
        await supprimerVehicule(vehiculeId);
        break;
      case 'toggle-dispo':
        await toggleDisponibilite(vehiculeId, !vehicule.disponibilite);
        break;
      case 'modifier':
        openEditForm(vehiculeId);
        break;
      default:
        console.error('Action inconnue');
        break;
    }
    modal.style.display = 'none'; // Fermer le modal après l'action
  };

  // Fonction d'annulation "Non"
  btnNon.onclick = () => {
    modal.style.display = 'none'; // Fermer le modal
  };
}
// Gestion des boutons "Modifier"
document.querySelectorAll('.btn-modifier').forEach(btn => {
  btn.onclick = (e) => {
    const vehiculeId = getVehiculeIdFromButton(e.target);
    if (!vehiculeId) return;

    // Afficher le modal de confirmation pour modifier
    showConfirmationModal("Voulez-vous vraiment modifier ce véhicule ?", 'modifier', vehiculeId);
  };
});

/* Fonction pour obtenir l'ID du véhicule depuis le bouton
function getVehiculeIdFromButton(button) {
  const vehiculeCard = button.closest('.vehicule-card');
  return vehiculeCard ? vehiculeCard.dataset.vehiculeId : null;
}*/


// Helper pour récupérer l'id du véhicule depuis un bouton (dans la carte)
function getVehiculeIdFromButton(button) {
  const card = button.closest('.vehicule-card');
  if (!card) return null;
  return parseInt(card.dataset.vehiculeId);
}



/*--------------------------------------------------------------------------------------------------------------------------------------------*/


async function openEditForm(vehiculeId) {
    const formContainer = document.getElementById('form-container');
    const form = document.getElementById('form-edit-vehicule');
    const saveBtn = document.getElementById('save-btn-vehicule');
    const cancelBtnV = document.getElementById('cancel-edit-btn');
    const vehiculeList = document.getElementById('vehicule-list');
    
    // Afficher le formulaire d'édition et masquer la liste des véhicules
    formContainer.style.display = 'block';  // Affiche le formulaire
    vehiculeList.style.display = 'none';  // Masque la liste des véhicules

    try {
        // Effectuer une requête pour récupérer les données du véhicule
        const response = await fetch(`http://127.0.0.1:8000/Vehicules/ConsulterFicheVehicules/${vehiculeId}`);
        
        if (!response.ok) throw new Error('Erreur lors de la récupération des informations du véhicule');
        
        const { vehicule } = await response.json();
        
        // Remplir le formulaire avec les informations du véhicule
        document.getElementById('edit-prix-par-jour').value = vehicule.prix_par_jour || '';
        document.getElementById('edit-carburant').value = vehicule.carburant || '';
        
        // Gérer les options (si elles existent) : joindre les options avec une virgule si c'est un tableau
        document.getElementById('edit-options').value = vehicule.options && Array.isArray(vehicule.options) 
            ? vehicule.options.join(', ') 
            : '';
        
        document.getElementById('edit-kilometrage').value = vehicule.kilometrage !== null ? vehicule.kilometrage : '';
        
    } catch (error) {
        console.error('Erreur lors de la récupération des infos du véhicule:', error);
    }

    // Remplacer l'addEventListener par onsubmit directement
    form.onsubmit = async (e) => {
        e.preventDefault();  // Empêcher le comportement par défaut du submit
        
        // Récupérer les données des champs
        const prixParJour = document.getElementById('edit-prix-par-jour').value;
        const carburant = document.getElementById('edit-carburant').value;
        const options = document.getElementById('edit-options').value;
        const kilometrage = document.getElementById('edit-kilometrage').value;

        const updatedData = {
            prix_par_jour: prixParJour,
            carburant,
            options: options.split(',').map(option => option.trim()),  // Séparer les options par virgules
            kilometrage: kilometrage || null // Si le kilométrage n'est pas rempli, l'envoyer comme null
        };
        
        console.log("Données envoyées : ", updatedData);

        try {
            const tokenGarage = localStorage.getItem('garage_access_token');
            if (!tokenGarage) throw new Error("Vous devez vous connecter.");
            
            // Envoi des données de mise à jour
            const response = await fetch(`http://127.0.0.1:8000/garages/ModifierVehicule/${vehiculeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenGarage}`,
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) throw new Error("Erreur lors de la modification du véhicule");

            const updatedVehicule = await response.json();
            showFlashMessage("Véhicule modifié avec succès !");
            console.log(updatedVehicule);

            // Vider la liste des véhicules (cela supprimera les doublons)
            const vehiculeList = document.getElementById('vehicule-list');
            vehiculeList.innerHTML = '';

            // Fermer le formulaire et revenir à la liste des véhicules
            formContainer.style.display = 'none';  // Masquer le formulaire
            vehiculeList.style.display = 'block';  // Afficher la liste des véhicules

            // Rafraîchir la liste des véhicules
            await fetchVehicules(currentGarageId);  // Rafraîchir les véhicules après modification

        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            // Réactiver les boutons après la mise à jour
            saveBtn.disabled = false;
            cancelBtnV.disabled = false;
        }
    };

    // Gérer le bouton "Annuler" pour revenir à la liste des véhicules
    cancelBtnV.addEventListener('click', (e) => {
        e.preventDefault();  // Empêcher le comportement par défaut du bouton
        formContainer.style.display = 'none';  // Masquer le formulaire
        vehiculeList.style.display = 'block';  // Afficher la liste des véhicules
    });
}



/*--------------------------------------------------------------------------------------------------------------------------------------------*/



// Gestion des boutons "Supprimer"
document.querySelectorAll('.btn-supprimer').forEach(btn => {
  btn.onclick = (e) => {
    const vehiculeId = getVehiculeIdFromButton(e.target);
    if (!vehiculeId) return;

    // Afficher le modal de confirmation pour la suppression
    showConfirmationModal("Voulez-vous vraiment supprimer ce véhicule ?", 'supprimer', vehiculeId);
  };
});
// Fonction pour supprimer le véhicule
async function supprimerVehicule(vehicule_id) {
  try {
    const tokenGarage = localStorage.getItem('garage_access_token');
    if (!tokenGarage) {
      alert('Vous devez vous connecter.');
      return;
    }

    const res = await fetch(`http://127.0.0.1:8000/garages/SupprimeVehicules/${vehicule_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tokenGarage}`,
      },
    });

    if (!res.ok) throw new Error('Erreur lors de la suppression du véhicule');

    showFlashMessage("Véhicule supprimé avec succès !");

    // Rafraîchir la liste des véhicules
    await fetchVehicules(currentGarageId);
  } catch (err) {
    console.error(err);
    showFlashMessage("Erreur lors de la suppression du véhicule.", "#f44336");
  }
}
  // Voir plus
  document.querySelectorAll('.btn-voirplus').forEach(btn => {
    btn.onclick = (e) => {
      const vehiculeId = getVehiculeIdFromButton(e.target);
      if (!vehiculeId) return;
      afficherDetailsVehicule(vehiculeId);
    };
  });

// Afficher plus d'infos sur un véhicule (popup ou section dédiée)
async function afficherDetailsVehicule(vehiculeId) {
  try {
    // On va chercher les détails complets à l'API
    const response = await fetch(`http://127.0.0.1:8000/Vehicules/ConsulterFicheVehicules/${vehiculeId}`);
    if (!response.ok) throw new Error("Erreur lors de la récupération des détails du véhicule");
    const data = await response.json();
    const vehicule = data.vehicule; // L'objet détaillé

    let optionsText = vehicule.options && vehicule.options.length > 0 ? vehicule.options.join(", ") : "Aucune option";
    const vehiculeHTML = `
      <h3>${vehicule.marque} ${vehicule.modele} (${vehicule.annee_circulation || ""})</h3>
      <p><strong>Prix par jour :</strong> ${vehicule.prix_par_jour} €</p>
      <p><strong>Carburant :</strong> ${vehicule.carburant}</p>
      <p><strong>Boîte de vitesse :</strong> ${vehicule.boite_vitesse || ""}</p>
      <p><strong>Nombre de portes :</strong> ${vehicule.nb_portes ?? ""}</p>
      <p><strong>Nombre de places :</strong> ${vehicule.nb_places ?? ""}</p>
      <p><strong>Kilométrage :</strong> ${vehicule.kilometrage ?? ""}</p>
      <p><strong>Crit'Air :</strong> ${vehicule.crit_air || ""}</p>
      <p><strong>Permis requis :</strong> ${vehicule.permis_requis ? 'Oui' : 'Non'}</p>
      <p><strong>Options :</strong> ${optionsText || "Aucune option"}</p>
      <p><strong>Disponibilité :</strong> ${vehicule.disponibilite ? 'Disponible' : 'Indisponible'}</p>
      <p><strong>Ville :</strong> ${vehicule.ville || ""}</p>
    `;

    // Ajouter les informations au modal
    const vehiculeDetails = document.getElementById("vehicule-details");
    vehiculeDetails.innerHTML = vehiculeHTML;

    // Afficher le modal
    const vehiculeModal = document.getElementById("vehicule-modal");
    vehiculeModal.style.display = "block";

    const closeModal = document.getElementById("close-modal-vehicule");
    closeModal.onclick = () => {
      vehiculeModal.style.display = "none";
    };

    // Fermer le modal si on clique à l'extérieur
    window.onclick = (event) => {
      if (event.target === vehiculeModal) {
        vehiculeModal.style.display = "none";
      }
    };
  } catch (err) {
    alert("Impossible d'afficher les détails du véhicule.");
    console.error(err);
  }
}


// Activer / Désactiver dispo
document.querySelectorAll('.btn-toggle-dispo').forEach(btn => {
  btn.onclick = async (e) => {
    e.preventDefault();
    const vehiculeId = getVehiculeIdFromButton(e.target);
    if (!vehiculeId) return;
    const vehicule = vehicules.find(v => v.vehicule_id === vehiculeId);
    if (!vehicule) return;

    const nouvelleDisponibilite = !vehicule.disponibilite;
    await toggleDisponibilite(vehiculeId, nouvelleDisponibilite);

    // Mise à jour du texte du bouton selon la nouvelle disponibilité
    e.target.textContent = nouvelleDisponibilite ? "Désactiver" : "Activer";

    
  };
});
}
// Fonction pour mettre à jour la disponibilité du véhicule via l'API
// Fonction pour mettre à jour la disponibilité
async function toggleDisponibilite(vehiculeId, nouvelleDispo) {
  
  try {
    const tokenGarage = localStorage.getItem('garage_access_token');
    if (!tokenGarage) {
      alert('Vous devez vous connecter.');
      return;
    }

    const res = await fetch(`http://127.0.0.1:8000/Vehicules/DisponibiliteVehicules/${vehiculeId}/disponibilite?disponibilite=${nouvelleDispo}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokenGarage}`,
      },
    });

    if (!res.ok) throw new Error('Erreur lors de la mise à jour de la disponibilité');

    // Rafraîchir la liste des véhicules
    await fetchVehicules(currentGarageId);
  } catch (err) {
    console.error(err);
    // Si erreur, afficher un message d'erreur
    afficherMessage(vehiculeId, 'Erreur lors de la mise à jour de la disponibilité', 'error');
  }
}



// Edition description 
async function setupEditDescription() {
  const editBtn = document.getElementById('edit-description-btn');
  const cancelBtn = document.getElementById('cancel-description-btn');
  const descContainer = document.getElementById('garage-description-container');

  if (!editBtn || !descContainer || !cancelBtn) return;

  let isEditing = false;
  let originalDesc = descContainer.textContent.trim();

  editBtn.addEventListener('click', async () => {
    if (!isEditing) {
      originalDesc = descContainer.textContent.trim();
      descContainer.innerHTML = `<textarea id="desc-textarea" rows="5" style="width: 100%;">${originalDesc}</textarea>`;
      descContainer.classList.add('highlight');
      editBtn.textContent = "Enregistrer description";
      cancelBtn.style.display = "inline-block";
      isEditing = true;
    } else {
      const textarea = document.getElementById('desc-textarea');
      if (!textarea) return;

      const newDesc = textarea.value.trim();

      try {
        const tokenGarage = localStorage.getItem('garage_access_token');
        if (!tokenGarage) throw new Error("Vous devez vous connecter.");

        const res = await fetch('http://127.0.0.1:8000/garages/MonGarage', {
          method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenGarage}`,
          },
          body: JSON.stringify({ description: newDesc }),
        });

        if (!res.ok) throw new Error('Erreur lors de la mise à jour');

        const data = await res.json();
        descContainer.textContent = data.description || "Aucune description fournie";
        descContainer.classList.remove('highlight');
        editBtn.textContent = "Modifier description";
        cancelBtn.style.display = "none";
        isEditing = false;

        // Met à jour local et infos complètes
        currentGarageData.description = data.description;
        await fetchGarageInfo();
      } catch (err) {
        alert(err.message);
        console.error(err);
      }
    }
  });

  cancelBtn.addEventListener('click', () => {
    descContainer.textContent = originalDesc;
    descContainer.classList.remove('highlight');
    editBtn.textContent = "Modifier description";
    cancelBtn.style.display = "none";
    isEditing = false;
  });
}


async function setupEditInfo() {
  const editBtn = document.getElementById('edit-info-btn');
  const infoDiv = document.getElementById('garage-info');
  const cancelEditBtn = document.getElementById('cancel-info-btn');
  const editFormDiv = document.getElementById('edit-info-form'); // Formulaire d'édition
  const saveBtnGarage = document.querySelector('.save-btn-garage');
  
  if (!editBtn || !infoDiv || !cancelEditBtn || !editFormDiv) return;

  let isEditing = false;
  let originalData = {};

  // Fonction pour annuler l'édition et restaurer les données
  cancelEditBtn.addEventListener('click', () => {
    // Restaurer les données actuelles
    updateGarageInfos(currentGarageData);

    // Cacher le formulaire d'édition et afficher les infos
    editFormDiv.style.display = 'none';  // Cacher le formulaire
    infoDiv.style.display = 'block';     // Afficher les infos
    editBtn.style.display = 'inline-block';  // Réafficher le bouton "Modifier infos"
    isEditing = false;
  });

  // Fonction pour afficher le formulaire d'édition et cacher les infos
  editBtn.addEventListener('click', async () => {
    if (!isEditing) {
      // Sauvegarde des données actuelles pour annulation
      originalData = {
        email: currentGarageData.email || '',
        ville: currentGarageData.ville || '',
        adresse: currentGarageData.adresse || '',
        telephone: currentGarageData.telephone || '',
      };

      // Remplir le formulaire avec les données existantes
      
      document.getElementById('edit-email').value = originalData.email;
      document.getElementById('edit-ville').value = originalData.ville;
      document.getElementById('edit-adresse').value = originalData.adresse;
      document.getElementById('edit-telephone').value = originalData.telephone;
      
      // Afficher le formulaire d'édition et cacher les infos
      editFormDiv.style.display = 'block';  // Afficher le formulaire
      infoDiv.style.display = 'none';       // Cacher les infos
      editBtn.style.display = 'none';       // Cacher le bouton "Modifier infos"
      isEditing = true;
    }
  });

  // Gestion de la soumission du formulaire
  saveBtnGarage.addEventListener('click', async (e) => {
    e.preventDefault(); // Empêcher la soumission normale du formulaire

    // Validation des champs avant de les soumettre
    const email = document.getElementById('edit-email').value.trim();
    const ville = document.getElementById('edit-ville').value.trim();
    const adresse = document.getElementById('edit-adresse').value.trim();
    const telephone = document.getElementById('edit-telephone').value.trim();

    if (!email || !ville || !adresse || !telephone) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    // Désactiver les boutons pendant la mise à jour
    cancelEditBtn.disabled = true;
    editBtn.disabled = true;
    saveBtnGarage.disabled = true;

    try {
      const tokenGarage = localStorage.getItem('garage_access_token');
      if (!tokenGarage) throw new Error("Vous devez vous connecter.");

      const updatedData = { email, ville, adresse, telephone };

      // Envoi de la requête pour mettre à jour les informations du garage
      const res = await fetch(`http://127.0.0.1:8000/garages/MonGarage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenGarage}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error('Erreur lors de la mise à jour des infos');
      showFlashMessage("Les informations du garage ont été mises à jour.");

      // Récupérer les infos mises à jour du garage
      const updatedGarageRes = await fetch(`http://127.0.0.1:8000/garages/MonGarage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenGarage}`,
        }
      });

      if (!updatedGarageRes.ok) throw new Error('Erreur lors de la récupération des données du garage');

      const data = await updatedGarageRes.json();
      currentGarageData = data;
      updateGarageInfos(data);

      // Revenir à l'affichage initial après mise à jour
      editFormDiv.style.display = 'none';  // Cacher le formulaire
      infoDiv.style.display = 'block';     // Afficher les infos
      editBtn.style.display = 'inline-block';  // Réafficher le bouton "Modifier infos"
      
      isEditing = false;

    } catch (err) {
      alert(err.message);
      console.error(err);
    } finally {
      cancelEditBtn.disabled = false;
      editBtn.disabled = false;
      saveBtnGarage.disabled = false;
    }
  });
}




// ==== Affichage du popup Soumission du formulaire d’ajout Vehicule ====
const addVehiculeBtn = document.createElement('button');
addVehiculeBtn.textContent = "Ajouter un véhicule";
addVehiculeBtn.classList.add('btn-ajouter-vehicule');

addVehiculeBtn.onclick = () => {
  const currentFiles = [];

const input = document.getElementById('ajout-images');
const container = document.getElementById('preview-images-container');

input.addEventListener('change', function () {
  const selected = Array.from(this.files);

  if (currentFiles.length + selected.length > 4) {
    showFlashMessage("Vous pouvez ajouter au maximum 4 images.");
    this.value = '';
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

   selected.forEach((file) => {
    if (!allowedTypes.includes(file.type)) {
      showFlashMessage(`Fichier "${file.name}" non autorisé. Seuls les formats JPG, JPEG et PNG sont acceptés.`);
      return;
    }

    currentFiles.push(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      wrapper.style.marginRight = '10px';

      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.objectFit = 'cover';

      const closeBtn = document.createElement('span');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '0';
      closeBtn.style.right = '0';
      closeBtn.style.background = '#fff';
      closeBtn.style.cursor = 'pointer';

      closeBtn.onclick = () => {
        wrapper.remove();
        const indexToRemove = currentFiles.indexOf(file);
        if (indexToRemove !== -1) currentFiles.splice(indexToRemove, 1);
        updateFileList(input, currentFiles);
      };

      wrapper.appendChild(img);
      wrapper.appendChild(closeBtn);
      container.appendChild(wrapper);
    };

    reader.readAsDataURL(file);
  });

  updateFileList(input, currentFiles);
});


  document.getElementById('modal-ajout-vehicule').style.display = 'block';
  
  document.getElementById('ajout-permis-requis').checked = true;
};

document.querySelector('#vehicules-list-container h2').before(addVehiculeBtn);

function updateFileList(input, filesArray) {
  const dataTransfer = new DataTransfer();
  filesArray.forEach(file => dataTransfer.items.add(file));
  input.files = dataTransfer.files;
   
}

// ==== Fermeture du popup ====
document.getElementById('close-ajout-modal').onclick = () => {
  document.body.classList.remove('modal-open');
  document.getElementById('modal-ajout-vehicule').style.display = 'none';
};

// ==== Soumission du formulaire d’ajout ====
document.getElementById('form-ajout-vehicule').onsubmit = async (e) => {
  e.preventDefault();

  const tokenGarage = localStorage.getItem('garage_access_token');
  if (!tokenGarage) return alert("Vous devez être connecté.");

  // Récupération des données
  const modele = document.getElementById('ajout-modele').value;
  const marque = document.getElementById('ajout-marque').value;
  const carburant = document.getElementById('ajout-carburant').value;
  const type_vehicule = document.getElementById('ajout-type-vehicule').value;
  const prix_par_jour = parseFloat(document.getElementById('ajout-prix-par-jour').value);
  const optionsRaw = document.getElementById('ajout-options').value.trim();
  const options = optionsRaw ? optionsRaw.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0) : [];
  const kilometrage = parseInt(document.getElementById('ajout-kilometrage').value, 10) || null;
  const boite_vitesse = document.getElementById('ajout-boite-vitesse').value;
  const crit_air = document.getElementById('ajout-crit-air').value;
  const permis_requis = document.getElementById('ajout-permis-requis').checked;

  const vehiculeData = {
    modele,
    marque,
    carburant,
    prix_par_jour,
    options,
    kilometrage,
    disponibilite: true,
    type_vehicule,
    boite_vitesse,
    nb_portes: parseInt(document.getElementById('ajout-nb-portes').value, 10),
    nb_places: parseInt(document.getElementById('ajout-nb-places').value, 10),
    annee_circulation: parseInt(document.getElementById('ajout-annee-circulation').value, 10),
    crit_air,
    permis_requis
  };

  try {
    // Envoi des données du véhicule
    const res = await fetch("http://127.0.0.1:8000/garages/AjouterVehicules/", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenGarage}`
      },
      body: JSON.stringify(vehiculeData)
    });

    if (!res.ok) {
      const errorData = await res.json();
      let message = "Erreur lors de l'ajout du véhicule";
      if (errorData.detail) {
        message = Array.isArray(errorData.detail)
          ? errorData.detail.map(d => typeof d === "string" ? d : JSON.stringify(d)).join(", ")
          : typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
      throw new Error(message);
    }

    const newVehicule = await res.json();

    // ==== Upload des images si présentes ====
    const imageInput = document.getElementById('ajout-images');
    if (imageInput.files.length > 0) {
      const formData = new FormData();
      const uploadedFiles = new Set();
      for (let i = 0; i < Math.min(imageInput.files.length, 4); i++) {
         const file = imageInput.files[i];
    if (!uploadedFiles.has(file.name)) {
        formData.append('images', file);
        uploadedFiles.add(file.name);  // Marquer le fichier comme ajouté
    }

      }

      const uploadRes = await fetch(`http://127.0.0.1:8000/garages/upload_images/${newVehicule.vehicule_id}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${tokenGarage}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json();
        console.warn("Erreur upload images :", uploadErr.detail || uploadErr);
      } else {
        console.log("Images uploadées avec succès.");
      }
    }
    
    showFlashMessage("Véhicule ajouté avec succès !");
    document.getElementById('modal-ajout-vehicule').style.display = 'none';
    document.getElementById('form-ajout-vehicule').reset();
    document.getElementById('ajout-images').value = '';

    await fetchVehicules(currentGarageId);

  } catch (err) {
    console.error(err);
    alert("Erreur : " + err.message);
  }
};

// ==== Annulation de l’ajout ====
document.getElementById("cancel-ajout-vehicule-btn").onclick = () => {
  document.getElementById("modal-confirm-cancel").style.display = "block";
};

document.getElementById("confirm-cancel-ok").onclick = () => {
  document.getElementById("form-ajout-vehicule").reset();
  document.getElementById("modal-ajout-vehicule").style.display = "none";
  document.getElementById("modal-confirm-cancel").style.display = "none";
};

document.getElementById("confirm-cancel-cancel").onclick = () => {
  document.getElementById("modal-confirm-cancel").style.display = "none";
};


// Initialisation générale
window.addEventListener('DOMContentLoaded', async () => {
  await fetchGarageInfo();
  setupEditDescription();
  setupEditInfo();
});





/*
fetchGarageInfo : Récupère les infos du garage et initialise l’affichage.
updateGarageDescription : Met à jour l’affichage de la description du garage.
updateGarageInfos : Met à jour l’affichage des infos du garage (email, ville, etc.).
updateHeaderStatus : Met à jour l’état du header (statut freemium, nb véhicules).
fetchVehicules : Récupère la liste des véhicules du garage.
renderVehicules : Affiche la liste des véhicules dans le DOM.
setupVehiculeActions : Attache les listeners aux boutons des cartes véhicules.
showConfirmationModal : Affiche un modal de confirmation pour les actions critiques.
getVehiculeIdFromButton : Helper pour récupérer l’ID véhicule depuis un bouton.
openModifierVehiculeModal : (à implémenter) Ouvre le formulaire de modification.
supprimerVehicule : Supprime un véhicule via l’API.
afficherDetailsVehicule : Affiche les détails d’un véhicule (alert).
toggleDisponibilite : Met à jour la disponibilité d’un véhicule via l’API.
setupEditDescription : Gère l’édition de la description du garage.
setupEditInfo : Gère l’édition des infos du garage.
*/