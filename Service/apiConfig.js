const axios = require('axios');

let token = null;

const api = axios.create({
  baseURL: 'https://time-tracker-server-na4c.onrender.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token before every request
api.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Setter function to update token
const setToken = (newToken) => {
  token = newToken;
};

module.exports = {
  api,
  setToken
};
