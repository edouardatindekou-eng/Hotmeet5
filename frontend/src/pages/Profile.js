import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import '../styles/Profile.css';

const GET_ME = gql`
  query GetMe {
    me {
      id
      firstName
      lastName
      email
      bio
      age
      location
      interests
      photos {
        id
        photoUrl
        photoOrder
      }
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($firstName: String, $lastName: String, $bio: String, $age: Int, $location: String, $interests: [String!]) {
    updateProfile(firstName: $firstName, lastName: $lastName, bio: $bio, age: $age, location: $location, interests: $interests) {
      id
      firstName
      lastName
      bio
      age
      location
      interests
    }
  }
`;

function Profile() {
  const { data, loading } = useQuery(GET_ME);
  const [updateProfile] = useMutation(UPDATE_PROFILE);
  const [formData, setFormData] = useState({});

  React.useEffect(() => {
    if (data?.me) {
      setFormData(data.me);
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({
        variables: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio,
          age: parseInt(formData.age),
          location: formData.location,
          interests: formData.interests || [],
        },
      });
      alert('Profil mis à jour avec succès!');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="profile">
      <div className="container">
        <h1>Mon Profil</h1>
        <div className="profile-card card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Âge</label>
              <input
                type="number"
                name="age"
                value={formData.age || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Localisation</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Sauvegarder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
