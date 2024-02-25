# VM_Cloud
Projet M1 VM Cloud

Ce projet consiste à lancer différentes VM depuis une interface Web via l'API Azure mais aussi de s'y connecter grâce aux informations de connexion renvoyées.

## Installation
  
```bash
curl -sL https://deb.nodesource.com/setup_21.x | sudo -E bash -
```
```bash
npm install
```
```bash
sudo apt-get install freerdp2-x11
```

## Lancer le serveur

Une fois le projet et les dépendances installés, tapez cette commande dans le répertoire du projet: 

```bash
node ./app.js
```
 
Le serveur est maintenant lancé, vous pouvez y accéder via http://localhost:3000/

## Se connecter à une VM

Une fois la VM lancé, les informations de connexions vous seront renvoyés sur l'interface web. Vous pouvez vous y connecter pour Debian/Linux en faisant (veillez à retirer les crochets) :

ssh [utilisateur]@[adresse_ip]

Pour une VM Windows :

xfreerdp /v:[adresse_ip] /u:[utilisateur] /p:[mot_de_passe]




