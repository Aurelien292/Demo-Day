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

  // -------- Gestion du formulaire de connexion --------
  
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

  // -------- Gestion connexion/déconnexion --------
  const loginLink = document.getElementById('login-link');
  const accountLink = document.getElementById('account-link');
  const logoutBtn = document.getElementById('logoutBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      window.location.href = '/index.html';
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

  checkLoginStatus();
});

// -------- Gestion du formulaire d'inscription --------
document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginFormSection');
  const signupForm = document.getElementById('signup-form');
  const createAccountLink = document.getElementById('create-account');
  const backToLoginLink = document.getElementById('back-to-login');

  // Lorsque l'utilisateur clique sur "Créer un compte"
  createAccountLink.addEventListener('click', function () {
    loginForm.style.display = 'none';  // Masquer le formulaire de connexion
    signupForm.style.display = 'block'; // Afficher le formulaire d'inscription
  });

  // Lorsque l'utilisateur veut revenir au formulaire de connexion
  backToLoginLink.addEventListener('click', function () {
    signupForm.style.display = 'none';  // Masquer le formulaire d'inscription
    loginForm.style.display = 'block';      // Afficher le formulaire de connexion
  });
});

// -------- Donées Inscription --------
document.addEventListener('DOMContentLoaded', function () {
  const signupForm = document.getElementById('signupForm');
  const messageEl = document.querySelector('#message-signup');

  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Réinitialisation des messages d'erreur
      messageEl.textContent = '';
      messageEl.style.color = 'red';

      const firstName = document.getElementById('first-name').value.trim();
      const username = document.getElementById('username').value.trim();
      const city = document.getElementById('city').value.trim();
      const email = document.getElementById('new-email').value.trim();
      const password = document.getElementById('new-password').value.trim();
      const confirmPassword = document.getElementById('confirm-password').value.trim();

      // Vérifier que tous les champs sont remplis
      if (!firstName || !username || !city || !email || !password || !confirmPassword) {
        messageEl.textContent = 'Veuillez remplir tous les champs.';
        return;
      }

      // Vérifier si les mots de passe correspondent
      if (password !== confirmPassword) {
        messageEl.textContent = 'Les mots de passe ne correspondent pas.';
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/users/Utilisateurs/Inscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            first_name: firstName,
            username: username,
            city: city,
            email: email,
            password: password
          })
        });

        // Gérer les erreurs si la réponse n'est pas ok
        if (!response.ok) {
          const errorData = await response.json();
          messageEl.textContent = errorData.detail || 'Erreur lors de la création du compte.';
          return;
        }

        const data = await response.json();
        messageEl.style.color = 'green';
        messageEl.textContent = 'Inscription réussie ! Bienvenue ' + data.username;

        // Rediriger l'utilisateur après un certain délai
        setTimeout(() => {
          window.location.href = 'connexion.html';  // Ou la page souhaitée après inscription
        }, 1500);

      } catch (error) {
        messageEl.textContent = 'Erreur réseau, veuillez réessayer.';
      }
    });
  }
});