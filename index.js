const users = {
    "user1": { "password": "pwd1", "role": "1" },
    "user2": { "password": "pwd2", "role": "2" },
    "user3": { "password": "pwd3", "role": "3" }
};


function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (users.hasOwnProperty(username)) {
        if (users[username].password === password) {
            const role = users[username].role;
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('content').style.display = 'block';

            if (role === "1") {
                document.getElementById('message').innerText = "Vous n'avez aucun droit.";
            } else if (role === "2") {
                document.getElementById('message').innerText = "Bienvenue ! Vous pouvez lancer la VM Linux.";
                document.getElementById('launch-vm-button').style.display = 'block';
                document.getElementById('stop-vm-button').style.display = 'block';
                document.getElementById('stop-vm-button').disabled = true;
            } else if (role === "3") {
                document.getElementById('message').innerText = "Bienvenue ! Vous pouvez configurer et lancer la VM.";
                document.getElementById('vm-type').style.display = 'block';
                document.getElementById('launch-config-vm-button').style.display = 'block';
                document.getElementById('stop-vm-button').style.display = 'block';
                document.getElementById('stop-vm-button').disabled = true;
            } else {
                console.error("Rôle non valide pour l'utilisateur");
            }
        } else {
            console.error("Mot de passe incorrect");
        }
    } else {
        console.error("Nom d'utilisateur incorrect");
    }
}

async function launchVM() {
    console.log("Lancement de la VM...");

    // Désactiver le bouton de lancement de la VM
    document.getElementById('launch-vm-button').disabled = true;
    document.getElementById('stop-vm-button').disabled = false;

    document.getElementById("connection-params").textContent = "Création de la machine virtuelle...";
    document.getElementById('loading-spinner').style.display = 'flex';

    // Configuration de la requête
    var requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch('/lancer-vm', requestOptions);
        const data = await response.json(); // Attendre la résolution de la promesse de réponse et la transformer en JSON

        // Construire la chaîne de réponse avec chaque élément sur une ligne distincte
        const responseString = `Adresse IP: ${data.ipAddress}\nNom d'utilisateur: ${data.username}\nMot de passe: ${data.password}`;

        // Sélectionner l'élément où vous voulez afficher la réponse
        const responseElement = document.getElementById("connection-params");

        // Mettre à jour le contenu de l'élément avec la chaîne de réponse
        responseElement.textContent = responseString;

        return data; // Retourner les données
    } catch (error) {
        console.error("Une erreur s'est produite lors de la récupération des données :", error);
        throw error; // Re-lancer l'erreur pour qu'elle soit gérée à l'extérieur de la fonction
    } finally {
        // Masquer le logo de chargement une fois la réponse reçue ou en cas d'erreur
        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('launch-vm-button').disabled = false;
    }
}

async function launchConfigVM() {
    const vmType = document.getElementById('vm-type').value;
    console.log("Lancement de la VM avec la configuration pour " + vmType);

    document.getElementById("connection-params").textContent = "Création de la machine virtuelle...";
    document.getElementById('launch-config-vm-button').disabled = true;
    document.getElementById('stop-vm-button').disabled = false;

    // Afficher le logo de chargement
    document.getElementById('loading-spinner').style.display = 'flex';

    // Définition des données à envoyer
    const data = { vmType: vmType };

    // Configuration de la requête
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    try {
        const response = await fetch('/config-vm', requestOptions);
        const data = await response.json(); // Attendre la résolution de la promesse de réponse et la transformer en JSON

        // Construire la chaîne de réponse avec chaque élément sur une ligne distincte
        const responseString = `Adresse IP: ${data.ipAddress}\nNom d'utilisateur: ${data.username}\nMot de passe: ${data.password}`;

        // Sélectionner l'élément où vous voulez afficher la réponse
        const responseElement = document.getElementById("connection-params");

        // Mettre à jour le contenu de l'élément avec la chaîne de réponse
        responseElement.textContent = responseString;

        return data; // Retourner les données
    } catch (error) {
        console.error("Une erreur s'est produite lors de la récupération des données :", error);
        throw error; // Re-lancer l'erreur pour qu'elle soit gérée à l'extérieur de la fonction
    } finally {
        // Masquer le logo de chargement une fois la réponse reçue ou en cas d'erreur
        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('launch-config-vm-button').disabled = false;
    }
}


async function stopVM() {
    console.log("Suppression de la VM...");

    // Configuration de la requête
    var requestOptions = {
        method: 'DELETE'
    };

    document.getElementById('loading-spinner').style.display = 'flex';
    document.getElementById("connection-params").textContent = "Machine en cours de suppression...";

    const response = await fetch('/stop-vm', requestOptions);
    document.getElementById("connection-params").textContent = "";
    document.getElementById('loading-spinner').style.display = 'none';

    return response;
}

function logout() {
    // Recharger la page pour effectuer la déconnexion
    location.reload();
}