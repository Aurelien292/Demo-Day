from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.avis import Avis
from app.models.Vehicules import Vehicule
from app.persistence.database import get_db
from app.schemas.avis import AvisCreate, AvisOut, AvisBase
from app.utils.auth import get_current_user, get_current_admin_user

from typing import List

router = APIRouter()

@router.post("/PosterAvis/", response_model=AvisOut,
              summary="Poster un avis sur un garage ou un véhicule ===> Authentifié",
              description="Permet aux utilisateurs de laisser un avis sur un garage ou un véhicule. Nécessite une authentification.")
def laisser_avis(request: AvisCreate, db: Session = Depends(get_db), utilisateur=Depends(get_current_user)):
    # Si un garage_id est nécessaire, assure-toi qu'il est dans la requête.
    garage_id = request.garage_id if request.garage_id else None  # Assignation conditionnelle

    # Assurer que garage_id ou vehicule_id soit défini
    if not garage_id and not request.vehicule_id:
        raise HTTPException(status_code=400, detail="Un garage_id ou un vehicule_id doit être fourni.")

    # Créer l'objet Avis
    avis = Avis(
        utilisateur_id=utilisateur["id"],
        garage_id=garage_id,  # Garage ID si disponible
        vehicule_id=request.vehicule_id,  # Vehicule ID
        note=request.note,
        commentaire=request.commentaire,
        date_avis=request.date_avis
    )

    # Ajouter et valider dans la base de données
    db.add(avis)
    db.commit()
    db.refresh(avis)
    return avis


#Modifier un avis existant
@router.put("/ModifierAvis/{avis_id}", response_model=AvisOut,
              summary="Modifier un avis existant ===> Authentifié",
              description="Permet aux utilisateurs de modifier leur propre avis sur un garage ou un véhicule. Nécessite une authentification.")
def modifier_avis(avis_id: int, request: AvisBase, db: Session = Depends(get_db), utilisateur=Depends(get_current_user)):
    avis = db.query(Avis).filter(Avis.avis_id == avis_id).first()

    if not avis:
        raise HTTPException(status_code=404, detail="Avis non trouvé")
    if avis.utilisateur_id != utilisateur["id"]:
        raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres avis")

    avis.note = request.note
    avis.commentaire = request.commentaire
    db.commit()
    db.refresh(avis)
    return avis


@router.delete("/SupprimerAvis/{avis_id}",
               summary="Supprimer un avis ====> Admin only",
               description="Permet à un administrateur de supprimer un avis sur un garage ou un véhicule. Accessible uniquement aux administrateurs.")
def supprimer_avis(
    avis_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin_user)
):
    from app.models.avis import Avis

    avis = db.query(Avis).filter(Avis.id == avis_id).first()

    if not avis:
        raise HTTPException(status_code=404, detail="Avis non trouvé")

    db.delete(avis)
    db.commit()

    return {"message": "Avis supprimé avec succès"}


@router.get("/Avis/{vehicule_id}", response_model=List[AvisOut], summary="Récupérer les avis pour un véhicule et son garage")
def recuperer_avis(vehicule_id: int, db: Session = Depends(get_db)):
    # Récupérer les avis du véhicule
    avis_vehicule = db.query(Avis).filter(Avis.vehicule_id == vehicule_id).all()

    # Récupérer le garage_id du véhicule
    vehicule = db.query(Vehicule).filter(Vehicule.vehicule_id == vehicule_id).first()
    
    if not vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")

    garage_id = vehicule.garage_id  # Le garage auquel appartient ce véhicule

    # Récupérer les avis du garage
    avis_garage = db.query(Avis).filter(Avis.garage_id == garage_id).all()

    # Combiner les avis du véhicule et du garage
    all_avis = avis_vehicule + avis_garage
    
    if not all_avis:
        raise HTTPException(status_code=404, detail="Aucun avis trouvé pour ce véhicule et ce garage")
    
    return all_avis