import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const GET_ME = gql`
  query GetMe {
    me {
      id
      firstName
      lastName
      email
      bio
      isPremium
    }
  }
`;

function Dashboard() {
  const { data, loading } = useQuery(GET_ME);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) return <div className="loading">Chargement...</div>;

  const user = data?.me;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-brand">❤️ HotMeet</h1>
          <ul className="navbar-links">
            <li><a href="/search">Découvrir</a></li>
            <li><a href="/messages">Messages</a></li>
            <li><a href="/profile">Profil</a></li>
            <li><a href="#" onClick={handleLogout}>Déconnexion</a></li>
          </ul>
        </div>
      </nav>

      <div className="container">
        <div className="welcome-section">
          <h2>Bienvenue {user?.firstName} ! 👋</h2>
          <p>Explorez les profils, likez et trouvez votre match !</p>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h3>Découvrir</h3>
            <p>Explorez les profils qui vous correspondent</p>
            <button className="btn btn-primary" onClick={() => navigate('/search')}>
              Commencer
            </button>
          </div>

          <div className="card">
            <h3>Messages</h3>
            <p>Discutez en temps réel avec vos matchs</p>
            <button className="btn btn-primary" onClick={() => navigate('/messages')}>
              Ouvrir
            </button>
          </div>

          <div className="card">
            <h3>Profil</h3>
            <p>Complétez et modifiez votre profil</p>
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>
              Éditer
            </button>
          </div>

          {!user?.isPremium && (
            <div className="card premium-card">
              <h3>🌟 Devenir Premium</h3>
              <p>Accédez à des fonctionnalités exclusives</p>
              <button className="btn btn-primary">
                Découvrir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
