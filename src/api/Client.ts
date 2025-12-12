import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://localhost:7225/api', // Check your API port!
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;