# API d'authentification — DS Flutter

Stack : Node.js ≥ 24, Express 5, SQLite (`better-sqlite3`), Argon2id (`argon2`), JWT (`jsonwebtoken`), `dotenv`.

## Déploiement

L'API est déployée ici :
**https://api-flutter-tgoussot.labo-narra.fr**


## Prérequis

- **Node.js 24 ou supérieur** (`node --version`)
- ou **Docker** avec Docker Compose (l'image embarque Node 24)

## Configuration

Copier le fichier d'exemple puis renseigner les valeurs :

```bash
cp .env.example .env
```

```dotenv
PORT=9999
DB_PATH=./data/<nom_db_ici>
JWT_SECRET=<secret_aleatoire_de_32_caracteres_minimum>
JWT_EXPIRES_IN=1h
```

| Variable         | Rôle                                                      | Défaut            |
|------------------|-----------------------------------------------------------|-------------------|
| `PORT`           | Port d'écoute HTTP de l'API                               | `3000`            |
| `DB_PATH`        | Chemin du fichier SQLite (créé si absent)                 | `./data/users.db` |
| `JWT_SECRET`     | Secret de signature des tokens JWT (obligatoire, ≥ 32 caractères) | aucun |
| `JWT_EXPIRES_IN` | Durée de validité des tokens                              | `1h`              |

Générer un secret aléatoire :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Si `JWT_SECRET` est absent ou trop court, l'API refuse de démarrer. Il doit
aussi être défini dans l'environnement de déploiement (variables d'environnement
du serveur ou fichier `.env` lu par Docker Compose), jamais dans le code.

## Installation et lancement

### En local (Node.js ≥ 24)

```bash
npm install
cp .env.example .env
npm run seed
npm start
```

### Avec Docker

```bash
cp .env.example .env
docker compose build
docker compose run --rm api npm run seed
docker compose up
```


L'API  dispo sur `http://localhost:<port_definis>`.

## Endpoints

### `POST /login`

Paramètres (body) :

| Champ      | Type   | Contraintes                                          |
|------------|--------|------------------------------------------------------|
| `email`    | string | obligatoire, format email valide, 254 caractères max |
| `password` | string | obligatoire, 128 caractères max                      |

Le body est accepté en **`application/json`** et en
**`application/x-www-form-urlencoded`**.

#### Succès — `200 OK`

```json
{
  "status": 200,
  "message": "Success",
  "id": 2,
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@example.com",
  "role": 2,
  "token": "<jwt>"
}
```

`id` et `role` sont des nombres. Le hash du mot de passe n'est jamais renvoyé.
`token` est un JWT à envoyer dans l'en-tête `Authorization` des requêtes protégées.

#### Échec — `400 Bad Request`

Réponse identique quelle que soit la cause (champ manquant, type incorrect,
email invalide, body illisible, utilisateur inconnu, mauvais mot de passe) :

```json
{
  "status": 400,
  "message": "Error"
}
```

#### Erreur serveur — `500 Internal Server Error`

```json
{
  "status": 500,
  "message": "Server error"
}
```

Aucune stack trace n'est renvoyée au client ; l'erreur est seulement loggée côté serveur.

### `GET /me`

Route protégée : renvoie le profil de l'utilisateur authentifié.

En-tête requis :

```
Authorization: Bearer <token>
```

#### Succès — `200 OK`

```json
{
  "status": 200,
  "message": "Success",
  "id": 2,
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@example.com",
  "role": 2
}
```

#### Non authentifié — `401 Unauthorized`

Réponse identique quelle que soit la cause (en-tête absent ou mal formé, token
invalide, signature incorrecte, token expiré, utilisateur supprimé) :

```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

## Identifiants de test

| Prénom | Nom    | Email               | Mot de passe | Rôle |
|--------|--------|---------------------|--------------|------|
| Admin  | User   | admin@example.com   | adminpass    | 1    |
| Jean   | Dupont | jean@example.com    | jeanpass     | 2    |

## Mesures de sécurité

- **Argon2id** : les mots de passe sont hachés avec Argon2id, qui génère un sel
  aléatoire unique par mot de passe (stocké dans le hash).
- **Token JWT** : signé en HS256, algorithme imposé à la vérification (aucun
  autre algorithme accepté), expiration 1 h, secret hors du code (variable
  d'environnement `JWT_SECRET`).
- **Payload minimal** : le token ne contient que l'identifiant de l'utilisateur
  (`sub`), aucune donnée personnelle.

- **Requêtes préparées** : l'email est passé en paramètre (`WHERE email = ?`),
  jamais concaténé dans le SQL ->  empêche l'injection SQL.
- **Validation des entrées** : présence, type `string`, valeur non vide,
  format d'email et longueurs maximales (email 254, mot de passe 128).
- **Message d'erreur unique** : toutes les causes d'échec renvoient la même
  réponse `400 Error`, pour ne pas révéler si un email existe.

## Tester avec curl

Les exemples ciblent l'API locale. Pour tester la version déployée, remplacer
`http://localhost:3000` par `https://api-flutter-tgoussot.labo-narra.fr`.

JSON, identifiants valides → `200` + profil :

```bash
curl -i -X POST http://localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"jean@example.com","password":"jeanpass"}'
```

form-urlencoded, identifiants valides → `200` + profil :

```bash
curl -i -X POST http://localhost:3000/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=jean@example.com&password=jeanpass'
```

Mauvais mot de passe → `400` :

```bash
curl -i -X POST http://localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"jean@example.com","password":"mauvais"}'
```

Email inconnu → `400` :

```bash
curl -i -X POST http://localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"inconnu@example.com","password":"jeanpass"}'
```

Champ manquant → `400` :

```bash
curl -i -X POST http://localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"jean@example.com"}'
```

Email au format invalide → `400` :

```bash
curl -i -X POST http://localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"pas-un-email","password":"jeanpass"}'
```

Récupérer le token puis appeler `/me` → `200` + profil :

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"jean@example.com","password":"jeanpass"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -i http://localhost:3000/me -H "Authorization: Bearer $TOKEN"
```

`/me` sans token → `401` :

```bash
curl -i http://localhost:3000/me
```

## Structure

```
api/
├── src/
│   ├── server.js                       # Serveur
│   ├── config.js                       # variables JWT (arrêt si secret absent)
│   ├── app.js                          # config Express
│   ├── routes/auth.routes.js           # POST /login, GET /me
│   ├── controllers/auth.controller.js  # connexion et profil
│   ├── middlewares/auth.middleware.js  # vérification du token JWT
│   └── db/
│       ├── database.js                 # connexion SQLite + table users
│       └── seed.js                     # utilisateurs de test (Argon2id)
├── Dockerfile / compose.yaml           # Dockerisation
├── .env.example
└── package.json
```
