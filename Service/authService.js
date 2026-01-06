const { api } = require('./apiConfig');

const login = async (credentials) => {
  const response = await api.post('/api/signin', credentials);
  return response.data;
};

const addAutoUserActivity = async (data)=>{
    const response = await api.post('/api/addAutoUserActivity', data);
    return response.data;
}

module.exports = {
  login,
  addAutoUserActivity
};
