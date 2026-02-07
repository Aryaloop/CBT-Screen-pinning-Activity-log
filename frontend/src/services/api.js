import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // URL Backend Kamu
  withCredentials: true, // WAJIB: Agar Cookie JWT dikirim/diterima otomatis
});

export default api;