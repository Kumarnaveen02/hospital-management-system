import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope, Package,
  Receipt, FileText, Bell, LogOut, Menu, Sun, Moon, Languages
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import { ScrollArea } from '../components/ui/scroll-area';

const API = process.env.REACT_APP_BACKEND_URL || 'http://https://hospital-backend-fvr6.onrender.com';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/patients', label: t('patients'), icon: Users },
    { to: '/appointments', label: t('appointments'), icon: CalendarDays },
    { to: '/doctors', label: t('doctors'), icon: Stethoscope },
    { to: '/prescriptions', label: t('prescriptions'), icon: FileText },
    { to: '/inventory', label: t('inventory'), icon: Package },
    { to: '/billing', label: t('billing'), icon: Receipt },
  ];

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`${API}/api/notifications`);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/api/notifications/read-all`, {});
      fetchNotifications();
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background" data-testid="app-layout">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        data-testid="sidebar"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img
              src="https://customer-assets.emergentagent.com/job_health-inventory-hub-1/artifacts/1gr0ha6a_403889048_670648715155502_7494479213043444718_n.jpg"
              alt="Logo"
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {t('hospitalName1')} {t('hospitalName2')}
              </h1>
              <p className="text-[10px] text-muted-foreground">{t('hospitalSubtitle')}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 py-4 px-3">
          <nav className="space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                data-testid={`nav-${item.to.slice(1)}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-muted-foreground hover:text-destructive hover:border-destructive"
            onClick={handleLogout}
            data-testid="logout-button"
          >
            <LogOut size={14} className="mr-2" />
            {t('signOut')}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              data-testid="mobile-menu-toggle"
            >
              <Menu size={20} />
            </Button>
            <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t('welcome')}, {user?.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-muted-foreground hover:text-foreground gap-1.5"
              data-testid="language-toggle"
            >
              <Languages size={16} />
              <span className="text-xs font-semibold">{lang === 'en' ? 'HI' : 'EN'}</span>
            </Button>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              data-testid="theme-toggle"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="notifications-bell">
                  <Bell size={18} className="text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-3 border-b">
                  <span className="font-semibold text-sm">{t('notifications')}</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[#0EA5E9] hover:underline">
                      {t('markAllRead')}
                    </button>
                  )}
                </div>
                <ScrollArea className="max-h-64">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">{t('noNotifications')}</p>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3">
                        <div className="flex items-center gap-2">
                          {!n.read && <span className="w-2 h-2 bg-[#0EA5E9] rounded-full shrink-0" />}
                          <span className="font-medium text-sm">{n.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-4">{n.message}</p>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant="outline" className="hidden sm:flex text-muted-foreground capitalize">
              {user?.role}
            </Badge>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
