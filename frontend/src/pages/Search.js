import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import '../styles/Search.css';

const SEARCH_USERS = gql`
  query SearchUsers($filters: SearchFilters!) {
    searchUsers(filters: $filters) {
      users {
        id
        firstName
        lastName
        age
        location
        bio
        interests
        photos {
          photoUrl
        }
      }
      total
    }
  }
`;

const LIKE_USER = gql`
  mutation LikeUser($likedId: ID!) {
    likeUser(likedId: $likedId) {
      id
    }
  }
`;

function Search() {
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 50,
    location: '',
    interests: [],
  });

  const { data, loading, refetch } = useQuery(SEARCH_USERS, {
    variables: { filters },
  });
  const [likeUser] = useMutation(LIKE_USER);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSearch = () => {
    refetch({ filters });
  };

  const handleLike = async (userId) => {
    try {
      await likeUser({ variables: { likedId: userId } });
      alert('Profil aimé!');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  if (loading) return <div>Chargement...</div>;

  const users = data?.searchUsers?.users || [];

  return (
    <div className="search">
      <div className="container">
        <h1>Découvrir</h1>
        <div className="filter-card card">
          <div className="form-group">
            <label>Âge Min</label>
            <input
              type="number"
              name="minAge"
              value={filters.minAge}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label>Âge Max</label>
            <input
              type="number"
              name="maxAge"
              value={filters.maxAge}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label>Localisation</label>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Ville"
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>
            Chercher
          </button>
        </div>

        <div className="users-grid">
          {users.map((user) => (
            <div key={user.id} className="user-card card">
              {user.photos?.length > 0 && (
                <img src={user.photos[0].photoUrl} alt={user.firstName} />
              )}
              <div className="user-info">
                <h3>{user.firstName} {user.lastName}, {user.age}</h3>
                <p>{user.location}</p>
                <p className="bio">{user.bio}</p>
                <div className="interests">
                  {user.interests?.map((interest, idx) => (
                    <span key={idx} className="interest-tag">{interest}</span>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={() => handleLike(user.id)}>
                  ❤️ Liker
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Search;
