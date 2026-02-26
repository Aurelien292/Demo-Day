from datetime import datetime, timedelta

def calcul_tarif_post_gratuit(nb: int) -> int:
    total = 0
    for i in range(1, nb + 1):
        if i <= 2:
            total += 100
        elif 3 <= i <= 5:
            total += 70
        elif i == 6 or i == 9:
            continue  # gratuit
        else:
            total += 50
    return total

def calcul_tarif_mensuel(nb_vehicules: int, date_creation: datetime) -> int:
    date_fin_gratuit = date_creation + timedelta(days=90)
    if datetime.utcnow() < date_fin_gratuit:
        return 0 if nb_vehicules <= 5 else calcul_tarif_post_gratuit(nb_vehicules - 5)
    return calcul_tarif_post_gratuit(nb_vehicules)
