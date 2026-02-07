import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Cek User saat aplikasi pertama kali dimuat (Refresh page)
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Hit endpoint /me yang sudah diproteksi token
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  // 2. Fungsi Login
  const login = async (identifier, password) => {
    // Ingat: Backend authController memisahkan login web vs mobile
    // Untuk Web kita pakai endpoint /auth/login/web
    const res = await api.post('/auth/login/web', { 
      email: identifier, // Backend web butuh 'email'
      kata_sandi: password 
    });
    setUser(res.data);
    return res.data;
  };

  // 3. Fungsi Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
    } catch (err) {
      console.error("Logout gagal", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);