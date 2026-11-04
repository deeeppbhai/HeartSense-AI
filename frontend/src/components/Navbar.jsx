import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './StatusBadge';
import { Heart, LogOut, User, Bell, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-800 lg:hidden rounded-lg hover:bg-slate-100 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg flex items-center gap-1">
                HeartSense <span className="text-brand-600">AI</span>
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider -mt-1">
                Clinical Decision Support
              </span>
            </div>
          </Link>
        </div>

        {/* Right: User Status & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center">
            <RoleBadge role={role} />
          </div>

          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
              {user?.first_name ? user.first_name[0] : (user?.username ? user.username[0].toUpperCase() : 'U')}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {user?.full_name || user?.username}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200/60"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
