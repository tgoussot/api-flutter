# API d'authentification — DS Flutter

Stack : Node.js ≥ 24, Express 5, SQLite (`better-sqlite3`), Argon2id (`argon2`), `dotenv`.

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
```

| Variable  | Rôle                                         | Défaut            |
|-----------|----------------------------------------------|-------------------|
| `PORT`    | Port d'écoute HTTP de l'API                  | `3000`            |
| `DB_PATH` | Chemin du fichier SQLite (créé si absent)    | `./data/users.db` |

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

## Endpoint

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
  "role": 2
}
```

`id` et `role` sont des nombres. Le hash du mot de passe n'est jamais renvoyé.

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

## Identifiants de test

| Prénom | Nom    | Email               | Mot de passe | Rôle |
|--------|--------|---------------------|--------------|------|
| Admin  | User   | admin@example.com   | adminpass    | 1    |
| Jean   | Dupont | jean@example.com    | jeanpass     | 2    |

## Mesures de sécurité

- **Argon2id** : les mots de passe sont hachés avec Argon2id

- **Requêtes préparées** : l'email est passé en paramètre (`WHERE email = ?`),
  jamais concaténé dans le SQL ->  empêche l'injection SQL.
- **Validation des entrées** : présence, type `string`, valeur non vide,
  format d'email et longueurs maximales (email 254, mot de passe 128).
- **Message d'erreur unique** : toutes les causes d'échec renvoient la même
  réponse `400 Error`, pour ne pas révéler si un email existe.

## Tester avec curl

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

## Structure

```
api/
├── src/
│   ├── server.js                       # Serveur
│   ├── app.js                          # config Express
│   ├── routes/auth.routes.js           # POST /login
│   ├── controllers/auth.controller.js  # logique de connexion
│   └── db/
│       ├── database.js                 # connexion SQLite + table users
│       └── seed.js                     # utilisateurs de test (Argon2id)
├── Dockerfile / compose.yaml           # Dockerisation
├── .env.example
└── package.json
```
