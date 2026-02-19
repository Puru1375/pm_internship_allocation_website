import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, FileText, Briefcase, UserCircle, Settings, 
  LogOut, Search, Bell, Menu, X , Plus, ShieldAlert, Award, FilePlus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiGetCompanyProfile, apiGetProfile, apiGetNotifications } from '../services/api';

export default function DashboardLayout() {
  const { user, logout, profileCompletion } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [localProfileCompletion, setLocalProfileCompletion] = useState(profileCompletion);
  const [rejection, setRejection] = useState(null);
  const isRejected = !!rejection;
  
  // Company profile update notifications for admin
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  console.log('DashboardLayout render - user:', user, 'profileCompletion:', profileCompletion);
  // Listen for profile completion changes from AuthContext
  useEffect(() => {
    setLocalProfileCompletion(profileCompletion);
  }, [profileCompletion]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    if(!user) return;
    // Check if this user has been rejected by admin and fetch rejection reason
    const checkRejection = async () => {
      try {
        if (user.role === 'company') {
          const profile = await apiGetCompanyProfile();
          // Accept multiple possible fields from backend: verification_status, status, rejection_reason
          const status = (profile.verification_status || profile.status || '').toLowerCase();
          const reason = profile.rejection_reason || profile.rejectionReason || profile.rejection || null;
          if (status === 'rejected' || reason) setRejection({ reason: reason || 'Your account was rejected by the admin.' });
        } else if (user.role === 'intern') {
          const profile = await apiGetProfile();
          const status = (profile.status || profile.verification_status || '').toLowerCase();
          const reason = profile.rejection_reason || profile.rejectionReason || profile.rejection || null;
          if (status === 'rejected' || reason) setRejection({ reason: reason || 'Your account was rejected by the admin.' });
          // Profile completion is now from AuthContext, no need to fetch here
        } else {
          setRejection(null);
        }
      } catch (err) {
        console.error('Failed to check rejection status:', err);
      }
    };
    checkRejection();
  }, [user]); // Only check on user change, not on location

  // Fetch company profile update notifications for admin
  useEffect(() => {
    if (user?.role !== 'admin') return;
    
    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const data = await apiGetNotifications();
        // Filter to show only info type notifications (company profile updates)
        const companyUpdateNotifications = data.filter(n => n.type === 'info' && n.message.includes('updated their profile'));
        // Sort by created_at descending (newest first)
        companyUpdateNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setNotifications(companyUpdateNotifications);
        console.log('Company Update Notifications:', companyUpdateNotifications);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
      setLoadingNotifications(false);
    };
    
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  // const handleBellClick = () => {
  //   setShowNotif(!showNotif);
  //   if (unreadCount > 0) {
  //       apiMarkNotificationsRead();
  //       // Optimistically update UI
  //       setNotifications(prev => prev.map(n => ({...n, is_read: true})));
  //   }
  // };

  // Generate breadcrumb items based on current path
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', path: `/${user?.role || 'intern'}` }];

    const breadcrumbMap = {
      applications: { label: 'My Applications', path: '/intern/applications' },
      jobs: { label: 'Job Feed', path: '/intern/jobs' },
      profile: { label: 'Profile', path: `/${user?.role}/profile` },
      resume: { label: 'Resume', path: '/intern/resume' },
      settings: { label: 'Settings', path: '/intern/settings' },
      post: { label: 'Post Internship', path: '/company/post' },
      postings: { label: 'Postings', path: '/company/postings' },
      applicants: { label: 'Applicants', path: '/company/applicants' },
      'verify-companies': { label: 'Verify Companies', path: '/admin/verify-companies' },
      'verify-interns': { label: 'Verify Interns', path: '/admin/verify-interns' },
      allocation: { label: 'Allocation', path: '/admin/allocation' },
      certs: { label: 'Certificates', path: '/admin/certs' },
    };

    // Handle detail pages with dynamic IDs
    const handleDetailBreadcrumbs = (pathSegments) => {
      // Check for company detail page: /admin/verify-companies/:companyId
      if (pathSegments[0] === 'admin' && pathSegments[1] === 'verify-companies' && /^\d+$/.test(pathSegments[2])) {
        return [
          { label: 'Home', path: '/admin' },
          { label: 'Verify Companies', path: '/admin/verify-companies' },
          { label: 'Company Details', path: location.pathname }
        ];
      }
      // Check for intern detail page: /admin/verify-interns/:internId
      if (pathSegments[0] === 'admin' && pathSegments[1] === 'verify-interns' && /^\d+$/.test(pathSegments[2])) {
        return [
          { label: 'Home', path: '/admin' },
          { label: 'Verify Interns', path: '/admin/verify-interns' },
          { label: 'Intern Details', path: location.pathname }
        ];
      }
      // Check for certificate detail page: /admin/certs/:certificateId
      if (pathSegments[0] === 'admin' && pathSegments[1] === 'certs' && /^\d+$/.test(pathSegments[2])) {
        return [
          { label: 'Home', path: '/admin' },
          { label: 'Certificates', path: '/admin/certs' },
          { label: 'Certificate Details', path: location.pathname }
        ];
      }
      // Check for issue certificate page: /admin/certs/issue
      if (pathSegments[0] === 'admin' && pathSegments[1] === 'certs' && pathSegments[2] === 'issue') {
        return [
          { label: 'Home', path: '/admin' },
          { label: 'Issue Certificate', path: location.pathname }
        ];
      }
      // Check for posting detail page: /company/postings/:postingId
      if (pathSegments[0] === 'company' && pathSegments[1] === 'postings' && /^\d+$/.test(pathSegments[2])) {
        return [
          { label: 'Home', path: '/company' },
          { label: 'Postings', path: '/company/postings' },
          { label: 'Posting Details', path: location.pathname }
        ];
      }
      // Check for applicant detail page: /company/applicants/:applicantId
      if (pathSegments[0] === 'company' && pathSegments[1] === 'applicants' && /^\d+$/.test(pathSegments[2])) {
        return [
          { label: 'Home', path: '/company' },
          { label: 'Applicants', path: '/company/applicants' },
          { label: 'Applicant Details', path: location.pathname }
        ];
      }
      return null;
    };

    // Check for detail pages first
    const detailBreadcrumbs = handleDetailBreadcrumbs(pathSegments);
    if (detailBreadcrumbs) {
      return detailBreadcrumbs;
    }

    pathSegments.forEach((segment, idx) => {
      if (segment === user?.role) return; // Skip role segment
      
      // Handle dynamic job ID (numeric segment after 'jobs')
      if (segment === 'jobs' && idx < pathSegments.length - 1) {
        breadcrumbs.push({ label: 'Job Feed', path: '/intern/jobs' });
        const jobId = pathSegments[idx + 1];
        if (/^\d+$/.test(jobId)) {
          breadcrumbs.push({ label: 'Internship Details', path: location.pathname });
        }
        return; // Skip this segment, handled above
      }
      
      const breadcrumbItem = breadcrumbMap[segment];
      if (breadcrumbItem) {
        breadcrumbs.push(breadcrumbItem);
      }
    });

    return breadcrumbs;
  };

  // Define the exact menu items from the image
   let menuItems = [];
  
  if (user?.role === 'company') {
    menuItems = [
      { name: 'Dashboard', path: '/company', icon: LayoutDashboard },
      { name: 'Internship Postings', path: '/company/post', icon: Briefcase }, // Briefcase icon
      { name: 'Postings', path: '/company/postings', icon: FileText },
      { name: 'Applicants', path: '/company/applicants', icon: ShieldAlert },
      { name: 'Profile', path: '/company/profile', icon: UserCircle },
    ];
  } else if (user?.role === 'admin') {
    menuItems = [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Verify Companies', path: '/admin/verify-companies', icon: ShieldAlert },
      { name: 'Verify Interns', path: '/admin/verify-interns', icon: UserCircle },
      { name: 'Allocation', path: '/admin/allocation', icon: Settings },
      { name: 'Issue Certificate', path: '/admin/certs/issue', icon: FilePlus },
      { name: 'Certificates', path: '/admin/certs', icon: Award },
    ];
  }else {
    // Student items (Keep existing)
    menuItems = [
      { name: 'Dashboard', path: '/intern', icon: LayoutDashboard },
      { name: 'Job Feed', path: '/intern/jobs', icon: Search },
      { name: 'My Applications', path: '/intern/applications', icon: Briefcase },
      { name: 'Resume', path: '/intern/resume', icon: FileText },
      { name: 'Profile', path: '/intern/profile', icon: UserCircle },
    ];
  }

  // Generate initials from user name for simple avatar
  const getInitials = () => {
    const name = user?.full_name || user?.name || user?.email || 'U';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans text-slate-900">
      
      {/* --- SIDEBAR (Desktop: Fixed Left, Mobile: Hidden/Drawer) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-slate-100 transform transition-transform duration-200 ease-in-out
        md:translate-x-0 md:static md:block
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="h-16 flex items-center px-5 border-b border-transparent md:border-none">
          <div className="h-7 w-7 bg-blue-600 rounded-full flex items-center justify-center mr-2">
            <div className="h-3 w-3 bg-white rounded-full opacity-30"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight">SkillBridge</span>
            <span className="text-[10px] text-slate-500 -mt-0.5">
              {user?.role === 'intern' ? 'Student Portal' : user?.role === 'company' ? 'Company Portal' : user?.role === 'admin' ? 'Admin Portal' : 'Dashboard'}
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1 mt-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/intern' && location.pathname === '/intern');
            
            // Access control: interns need >= 75% completion to access non-dashboard pages
            // IMPORTANT: Profile page must ALWAYS be accessible so interns can complete their profile!
            const hasAccess = user?.role !== 'intern' || localProfileCompletion >= 75;
            const isDashboard = item.path === '/intern' || item.path === '/company' || item.path === '/admin';
            const isProfilePage = item.path === '/intern/profile' || item.path === '/company/profile';
            const canNavigate = hasAccess || isDashboard || isProfilePage;
            
            return (
                <Link
                  key={item.name}
                  to={canNavigate ? item.path : '#'}
                  onClick={(e) => {
                    if (!canNavigate) {
                      e.preventDefault();
                      return;
                    }
                    setSidebarOpen(false);
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-[#EBF3FF] text-blue-600' 
                      : canNavigate
                        ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 cursor-pointer'
                        : 'text-slate-400 cursor-not-allowed opacity-50'}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  {item.name}
                </Link>
              );
          })}
        </nav>

        {/* Logout at bottom */}
        <div className="absolute bottom-6 left-0 w-full px-3">
        
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors w-full">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white md:bg-[#F8F9FC] border-b md:border-none border-slate-100 flex items-center justify-between px-4 md:px-6">
          
          {/* Mobile Menu Toggle */}
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 mr-3">
            <Menu size={22} />
          </button>

          {/* Breadcrumb Navigation */}
          <div className="flex-1 max-w-xl px-2">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              {getBreadcrumbs().map((crumb, idx) => (
                <div key={crumb.path} className="flex items-center gap-2">
                  <Link to={crumb.path} className="hover:text-slate-900 transition-colors">
                    {crumb.label}
                  </Link>
                  {idx < getBreadcrumbs().length - 1 && <span>/</span>}
                </div>
              ))}
            </div>
            <span className="md:hidden font-bold text-base">Dashboard</span>
          </div>

          {/* Right Icons (Bell & Profile) - hidden when rejected to prevent actions */}
          <div className="flex items-center gap-3 ml-3">
            {!isRejected && (
              <>
                {/* Company Profile Update Notifications for Admin */}
                {user?.role === 'admin' && (
                  <div className="relative notification-dropdown-container">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 bg-white rounded-full text-slate-600 hover:bg-slate-100 shadow-sm relative"
                      title="Company Profile Updates"
                    >
                      <Bell size={18} />
                      {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-2 h-2 w-2 bg-blue-500 rounded-full border border-white"></span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                      <div className="absolute top-12 right-0 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-slate-100 bg-blue-50 font-semibold text-sm flex items-center justify-between">
                          <span className="text-blue-900">Company Profile Updates</span>
                          <button 
                            onClick={() => setShowNotifications(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {loadingNotifications ? (
                            <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                          ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">No company profile updates</div>
                          ) : (
                            notifications.map((notif) => {
                              const timestamp = new Date(notif.created_at);
                              const timeAgo = getTimeAgo(timestamp);
                              
                              return (
                                <div 
                                  key={notif.id} 
                                  className="p-3 border-b border-slate-100 hover:bg-blue-50 transition"
                                >
                                  <p className="text-sm text-slate-900 font-medium">{notif.message}</p>
                                  <p className="text-xs text-slate-500 mt-1">{timeAgo}</p>
                                </div>
                              );
                            })
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                            <p className="text-xs text-slate-600">{notifications.length} total update{notifications.length !== 1 ? 's' : ''}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* --- NOTIFICATION DROPDOWN --- */}
                    {/* {showNotif && (
                        <div className="absolute top-12 right-6 w-72 bg-white border border-slate-100 rounded-lg shadow-xl z-50 overflow-hidden">
                            <div className="p-2.5 border-b border-slate-50 bg-slate-50 font-semibold text-xs">Notifications</div>
                            <div className="max-h-60 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-slate-400">No notifications</div>
                                ) : (
                                    notifications.map((n) => (
                                        <div key={n.id} className={`p-2.5 border-b border-slate-50 text-xs hover:bg-blue-50 transition ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                                            <p className="text-slate-800">{n.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )} */}
                <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center border-2 border-white shadow-sm cursor-pointer">
                  <span className="text-white text-xs font-bold">{getInitials()}</span>
                </div>
              </>
            )}
            {isRejected && (
              <div className="text-sm text-red-600 font-medium">Account restricted</div>
            )}
          </div>
        </header>

        {/* Admin rejection banner (visible when the logged-in user was rejected) */}
        {rejection && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-md mx-4 md:mx-10 -mt-4 mb-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="font-semibold text-red-800">Account Review Result</p>
                <p className="text-sm text-red-700 mt-1">Your account was rejected by the admin{rejection.reason ? `: ${rejection.reason}` : '.'}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
                <button onClick={() => { setRejection(null); }} className="w-full sm:w-auto text-sm text-red-600 px-3 py-2 rounded bg-red-100 hover:bg-red-200">Dismiss</button>
                <button onClick={() => { logout(); }} className="w-full sm:w-auto text-sm text-white bg-red-600 px-3 py-2 rounded hover:bg-red-700">Logout</button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {isRejected ? (
            <div className="max-w-lg mx-auto bg-white rounded-xl border border-red-100 shadow-sm p-4 text-center">
              <h2 className="text-base sm:text-lg font-bold text-red-800 mb-1.5">Your account has been rejected</h2>
              <p className="text-xs text-red-700 mb-3">{rejection?.reason || 'Your account was rejected by the admin.'}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <button onClick={() => logout()} className="w-full sm:w-auto px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">Logout</button>
                <a href="mailto:admin@skillbridge.example?subject=Appeal%20Account%20Rejection" className="w-full sm:w-auto px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm">Contact Admin</a>
              </div>
              <p className="text-[10px] text-slate-400 mt-3">You will not be able to use the site until the admin changes your account status.</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
}