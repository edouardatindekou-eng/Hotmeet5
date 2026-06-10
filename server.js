const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ==================== MODELS ====================

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  bio: String,
  age: Number,
  location: String,
  interests: [String],
  photos: [String],
  isPremium: { type: Boolean, default: false },
  subscriptionType: { type: String, default: 'free' },
  subscriptionExpiry: Date,
  createdAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const likeSchema = new mongoose.Schema({
  likerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Like = mongoose.model('Like', likeSchema);

// ==================== GRAPHQL ====================

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    age: Int
    location: String
    bio: String
    interests: [String!]
    photos: [String!]
    isPremium: Boolean!
    createdAt: String!
  }

  type Message {
    id: ID!
    senderId: ID!
    recipientId: ID!
    content: String!
    isRead: Boolean!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    searchUsers(minAge: Int, maxAge: Int, location: String): [User!]!
    getMessages(recipientId: ID!): [Message!]!
  }

  type Mutation {
    register(email: String!, password: String!, firstName: String!, lastName: String!, age: Int!, location: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateProfile(firstName: String, bio: String, age: Int, location: String): User!
    likeUser(likedId: ID!): String!
    sendMessage(recipientId: ID!, content: String!): Message!
    upgradeToPremium: User!
  }
`;

const resolvers = {
  Query: {
    me: async (_, __, { userId }) => {
      if (!userId) throw new Error('Not authenticated');
      const user = await User.findById(userId);
      return user ? user.toObject() : null;
    },

    searchUsers: async (_, { minAge = 18, maxAge = 100, location }, { userId }) => {
      if (!userId) throw new Error('Not authenticated');
      const query = { _id: { $ne: userId } };
      if (minAge) query.age = { ...query.age, $gte: minAge };
      if (maxAge) query.age = { ...query.age, $lte: maxAge };
      if (location) query.location = new RegExp(location, 'i');
      const users = await User.find(query).limit(20);
      return users.map(u => u.toObject());
    },

    getMessages: async (_, { recipientId }, { userId }) => {
      if (!userId) throw new Error('Not authenticated');
      const messages = await Message.find({
        $or: [{ senderId: userId, recipientId }, { senderId: recipientId, recipientId: userId }]
      }).sort({ createdAt: 1 });
      return messages.map(m => m.toObject());
    },
  },

  Mutation: {
    register: async (_, { email, password, firstName, lastName, age, location }) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) throw new Error('Email already exists');
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashedPassword, firstName, lastName, age, location });
      await user.save();
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const userObj = user.toObject();
      delete userObj.password;
      return { token, user: userObj };
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error('User not found');
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) throw new Error('Invalid password');
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const userObj = user.toObject();
      delete userObj.password;
      return { token, user: userObj };
    },

    updateProfile: async (_, { firstName, bio, age, location }, { userId }) => {
      if (!userId) throw new Error('Not authenticated');
      const user = await User.findByIdAndUpdate(
        userId,
        { firstName, bio, age, location },
        { new: true }
      );
      return user.toObject();
    },

    likeUser: async (_, { likedId }, { userId }) => {
      if (!userId) throw new Error('Not authenticated');
      const like = new Like({ likerId: userId, likedId });
      await like.save();
      return 'User liked!';
    },

    sendMessage: async (_, { recipientId, content }, { userId }) => {
      if (!userId) throw new Error('Not authenticated');
      const message = new Message({ senderId: userId, recipientId, content });
      await message.save();
      return message.toObject();
    },

    upgradeToPremium: async (_, __, { userId }) => {
      if (!userId) throw new Error('Not authenticated');
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      const user = await User.findByIdAndUpdate(
        userId,
        { isPremium: true, subscriptionType: 'premium', subscriptionExpiry: expiryDate },
        { new: true }
      );
      return user.toObject();
    },
  },
};

// ==================== EXPRESS APP ====================

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Auth Middleware
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      req.user = null;
    }
  }
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '🚀 HotMeet is running!' });
});

// Frontend HTML
const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>❤️ HotMeet - Rencontres</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root { --red: #dc143c; --white: #fff; --text: #333; --light: #999; --border: #e0e0e0; }
    body { font-family: -apple-system, sans-serif; background: #f5f5f5; }
    .navbar { background: var(--red); color: var(--white); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
    .navbar a { color: var(--white); text-decoration: none; margin-left: 20px; cursor: pointer; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .card { background: var(--white); border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #dc143c, #ff69b4); }
    .auth-card { background: var(--white); border-radius: 12px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); width: 100%; max-width: 400px; }
    .auth-card h1 { color: var(--red); text-align: center; font-size: 32px; margin-bottom: 20px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 500; }
    .form-group input, .form-group textarea { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 16px; font-family: inherit; }
    .btn { width: 100%; padding: 12px; background: var(--red); color: var(--white); border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn:hover { opacity: 0.9; }
    .error { background: #f8d7da; color: #721c24; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
    .user-card { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    .user-card img { width: 100%; height: 200px; object-fit: cover; }
    .user-info { padding: 15px; }
    .user-info h3 { color: var(--red); margin-bottom: 5px; }
    .user-info p { color: var(--light); font-size: 14px; margin-bottom: 10px; }
    .link { text-align: center; margin-top: 20px; }
    .link a { color: var(--red); cursor: pointer; }
    @media (max-width: 768px) { .auth-card { padding: 20px; } .navbar { flex-direction: column; gap: 10px; } }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script>
    const { useState } = React;
    const { createRoot } = ReactDOM;

    function App() {
      const [page, setPage] = useState('login');
      const [token, setToken] = useState(localStorage.getItem('token'));
      const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [firstName, setFirstName] = useState('');
      const [lastName, setLastName] = useState('');
      const [age, setAge] = useState('');
      const [location, setLocation] = useState('');
      const [error, setError] = useState('');
      const [loading, setLoading] = useState(false);
      const [users, setUsers] = useState([]);

      const API_URL = '/graphql';

      const query = async (gql, variables = {}) => {
        try {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? \`Bearer \${token}\` : '',
            },
            body: JSON.stringify({ query: gql, variables }),
          });
          const data = await response.json();
          if (data.errors) throw new Error(data.errors[0].message);
          return data.data;
        } catch (err) {
          setError(err.message);
          throw err;
        }
      };

      const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const data = await query(\`
            mutation {
              register(email: \"\${email}\", password: \"\${password}\", firstName: \"\${firstName}\", lastName: \"\${lastName}\", age: \${age}, location: \"\${location}\") {
                token
                user { id email firstName }
              }
            }
          \`);
          localStorage.setItem('token', data.register.token);
          localStorage.setItem('user', JSON.stringify(data.register.user));
          setToken(data.register.token);
          setUser(data.register.user);
          setPage('dashboard');
        } finally {
          setLoading(false);
        }
      };

      const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const data = await query(\`
            mutation {
              login(email: \"\${email}\", password: \"\${password}\") {
                token
                user { id email firstName }
              }
            }
          \`);
          localStorage.setItem('token', data.login.token);
          localStorage.setItem('user', JSON.stringify(data.login.user));
          setToken(data.login.token);
          setUser(data.login.user);
          setPage('dashboard');
        } finally {
          setLoading(false);
        }
      };

      const handleLogout = () => {
        localStorage.clear();
        setToken(null);
        setUser(null);
        setPage('login');
      };

      const handleSearch = async () => {
        try {
          const data = await query(\`
            query {
              searchUsers(minAge: 18, maxAge: 100) {
                id
                firstName
                lastName
                age
                location
                bio
              }
            }
          \`);
          setUsers(data.searchUsers);
        } catch (e) {}
      };

      if (!token) {
        return (
          <div className="auth-container">
            <div className="auth-card">
              <h1>❤️ HotMeet</h1>
              {error && <div className="error">{error}</div>}
              {page === 'login' ? (
                <form onSubmit={handleLogin}>
                  <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Connexion</h2>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Mot de passe</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn" disabled={loading}>{loading ? 'Connexion...' : 'Connexion'}</button>
                  <div className="link"><a onClick={() => setPage('register')}>S'inscrire</a></div>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Inscription</h2>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Mot de passe</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Prénom</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Nom</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Âge</label>
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} min="18" required />
                  </div>
                  <div className="form-group">
                    <label>Localisation</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn" disabled={loading}>{loading ? 'Inscription...' : "S'inscrire"}</button>
                  <div className="link"><a onClick={() => setPage('login')}>Connexion</a></div>
                </form>
              )}
            </div>
          </div>
        );
      }

      return (
        <div>
          <div className="navbar">
            <h1>❤️ HotMeet</h1>
            <div>
              <a onClick={() => setPage('dashboard')}>Accueil</a>
              <a onClick={() => setPage('search')}>Découvrir</a>
              <a onClick={() => setPage('messages')}>Messages</a>
              <a onClick={handleLogout}>Déconnexion</a>
            </div>
          </div>
          <div className="container">
            {page === 'dashboard' && (
              <div>
                <h2>Bienvenue {user?.firstName} ! 👋</h2>
                <p style={{ marginBottom: '30px', color: '#999' }}>Explorez et trouvez votre match</p>
                <div className="grid">
                  <div className="card">
                    <h3 style={{ color: '#dc143c' }}>🔍 Découvrir</h3>
                    <p>Explorez les profils</p>
                    <button className="btn" onClick={() => setPage('search')}>Commencer</button>
                  </div>
                  <div className="card">
                    <h3 style={{ color: '#dc143c' }}>💬 Messages</h3>
                    <p>Discutez avec vos matchs</p>
                    <button className="btn" onClick={() => setPage('messages')}>Ouvrir</button>
                  </div>
                </div>
              </div>
            )}
            {page === 'search' && (
              <div>
                <h2>Découvrir</h2>
                <div className="card">
                  <button className="btn" onClick={handleSearch}>Chercher</button>
                </div>
                {users.length > 0 && (
                  <div className="grid">
                    {users.map(u => (
                      <div key={u.id} className="user-card">
                        <div className="user-info">
                          <h3>{u.firstName} {u.lastName}, {u.age}</h3>
                          <p>{u.location}</p>
                          <p>{u.bio}</p>
                          <button className="btn" style={{ marginTop: '10px' }}>❤️ Liker</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {page === 'messages' && <div className="card"><h2>Messages</h2><p>Fonctionnalité disponible</p></div>}
          </div>
        </div>
      );
    }

    createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>
`;

app.get('/', (req, res) => {
  res.send(htmlContent);
});

app.get('*', (req, res) => {
  res.send(htmlContent);
});

// Start Apollo Server
const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      userId: req.user?.id || null,
      user: req.user || null,
    }),
  });

  await server.start();
  server.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log(`\n🚀 HotMeet sur port ${PORT}`);
    console.log(`📊 GraphQL: http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`💻 Frontend: http://localhost:${PORT}\n`);
  });
};

startServer().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
