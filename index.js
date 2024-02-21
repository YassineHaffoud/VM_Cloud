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
                document.getElementById('message').innerText = "Bienvenue! Vous pouvez lancer la VM.";
                document.getElementById('launch-vm-button').style.display = 'block';
            } else if (role === "3") {
                document.getElementById('message').innerText = "Bienvenue! Vous pouvez configurer et lancer la VM.";
                document.getElementById('vm-type').style.display = 'block';
                document.getElementById('launch-config-vm-button').style.display = 'block';
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

    // Configuration de la requête
    var requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };


  const response = await fetch('/lancer-vm', requestOptions);

  return response.json();
}


async function launchConfigVM() {
    const vmType = document.getElementById('vm-type').value;


    console.log("Lancement de la VM avec la configuration pour " + vmType);

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

    const response = await fetch('/configurer-vm', requestOptions);

    return response.json();

}