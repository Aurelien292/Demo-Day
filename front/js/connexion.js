document.addEventListener("DOMContentLoaded", () => {
  // -------- Gestion des images --------
  const col1 = document.getElementById('col1-inner');
  const col2 = document.getElementById('col2-inner');
  const col3 = document.getElementById('col3-inner');

  const basePath = "images/connexion/";
  const imageNames = [
    "voiture.webp", "voiture1.webp", "voiture2.webp", "voiture3.webp",
    "voiture4.webp", "voiture5.webp", "voiture6.webp", "voiture7.webp",
    "voiture8.webp", "voiture9.webp", "voiture10.webp", "voiture11.webp",
    "voiture12.webp", "voiture13.webp", "voiture14.webp", "voiture15.webp",
    "voiture16.webp"
  ];

  const col1Images = [];
  const col2Images = [];
  const col3Images = [];

  imageNames.forEach((name, index) => {
    const img = document.createElement("img");
    img.src = basePath + name;
    img.alt = "Illustration véhicule";

    if (index % 3 === 0) col1Images.push(img);
    else if (index % 3 === 1) col2Images.push(img);
    else col3Images.push(img);
  });

  const fillColumn = (container, images) => {
    for (let i = 0; i < 13; i++) {
      images.forEach(img => container.appendChild(img.cloneNode(true)));
    }
  };

  if (col1 && col2 && col3) {
    fillColumn(col1, col1Images);
    fillColumn(col2, col2Images);
    fillColumn(col3, col3Images);
  }

  // -------- Gestion des boutons "Conducteur" et "Propriétaire de flotte" --------
  const conducteurBtn = document.getElementById('conducteur-btn');
  const proprietaireBtn = document.getElementById('proprietaire-btn');

  if (conducteurBtn && proprietaireBtn) {
    conducteurBtn.addEventListener('click', () => {
      console.log('Conducteur sélectionné');
      document.querySelector('.user-type-selection').style.display = 'none';
      // Afficher le formulaire Conducteur et cacher le formulaire Propriétaire
      document.getElementById('loginFormSection').style.display = 'block';
      document.getElementById('garage-login-form').style.display = 'none';
    });

    proprietaireBtn.addEventListener('click', () => {
      console.log('Propriétaire de flotte sélectionné');
      document.querySelector('.user-type-selection').style.display = 'none';
      // Afficher le formulaire Propriétaire et cacher le formulaire Conducteur
      document.getElementById('garage-login-form').style.display = 'block';
      document.getElementById('loginFormSection').style.display = 'none';
    });
  }

  // Sélectionner les boutons "Retour à la sélection du type d'accès"
const backToSelectionButtons = document.querySelectorAll('#back-to-selection');

// Sélectionner la section de sélection du type d'accès
const userTypeSelectionSection = document.querySelector('.user-type-selection');
  // Fonction pour revenir à la section de sélection du type d'accès
backToSelectionButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Afficher la section de sélection du type d'accès
    userTypeSelectionSection.style.display = 'block';

    // Cacher seulement les sections des formulaires (login, signup, etc.)
    const formSections = document.querySelectorAll('.login-form, .signup-form, .garage-login-form, .garage-signup-form');
    formSections.forEach(section => {
      section.style.display = 'none';
    });
  });
});
  



  // -------- Gestion du formulaire de connexion Conducteur --------
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const loginMessageEl = document.querySelector('#message-login');
      loginMessageEl.textContent = '';
      loginMessageEl.style.color = 'red';

      const email = this.email.value.trim();
      const password = this.password.value.trim();

      if (!email || !password) {
        loginMessageEl.textContent = 'Veuillez remplir tous les champs.';
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const errorData = await response.json();
          loginMessageEl.textContent = errorData.detail || 'Erreur lors de la connexion.';
          return;
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('username', data.username);
        
        console.log(data);
        loginMessageEl.style.color = 'green';
        loginMessageEl.textContent = 'Connexion réussie ! Bonjour ' + data.username;

        setTimeout(() => {
          window.location.href = '../../index.html';
        }, 3500);
      } catch (error) {
        loginMessageEl.textContent = 'Erreur réseau, veuillez réessayer.';
      }
    });
  }

  // -------- Gestion du formulaire de connexion Garage --------
  const garageLoginForm = document.getElementById('garageLoginForm');
  if (garageLoginForm) {
    garageLoginForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const loginMessageEl = document.querySelector('#message-garage-login');
      loginMessageEl.textContent = '';
      loginMessageEl.style.color = 'red';

      const email = this['email'].value.trim();
      const password = this['password'].value.trim();

      if (!email || !password) {
        loginMessageEl.textContent = 'Veuillez remplir tous les champs.';
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/garages/connexion/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const errorData = await response.json();
          loginMessageEl.textContent = errorData.detail || 'Erreur lors de la connexion.';
          return;
        }

        const data = await response.json();
        console.log(data);
        localStorage.setItem('garage_access_token', data.access_token);
        
        
        loginMessageEl.style.color = 'green';
        loginMessageEl.textContent = 'Connexion réussie ! Bienvenue dans votre espace';

        setTimeout(() => {
          window.location.href = '../../index.html';
        }, 3500);
      } catch (error) {
        loginMessageEl.textContent = 'Erreur réseau, veuillez réessayer.';
      }
    });
  }

   // -------- Gestion du lien "Créer un compte" --------
  const createAccountLink = document.getElementById('create-account');
  const backToLoginLink = document.getElementById('back-to-login');
  const loginFormSection = document.getElementById('loginFormSection');
  const signupFormSection = document.getElementById('signup-form');

  // Afficher le formulaire d'inscription et cacher celui de connexion
  if (createAccountLink) {
    createAccountLink.addEventListener('click', () => {
      loginFormSection.style.display = 'none';
      signupFormSection.style.display = 'block';
    });
  }

  // Retourner au formulaire de connexion
  if (backToLoginLink) {
    backToLoginLink.addEventListener('click', () => {
      signupFormSection.style.display = 'none';
      loginFormSection.style.display = 'block';
    });
  }
  // -------- Gestion du formulaire d'inscription Conducteur --------
  const signupForm = document.getElementById('signupForm');
  const messageEl = document.querySelector('#message-signup');

  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      messageEl.textContent = '';
      messageEl.style.color = 'red';

      const firstName = document.getElementById('first-name').value.trim();
      const username = document.getElementById('username').value.trim();
      const city = document.getElementById('city').value.trim();
      const email = document.getElementById('new-email').value.trim();
      const password = document.getElementById('new-password').value.trim();
      const confirmPassword = document.getElementById('confirm-password').value.trim();

      if (!firstName || !username || !city || !email || !password || !confirmPassword) {
        messageEl.textContent = 'Veuillez remplir tous les champs.';
        return;
      }

      if (password !== confirmPassword) {
        messageEl.textContent = 'Les mots de passe ne correspondent pas.';
        return;
      }

      // --- Fonction pour envoyer la requête d'inscription ---
    const sendRequest = async (force = false) => {
      try {
        const url = force
          ? `http://127.0.0.1:8000/users/Utilisateurs/Inscription?force=true`
          : `http://127.0.0.1:8000/users/Utilisateurs/Inscription`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: firstName,
            username: username,
            city: city,
            email: email,
            password: password
          })
        });

        if (!response.ok) {
          const errorData = await response.json();

          // Cas spécifique "Ville introuvable"
          if (errorData.detail && errorData.detail.includes("Ville introuvable")) {
            const continueAnyway = confirm("Ville introuvable. Voulez-vous continuer malgré tout ?");
            if (continueAnyway) {
              // Réessayer avec force=true
              return await sendRequest(true);
            } else {
              messageEl.textContent = 'Inscription annulée.';
              return;
            }
          }

          // Autres erreurs
          messageEl.textContent = errorData.detail || 'Erreur lors de la création du compte.';
          return;
        }

        // Inscription réussie
        const data = await response.json();
        messageEl.style.color = 'green';
        messageEl.textContent = 'Inscription réussie ! Bienvenue ' + data.username;

        // Redirection après 1,5 seconde
        setTimeout(() => {
          window.location.href = 'connexion.html';
        }, 11500);

      } catch (error) {
        messageEl.textContent = 'Erreur réseau, veuillez réessayer.';
      }
    };

    // --- Appel initial ---
    await sendRequest();
  });
}

  
 
  // -------- Gestion de l'affichage des formulaires (Connexion et Inscription Garage) --------
  const createGarageAccountLink = document.getElementById('create-garage-account');
  const backToGarageLoginLink = document.getElementById('back-to-garage-login');
  const garageLoginFormSection = document.getElementById('garage-login-form');
  const garageSignupFormSection = document.getElementById('garage-signup-form');

  // Lorsque l'utilisateur clique sur "Créer un garage"
  if (createGarageAccountLink) {
    createGarageAccountLink.addEventListener('click', () => {
      garageLoginFormSection.style.display = 'none';
      garageSignupFormSection.style.display = 'block';
    });
  }

  // Lorsque l'utilisateur clique sur "Retour à la connexion du garage"
  if (backToGarageLoginLink) {
    backToGarageLoginLink.addEventListener('click', () => {
      garageSignupFormSection.style.display = 'none';
      garageLoginFormSection.style.display = 'block';
    });
  }
  // -------- Gestion du formulaire d'inscription Garage --------
  const garageSignupForm = document.getElementById('garageSignupForm');
  const garageMessageEl = document.querySelector('#message-garage-signup');

  if (garageSignupForm) {
    garageSignupForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      garageMessageEl.textContent = '';
      garageMessageEl.style.color = 'red';

      const garageName = document.getElementById('garage-name').value.trim();
      const garageAddress = document.getElementById('garage-address').value.trim();
      const garageCity = document.getElementById('garage-city').value.trim();
      const garageEmail = document.getElementById('garage-signup-email').value.trim();
      const garagePassword = document.getElementById('garage-signup-password').value.trim();
      const garagePhone = document.getElementById('garage-phone').value.trim();
      console.log(garageName, garageAddress, garageCity, garageEmail, garagePassword, garagePhone);

      if (!garageName || !garageAddress || !garageCity || !garageEmail || !garagePassword || !garagePhone) {
        garageMessageEl.textContent = 'Veuillez remplir tous les champs.';
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/garages/CreationDeGarage/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: garageName,
            adresse: garageAddress,
            ville: garageCity,
            email: garageEmail,
            password: garagePassword,
            description: "Garage Description", 
            telephone: garagePhone
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          garageMessageEl.textContent = errorData.detail || 'Erreur lors de la création du garage.';
          return;
        }

        const data = await response.json();
        garageMessageEl.style.color = 'green';
        garageMessageEl.textContent = 'Garage créé avec succès !';

        setTimeout(() => {
          window.location.href = 'connexion.html';  
        }, 1500);
      } catch (error) {
        garageMessageEl.textContent = 'Erreur réseau, veuillez réessayer.';
      }
    });
  }
});

// -------- Gestion connexion/déconnexion --------
const loginLink = document.getElementById('login-link');
const accountLink = document.getElementById('account-link');
const logoutBtn = document.getElementById('logoutBtn');
const accountLinkGarage = document.getElementById('account-link-garage');
const logoutBtnGarage = document.getElementById('logoutBtn-garage');
const dashboardLink = document.getElementById('dashboard-link');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    window.location.href = '/index.html';
  });
}
if (logoutBtnGarage) {
  logoutBtnGarage.addEventListener('click', () => {
    localStorage.removeItem('garage_access_token');
      
    window.location.href = '/index.html';  // Rediriger après déconnexion
  });
}

function checkLoginStatus() {
  const token = localStorage.getItem('access_token');

  if (token) {
    if (loginLink) loginLink.style.display = 'none';
    if (accountLink) accountLink.style.display = 'inline';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    if (loginLink) loginLink.style.display = 'inline-block';
    if (accountLink) accountLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

function checkGarageLoginStatus() {
  const tokenGarage = localStorage.getItem('garage_access_token');

  if (tokenGarage) {
    // Afficher les éléments pour un utilisateur connecté (garage)
    if (loginLink) loginLink.style.display = 'none';
    if (accountLinkGarage) accountLinkGarage.style.display = 'inline';
    if (logoutBtnGarage) logoutBtnGarage.style.display = 'inline-block';
    if (dashboardLink) dashboardLink.style.display = 'inline';
  } else {
    // Afficher les éléments pour un utilisateur non connecté
    if (accountLinkGarage) accountLinkGarage.style.display = 'none';
    if (logoutBtnGarage) logoutBtnGarage.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'none';
  }
}

checkLoginStatus();
checkGarageLoginStatus();

