document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const vehicule_id = params.get("id");

  if (!vehicule_id) {
    document.getElementById("fiche-container").innerHTML = "<p>ID manquant dans l’URL.</p>";
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/Vehicules/ConsulterFicheVehicules/${vehicule_id}`);
    if (!response.ok) throw new Error("Véhicule non trouvé");

    const data = await response.json();
    const vehicule = data.vehicule;
    const vehicules_du_garage = data.vehicules_du_garage;

    // Récupérer les avis du véhicule
    try {
  const avisVehiculeResponse = await fetch(`http://127.0.0.1:8000/avis/Avis/${vehicule_id}`);
  if (!avisVehiculeResponse.ok) throw new Error("Impossible de récupérer les avis du véhicule");
  avisVehiculeData = await avisVehiculeResponse.json();
} catch (error) {
  console.error(error.message);  // Logue l'erreur pour le débogage
  avisVehiculeData = []; // Assure que la variable est un tableau vide en cas d'erreur
}

    

    const ficheHTML = `
      <div class="fiche">
        <!-- Informations du véhicule -->
        <div class="fiche-vehicule">
          <h3>Informations du véhicule</h3>
          <div class="fiche-images">
            ${vehicule.images && vehicule.images.length > 0
              ? vehicule.images.map(img => `<img src="${img}" alt="Image véhicule">`).join("")
              : "<p>Aucune image disponible.</p>"
            }
          </div>
          <div class="fiche-infos">
            <p><strong>Marque et modèle :</strong> ${vehicule.marque} ${vehicule.modele}</p>
            <p><strong>Prix par jour :</strong> ${vehicule.prix_par_jour} €</p>
            <p><strong>Carburant :</strong> ${vehicule.carburant}</p>
            <p><strong>Date de disponibilité :</strong> ${vehicule.date_disponibilite ? vehicule.date_disponibilite : "Disponible immédiatement"}</p>
            <p><strong>Ville :</strong> ${vehicule.ville}</p>
            <p><strong>Type :</strong> ${vehicule.type_vehicule}</p>
            <p><strong>Boîte de vitesse :</strong> ${vehicule.boite_vitesse}</p>
            <p><strong>Options :</strong> ${vehicule.options && vehicule.options.length ? vehicule.options.join(', ') : "Aucune"}</p>
            <p><strong>Kilométrage :</strong> ${vehicule.kilometrage} km</p>
            <p><strong>Année de circulation :</strong> ${vehicule.annee_circulation}</p>
            <p><strong>Crit'air :</strong> ${vehicule.crit_air}</p>
            <p><strong>Permis requis :</strong> ${vehicule.permis_requis ? "Oui" : "Non"}</p>
          </div>
        </div>

        <!-- Informations du garage -->
        <div class="fiche-garage">
          <h3>Informations du garage</h3>
          <div class="fiche-infos">
            <p><strong>Nom du garage :</strong> ${vehicule.garage_nom}</p><br>
            <p><strong>Ville du garage :</strong> ${vehicule.garage_ville}</p><br>
            <p><strong>Information :</strong> ${vehicule.garage_description ? vehicule.garage_description : "Aucune description disponible."}</p>
          </div>
        </div>

        <!-- Liste des autres véhicules du garage -->
        <div class="fiche-autres-vehicules">
          <h3>Autres véhicules du garage</h3><br>
          <ul>
    ${vehicules_du_garage.map(v => `
      <li class="vehicule-item">
        <div class="vehicule-info">
          <p><strong>${v.marque} ${v.modele}</strong></p>
          <p>Prix par jour : ${v.prix_par_jour} €</p>
        </div>
        <div class="vehicule-action">
          <a href="../html/fiche_vehicule.html?id=${v.vehicule_id}">
            <button type="button">Voir annonce</button>
          </a>
        </div>
      </li>
    `).join('')}
  </ul>
        </div>

        <!-- Formulaire pour laisser un avis -->
        <div class="fiche-avis">
          <h3>Laisser un avis</h3>
          <form id="form-avis">
            <div>
              <label for="note">Note (sur 5) :</label>
              <input type="number" id="note" name="note" min="1" max="5" required>
            </div>
            <div>
              <label for="commentaire">Commentaire :</label>
              <textarea id="commentaire" name="commentaire" rows="4" required></textarea>
            </div>
            <div>
              <label for="type-avis">Laisser un avis sur :</label>
              <label><input type="radio" name="type-avis" value="vehicule" checked> Véhicule</label>
              <label><input type="radio" name="type-avis" value="garage"> Garage</label>
            </div>
            <button type="submit">Envoyer l'avis</button>
          </form>
        </div>
      </div>

       

        <!-- Affichage des avis du véhicule -->
<div class="affichage-avis">
  <h3>Avis sur le véhicule</h3>
  <ul>
    ${avisVehiculeData.length > 0 ? avisVehiculeData.map(avis => `
      <li>
        <p><strong>Note :</strong> ${avis.note}/5</p><br>
        <p><strong>Commentaire :</strong> ${avis.commentaire}</p>
        <p><strong>Date :</strong> ${avis.date_avis}</p><br>
      </li>
    `).join('') : '<p>Aucun avis pour ce véhicule.</p>'}
  </ul>
</div>

    `;

    // Insérer le contenu dans l'élément approprié
    document.getElementById("fiche-container").innerHTML = ficheHTML;

    // Gestion de l'envoi de l'avis
    document.getElementById("form-avis").addEventListener("submit", async (event) => {
      event.preventDefault();

      // Récupération de la note
      const noteElement = document.getElementById("note");
      const note = noteElement ? noteElement.value : null;

      if (!note) {
        
        showFlashMessage("Veuillez attribuer une note.");
        
        return;
      }

      const commentaire = document.getElementById("commentaire").value;
      const typeAvis = document.querySelector('input[name="type-avis"]:checked').value;

      // Décider quel ID envoyer (vehicule_id ou garage_id)
      const requestData = {
  note: note,
  commentaire: commentaire,
  date_avis: new Date().toISOString().split('T')[0], // format "YYYY-MM-DD"
};

 // Si c'est un avis sur un garage
  if (typeAvis === "garage") {
    requestData.garage_id = vehicule.garage_id; // Ajoute l'ID du garage
  }

// Si c'est un avis sur un véhicule
 // Ajouter l'ID du véhicule si c'est un avis sur un véhicule
    if (typeAvis === "vehicule") {
        requestData.vehicule_id = vehicule_id;  // ID du véhicule
      }


const token = localStorage.getItem('access_token');
fetch('http://127.0.0.1:8000/avis/PosterAvis/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    
  },
  body: JSON.stringify(requestData),
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
  showFlashMessage("Avis envoyé avec succès !");
  
})
.catch((error) => {
  console.error('Error:', error);
  showFlashMessage("Erreur lors de l'envoi de l'avis.");
  
});
    });
  }
  catch (error) {
    document.getElementById("fiche-container").innerHTML = `<p>Erreur : ${error.message}</p>`;
  }
});

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