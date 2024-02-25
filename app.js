const util = require('util');
const { DefaultAzureCredential } = require("@azure/identity");
const { ComputeManagementClient } = require("@azure/arm-compute");
const { ResourceManagementClient } = require("@azure/arm-resources");
const { StorageManagementClient } = require("@azure/arm-storage");
const { NetworkManagementClient } = require("@azure/arm-network");
const express = require('express');
const dotenv = require('dotenv');


dotenv.config();



const bodyParser = require('body-parser');
const app = express();
const path = require('path');

// Utiliser bodyParser pour analyser les données JSON
app.use(bodyParser.json());
// Définir le chemin vers le répertoire contenant les fichiers statiques
const publicPath = path.join(__dirname, '/');

// Utiliser express.static pour servir les fichiers statiques
app.use(express.static(publicPath));

// Définir la route pour la page d'accueil
app.get('/', (req, res) => {
    // Envoyer le fichier HTML de la page d'accueil
    res.sendFile(path.join(__dirname, 'index.html'));
});



// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur Express en écoute sur le port ${PORT}`);
});

// Store function output to be used elsewhere
let randomIds = {};
let subnetInfo = null;
let publicIPInfo = null;
let vmImageInfo = null;
let nicInfo = null;

//Random number generator for service names and settings
const resourceGroupName = _generateRandomId("rg_yass", randomIds);
let vmName = _generateRandomId("vmPreconfig", randomIds);
const storageAccountName = _generateRandomId("testac", randomIds);
const vnetName = _generateRandomId("testvnet", randomIds);
const subnetName = _generateRandomId("testsubnet", randomIds);
const publicIPName = _generateRandomId("testpip", randomIds);
const networkInterfaceName = _generateRandomId("testnic", randomIds);
const ipConfigName = _generateRandomId("testcrpip", randomIds);
const domainNameLabel = _generateRandomId("testdomainname", randomIds);
const osDiskName = _generateRandomId("testosdisk", randomIds);

// Resource configs 
const location = "eastus";
const accType = "Standard_LRS";

// Ubuntu config for VM
let publisher = "Canonical";
let offer = "UbuntuServer";
let sku = "14.04.3-LTS";
const adminUsername = "notadmin";
const adminPassword = "Pwd1234!";


// Azure platform authentication
const clientId = process.env["AZURE_CLIENT_ID"];
const domain = process.env["AZURE_TENANT_ID"];
const secret = process.env["AZURE_CLIENT_SECRET"];
const subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"];

if (!clientId || !domain || !secret || !subscriptionId) {
    console.log("Default credentials couldn't be found");
}
const credentials = new DefaultAzureCredential();

// Azure services
const resourceClient = new ResourceManagementClient(credentials, subscriptionId);
const computeClient = new ComputeManagementClient(credentials, subscriptionId);
const storageClient = new StorageManagementClient(credentials, subscriptionId);
const networkClient = new NetworkManagementClient(credentials, subscriptionId);

// Create resources then manage them (on/off)
const main = async () => {
    try {
        await createResources();
        await manageResources();
    } catch (err) {
        console.log(err);
    }
};

function generateLinuxHostname(prefix, maxChars) {
    const validChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let hostname = prefix;
    const charsLength = validChars.length;

    while (hostname.length < maxChars) {
        const randomIndex = Math.floor(Math.random() * charsLength);
        hostname += validChars[randomIndex];
    }

    return hostname.slice(0, maxChars);
}



const createResources = async () => {
    try {
        result = await createResourceGroup();
        accountInfo = await createStorageAccount();
        vnetInfo = await createVnet();
        subnetInfo = await getSubnetInfo();
        publicIPInfo = await createPublicIP();
        nicInfo = await createNIC(
            subnetInfo,
            publicIPInfo
        );
        vmImageInfo = await findVMImage();
        nicResult = await getNICInfo();
        vmInfo = await createVirtualMachine(
            nicInfo.id,
            vmImageInfo[0].name
        );
        console.log("createResources end");
        return;
    } catch (err) {
        console.log(err);
    }
};



const createResourceGroup = async () => {
    const groupParameters = {
        location: location,
        tags: { sampletag: "sampleValue" },
    };
    console.log("\n1.Creating resource group: " + resourceGroupName);
    return await resourceClient.resourceGroups.createOrUpdate(
        resourceGroupName,
        groupParameters
    );
};

const createStorageAccount = async () => {
    console.log("\n2.Creating storage account: " + storageAccountName);
    const createParameters = {
        location: location,
        sku: {
            name: accType,
        },
        kind: "Storage",
        tags: {
            tag1: "val1",
            tag2: "val2",
        },
    };
    return await storageClient.storageAccounts.beginCreateAndWait(
        resourceGroupName,
        storageAccountName,
        createParameters
    );
};
const createVnet = async () => {
    const vnetParameters = {
        location: location,
        addressSpace: {
            addressPrefixes: ['10.0.0.0/16']
        },
        dhcpOptions: {
            dnsServers: ['10.1.1.1', '10.1.2.4']
        },
        subnets: [{ name: subnetName, addressPrefix: '10.0.0.0/24' }],
    };
    console.log('\n3.Creating vnet: ' + vnetName);
    return await networkClient.virtualNetworks.beginCreateOrUpdateAndWait(resourceGroupName, vnetName, vnetParameters);
}

const getSubnetInfo = async () => {
    console.log('\nGetting subnet info for: ' + subnetName);
    return await networkClient.subnets.get(resourceGroupName, vnetName, subnetName);
}
const createPublicIP = async () => {
    const publicIPParameters = {
        location: location,
        publicIPAllocationMethod: 'Dynamic',
        dnsSettings: {
            domainNameLabel: domainNameLabel
        }
    };

    console.log('\n4.Creating public IP: ' + publicIPName);
    return await networkClient.publicIPAddresses.beginCreateOrUpdateAndWait(resourceGroupName, publicIPName, publicIPParameters);
}

const createNIC = async (subnetInfo, publicIPInfo) => {
    const nicParameters = {
        location: location,
        ipConfigurations: [
            {
                name: ipConfigName,
                privateIPAllocationMethod: 'Dynamic',
                subnet: subnetInfo,
                publicIPAddress: publicIPInfo
            }
        ]
    };
    console.log('\n5.Creating Network Interface: ' + networkInterfaceName);
    return await networkClient.networkInterfaces.beginCreateOrUpdateAndWait(resourceGroupName, networkInterfaceName, nicParameters);
}
const findVMImage = async () => {
    console.log(util.format('\nFinding a VM Image for location %s from ' +
        'publisher %s with offer %s and sku %s', location, publisher, offer, sku));
    return await computeClient.virtualMachineImages.list(location, publisher, offer, sku, { top: 1 });
}
const getNICInfo = async () => {
    console.log('\nGetting NIC info for: ' + networkInterfaceName);
    return await networkClient.networkInterfaces.get(resourceGroupName, networkInterfaceName);
}

const createVirtualMachine = async (nicId, vmImageVersionNumber) => {
    const vmParameters = {
        location: location,
        osProfile: {
            computerName: vmName,
            adminUsername: adminUsername,
            adminPassword: adminPassword
        },
        hardwareProfile: {
            vmSize: 'Standard_B1ls'
        },
        storageProfile: {
            imageReference: {
                publisher: publisher,
                offer: offer,
                sku: sku,
                version: vmImageVersionNumber
            },
            osDisk: {
                name: osDiskName,
                caching: 'None',
                createOption: 'fromImage',
                vhd: { uri: 'https://' + storageAccountName + '.blob.core.windows.net/nodejscontainer/osnodejslinux.vhd' }
            },
        },
        networkProfile: {
            networkInterfaces: [
                {
                    id: nicId,
                    primary: true
                }
            ]
        }
    };
    console.log('6.Creating Virtual Machine: ' + vmName);
    console.log(' VM create parameters: ' + util.inspect(vmParameters, { depth: null }));
    await computeClient.virtualMachines.beginCreateOrUpdateAndWait(resourceGroupName, vmName, vmParameters);
}
const manageResources = async () => {

    await getVirtualMachines();
    await turnOffVirtualMachines(
        resourceGroupName,
        vmName,
        computeClient
    );
    await startVirtualMachines(
        resourceGroupName,
        vmName
    );
    const resultListVirtualMachines = await listVirtualMachines();
    console.log(util.format('List all the vms under the current ' +
        'subscription \n%s', util.inspect(resultListVirtualMachines, { depth: null })));
}
const getVirtualMachines = async () => {
    console.log(`Get VM Info about ${vmName}`)
    return await computeClient.virtualMachines.get(resourceGroupName, vmName).publicIPAddress;
};
const turnOffVirtualMachines = async () => {
    console.log(`Poweroff the VM ${vmName}`)
    return await computeClient.virtualMachines.beginPowerOff(resourceGroupName, vmName);;
};
const startVirtualMachines = async () => {
    console.log(`Start the VM ${vmName}`)
    return await computeClient.virtualMachines.beginStart(resourceGroupName, vmName);
};
const listVirtualMachines = async () => {
    console.log(`Lists VMs`)
    const result = new Array();
    for await (const item of computeClient.virtualMachines.listAll()) {
        result.push(item);
    }
    return result;
};

function _generateRandomId(prefix, existIds) {
    let newNumber;
    while (true) {
        newNumber = prefix + Math.floor(Math.random() * 10000);
        if (!existIds || !(newNumber in existIds)) {
            break;
        }
    }
    return newNumber;
}

const deleteResourceGroup = async (resourceGroupName) => {
    console.log("\nDeleting resource group: " + resourceGroupName);
    try {
        await resourceClient.resourceGroups.beginDeleteAndWait(resourceGroupName);
        console.log("Resource group deleted successfully.");
    } catch (error) {
        console.error("Error deleting resource group:", error.message);
        throw error; // Re-throw the error to handle it in the calling function
    }
};

async function getPublicIpAddress(resourceGroupName, publicIPName) {
    return networkClient.publicIPAddresses.get(resourceGroupName, publicIPName);
}



// Définir la route pour la configuration de la VM
app.post('/lancer-vm', async (req, res) => { // Ajoutez le mot-clé async ici
    try {
        await createResources();
        console.log("Ressources créées avec succès");

        const publicIP = await getPublicIpAddress(resourceGroupName, publicIPName);
        console.log("Adresse IP publique de la VM:", publicIP.ipAddress);

        // Supprimer le groupe de ressources après un certain délai (par exemple, 60 secondes)
        setTimeout(async () => {
            await deleteResourceGroup(resourceGroupName);
        }, 240000);

        // Envoyer les paramètres de connexion à l'utilisateur
        res.json({ ipAddress: publicIP.ipAddress, username: adminUsername, password: adminPassword});
    } catch (err) {
        console.log(err);
        res.status(500).send('Une erreur s\'est produite lors de la configuration de la VM');
    }
});

// Définir la route pour la configuration de la VM
app.post('/config-vm', async (req, res) => {
    // Récupérer le type de VM envoyé depuis le client
    const vmType = req.body.vmType;
    console.log('Type de VM reçu du client:', vmType);

    // Générer un nouveau nom de VM
    vmName = _generateRandomId("vmConfig", randomIds);

    try {
        // Définir la configuration en fonction du type de VM
        if (vmType === "windows") {
            console.log("Configuration de la VM Windows");
            // Windows config for VM
            publisher = "MicrosoftWindowsServer";
            offer = "WindowsServer";
            sku = "2019-Datacenter";
        } else if (vmType === "linux") {
            console.log("Configuration de la VM Linux");
            // Linux config for VM
            publisher = "Canonical";
            offer = "UbuntuServer";
            sku = "14.04.3-LTS";
        } else if (vmType === "debian") {
            console.log("Configuration de la VM Debian");
            // Debian config for VM
            publisher = "Debian";
            offer = "debian-10";
            sku = "10";
        } else {
            console.error("Type de VM non valide :", vmType);
        }

        // Créer les ressources et gérer les VM
        await createResources();

        const publicIP = await getPublicIpAddress(resourceGroupName, publicIPName);
        console.log("Adresse IP publique de la VM:", publicIP.ipAddress);

        // Supprimer le groupe de ressources après un certain délai (par exemple, 60 secondes)
        setTimeout(async () => {
            await deleteResourceGroup(resourceGroupName);
        }, 240000);

        // Envoyer les paramètres de connexion à l'utilisateur
        res.json({ ipAddress: publicIP.ipAddress, username: adminUsername, password: adminPassword});
    } catch (err) {
        console.log(err);
        res.status(500).send('Une erreur s\'est produite lors de la configuration de la VM');
    }
});

app.delete('/stop-vm', async (req, res) => {
    try {
        await deleteResourceGroup(resourceGroupName);
        res.status(200).send('La VM a été arrêtée avec succès et le groupe de ressources a été supprimé');
    } catch (err) {
        console.log(err);
        res.status(500).send('Une erreur s\'est produite lors de l\'arrêt de la VM');
    }
});
