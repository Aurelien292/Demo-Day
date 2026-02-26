// Fonction pour ajouter une image
async function uploadImage(vehiculeId, fileInput) {
  const token = 'ton_token';  // Utilise un token valide ici
  const formData = new FormData();
  formData.append('images', fileInput.files[0]);

  const url = `http://127.0.0.1:8000/garages/upload_images/${vehiculeId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Image ajoutée avec succès', data);
      return data.images;  // Retourner les nouvelles images pour mettre à jour l'UI
    } else {
      throw new Error('Erreur lors de l\'ajout de l\'image');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue lors de l\'ajout de l\'image');
  }
}

// Fonction pour supprimer une image
async function deleteImage(vehiculeId, imageUrl) {
  const token = 'ton_token';  // Utilise un token valide ici
  const url = `http://127.0.0.1:8000/garages/garages/${vehiculeId}/delete_image?image_url=${encodeURIComponent(imageUrl)}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Image supprimée avec succès', data);
      return data.images_restantes;  // Retourner les images restantes
    } else {
      throw new Error('Erreur lors de la suppression de l\'image');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue lors de la suppression de l\'image');
  }
}
