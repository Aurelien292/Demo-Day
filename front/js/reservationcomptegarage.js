document.addEventListener("DOMContentLoaded", () => {
  const showReservationsBtn = document.getElementById('show-reservations-btn');
  const reservationsContainer = document.getElementById('reservations-container');
  const reservationsList = document.getElementById('reservations-list');

  // Ajouter un événement au bouton "Voir les réservations"
  showReservationsBtn.addEventListener('click', async () => {
    // Vérifier si la section des réservations est déjà visible
    const areReservationsVisible = reservationsContainer.style.display === 'block';
    
    if (areReservationsVisible) {
      // Si les réservations sont visibles, on les cache
      reservationsContainer.style.display = 'none';
      showReservationsBtn.textContent = 'Voir les réservations';  // Changer le texte du bouton
      showReservationsBtn.classList.remove('is-active');
    } else {
      // Afficher les réservations
      reservationsContainer.style.display = 'block';
      showReservationsBtn.textContent = 'Fermer les réservations';  // Changer le texte du bouton
      showReservationsBtn.classList.add('is-active');
      
      // Charger les réservations depuis l'API
      try {
        const response = await fetch('http://127.0.0.1:8000/garages/ConsulterReservations/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('garage_access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Impossible de récupérer les réservations');
        }

        const reservations = await response.json();

        // Insérer les réservations dans le tableau
        reservationsList.innerHTML = ''; // Vider la liste avant de rajouter les éléments

        reservations.forEach(reservation => {
          // Formatage des dates pour chaque réservation
          const dateDebut = new Date(reservation.date_debut);
          const dateFin = new Date(reservation.date_fin);

          const formattedDateDebut = dateDebut.toLocaleDateString('fr-FR');  // Format français pour la date de début
          const formattedDateFin = dateFin.toLocaleDateString('fr-FR');  // Format français pour la date de fin

          // Si le véhicule est présent dans la réponse et a une marque et un modèle
          const formattedMarque = reservation.vehicule_marque ? reservation.vehicule_marque.toUpperCase() : 'Inconnu';
          const formattedModele = reservation.vehicule_modele ? reservation.vehicule_modele.toUpperCase() : 'Inconnu';

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${formattedMarque}</td>
            <td>${formattedModele}</td>
            <td>${formattedDateDebut}</td>
            <td>${formattedDateFin}</td>
            <td>${reservation.statut}</td>
            <td><button class="confirm-btn" data-id="${reservation.reservation_id}">Confirmer</button></td>
          `;
          reservationsList.appendChild(row);
        });

        // Ajouter des événements pour les boutons de confirmation
        document.querySelectorAll('.confirm-btn').forEach(button => {
          button.addEventListener('click', async (event) => {
            const reservationId = event.target.getAttribute('data-id');

            try {
              const confirmResponse = await fetch(`http://127.0.0.1:8000/garages/ConfirmerReservation/${reservationId}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('garage_access_token')}`,
                  'Content-Type': 'application/json'
                }
              });

              if (!confirmResponse.ok) {
                throw new Error('Erreur lors de la confirmation de la réservation');
              }

              const confirmData = await confirmResponse.json();
              showFlashMessage("Réservation confirmée", "#4CAF50"); // Flash message de succès
              // Optionnel : Recharger la page pour voir les mises à jour ou mettre à jour dynamiquement
              location.reload(); 

            } catch (error) {
              console.error('Erreur:', error);
              showFlashMessage("Erreur lors de la confirmation de la réservation", "#FF5733"); // Flash message d'erreur
            }
          });
        });

      } catch (error) {
        console.error('Erreur lors de la récupération des réservations:', error);
      }
    }
  });
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
