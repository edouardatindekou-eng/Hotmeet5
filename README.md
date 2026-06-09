# 🔴 HotMeet - Plateforme de Rencontres Moderne

Une plateforme de rencontres responsive et moderne construite avec React, Node.js, GraphQL et PostgreSQL.

## ✨ Fonctionnalités

✅ **Authentification** - Inscription/Connexion avec JWT
✅ **Profils Utilisateurs** - Bio, photos (4 max), âge, localisation, intérêts
✅ **Système de Like** - Système classique de like/unlike
✅ **Recherche Filtrée** - Filtrer par âge, localisation, intérêts
✅ **Messagerie Temps Réel** - WebSocket pour les messages instantanés
✅ **Notifications** - Notifications en temps réel
✅ **Système Premium** - Subscriptions avec expiration
✅ **Design Responsive** - Adapté à tous les appareils
✅ **Couleurs** - Rouge et Blanc avec design moderne

## 🏗️ Architecture

```
hotmeet5/
├── backend/              # Node.js + Express + GraphQL
│   ├── src/
│   │   ├── graphql/      # TypeDefs et Resolvers
│   │   ├── services/     # Logique métier
│   │   ├── db/           # Pool PostgreSQL
│   │   ├── middleware/   # Authentification JWT
│   │   └── websocket/    # Gestion des messages temps réel
│   └── package.json
└── frontend/             # React
    ├── src/
    │   ├── pages/        # Pages principales
    │   ├── styles/       # CSS
    │   └── App.js
    └── package.json
```

## 🚀 Installation Rapide

### Prérequis
- Node.js v16+
- PostgreSQL v12+
- npm ou yarn

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configurez votre `.env` :
```
DATABASE_URL=postgresql://user:password@localhost:5432/hotmeet
JWT_SECRET=your_super_secret_key
PORT=4000
NODE_ENV=development
```

Initialisez la base de données :
```bash
psql -U postgres -d hotmeet -f src/db/schema.sql
```

Démarrez le serveur :
```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

## 📊 Base de Données

Schéma PostgreSQL inclut :
- `users` - Profils utilisateurs avec is_premium, subscription_type, subscription_expiry
- `profile_photos` - Jusqu'à 4 photos par utilisateur
- `likes` - Système de likes
- `messages` - Conversations
- `conversations` - Groupes de messages
- `notifications` - Notifications en temps réel
- `blocks` - Utilisateurs bloqués

## 🔐 Authentification

- JWT tokens
- Passwords hashés avec bcryptjs
- Tokens d'expiration configurable

## 📱 API GraphQL

### Queries
- `me` - Récupérer l'utilisateur actuel
- `user(id)` - Récupérer un utilisateur
- `searchUsers(filters)` - Chercher des utilisateurs
- `getMessages(conversationId)` - Récupérer les messages
- `getConversations` - Lister les conversations
- `getNotifications` - Lister les notifications

### Mutations
- `register` - Créer un compte
- `login` - Se connecter
- `updateProfile` - Mettre à jour le profil
- `uploadPhoto` - Ajouter une photo
- `likeUser` - Liker un utilisateur
- `sendMessage` - Envoyer un message
- `blockUser` - Bloquer un utilisateur
- `upgradeToPremium` - Passer en premium

## 🎨 Design

- **Couleurs** : Rouge (#dc143c) et Blanc
- **Responsive** : Mobile, Tablet, Desktop
- **Style** : Moderne et minimaliste

## 🌐 Déploiement

### Frontend (GitHub Pages)
```bash
cd frontend
npm run build
```

### Backend (Heroku/Railway)
```bash
git push heroku main
```

## 🤝 Contribution

Les contributions sont bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📝 Licence

MIT - Libre d'utilisation

---

**Créé avec ❤️ par HotMeet Team**

🚀 Prêt à lancer ? Commencez par installer les dépendances !
