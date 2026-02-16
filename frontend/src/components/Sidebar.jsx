import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Menu berdasarkan Role (Standar Clean Code: Configuration over Hardcoding)
  const menus = {
    admin: [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Data Siswa', path: '/admin/siswa' }, // Sesuai FR-W-03
      { label: 'Data Guru', path: '/admin/guru' },
    ],
    guru: [
      { label: 'Dashboard', path: '/guru/dashboard' },
      { label: 'Bank Soal', path: '/guru/ujian' },   // Sesuai FR-W-01
      { label: 'Monitoring', path: '/guru/monitoring' },
    ]
  };

  const currentMenu = menus[user?.peran] || [];

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="flex items-center justify-center h-16 bg-slate-800 shadow-md">
        <h1 className="text-xl font-bold tracking-wider">CBT SYSTEM</h1>
      </div>
      <nav className="mt-5 px-4 space-y-2">
        {currentMenu.map((menu, idx) => (
          <Link
            key={idx}
            to={menu.path}
            className={`block px-4 py-2.5 rounded transition duration-200 ${
              location.pathname === menu.path ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-gray-300'
            }`}
          >
            {menu.label}
          </Link>
        ))}
        <button 
          onClick={logout}
          className="w-full text-left px-4 py-2.5 mt-10 rounded hover:bg-red-600 text-gray-300 hover:text-white transition"
        >
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;