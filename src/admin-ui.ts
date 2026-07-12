export const adminHtmlTemplate = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Green Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        darkbg: '#0f172a',
                        cardbg: '#1e293b',
                        brand: '#3b82f6',
                        brandhover: '#2563eb'
                    }
                }
            }
        }
    </script>
    <style>
        body { background-color: #0f172a; color: #f8fafc; }
        .glass-panel { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 1rem; }
        .nav-item { transition: all 0.2s; border-right: 3px solid transparent; }
        .nav-active { background-color: rgba(59, 130, 246, 0.1); color: #60a5fa; border-right: 3px solid #3b82f6; }
        .nav-item:hover:not(.nav-active) { background-color: rgba(255,255,255,0.05); }
        .hidden { display: none !important; }
        .modal-overlay { background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); }

        /* Smooth transitions */
        * { -webkit-tap-highlight-color: transparent; }
        button, a, select, input { transition: all 0.15s ease; }
        .glass-panel { transition: transform 0.2s ease, box-shadow 0.2s ease; }

        /* Toast animation */
        #toast { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease; }

        /* Mobile: full-screen modals */
        @media (max-width: 640px) {
            .modal-overlay > div:not(button) {
                width: 100% !important;
                max-width: 100% !important;
                height: 100dvh !important;
                max-height: 100dvh !important;
                border-radius: 0 !important;
                padding: 1rem !important;
            }
            .modal-overlay { align-items: stretch !important; }
        }

        /* Mobile: responsive table → card layout */
        @media (max-width: 767px) {
            .responsive-table thead { display: none; }
            .responsive-table tbody tr {
                display: block;
                padding: 0.75rem 1rem;
                margin-bottom: 0.5rem;
                border-radius: 0.75rem;
                background: rgba(30, 41, 59, 0.5);
                border: 1px solid rgba(255,255,255,0.03);
            }
            .responsive-table tbody td {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.375rem 0;
                border-bottom: 1px solid rgba(255,255,255,0.03);
                font-size: 0.8125rem;
            }
            .responsive-table tbody td:last-child { border-bottom: none; justify-content: flex-end; gap: 0.25rem; padding-top: 0.5rem; }
            .responsive-table tbody td[data-label]::before {
                content: attr(data-label);
                font-weight: 600;
                color: #94a3b8;
                font-size: 0.6875rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                flex-shrink: 0;
                margin-right: 0.75rem;
            }
            .responsive-table tbody td:not([data-label]) { justify-content: center; }
        }

        /* Touch-friendly action buttons */
        @media (max-width: 767px) {
            td button { padding: 0.625rem !important; min-width: 2.5rem; min-height: 2.5rem; display: inline-flex; align-items: center; justify-content: center; }
            .filter-row select { min-height: 2.5rem; }
        }

        /* Toast: bottom-center on mobile */
        @media (max-width: 640px) {
            #toast { left: 50% !important; right: auto !important; transform: translateX(-50%) translateY(1.25rem); bottom: 1rem; max-width: calc(100vw - 2rem); }
            #toast:not(.translate-y-20) { transform: translateX(-50%) translateY(0); }
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }

        /* Safe area for mobile bottom bar */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
            #mainContent { padding-bottom: calc(6rem + env(safe-area-inset-bottom)); }
        }
    </style>
</head>
<body class="h-[100dvh] flex overflow-hidden antialiased">
    
    <!-- Login Overlay -->
    <div id="loginOverlay" class="fixed inset-0 z-50 flex items-center justify-center bg-darkbg">
        <div class="glass-panel p-8 w-full max-w-md shadow-2xl">
            <h2 class="text-3xl font-bold text-center mb-6 text-white"><i class="fa-solid fa-shield-halved text-brand mr-2"></i>V-Panel</h2>
            <p class="text-slate-400 text-center mb-8">Enter your admin token to continue.</p>
            <div class="mb-4">
                <input type="password" id="adminTokenInput" placeholder="Admin Token" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors">
            </div>
            <button onclick="login()" class="w-full bg-brand hover:bg-brandhover text-white font-medium py-3 rounded-lg transition-colors duration-200">
                Authenticate
            </button>
            <div id="loginError" class="text-red-400 text-sm mt-4 text-center hidden">Invalid token or connection failed.</div>
        </div>
    </div>

    <!-- Sidebar Overlay -->
    <div id="sidebarOverlay" onclick="toggleSidebar()" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 hidden lg:hidden transition-opacity"></div>

    <!-- Sidebar -->
    <aside id="sidebar" class="fixed inset-y-0 left-0 w-64 bg-cardbg border-r border-slate-800 flex flex-col z-50 transform -translate-x-full transition-transform duration-300 lg:relative lg:translate-x-0">
        <div class="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <h1 class="text-xl font-bold tracking-wider text-white"><i class="fa-solid fa-server text-brand mr-2"></i>Green </h1>
            <button onclick="toggleSidebar()" class="lg:hidden text-slate-400 hover:text-white p-2">
                <i class="fa-solid fa-xmark text-xl"></i>
            </button>
        </div>
        <nav class="flex-1 py-6 space-y-1 overflow-y-auto">
            <a href="#" onclick="switchTab('dashboard')" id="nav-dashboard" class="nav-item nav-active flex items-center px-6 py-3 text-slate-300">
                <i class="fa-solid fa-chart-pie w-6"></i>
                <span class="font-medium">Dashboard</span>
            </a>
            <a href="#" onclick="switchTab('configs')" id="nav-configs" class="nav-item flex items-center px-6 py-3 text-slate-300">
                <i class="fa-solid fa-code w-6"></i>
                <span class="font-medium">Configs</span>
            </a>
            <a href="#" onclick="switchTab('links')" id="nav-links" class="nav-item flex items-center px-6 py-3 text-slate-300">
                <i class="fa-solid fa-link w-6"></i>
                <span class="font-medium">Links</span>
            </a>
            <a href="#" onclick="switchTab('devices')" id="nav-devices" class="nav-item flex items-center px-6 py-3 text-slate-300">
                <i class="fa-solid fa-mobile-screen w-6"></i>
                <span class="font-medium">Devices</span>
            </a>
            <a href="#" onclick="switchTab('events')" id="nav-events" class="nav-item flex items-center px-6 py-3 text-slate-300">
                <i class="fa-solid fa-calendar-days w-6"></i>
                <span class="font-medium">Events</span>
            </a>
            <a href="#" onclick="switchTab('announcements')" id="nav-announcements" class="nav-item flex items-center px-6 py-3 text-slate-300">
                <i class="fa-solid fa-bullhorn w-6"></i>
                <span class="font-medium">Announcements</span>
            </a>
            <a href="#" onclick="switchTab('proxies')" id="nav-proxies" class="nav-item flex items-center px-6 py-3 text-slate-300">
                <i class="fa-solid fa-server w-6"></i>
                <span class="font-medium">Proxies</span>
            </a>
            <a href="#" onclick="switchTab('warp')" id="nav-warp" class="nav-item flex items-center px-6 py-3 text-slate-300">
                <i class="fa-solid fa-shield-halved w-6"></i>
                <span class="font-medium">Warp</span>
            </a>
        </nav>
        <div class="p-4 border-t border-slate-800">
            <button onclick="logout()" class="flex items-center text-slate-400 hover:text-white transition-colors w-full px-2 py-2">
                <i class="fa-solid fa-arrow-right-from-bracket w-6"></i>
                <span>Logout</span>
            </button>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col relative overflow-hidden bg-darkbg">
        <!-- Header -->
        <header class="h-16 flex items-center justify-between px-4 sm:px-8 glass-panel rounded-none border-t-0 border-l-0 border-r-0 z-10 shrink-0">
            <div class="flex items-center gap-3">
                <button onclick="toggleSidebar()" class="lg:hidden text-slate-400 hover:text-white p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors">
                    <i class="fa-solid fa-bars text-xl"></i>
                </button>
                <h2 id="pageTitle" class="text-xl font-semibold text-white">Dashboard</h2>
            </div>
            <div class="flex items-center">
                <div class="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm border border-slate-600">
                    <i class="fa-solid fa-user text-slate-300"></i>
                </div>
            </div>
        </header>

        <!-- Dynamic Content Area -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-8 pb-24" id="mainContent">
            
            <!-- Dashboard View -->
            <div id="view-dashboard" class="space-y-6">
                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="glass-panel p-6 flex flex-col justify-center">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-slate-400 font-medium text-sm tracking-wider uppercase">Total Configs</h3>
                            <div class="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><i class="fa-solid fa-code"></i></div>
                        </div>
                        <p class="text-3xl font-bold text-white" id="stat-configs">...</p>
                    </div>
                    <div class="glass-panel p-6 flex flex-col justify-center">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-slate-400 font-medium text-sm tracking-wider uppercase">Active Links</h3>
                            <div class="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><i class="fa-solid fa-link"></i></div>
                        </div>
                        <p class="text-3xl font-bold text-white" id="stat-links">...</p>
                    </div>
                    <div class="glass-panel p-6 flex flex-col justify-center">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-slate-400 font-medium text-sm tracking-wider uppercase">Connected Devices</h3>
                            <div class="p-2 bg-amber-500/20 rounded-lg text-amber-400"><i class="fa-solid fa-mobile-screen"></i></div>
                        </div>
                        <p class="text-3xl font-bold text-white" id="stat-devices">...</p>
                    </div>
                </div>
                
                <div class="mt-8">
                    <h3 class="text-lg font-medium text-white mb-4">Event Slot Tracker</h3>
                    <div id="dashboardEventsContainer" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>

            <!-- Configs View -->
            <div id="view-configs" class="hidden space-y-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-white">Server Configurations</h3>
                    <div class="flex items-center gap-3">
                        <button onclick="openCreateConfigModal()" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand/20">
                            <i class="fa-solid fa-plus mr-2"></i>Add Config
                        </button>
                        <button onclick="withRefresh('refreshConfigsBtn', loadConfigs)" id="refreshConfigsBtn" class="text-slate-400 hover:text-white px-3 py-2 rounded-lg text-sm bg-slate-800 transition-colors" title="Refresh">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                </div>
                <div class="glass-panel overflow-x-auto">
                    <table class="responsive-table w-full text-left text-sm whitespace-nowrap">
                        <thead class="uppercase tracking-wider border-b-2 border-slate-800 text-slate-400 bg-slate-800/50">
                            <tr>
                                <th class="px-6 py-4 font-medium w-16 text-center">Position</th>
                                <th class="px-6 py-4 font-medium hidden md:table-cell">ID</th>
                                <th class="px-6 py-4 font-medium">Name</th>
                                <th class="px-6 py-4 font-medium w-full">Node (VLESS/Trojan URI)</th>
                                <th class="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="configsTableBody" class="divide-y divide-slate-800/50 text-slate-300">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Links View -->
            <div id="view-links" class="hidden space-y-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-white">Base Subscription Links</h3>
                    <div class="flex items-center gap-3">
                        <button onclick="openCreateLinkModal()" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand/20">
                            <i class="fa-solid fa-plus mr-2"></i>Create Base Link
                        </button>
                        <button onclick="withRefresh('refreshLinksBtn', loadLinks)" id="refreshLinksBtn" class="text-slate-400 hover:text-white px-3 py-2 rounded-lg text-sm bg-slate-800 transition-colors" title="Refresh">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                </div>
                <div class="glass-panel overflow-x-auto">
                    <table class="responsive-table w-full text-left text-sm whitespace-nowrap">
                        <thead class="uppercase tracking-wider border-b-2 border-slate-800 text-slate-400 bg-slate-800/50">
                            <tr>
                                <th class="px-6 py-4 font-medium">ID (UUID)</th>
                                <th class="px-6 py-4 font-medium">Remark</th>
                                <th class="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="linksTableBody" class="divide-y divide-slate-800/50 text-slate-300">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Devices View -->
            <div id="view-devices" class="hidden space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 class="text-lg font-medium text-white">Connected Devices</h3>
                    <div class="flex items-center gap-3 w-full sm:w-auto">
                        <div class="relative flex-1 sm:w-64">
                            <i class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                            <input type="text" id="searchDeviceInput" oninput="debouncedFilterDevices()" placeholder="Search by HWID..." class="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                        </div>
                        <button onclick="openAddDeviceModal()" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 shrink-0">
                            <i class="fa-solid fa-plus mr-2"></i>Add Device
                        </button>
                        <button onclick="withRefresh('refreshDevicesBtn', loadDevices)" id="refreshDevicesBtn" class="text-slate-400 hover:text-white px-3 py-2 rounded-lg text-sm bg-slate-800 transition-colors shrink-0" title="Refresh">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-3 mb-4">
                    <select id="filterDeviceType" onchange="filterDevices()" class="filter-row bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-brand focus:border-brand block px-3 py-2 flex-1 min-w-[100px]">
                        <option value="all">All Types</option>
                        <option value="free">Free</option>
                        <option value="paid">Paid</option>
                        <option value="promo">Promo</option>
                        <option value="reg">Reg</option>
                    </select>
                    <select id="filterDeviceOs" onchange="filterDevices()" class="filter-row bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-brand focus:border-brand block px-3 py-2 flex-1 min-w-[100px]">
                        <option value="all">All OS</option>
                        <option value="Android">Android</option>
                        <option value="iOS">iOS</option>
                        <option value="Mac">macOS</option>
                        <option value="Windows">Windows</option>
                        <option value="Unknown">Unknown</option>
                    </select>
                    <select id="filterDeviceEvent" onchange="filterDevices()" class="filter-row bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-brand focus:border-brand block px-3 py-2 flex-1 min-w-[130px]">
                        <option value="all">All Events</option>
                        <option value="none">None</option>
                    </select>
                </div>
                <div class="glass-panel overflow-x-auto">
                    <table class="responsive-table w-full text-left text-sm whitespace-nowrap">
                        <thead class="uppercase tracking-wider border-b-2 border-slate-800 text-slate-400 bg-slate-800/50">
                            <tr>
                                <th class="px-6 py-4 font-medium">HWID</th>
                                <th class="px-6 py-4 font-medium">Event</th>
                                <th class="px-6 py-4 font-medium">OS Info</th>
                                <th class="px-6 py-4 font-medium">Type</th>
                                <th class="px-6 py-4 font-medium hidden md:table-cell">First Seen</th>
                                <th class="px-6 py-4 font-medium">Expiry</th>
                                <th class="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="devicesTableBody" class="divide-y divide-slate-800/50 text-slate-300">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination Controls -->
                <div id="devicesPagination" class="flex items-center justify-between px-2 py-3 hidden">
                    <div class="text-sm text-slate-400" id="devicesPageInfo">Page 1 of 1</div>
                    <div class="flex items-center gap-2">
                        <button id="devicesPrevBtn" onclick="goToDevicesPage(deviceCurrentPage - 1)" class="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            <i class="fa-solid fa-chevron-left mr-1"></i>Previous
                        </button>
                        <button id="devicesNextBtn" onclick="goToDevicesPage(deviceCurrentPage + 1)" class="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            Next<i class="fa-solid fa-chevron-right ml-1"></i>
                        </button>
                    </div>
                </div>

            </div>

            <!-- Events View -->
            <div id="view-events" class="hidden space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 class="text-lg font-medium text-white">Event Subscriptions</h3>
                    <div class="flex items-center gap-3 w-full sm:w-auto">
                        <select id="globalProxySelect" class="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-brand focus:border-brand block w-full sm:w-64 p-2">
                            <option value="default">Default Origin (Worker URL)</option>
                        </select>
                        <button onclick="openCreateEventModal()" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap shrink-0">
                            <i class="fa-solid fa-plus mr-2"></i>Create Event
                        </button>
                        <button onclick="withRefresh('refreshEventsBtn', loadEvents)" id="refreshEventsBtn" class="text-slate-400 hover:text-white px-3 py-2 rounded-lg text-sm bg-slate-800 transition-colors shrink-0" title="Refresh">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                </div>
                <div class="glass-panel overflow-x-auto">
                    <table class="responsive-table w-full text-left text-sm whitespace-nowrap">
                        <thead class="uppercase tracking-wider border-b-2 border-slate-800 text-slate-400 bg-slate-800/50">
                            <tr>
                                <th class="px-6 py-4 font-medium">Name</th>
                                <th class="px-6 py-4 font-medium">Type</th>
                                <th class="px-6 py-4 font-medium hidden md:table-cell">Event URL</th>
                                <th class="px-6 py-4 font-medium">Limit</th>
                                <th class="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="eventsTableBody" class="divide-y divide-slate-800/50 text-slate-300">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Announcements View -->
            <div id="view-announcements" class="hidden space-y-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-white">App Announcements Engine</h3>
                    <div class="flex items-center gap-3">
                        <button onclick="openAnnouncementModal()" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand/20">
                            <i class="fa-solid fa-plus mr-2"></i>Create Target Set
                        </button>
                        <button onclick="withRefresh('refreshAnnouncementsBtn', loadAnnouncements)" id="refreshAnnouncementsBtn" class="text-slate-400 hover:text-white px-3 py-2 rounded-lg text-sm bg-slate-800 transition-colors" title="Refresh">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                </div>
                
                <div class="glass-panel overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="responsive-table w-full text-left border-collapse">
                            <thead>
                                <tr class="border-b border-slate-700/50 bg-slate-800/30">
                                    <th class="px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">Target</th>
                                    <th class="px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="announcementsTableBody" class="divide-y divide-slate-700/50">
                                <!-- Populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Proxies View -->
            <div id="view-proxies" class="hidden space-y-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-white">Proxy Domains (Anti-ISP Blocking)</h3>
                    <div class="flex items-center gap-3">
                        <button onclick="openCreateProxyModal()" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand/20">
                            <i class="fa-solid fa-plus mr-2"></i>Add Proxy
                        </button>
                        <button onclick="withRefresh('refreshProxiesBtn', loadProxies)" id="refreshProxiesBtn" class="text-slate-400 hover:text-white px-3 py-2 rounded-lg text-sm bg-slate-800 transition-colors" title="Refresh">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                </div>
                <div class="glass-panel overflow-x-auto">
                    <table class="responsive-table w-full text-left text-sm whitespace-nowrap">
                        <thead class="uppercase tracking-wider border-b-2 border-slate-800 text-slate-400 bg-slate-800/50">
                            <tr>
                                <th class="px-6 py-4 font-medium">Name</th>
                                <th class="px-6 py-4 font-medium">Proxy URL</th>
                                <th class="px-6 py-4 font-medium">Status</th>
                                <th class="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="proxiesTableBody" class="divide-y divide-slate-800/50 text-slate-300">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Warp View -->
            <div id="view-warp" class="hidden space-y-6">
                <!-- Settings Card -->
                <div class="glass-panel p-6">
                    <h3 class="text-lg font-medium text-white mb-4"><i class="fa-solid fa-gear mr-2 text-brand"></i>Warp Settings</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-400 mb-1">Auto-Connect Mode</label>
                            <div class="flex items-center mt-2">
                                <input type="checkbox" id="warpAutoConnect" class="w-4 h-4 text-brand bg-slate-800 border-slate-700 rounded focus:ring-brand focus:ring-2">
                                <label for="warpAutoConnect" class="ml-2 text-sm font-medium text-slate-300">Auto-generate WARP for new devices</label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-400 mb-1">Default Endpoint</label>
                            <input type="text" id="warpEndpoint" placeholder="162.159.193.8:500" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-400 mb-1">Default Remark</label>
                            <input type="text" id="warpRemark" placeholder="Local Anycast" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                        </div>
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button onclick="saveWarpSettings()" id="saveWarpSettingsBtn" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand/20">
                            <i class="fa-solid fa-floppy-disk mr-2"></i>Save Settings
                        </button>
                    </div>
                </div>

                <!-- Warp Configs Table -->
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-white">WARP Configs</h3>
                    <div class="flex items-center gap-3">
                        <button onclick="openGenerateWarpModal()" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand/20">
                            <i class="fa-solid fa-plus mr-2"></i>Generate WARP
                        </button>
                        <button onclick="withRefresh('refreshWarpBtn', loadWarp)" id="refreshWarpBtn" class="text-slate-400 hover:text-white px-3 py-2 rounded-lg text-sm bg-slate-800 transition-colors" title="Refresh">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                </div>
                <div class="glass-panel overflow-x-auto">
                    <table class="responsive-table w-full text-left text-sm whitespace-nowrap">
                        <thead class="uppercase tracking-wider border-b-2 border-slate-800 text-slate-400 bg-slate-800/50">
                            <tr>
                                <th class="px-6 py-4 font-medium">HWID</th>
                                <th class="px-6 py-4 font-medium hidden md:table-cell">Endpoint</th>
                                <th class="px-6 py-4 font-medium">Remark</th>
                                <th class="px-6 py-4 font-medium">Mode</th>
                                <th class="px-6 py-4 font-medium">Status</th>
                                <th class="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="warpTableBody" class="divide-y divide-slate-800/50 text-slate-300">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>


            <!-- Spacer: ensures last element clears mobile browser bottom bar -->
            <div class="h-32 w-full shrink-0"></div>

        </div>
    </main>

    <div id="createConfigModal" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
        <div class="glass-panel p-4 sm:p-6 w-full max-w-lg shadow-2xl relative">
            <button onclick="closeModal('createConfigModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="text-xl font-bold text-white mb-6">Add/Edit Config</h2>
            <form id="createConfigForm" onsubmit="submitConfig(event)">
                <input type="hidden" id="configId" value="">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Config Name</label>
                        <input type="text" id="configName" required class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Node URI (vless://...)</label>
                        <textarea id="configNode" required rows="4" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none font-mono text-xs"></textarea>
                    </div>
                </div>
                <div class="mt-8 flex justify-end gap-3">
                    <button type="button" onclick="closeModal('createConfigModal')" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand/20">Save Config</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Create Proxy -->
    <div id="createProxyModal" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
        <div class="glass-panel p-4 sm:p-6 w-full max-w-lg shadow-2xl relative">
            <button onclick="closeModal('createProxyModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="text-xl font-bold text-white mb-6">Add/Edit Proxy URL</h2>
            <form id="createProxyForm" onsubmit="submitProxy(event)">
                <input type="hidden" id="proxyId" value="">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Proxy Name (e.g. Vercel 1)</label>
                        <input type="text" id="proxyName" required placeholder="My Edge Proxy" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Full URL (e.g. https://my-proxy.vercel.app)</label>
                        <input type="url" id="proxyUrl" required placeholder="https://..." class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                    </div>
                    <div class="flex items-center mt-4">
                        <input type="checkbox" id="proxyIsActive" checked class="w-4 h-4 text-brand bg-slate-800 border-slate-700 rounded focus:ring-brand focus:ring-2">
                        <label for="proxyIsActive" class="ml-2 text-sm font-medium text-slate-300">Active (Available for Link Generation)</label>
                    </div>
                </div>
                <div class="mt-8 flex justify-end gap-3">
                    <button type="button" onclick="closeModal('createProxyModal')" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand/20">Save Proxy</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Create Link -->
    <div id="createLinkModal" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
        <div class="glass-panel p-4 sm:p-6 w-full max-w-xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onclick="closeModal('createLinkModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="text-xl font-bold text-white mb-6">Create/Edit Base Link</h2>
            
            <form id="createLinkForm" onsubmit="submitLink(event)" class="overflow-y-auto flex-1 pr-2 space-y-5">
                <input type="hidden" id="linkId" value="">
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Remark / UI Note</label>
                    <input type="text" id="linkRemark" placeholder="Optional. Displays in panel." class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand">
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Custom Parameters (Headers)</label>
                    <textarea id="linkCustomParameters" rows="2" placeholder="e.g. profile-title: My Fast V-Panel VPN" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand"></textarea>
                </div>

                <div class="border-t border-slate-700/50 pt-5 mt-2">
                    <label class="block text-sm font-medium text-slate-400 mb-3">Select Configs (Payload)</label>
                    <div id="configSelectionList" class="space-y-2 max-h-48 overflow-y-auto pr-2">
                        <!-- Checkboxes populated here -->
                    </div>
                </div>

                <div class="mt-8 pt-4 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-transparent">
                    <button type="button" onclick="closeModal('createLinkModal')" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand/20">Generate UUID Link</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Create Event -->
    <div id="createEventModal" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
        <div class="glass-panel p-4 sm:p-6 w-full max-w-xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onclick="closeModal('createEventModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="text-xl font-bold text-white mb-6">Create New Event</h2>
            
            <form id="createEventForm" onsubmit="submitEvent(event)" class="overflow-y-auto flex-1 pr-2 space-y-5">
                <input type="hidden" id="eventId" value="">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Event Name</label>
                        <input type="text" id="eventName" required class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Base Link</label>
                        <select id="eventLinkId" required class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                            <!-- Populated -->
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Event Type</label>
                        <select id="eventType" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                            <option value="limited">Limited Release</option>
                            <option value="hwid">Pre-bound HWID Only</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">User Type</label>
                        <select id="eventUserType" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                            <option value="free">Free</option>
                            <option value="paid">Paid</option>
                            <option value="promo">Promo</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Allowed OS</label>
                        <select id="eventOs" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                            <option value="all">All</option>
                            <option value="Android">Android</option>
                            <option value="iOS">iOS</option>
                            <option value="Windows">Windows</option>
                            <option value="Mac">Mac</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Device Limit (0=unlimited)</label>
                        <input type="number" id="eventLimit" value="0" min="0" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
                        <input type="datetime-local" id="eventStartDate" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">End Date</label>
                        <input type="datetime-local" id="eventEndDate" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Allow Days</label>
                        <input type="number" id="eventAllowDays" value="30" min="1" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    </div>
                    <div class="flex items-center mt-6">
                        <input type="checkbox" id="eventIsPromo" class="w-4 h-4 text-brand bg-slate-800 border-slate-700 rounded focus:ring-brand">
                        <label class="ml-2 text-sm font-medium text-slate-300">Is Promo Event?</label>
                    </div>
                </div>


                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Remark</label>
                    <input type="text" id="eventRemark" placeholder="Optional notes" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                </div>

                <div class="mt-8 pt-4 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-transparent">
                    <button type="button" onclick="closeModal('createEventModal')" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg">Cancel</button>
                    <button type="submit" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Save Event</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Create Announcement Set -->
    <div id="createAnnouncementModal" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
        <div class="glass-panel p-4 sm:p-6 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onclick="closeModal('createAnnouncementModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="text-xl font-bold text-white mb-6">Announcement Set</h2>
            
            <form id="createAnnouncementForm" onsubmit="submitAnnouncement(event)" class="overflow-y-auto flex-1 pr-2 space-y-5">
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Target Audience / Event</label>
                    <select id="announcementTarget" required class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                        <option value="global">Global (All Users)</option>
                        <!-- Populated by JS -->
                    </select>
                </div>

                <div id="announcementFields" class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4">
                    <!-- Populated by JS -->
                </div>

                <div class="mt-8 pt-4 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-transparent">
                    <button type="button" onclick="closeModal('createAnnouncementModal')" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg">Cancel</button>
                    <button type="submit" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium">Save Set</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Edit Device -->
    <div id="editDeviceModal" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
        <div class="glass-panel p-4 sm:p-6 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onclick="closeModal('editDeviceModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="text-xl font-bold text-white mb-6">Edit Device</h2>
            
            <form id="editDeviceForm" onsubmit="submitDevice(event)" class="overflow-y-auto flex-1 pr-2 space-y-5">
                <input type="hidden" id="deviceHwid" value="">
                
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">HWID (Read Only)</label>
                    <input type="text" id="deviceHwidDisplay" readonly class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 font-mono text-xs cursor-not-allowed">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">User Type</label>
                        <select id="deviceUserType" required class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                            <option value="free">Free</option>
                            <option value="paid">Paid</option>
                            <option value="promo">Promo</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Assigned Event</label>
                        <select id="deviceEventId" required class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                            <!-- Populated -->
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">OS Info</label>
                        <input type="text" id="deviceOs" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Expire Date</label>
                        <input type="datetime-local" id="deviceExpireDate" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    </div>
                </div>

                <div class="mt-8 pt-4 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-transparent">
                    <button type="button" onclick="closeModal('editDeviceModal')" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">Save Device</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Add Device (Pre-registration) -->
    <div id="addDeviceModal" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
        <div class="glass-panel p-4 sm:p-6 w-full max-w-sm shadow-2xl relative flex flex-col">
            <button onclick="closeModal('addDeviceModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="text-xl font-bold text-white mb-6">Pre-Register Device</h2>
            
            <form id="addDeviceForm" onsubmit="submitNewDevice(event)" class="space-y-5">
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">HWID</label>
                    <input type="text" id="newDeviceHwid" required placeholder="Device Hardware ID" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">OS Platform</label>
                    <select id="newDeviceOs" required class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                        <option value="Android">Android</option>
                        <option value="iOS">iOS</option>
                        <option value="Mac">Mac</option>
                        <option value="Windows">Windows</option>
                    </select>
                </div>
                <div class="mt-8 pt-4 flex justify-end gap-3">
                    <button type="button" onclick="closeModal('addDeviceModal')" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg">Cancel</button>
                    <button type="submit" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20">Add Device</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Generate WARP -->
    <div id="generateWarpModal" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
        <div class="glass-panel p-4 sm:p-6 w-full max-w-md shadow-2xl relative flex flex-col">
            <button onclick="closeModal('generateWarpModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="text-xl font-bold text-white mb-6">Generate WARP Config</h2>
            
            <form id="generateWarpForm" onsubmit="submitGenerateWarp(event)" class="space-y-5">
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Select Device</label>
                    <select id="warpDeviceHwid" required class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                        <!-- Populated by JS -->
                    </select>
                </div>
                <div class="mt-8 pt-4 flex justify-end gap-3">
                    <button type="button" onclick="closeModal('generateWarpModal')" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg">Cancel</button>
                    <button type="submit" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-brand/20">
                        <i class="fa-solid fa-bolt mr-2"></i>Generate
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Edit WARP Config -->
    <div id="editWarpModal" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
        <div class="glass-panel p-4 sm:p-6 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button onclick="closeModal('editWarpModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            <h2 class="text-xl font-bold text-white mb-6">Edit WARP Config</h2>
            
            <form id="editWarpForm" onsubmit="submitEditWarp(event)" class="space-y-4">
                <input type="hidden" id="editWarpHwid">
                <div class="text-xs font-mono text-slate-500 mb-2">HWID: <span id="editWarpHwidDisplay"></span></div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Endpoint</label>
                        <input type="text" id="editWarpEndpoint" oninput="updateWarpPreview()" placeholder="162.159.193.8:2408" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Remark</label>
                        <input type="text" id="editWarpRemark" oninput="updateWarpPreview()" placeholder="Local Anycast" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">MTU</label>
                        <input type="number" id="editWarpMtu" oninput="updateWarpPreview()" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Address V4</label>
                        <input type="text" id="editWarpAddressV4" oninput="updateWarpPreview()" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Address V6</label>
                        <input type="text" id="editWarpAddressV6" oninput="updateWarpPreview()" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Reserved</label>
                        <input type="text" id="editWarpReserved" oninput="updateWarpPreview()" placeholder="1, 2, 3" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-400 mb-1">Status</label>
                        <select id="editWarpStatus" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
                            <option value="active">Active</option>
                            <option value="error">Error</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Public Key</label>
                    <input type="text" id="editWarpPublicKey" oninput="updateWarpPreview()" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-xs font-mono">
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Private Key</label>
                    <input type="text" id="editWarpPrivateKey" oninput="updateWarpPreview()" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-xs font-mono">
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">URI Preview</label>
                    <textarea id="editWarpUriPreview" readonly rows="3" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-emerald-300 text-xs font-mono resize-none"></textarea>
                </div>

                <div class="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button type="button" onclick="closeModal('editWarpModal')" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" class="bg-brand hover:bg-brandhover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand/20">Save Changes</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Notification Toast -->
    <div id="toast" class="fixed bottom-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-2xl transform translate-y-20 opacity-0 transition-all duration-300 z-50 flex items-center">
        <i class="fa-solid fa-check-circle mr-2"></i> <span id="toastMsg">Success</span>
    </div>

    <!-- MAIN APP LOGIC -->
    <script>
        // State
        let ADMIN_TOKEN = localStorage.getItem('vpanel_token') || '';
        let globalConfigs = []; // Cache to generate links
        const API_BASE = '/api/dev';

        // Initialization
        document.addEventListener('DOMContentLoaded', () => {
            if (!ADMIN_TOKEN) {
                document.getElementById('loginOverlay').classList.remove('hidden');
            } else {
                document.getElementById('loginOverlay').classList.add('hidden');
                initDashboard();
            }
        });

        // --- Auth & Generic API ---
        async function login() {
            const token = document.getElementById('adminTokenInput').value;
            if(!token) return;
            
            // Test auth via dash stats
            try {
                const res = await fetch(\`\${API_BASE}/configs\`, { headers: { 'Authorization': \`Bearer \${token}\` } });
                if (res.ok) {
                    ADMIN_TOKEN = token;
                    localStorage.setItem('vpanel_token', token);
                    document.getElementById('loginOverlay').classList.add('hidden');
                    document.getElementById('loginError').classList.add('hidden');
                    initDashboard();
                } else {
                    document.getElementById('loginError').classList.remove('hidden');
                }
            } catch (e) {
                document.getElementById('loginError').classList.remove('hidden');
            }
        }

        function logout() {
            localStorage.removeItem('vpanel_token');
            ADMIN_TOKEN = '';
            document.getElementById('loginOverlay').classList.remove('hidden');
        }

        async function apiFetch(endpoint, method = 'GET', body = null) {
            const opts = {
                method,
                headers: {
                    'Authorization': \`Bearer \${ADMIN_TOKEN}\`,
                    'Content-Type': 'application/json'
                }
            };
            if (body) opts.body = JSON.stringify(body);
            
            const res = await fetch(\`\${API_BASE}\${endpoint}\`, opts);
            if(res.status === 401) { logout(); throw new Error("Unauthorized"); }
            if(!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.error || \`API Error: \${res.status}\`);
            }
            
            return method === 'GET' ? res.json() : await res.json().catch(()=>({}));
        }

        function showToast(msg, type = 'success') {
            const toast = document.getElementById('toast');
            const icon = toast.querySelector('i');
            document.getElementById('toastMsg').innerText = msg;
            toast.classList.remove('bg-emerald-500', 'bg-rose-500', 'translate-y-20', 'opacity-0');
            icon.classList.remove('fa-check-circle', 'fa-triangle-exclamation');
            if (type === 'error') {
                toast.classList.add('bg-rose-500');
                icon.classList.add('fa-triangle-exclamation');
            } else {
                toast.classList.add('bg-emerald-500');
                icon.classList.add('fa-check-circle');
            }
            clearTimeout(toast._t);
            toast._t = setTimeout(() => { toast.classList.add('translate-y-20', 'opacity-0'); }, 3000);
        }

        // --- Reusable table/refresh helpers ---
        function renderTableState(tbodyId, colspan, state, message, retryFn) {
            const tbody = document.getElementById(tbodyId);
            if (state === 'loading') {
                tbody.innerHTML = \`<tr><td colspan="\${colspan}" class="px-6 py-12 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl mb-3 block"></i>\${message || 'Loading...'}</td></tr>\`;
            } else if (state === 'empty') {
                tbody.innerHTML = \`<tr><td colspan="\${colspan}" class="px-6 py-12 text-center text-slate-500"><i class="fa-regular fa-folder-open text-3xl mb-3 block opacity-50"></i>\${message || 'No data found.'}</td></tr>\`;
            } else if (state === 'error') {
                const retryId = \`retry_\${tbodyId}\`;
                window[retryId] = retryFn;
                tbody.innerHTML = \`<tr><td colspan="\${colspan}" class="px-6 py-12 text-center"><i class="fa-solid fa-triangle-exclamation text-rose-400 text-2xl mb-3 block"></i><p class="text-rose-400 mb-3">\${message || 'Failed to load.'}</p><button onclick="window['\${retryId}']()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"><i class="fa-solid fa-rotate-right mr-2"></i>Retry</button></td></tr>\`;
            }
        }

        async function withRefresh(btnId, loadFn) {
            const btn = document.getElementById(btnId);
            if (!btn) return await loadFn();
            const icon = btn.querySelector('i');
            const originalClass = icon ? icon.className : '';
            if (icon) icon.className = 'fa-solid fa-spinner fa-spin';
            btn.disabled = true;
            try {
                await loadFn();
            } finally {
                if (icon) icon.className = originalClass;
                btn.disabled = false;
            }
        }

        // --- Navigation ---
        const tabs = ['dashboard', 'configs', 'links', 'devices', 'events', 'announcements', 'proxies', 'warp'];
        function switchTab(tabId) {
            tabs.forEach(t => {
                document.getElementById(\`nav-\${t}\`).classList.remove('nav-active', 'bg-blue-500/10', 'text-brand');
                document.getElementById(\`view-\${t}\`).classList.add('hidden');
            });
            document.getElementById(\`nav-\${tabId}\`).classList.add('nav-active', 'bg-blue-500/10', 'text-brand');
            document.getElementById(\`view-\${tabId}\`).classList.remove('hidden');
            
            document.getElementById('pageTitle').innerText = tabId.charAt(0).toUpperCase() + tabId.slice(1);

            if (window.innerWidth < 1024) {
                document.getElementById('sidebar').classList.add('-translate-x-full');
                document.getElementById('sidebarOverlay').classList.add('hidden');
            }

            // Load data based on tab
            if (tabId === 'dashboard') initDashboard();
            if (tabId === 'configs') loadConfigs();
            if (tabId === 'links') loadLinks();
            if (tabId === 'devices') { loadDevices(); loadWarp(); }
            if (tabId === 'events') loadEvents();
            if (tabId === 'announcements') loadAnnouncements();
            if (tabId === 'proxies') loadProxies();
            if (tabId === 'warp') { loadWarp(); loadWarpSettings(); }
        }

        function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
        function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            if (sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        }

        function copyHappLink(btnId, btnEl) {
            const link = btnEl.getAttribute('data-link');
            navigator.clipboard.writeText(link).then(() => {
                btnEl.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied!</span>';
                btnEl.classList.remove('bg-violet-500/20', 'text-violet-300', 'border-violet-500/30');
                btnEl.classList.add('bg-emerald-500/20', 'text-emerald-300', 'border-emerald-500/30');
                setTimeout(() => {
                    btnEl.innerHTML = '<i class="fa-regular fa-clipboard"></i> <span>Happ Link</span>';
                    btnEl.classList.remove('bg-emerald-500/20', 'text-emerald-300', 'border-emerald-500/30');
                    btnEl.classList.add('bg-violet-500/20', 'text-violet-300', 'border-violet-500/30');
                }, 2000);
            });
        }

        // --- Dashboard ---
        async function initDashboard() {
            const eventsContainer = document.getElementById('dashboardEventsContainer');
            eventsContainer.innerHTML = '<div class="col-span-full text-center text-slate-400 py-12"><i class="fa-solid fa-spinner fa-spin text-2xl mb-3 block"></i>Loading dashboard...</div>';
            try {
                const [configs, links, devices, events] = await Promise.all([
                    apiFetch('/configs'), apiFetch('/links'), apiFetch('/devices'), apiFetch('/events')
                ]);
                document.getElementById('stat-configs').innerText = configs.length;
                document.getElementById('stat-links').innerText = links.length;
                document.getElementById('stat-devices').innerText = devices.length;

                // Render Events Tracker
                eventsContainer.innerHTML = '';
                
                if (events.length === 0) {
                    eventsContainer.innerHTML = '<div class="text-slate-500 col-span-full flex flex-col items-center py-8"><i class="fa-regular fa-folder-open text-3xl mb-3 opacity-50"></i>No active events.</div>';
                    return;
                }

                events.forEach(e => {
                    const capacity = e.allowed_user > 0 ? e.allowed_user : '∞';
                    const isFull = e.allowed_user > 0 && e.joined_users >= e.allowed_user;
                    const statusColor = isFull ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                    const statusText = isFull ? 'FULL' : 'OPEN';
                    const happBtnId = 'happ-' + e.id.replace(/[^a-zA-Z0-9]/g, '');
                    const expiredCount = devices.filter(d => d.current_event_id === e.id && d.expire_date && new Date() > new Date(d.expire_date)).length;

                    const happBtn = e.happ_link ? \`
                        <button id="\${happBtnId}" onclick="copyHappLink('\${happBtnId}', this)" data-link="\${e.happ_link}" class="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-lg text-xs font-medium hover:bg-violet-500/30 transition-all" title="Copy Happ Link">
                            <i class="fa-regular fa-clipboard"></i>
                            <span>Happ Link</span>
                        </button>
                    \` : '';

                    const card = \`
                        <div class="glass-panel p-5 border border-slate-700/50 relative overflow-hidden group">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h4 class="text-white font-medium truncate max-w-[200px]">\${e.name}</h4>
                                    <p class="text-xs text-slate-400 capitalize">\${e.user_type} users • \${e.allowed_os}</p>
                                </div>
                                <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border \${statusColor}">
                                    \${statusText}
                                </span>
                            </div>
                            
                            <div class="flex items-end justify-between mb-3">
                                <div class="flex gap-6">
                                    <div>
                                        <p class="text-xs text-slate-500 mb-1 uppercase tracking-wider">Slots Taken</p>
                                        <div class="flex items-baseline gap-1">
                                            <span class="text-2xl font-bold \${isFull ? 'text-rose-400' : 'text-white'}">\${e.joined_users}</span>
                                            <span class="text-sm text-slate-500">/ \${capacity}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p class="text-xs text-slate-500 mb-1 uppercase tracking-wider">Expired</p>
                                        <span class="text-2xl font-bold \${expiredCount > 0 ? 'text-rose-400' : 'text-slate-500'}">\${expiredCount}</span>
                                    </div>
                                </div>
                                \${happBtn}
                            </div>
                            
                            <div class="absolute bottom-0 left-0 h-1 bg-brand/20 w-full">
                                <div class="h-full \${isFull ? 'bg-rose-500' : 'bg-brand'} transition-all" style="width: \${e.allowed_user > 0 ? Math.min((e.joined_users / e.allowed_user) * 100, 100) : 0}%;"></div>
                            </div>
                        </div>
                    \`;
                    eventsContainer.innerHTML += card;
                });

            } catch (e) {
                document.getElementById('stat-configs').innerText = '—';
                document.getElementById('stat-links').innerText = '—';
                document.getElementById('stat-devices').innerText = '—';
                eventsContainer.innerHTML = \`<div class="col-span-full text-center py-12"><i class="fa-solid fa-triangle-exclamation text-rose-400 text-2xl mb-3 block"></i><p class="text-rose-400 mb-3">\${e.message || 'Failed to load dashboard.'}</p><button onclick="initDashboard()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"><i class="fa-solid fa-rotate-right mr-2"></i>Retry</button></div>\`;
                showToast(e.message || 'Failed to load dashboard', 'error');
            }
        }

        // --- Configs Logic ---
        let draggedConfigId = null;

        function configDragStart(e, id) {
            draggedConfigId = id;
            e.dataTransfer.effectAllowed = "move";
            e.currentTarget.classList.add('opacity-40');
        }

        function configDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        }

        async function configDrop(e, targetId) {
            e.preventDefault();
            if (draggedConfigId === null || draggedConfigId === targetId) return;

            const fromIndex = globalConfigs.findIndex(c => c.id === draggedConfigId);
            const toIndex = globalConfigs.findIndex(c => c.id === targetId);

            if (fromIndex !== -1 && toIndex !== -1) {
                const [moved] = globalConfigs.splice(fromIndex, 1);
                globalConfigs.splice(toIndex, 0, moved);

                renderConfigsTable(globalConfigs);
                await saveConfigOrder();
            }
            draggedConfigId = null;
        }

        async function moveConfig(id, direction) {
            const index = globalConfigs.findIndex(c => c.id === id);
            if (index === -1) return;

            if (direction === 'up' && index > 0) {
                const temp = globalConfigs[index];
                globalConfigs[index] = globalConfigs[index - 1];
                globalConfigs[index - 1] = temp;
            } else if (direction === 'down' && index < globalConfigs.length - 1) {
                const temp = globalConfigs[index];
                globalConfigs[index] = globalConfigs[index + 1];
                globalConfigs[index + 1] = temp;
            } else {
                return;
            }

            renderConfigsTable(globalConfigs);
            await saveConfigOrder();
        }

        async function saveConfigOrder() {
            try {
                const ids = globalConfigs.map(c => c.id);
                await apiFetch('/configs/reorder', 'PUT', { ids });
                showToast("Order Saved!");
            } catch (e) {
                showToast("Failed to save configuration order: " + e.message, 'error');
                loadConfigs();
            }
        }

        function renderConfigsTable(configs) {
            const tbody = document.getElementById('configsTableBody');
            tbody.innerHTML = '';
            configs.forEach(c => {
                const row = \`<tr class="hover:bg-slate-800/30 transition-colors cursor-default" draggable="true" ondragstart="configDragStart(event, \${c.id})" ondragover="configDragOver(event)" ondragend="this.classList.remove('opacity-40')" ondrop="configDrop(event, \${c.id})">
                    <td class="px-6 py-3 flex items-center justify-center space-x-1" data-label="">
                        <i class="fa-solid fa-grip-vertical text-slate-500 cursor-grab hover:text-slate-300 mr-2" title="Drag to reorder"></i>
                        <button onclick="moveConfig(\${c.id}, 'up')" class="text-slate-500 hover:text-white p-1 transition-colors" title="Move Up"><i class="fa-solid fa-chevron-up text-xs"></i></button>
                        <button onclick="moveConfig(\${c.id}, 'down')" class="text-slate-500 hover:text-white p-1 transition-colors" title="Move Down"><i class="fa-solid fa-chevron-down text-xs"></i></button>
                    </td>
                    <td class="px-6 py-4 hidden md:table-cell" data-label="ID">\${c.id}</td>
                    <td class="px-6 py-4 font-medium text-white" data-label="Name">\${c.name}</td>
                    <td class="px-6 py-4 truncate max-w-xs text-xs text-slate-400 font-mono" data-label="Node">\${c.node}</td>
                    <td class="px-6 py-4 text-right" data-label="">
                        <button onclick="editConfig(\${c.id})" class="text-indigo-400 hover:text-indigo-300 p-2 rounded-lg"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteConfig(\${c.id})" class="text-rose-400 hover:text-rose-300 p-2 rounded-lg"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>\`;
                tbody.innerHTML += row;
            });
        }

        async function loadConfigs() {
            renderTableState('configsTableBody', 5, 'loading');
            try {
                const configs = await apiFetch('/configs');
                globalConfigs = configs;
                if (configs.length === 0) {
                    renderTableState('configsTableBody', 5, 'empty', 'No configs yet. Add a config to get started.');
                } else {
                    renderConfigsTable(configs);
                }
            } catch (e) {
                renderTableState('configsTableBody', 5, 'error', e.message, loadConfigs);
            }
        }

        function openCreateConfigModal() {
            document.getElementById('createConfigForm').reset();
            document.getElementById('configId').value = '';
            openModal('createConfigModal');
        }

        function editConfig(id) {
            const row = globalConfigs.find(c => c.id === id);
            if(!row) return;
            document.getElementById('configId').value = row.id;
            document.getElementById('configName').value = row.name;
            document.getElementById('configNode').value = row.node;
            openModal('createConfigModal');
        }

        async function submitConfig(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const btnText = btn.innerHTML;
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';
            const id = document.getElementById('configId').value;
            const name = document.getElementById('configName').value;
            const node = document.getElementById('configNode').value;
            try {
                if (id) {
                    await apiFetch(\`/configs/\${id}\`, 'PUT', { name, node });
                    showToast("Config Updated!");
                } else {
                    await apiFetch('/configs', 'POST', { name, node });
                    showToast("Config Added!");
                }
                closeModal('createConfigModal');
                document.getElementById('createConfigForm').reset();
                loadConfigs();
            } catch (e) { showToast("Failed to save config: " + e.message, 'error'); } finally {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                btn.innerHTML = btnText;
            }
        }

        async function deleteConfig(id) {
            if(!confirm("Delete this config?")) return;
            try {
                await apiFetch(\`/configs/\${id}\`, 'DELETE');
                showToast("Config Deleted");
                loadConfigs();
            } catch (e) { showToast("Delete failed: " + e.message, 'error'); }
        }

        // --- Links Logic ---
        let globalLinks = [];

        async function loadLinks() {
            renderTableState('linksTableBody', 3, 'loading');
            try {
                const links = await apiFetch('/links');
                globalLinks = links;
                const tbody = document.getElementById('linksTableBody');
                tbody.innerHTML = '';
                if (links.length === 0) {
                    renderTableState('linksTableBody', 3, 'empty', 'No base links yet. Create one to combine configs.');
                    return;
                }
                links.forEach(l => {
                    const displayId = \`\${l.id.substring(0,8)}...\`;
                    const row = \`<tr class="hover:bg-slate-800/30 transition-colors">
                        <td class="px-6 py-4 font-mono text-xs" data-label="ID">\${displayId}</td>
                        <td class="px-6 py-4" data-label="Remark">\${l.remark || 'N/A'}</td>
                        <td class="px-6 py-4 text-right" data-label="">
                            <button onclick="editLink('\${l.id}')" class="text-indigo-400 hover:text-indigo-300 p-2 rounded-lg"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteLink('\${l.id}')" class="text-rose-400 hover:text-rose-300 p-2 rounded-lg"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>\`;
                    tbody.innerHTML += row;
                });
            } catch (e) {
                renderTableState('linksTableBody', 3, 'error', e.message, loadLinks);
            }
        }

        async function openCreateLinkModal() {
            if(globalConfigs.length === 0) await loadConfigs();
            const container = document.getElementById('configSelectionList');
            container.innerHTML = globalConfigs.length === 0 ? '<div class="text-sm text-slate-500">No configs available. Please create one first.</div>' : '';
            
            globalConfigs.forEach(c => {
                container.innerHTML += \`
                    <label class="flex items-center p-3 rounded-lg border border-slate-700 hover:bg-slate-800 cursor-pointer transition-colors">
                        <input type="checkbox" name="selectedConfigs" value="\${c.id}" class="w-4 h-4 text-brand bg-slate-900 border-slate-600 rounded focus:ring-brand">
                        <div class="ml-3 flex-1 flex justify-between">
                            <span class="text-white text-sm font-medium">\${c.name}</span>
                            <span class="text-slate-500 text-xs">ID: \${c.id}</span>
                        </div>
                    </label>
                \`;
            });
            document.getElementById('createLinkForm').reset();
            document.getElementById('linkId').value = '';
            
            // Set default custom parameters
            document.getElementById('linkCustomParameters').value = '#profile-web-page-url: https://h2tunnel.htethtut.site\\n#support-url: https://t.me/H2Tunnel';
            
            openModal('createLinkModal');
        }

        async function editLink(id) {
            const link = globalLinks.find(l => l.id === id);
            if(!link) return;
            
            if(globalConfigs.length === 0) await loadConfigs();
            const container = document.getElementById('configSelectionList');
            container.innerHTML = globalConfigs.length === 0 ? '<div class="text-sm text-slate-500">No configs available. Please create one first.</div>' : '';
            
            globalConfigs.forEach(c => {
                container.innerHTML += \`
                    <label class="flex items-center p-3 rounded-lg border border-slate-700 hover:bg-slate-800 cursor-pointer transition-colors">
                        <input type="checkbox" name="selectedConfigs" value="\${c.id}" class="w-4 h-4 text-brand bg-slate-900 border-slate-600 rounded focus:ring-brand">
                        <div class="ml-3 flex-1 flex justify-between">
                            <span class="text-white text-sm font-medium">\${c.name}</span>
                            <span class="text-slate-500 text-xs">ID: \${c.id}</span>
                        </div>
                    </label>
                \`;
            });

            document.getElementById('linkId').value = link.id;
            document.getElementById('linkRemark').value = link.remark || '';
            document.getElementById('linkCustomParameters').value = link.custom_parameters || '';
            
            openModal('createLinkModal');
        }

        async function submitLink(e) {
            e.preventDefault();
            const selectedBoxes = document.querySelectorAll('input[name="selectedConfigs"]:checked');
            if(selectedBoxes.length === 0) { showToast("Please select configs.", 'error'); return; }

            const btn = e.target.querySelector('button[type="submit"]');
            const btnText = btn.innerHTML;
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';

            const selectedIds = Array.from(selectedBoxes).map(cb => parseInt(cb.value));
            const nodes = globalConfigs.filter(c => selectedIds.includes(c.id)).map(c => c.node);
            
            const linkId = document.getElementById('linkId').value;
            const payload = {
                remark: document.getElementById('linkRemark').value,
                custom_parameters: document.getElementById('linkCustomParameters').value,
                combined_configs: nodes.join('\\n')
            };

            try {
                if (linkId) {
                    await apiFetch(\`/links/\${linkId}\`, 'PUT', payload);
                    showToast("Base Link Updated");
                } else {
                    payload.id = crypto.randomUUID();
                    await apiFetch('/links', 'POST', payload);
                    showToast("Base Link Created");
                }
                closeModal('createLinkModal');
                document.getElementById('createLinkForm').reset();
                loadLinks();
            } catch (e) { showToast("Failed to save link: " + e.message, 'error'); } finally {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                btn.innerHTML = btnText;
            }
        }

        async function deleteLink(id) {
            if(!confirm("Delete this link? Users bound to this will lose access.")) return;
            try {
                await apiFetch(\`/links/\${id}\`, 'DELETE');
                showToast("Link Deleted");
                loadLinks();
            } catch (e) { showToast("Delete failed: " + e.message, 'error'); }
        }

        // --- Devices Logic ---
        let globalDevices = [];
        
        // --- Device Pagination & Debounce State ---
        let deviceCurrentPage = 1;
        const DEVICES_PER_PAGE = 50;
        let filteredDeviceCache = [];
        let _filterDebounceTimer = null;

        function debouncedFilterDevices() {
            clearTimeout(_filterDebounceTimer);
            _filterDebounceTimer = setTimeout(() => {
                deviceCurrentPage = 1;
                filterDevices();
            }, 250);
        }

        function goToDevicesPage(page) {
            const totalPages = Math.max(1, Math.ceil(filteredDeviceCache.length / DEVICES_PER_PAGE));
            deviceCurrentPage = Math.max(1, Math.min(page, totalPages));
            renderDevices(filteredDeviceCache);
        }

        function updateDevicesPagination(totalItems) {
            const totalPages = Math.max(1, Math.ceil(totalItems / DEVICES_PER_PAGE));
            const pageInfo = document.getElementById('devicesPageInfo');
            const prevBtn = document.getElementById('devicesPrevBtn');
            const nextBtn = document.getElementById('devicesNextBtn');
            const paginationEl = document.getElementById('devicesPagination');

            if (!pageInfo || !prevBtn || !nextBtn || !paginationEl) return;

            if (totalItems === 0) {
                paginationEl.classList.add('hidden');
                return;
            }
            paginationEl.classList.remove('hidden');

            pageInfo.textContent = \`Page \${deviceCurrentPage} of \${totalPages}\`;
            prevBtn.disabled = deviceCurrentPage <= 1;
            nextBtn.disabled = deviceCurrentPage >= totalPages;
        }

        async function loadDevices() {
            renderTableState('devicesTableBody', 7, 'loading');
            try {
                if (globalEvents.length === 0) {
                    globalEvents = await apiFetch('/events');
                }
                globalDevices = await apiFetch('/devices');
                populateDeviceFilters();
                // Re-apply active filters instead of resetting them
                filterDevices();
            } catch (e) {
                renderTableState('devicesTableBody', 7, 'error', e.message, loadDevices);
            }
        }

        function populateDeviceFilters() {
            const select = document.getElementById('filterDeviceEvent');
            const currentValue = select.value;
            select.innerHTML = '<option value="all">All Events</option><option value="none">None</option>';
            globalEvents.forEach(e => {
                select.innerHTML += \`<option value="\${e.id}">\${e.name}</option>\`;
            });
            if (currentValue && Array.from(select.options).some(o => o.value === currentValue)) {
                select.value = currentValue;
            } else {
                select.value = 'all';
            }
        }

        function filterDevices() {
            const query = document.getElementById('searchDeviceInput').value.toLowerCase();
            const typeFilter = document.getElementById('filterDeviceType').value;
            const osFilter = document.getElementById('filterDeviceOs').value;
            const eventFilter = document.getElementById('filterDeviceEvent').value;

            filteredDeviceCache = globalDevices.filter(d => {
                if (query && !(d.hwid || '').toLowerCase().includes(query)) return false;
                if (typeFilter !== 'all' && d.user_type !== typeFilter) return false;
                if (osFilter !== 'all') {
                    const devOs = (d.device_info_os || 'Unknown').toLowerCase();
                    const filterOs = osFilter.toLowerCase();
                    const isMatch = filterOs === 'mac'
                        ? devOs.includes('mac')
                        : devOs.includes(filterOs);
                    if (!isMatch) return false;
                }
                if (eventFilter !== 'all') {
                    if (eventFilter === 'none') {
                        if (d.current_event_id) return false;
                    } else if (d.current_event_id !== eventFilter) {
                        return false;
                    }
                }
                return true;
            });
            renderDevices(filteredDeviceCache, query);
        }

        function renderDevices(devices, searchQuery = '') {
            const tbody = document.getElementById('devicesTableBody');
            tbody.innerHTML = '';
            
            if (devices.length === 0) {
                 const msg = searchQuery ? 'No devices match your search.' : 'No devices found.';
                 tbody.innerHTML = \`<tr><td colspan="7" class="px-6 py-12 text-center text-slate-500"><i class="fa-regular fa-folder-open text-3xl mb-3 block opacity-50"></i>\${msg}</td></tr>\`;
                 updateDevicesPagination(0);
                 return;
            }

            // Pagination slice
            const totalPages = Math.max(1, Math.ceil(devices.length / DEVICES_PER_PAGE));
            if (deviceCurrentPage > totalPages) deviceCurrentPage = totalPages;
            const startIdx = (deviceCurrentPage - 1) * DEVICES_PER_PAGE;
            const pageDevices = devices.slice(startIdx, startIdx + DEVICES_PER_PAGE);

            function osIcon(os) {
                const osLower = (os || '').toLowerCase();
                if (osLower.includes('android')) return '🤖';
                if (osLower.includes('ios') || osLower.includes('iphone')) return '🍎';
                if (osLower.includes('mac')) return '💻';
                if (osLower.includes('windows') || osLower.includes('win')) return '🪟';
                return '❓';
            }

            pageDevices.forEach(d => {
                const expireText = d.expire_date ? new Date(d.expire_date).toLocaleDateString() : 'Never';
                const isExpired = d.expire_date && new Date() > new Date(d.expire_date);
                
                const ev = globalEvents.find(e => e.id === d.current_event_id || e.id === d.event_id);
                const eventName = ev ? ev.name : 'None';
                const hasWarp = globalWarpConfigs.some(w => w.hwid === d.hwid);
                const warpClass = hasWarp ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-brand';
                const warpTitle = hasWarp ? 'WARP Connected (click to regenerate)' : 'WARP Connect';
                const osLabel = d.device_info_os || 'Unknown';
                
                const row = \`<tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="px-6 py-4 font-mono text-xs text-slate-400" data-label="HWID">\${d.hwid}</td>
                    <td class="px-6 py-4 text-xs text-brand" data-label="Event">\${eventName}</td>
                    <td class="px-6 py-4 text-xs" data-label="OS"><span class="mr-1.5">\${osIcon(osLabel)}</span>\${osLabel}</td>
                    <td class="px-6 py-4 uppercase text-xs font-semibold" data-label="Type">\${d.user_type} \${d.has_used_promo ? '<i class="fa-solid fa-gift text-brand ml-1" title="Used Promo"></i>' : ''}</td>
                    <td class="px-6 py-4 text-xs text-slate-400 hidden md:table-cell" data-label="First Seen">\${new Date(d.first_date).toLocaleDateString()}</td>
                    <td class="px-6 py-4 text-xs \${isExpired ? 'text-rose-400' : 'text-emerald-400'}" data-label="Expiry">\${expireText}</td>
                    <td class="px-6 py-4 text-right" data-label="">
                        <button onclick="connectDeviceWarp('\${d.hwid}')" class="\${warpClass} p-2 rounded-lg" title="\${warpTitle}"><i class="fa-solid fa-bolt"></i></button>
                        <button onclick="editDevice('\${d.hwid}')" class="text-indigo-400 hover:text-indigo-300 p-2 rounded-lg"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteDevice('\${d.hwid}')" class="text-rose-400 hover:text-rose-300 p-2 rounded-lg" title="Revoke Device"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>\`;
                tbody.innerHTML += row;
            });
            updateDevicesPagination(devices.length);
        }

        async function editDevice(hwid) {
            const device = globalDevices.find(d => d.hwid === hwid);
            if (!device) return;

            if (globalEvents.length === 0) await loadEvents();
            const eventSelect = document.getElementById('deviceEventId');
            eventSelect.innerHTML = globalEvents.length === 0 ? '<option value="">-- No Events available --</option>' : '<option value="">-- None --</option>';
            globalEvents.forEach(e => {
                eventSelect.innerHTML += \`<option value="\${e.id}">\${e.name}</option>\`;
            });

            document.getElementById('deviceHwid').value = device.hwid;
            document.getElementById('deviceHwidDisplay').value = device.hwid;
            document.getElementById('deviceUserType').value = device.user_type;
            document.getElementById('deviceEventId').value = device.current_event_id || device.event_id || '';
            document.getElementById('deviceOs').value = device.device_info_os || '';
            
            if (device.expire_date) {
                const d = new Date(device.expire_date);
                const pad = (n) => n.toString().padStart(2, '0');
                const localStr = \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}-\${pad(d.getDate())}T\${pad(d.getHours())}:\${pad(d.getMinutes())}\`;
                document.getElementById('deviceExpireDate').value = localStr;
            } else {
                 document.getElementById('deviceExpireDate').value = '';
            }

            openModal('editDeviceModal');
        }

        async function submitDevice(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const btnText = btn.innerHTML;
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';
            const hwid = document.getElementById('deviceHwid').value;
            const expireVal = document.getElementById('deviceExpireDate').value;
            
            const payload = {
                user_type: document.getElementById('deviceUserType').value,
                event_id: document.getElementById('deviceEventId').value || null,
                device_info_os: document.getElementById('deviceOs').value || null,
                expire_date: expireVal ? new Date(expireVal).toISOString() : null
            };

            try {
                await apiFetch(\`/devices/\${hwid}\`, 'PUT', payload);
                showToast("Device Updated");
                closeModal('editDeviceModal');
                loadDevices();
            } catch (err) { showToast("Failed to update device: " + err.message, 'error'); } finally {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                btn.innerHTML = btnText;
            }
        }

        async function deleteDevice(hwid) {
            if(!confirm("Delete / Revoke this HWID device?")) return;
            try {
                await apiFetch(\`/devices/\${hwid}\`, 'DELETE');
                showToast("Device Revoked");
                loadDevices();
            } catch (e) { showToast("Delete failed: " + e.message, 'error'); }
        }

        async function connectDeviceWarp(hwid) {
            if (globalWarpConfigs.length === 0) {
                try { await loadWarp(); } catch {}
            }
            const existing = globalWarpConfigs.find(w => w.hwid === hwid);
            if (existing) {
                if (!confirm('WARP config already exists for this device. Regenerate?')) return;
                try {
                    await apiFetch(\`/warp/regenerate/\${hwid}\`, 'POST');
                    showToast('WARP config regenerated!');
                    await loadWarp();
                    filterDevices();
                } catch (e) { showToast('Failed to regenerate: ' + e.message, 'error'); }
            } else {
                try {
                    await apiFetch('/warp/generate', 'POST', { hwid });
                    showToast('WARP config generated!');
                    await loadWarp();
                    filterDevices();
                } catch (e) { showToast('Failed to generate: ' + e.message, 'error'); }
            }
        }

        function openAddDeviceModal() {
            document.getElementById('addDeviceForm').reset();
            openModal('addDeviceModal');
        }

        async function submitNewDevice(e) {
            e.preventDefault();
            const hwid = document.getElementById('newDeviceHwid').value;
            const os = document.getElementById('newDeviceOs').value;
            const btn = e.target.querySelector('button[type="submit"]');    
            try {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                
                const res = await fetch(\`/api/dev/devices\`, {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${ADMIN_TOKEN}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ hwid, device_info_os: os })
                });

                const data = await res.json();
                if (!res.ok) {
                    if (res.status === 409) {
                        showToast(data.error, 'error'); // Show exact conflict notice
                    } else {
                        throw new Error(data.error || 'Server Error');
                    }
                } else {
                    showToast("Device Pre-Registered");
                    closeModal('addDeviceModal');
                    loadDevices();
                    initDashboard();
                }
            } catch (err) {
                showToast('Failed to pre-register device: ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Add Device';
            }
        }

        // --- Events Logic ---
        let globalEvents = [];
        async function loadEvents() {
            renderTableState('eventsTableBody', 5, 'loading');
            try {
                const events = await apiFetch('/events');
                globalEvents = events;
                const tbody = document.getElementById('eventsTableBody');
                tbody.innerHTML = '';
                
                if (events.length === 0) {
                     renderTableState('eventsTableBody', 5, 'empty', 'No events yet. Create an event to generate subscription URLs.');
                     return;
                }

                events.forEach(ev => {
                    const promoBadge = ev.is_promo ? '<span class="ml-2 px-2 py-0.5 text-[10px] bg-brand/20 text-brand rounded-full uppercase font-bold border border-brand/30">Promo</span>' : '';
                    const allowDaysText = ev.allow_days ? \`<div class="text-[10px] text-slate-400 mt-1"><i class="fa-solid fa-clock mr-1"></i>\${ev.allow_days} Days</div>\` : '';
                    const row = \`<tr class="hover:bg-slate-800/30 transition-colors">
                        <td class="px-6 py-4 font-medium text-white" data-label="Name">
                            <div class="flex items-center">\${ev.name} \${promoBadge}</div>
                            \${allowDaysText}
                        </td>
                        <td class="px-6 py-4 text-xs uppercase" data-label="Type">\${ev.event_type} (\${ev.user_type})</td>
                        <td class="px-6 py-4 font-mono text-xs cursor-pointer hover:text-brand hidden md:table-cell" data-label="URL" onclick="copyEventUrl('\${ev.link_id}', '\${ev.event_code}')">
                            Copy URL <i class="fa-regular fa-copy ml-1"></i>
                        </td>
                        <td class="px-6 py-4 text-xs" data-label="Limit">\${ev.allowed_user === 0 ? 'Unl.' : ev.allowed_user}</td>
                        <td class="px-6 py-4 text-right" data-label="">
                            <button onclick="copyEventUrl('\${ev.link_id}', '\${ev.event_code}')" class="text-slate-400 hover:text-brand p-2 rounded-lg transition-colors" title="Copy Event Subscription URL"><i class="fa-solid fa-link"></i></button>
                            <button onclick="copyEventId('\${ev.id}')" class="text-slate-400 hover:text-brand p-2 rounded-lg transition-colors" title="Copy Event ID (for reseller bot config)"><i class="fa-solid fa-fingerprint"></i></button>
                            <button onclick="editEvent('\${ev.id}')" class="text-indigo-400 hover:text-indigo-300 p-2 rounded-lg"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteEvent('\${ev.id}')" class="text-rose-400 hover:text-rose-300 p-2 rounded-lg"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>\`;
                    tbody.innerHTML += row;
                });
            } catch(e) {
                renderTableState('eventsTableBody', 5, 'error', e.message, loadEvents);
            }
        }

        function copyEventUrl(linkId, eventCode) {
            const proxySelect = document.getElementById('globalProxySelect');
            let base = window.location.origin;
            if (proxySelect && proxySelect.value && proxySelect.value !== 'default') {
                base = proxySelect.value;
            }
            const url = \`\${base}/sub/\${linkId}?event_code=\${eventCode}\`;
            navigator.clipboard.writeText(url).then(() => showToast('Event URL Copied!'));
        }

        function copyEventId(id) {
            navigator.clipboard.writeText(id).then(() => showToast('Event ID Copied!'));
        }

        async function openCreateEventModal() {
            if(globalLinks.length === 0) await loadLinks();
            const linkSelect = document.getElementById('eventLinkId');
            linkSelect.innerHTML = globalLinks.length === 0 ? '<option value="">-- No Base Links available --</option>' : '';
            globalLinks.forEach(l => {
                linkSelect.innerHTML += \`<option value="\${l.id}">\${l.remark || l.id.substring(0,8)}</option>\`;
            });
            document.getElementById('eventId').value = '';
            document.getElementById('eventAllowDays').value = '30';
            document.getElementById('eventIsPromo').checked = false;
            openModal('createEventModal');
        }

        async function editEvent(id) {
            const ev = globalEvents.find(e => e.id === id);
            if (!ev) return;
            
            if(globalLinks.length === 0) await loadLinks();
            const linkSelect = document.getElementById('eventLinkId');
            linkSelect.innerHTML = globalLinks.length === 0 ? '<option value="">-- No Base Links available --</option>' : '';
            globalLinks.forEach(l => {
                linkSelect.innerHTML += \`<option value="\${l.id}">\${l.remark || l.id.substring(0,8)}</option>\`;
            });

            document.getElementById('eventId').value = ev.id;
            document.getElementById('eventName').value = ev.name;
            document.getElementById('eventLinkId').value = ev.link_id;
            document.getElementById('eventType').value = ev.event_type;
            document.getElementById('eventUserType').value = ev.user_type;
            document.getElementById('eventOs').value = ev.allowed_os;
            document.getElementById('eventLimit').value = ev.allowed_user;
            document.getElementById('eventRemark').value = ev.remark || '';
            document.getElementById('eventStartDate').value = ev.start_date || '';
            document.getElementById('eventEndDate').value = ev.end_date || '';
            document.getElementById('eventAllowDays').value = ev.allow_days || 30;
            document.getElementById('eventIsPromo').checked = ev.is_promo === 1 || ev.is_promo === true;
            
            openModal('createEventModal');
        }

        async function submitEvent(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const btnText = btn.innerHTML;
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';
            const eventId = document.getElementById('eventId').value;
            const payload = {
                name: document.getElementById('eventName').value,
                link_id: document.getElementById('eventLinkId').value,
                event_type: document.getElementById('eventType').value,
                user_type: document.getElementById('eventUserType').value,
                allowed_os: document.getElementById('eventOs').value,
                allowed_user: parseInt(document.getElementById('eventLimit').value) || 0,
                remark: document.getElementById('eventRemark').value,
                start_date: document.getElementById('eventStartDate').value || null,
                end_date: document.getElementById('eventEndDate').value || null,
                is_promo: document.getElementById('eventIsPromo').checked,
                allow_days: parseInt(document.getElementById('eventAllowDays').value) || 30
            };

            try {
                if (eventId) {
                    await apiFetch(\`/events/\${eventId}\`, 'PUT', payload);
                    showToast("Event Updated!");
                } else {
                    payload.id = crypto.randomUUID();
                    await apiFetch('/events', 'POST', payload);
                    showToast("Event Created!");
                }
                closeModal('createEventModal');
                loadEvents();
            } catch(e) { showToast("Failed to save event: " + e.message, 'error'); } finally {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                btn.innerHTML = btnText;
            }
        }

        async function deleteEvent(id) {
            if(!confirm("Delete this Event? Active users matching this may fail renewal.")) return;
            try {
                await apiFetch(\`/events/\${id}\`, 'DELETE');
                showToast("Event Deleted");
                loadEvents();
            } catch(e) { showToast("Failed to delete event: " + e.message, 'error'); }
        }

        // --- Announcements Logic ---
        const ANNOUNCE_KEYS = ['normal', 'expire', 'renew', 'limit_device', 'limit_os', 'wrong_hwid', 'miss_hwid', 'no_more_free', 'promo_used'];
        let globalAnnouncements = [];
        
        async function loadAnnouncements() {
            renderTableState('announcementsTableBody', 2, 'loading');
            try {
                const list = await apiFetch('/announcements');
                globalAnnouncements = list;
                const tbody = document.getElementById('announcementsTableBody');
                tbody.innerHTML = '';
                
                // Group by target_event_id
                const groups = {};
                list.forEach(a => {
                    const t = a.target_event_id || 'global';
                    if (!groups[t]) groups[t] = [];
                    groups[t].push(a);
                });

                if (Object.keys(groups).length === 0) {
                     renderTableState('announcementsTableBody', 2, 'empty', 'No announcement sets yet. Create a target set to customize messages.');
                     return;
                }

                Object.keys(groups).forEach(target => {
                    let targetName = 'Global (All Users)';
                    if (target !== 'global') {
                        const ev = globalEvents.find(e => e.id === target);
                        targetName = ev ? \`Event: \${ev.name}\` : \`Event: \${target}\`;
                    }
                    const badge = target === 'global' ? '<span class="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded ml-2">Global</span>' : '<span class="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded ml-2">Event-Specific</span>';
                    
                    const row = \`<tr class="hover:bg-slate-800/30 transition-colors">
                        <td class="px-6 py-4 font-medium text-white flex items-center" data-label="Target">
                            \${targetName} \${badge}
                        </td>
                        <td class="px-6 py-4 text-right" data-label="">
                            <button onclick="editAnnouncementSet('\${target}')" class="text-indigo-400 hover:text-indigo-300 p-2 rounded-lg"><i class="fa-solid fa-pen"></i></button>
                            \${target !== 'global' ? \`<button onclick="deleteAnnouncementSet('\${target}')" class="text-rose-400 hover:text-rose-300 p-2 rounded-lg"><i class="fa-solid fa-trash"></i></button>\` : ''}
                        </td>
                    </tr>\`;
                    tbody.innerHTML += row;
                });
            } catch(e) {
                renderTableState('announcementsTableBody', 2, 'error', e.message, loadAnnouncements);
            }
        }

        async function openAnnouncementModal() {
            if (globalEvents.length === 0) await loadEvents();
            const select = document.getElementById('announcementTarget');
            select.innerHTML = '<option value="global">Global (All Users)</option>';
            globalEvents.forEach(e => {
                select.innerHTML += \`<option value="\${e.id}">Event: \${e.name}</option>\`;
            });
            select.value = 'global';
            select.disabled = false; // Allow choosing target for new sets
            renderAnnouncementFields({});
            openModal('createAnnouncementModal');
        }

        async function editAnnouncementSet(target) {
            if (globalEvents.length === 0) await loadEvents();
            const select = document.getElementById('announcementTarget');
            select.innerHTML = '<option value="global">Global (All Users)</option>';
            globalEvents.forEach(e => {
                select.innerHTML += \`<option value="\${e.id}">Event: \${e.name}</option>\`;
            });
            select.value = target;
            select.disabled = true; // Don't allow changing target when editing

            const targetAnns = globalAnnouncements.filter(a => (a.target_event_id || 'global') === target);
            const valMap = {};
            targetAnns.forEach(a => valMap[a.key] = a.message);
            
            renderAnnouncementFields(valMap);
            openModal('createAnnouncementModal');
        }

        function renderAnnouncementFields(valMap) {
            const container = document.getElementById('announcementFields');
            container.innerHTML = '';
            ANNOUNCE_KEYS.forEach(k => {
                const val = valMap[k] || '';
                container.innerHTML += \`
                    <div>
                        <label class="block text-sm font-medium text-brand mb-1 capitalize">\${k.replace('_',' ')}</label>
                        <input type="text" name="\${k}" value="\${val}" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500">
                    </div>
                \`;
            });
        }

        async function submitAnnouncement(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const btnText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';
            
            const target = document.getElementById('announcementTarget').value;
            const payload = { target_event_id: target };
            const inputs = document.getElementById('announcementFields').querySelectorAll('input');
            inputs.forEach(i => { payload[i.name] = i.value; });

            try {
                await apiFetch('/announcements', 'PUT', payload);
                showToast("Announcement Set Saved!");
                closeModal('createAnnouncementModal');
                loadAnnouncements();
            } catch(err) { showToast("Failed to save announcements: " + err.message, 'error'); } finally {
                btn.disabled = false;
                btn.innerHTML = btnText;
            }
        }

        async function deleteAnnouncementSet(target) {
            if(!confirm("Delete this Event-Specific Announcement Set? Users will fallback to Global messages.")) return;
            try {
                await apiFetch(\`/announcements/\${target}\`, 'DELETE');
                showToast("Set Deleted");
                loadAnnouncements();
            } catch(e) { showToast("Failed to delete announcement set: " + e.message, 'error'); }
        }


        // --- Proxies Logic ---
        let globalProxies = [];
        let activeProxies = [];

        async function loadProxies() {
            renderTableState('proxiesTableBody', 4, 'loading');
            try {
                const proxies = await apiFetch('/proxies');
                globalProxies = proxies;
                const tbody = document.getElementById('proxiesTableBody');
                tbody.innerHTML = '';
                
                if (proxies.length === 0) {
                    renderTableState('proxiesTableBody', 4, 'empty', 'No proxies configured. Add a proxy domain to bypass ISP blocking.');
                    return;
                }

                proxies.forEach(p => {
                    const statusText = p.is_active ? '<span class="text-emerald-400 font-medium">Active</span>' : '<span class="text-slate-500 font-medium">Inactive</span>';
                    const toggleStatusBtn = p.is_active ? 
                        \`<button onclick="toggleProxyStatus(\${p.id}, false)" class="text-slate-400 hover:text-rose-400 mr-2 p-1" title="Disable"><i class="fa-solid fa-ban"></i></button>\` : 
                        \`<button onclick="toggleProxyStatus(\${p.id}, true)" class="text-slate-400 hover:text-emerald-400 mr-2 p-1" title="Enable"><i class="fa-solid fa-check"></i></button>\`;

                    const row = \`<tr class="hover:bg-slate-800/30 transition-colors">
                        <td class="px-6 py-4 font-medium text-white" data-label="Name">\${p.name}</td>
                        <td class="px-6 py-4 font-mono text-xs text-brand" data-label="URL">\${p.url}</td>
                        <td class="px-6 py-4 text-xs" data-label="Status">\${statusText}</td>
                        <td class="px-6 py-4 text-right" data-label="">
                            \${toggleStatusBtn}
                            <button onclick="editProxy(\${p.id})" class="text-indigo-400 hover:text-indigo-300 p-2 rounded-lg"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteProxy(\${p.id})" class="text-rose-400 hover:text-rose-300 p-2 rounded-lg"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>\`;
                    tbody.innerHTML += row;
                });
            } catch(e) {
                renderTableState('proxiesTableBody', 4, 'error', e.message, loadProxies);
            }
        }

        async function fetchActiveProxies() {
            try {
                activeProxies = await apiFetch('/proxies/active');
                // Update dropdown if exists
                const proxySelect = document.getElementById('globalProxySelect');
                if (proxySelect) {
                    // Retain current choice
                    const currentVal = proxySelect.value;
                    proxySelect.innerHTML = '<option value="default">Default Origin (Worker URL)</option>';
                    activeProxies.forEach(p => {
                        proxySelect.innerHTML += \`<option value="\${p.url}">\${p.name} (\${p.url})</option>\`;
                    });
                    if (currentVal && Array.from(proxySelect.options).some(o => o.value === currentVal)) {
                        proxySelect.value = currentVal;
                    }
                }
            } catch(e) { console.error("Failed to load active proxies", e); }
        }

        function openCreateProxyModal() {
            document.getElementById('createProxyForm').reset();
            document.getElementById('proxyId').value = '';
            document.getElementById('proxyIsActive').checked = true;
            openModal('createProxyModal');
        }

        function editProxy(id) {
            const row = globalProxies.find(p => p.id === id);
            if(!row) return;
            document.getElementById('proxyId').value = row.id;
            document.getElementById('proxyName').value = row.name;
            document.getElementById('proxyUrl').value = row.url;
            document.getElementById('proxyIsActive').checked = row.is_active === 1 || row.is_active === true;
            openModal('createProxyModal');
        }

        async function submitProxy(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const btnText = btn.innerHTML;
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';
            
            const id = document.getElementById('proxyId').value;
            const payload = {
                name: document.getElementById('proxyName').value,
                url: document.getElementById('proxyUrl').value,
                is_active: document.getElementById('proxyIsActive').checked ? 1 : 0
            };

            try {
                if (id) {
                    await apiFetch(\`/proxies/\${id}\`, 'PUT', payload);
                    showToast("Proxy Updated!");
                } else {
                    await apiFetch('/proxies', 'POST', payload);
                    showToast("Proxy Added!");
                }
                closeModal('createProxyModal');
                document.getElementById('createProxyForm').reset();
                loadProxies();
                fetchActiveProxies(); 
            } catch (err) { showToast("Failed to save proxy: " + err.message, 'error'); } finally {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                btn.innerHTML = btnText;
            }
        }

        async function toggleProxyStatus(id, newStatus) {
            const row = globalProxies.find(p => p.id === id);
            if(!row) return;
            try {
                await apiFetch(\`/proxies/\${id}\`, 'PUT', { name: row.name, url: row.url, is_active: newStatus });
                showToast(newStatus ? "Proxy Activated" : "Proxy Deactivated");
                loadProxies();
                fetchActiveProxies();
            } catch(e) { showToast("Status update failed: " + e.message, 'error'); }
        }

        async function deleteProxy(id) {
            if(!confirm("Delete this proxy?")) return;
            try {
                await apiFetch(\`/proxies/\${id}\`, 'DELETE');
                showToast("Proxy Deleted");
                loadProxies();
                fetchActiveProxies();
            } catch (e) { showToast("Delete failed: " + e.message, 'error'); }
        }

        // Initialize proxy list on boot
        document.addEventListener('DOMContentLoaded', () => {
            if (ADMIN_TOKEN) {
                fetchActiveProxies();
            }
        });

        // --- Warp Logic ---
        let globalWarpConfigs = [];
        let globalWarpSettings = { auto_connect: 0, endpoint: '', remark: '' };

        async function loadWarpSettings() {
            try {
                const settings = await apiFetch('/warp/settings');
                globalWarpSettings = settings;
                document.getElementById('warpAutoConnect').checked = settings.auto_connect === 1;
                document.getElementById('warpEndpoint').value = settings.endpoint || '';
                document.getElementById('warpRemark').value = settings.remark || '';
            } catch (e) {
                console.error('Failed to load warp settings:', e);
            }
        }

        async function saveWarpSettings() {
            const btn = document.getElementById('saveWarpSettingsBtn');
            const btnText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';

            const payload = {
                auto_connect: document.getElementById('warpAutoConnect').checked ? 1 : 0,
                endpoint: document.getElementById('warpEndpoint').value,
                remark: document.getElementById('warpRemark').value
            };

            try {
                await apiFetch('/warp/settings', 'PUT', payload);
                globalWarpSettings = payload;
                showToast('WARP settings saved!');
            } catch (e) {
                showToast('Failed to save settings: ' + e.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = btnText;
            }
        }

        async function loadWarp() {
            renderTableState('warpTableBody', 6, 'loading');
            try {
                const configs = await apiFetch('/warp');
                globalWarpConfigs = configs;
                const tbody = document.getElementById('warpTableBody');
                tbody.innerHTML = '';

                if (configs.length === 0) {
                    renderTableState('warpTableBody', 6, 'empty', 'No WARP configs yet. Generate one to get started.');
                    return;
                }

                configs.forEach(w => {
                    const modeText = w.auto_mode === 1
                        ? '<span class="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded-full uppercase font-bold border border-emerald-500/30">Auto</span>'
                        : '<span class="px-2 py-0.5 text-[10px] bg-slate-500/20 text-slate-300 rounded-full uppercase font-bold border border-slate-500/30">Manual</span>';
                    const statusText = w.status === 'active'
                        ? '<span class="text-emerald-400 font-medium">Active</span>'
                        : '<span class="text-rose-400 font-medium">Error</span>';

                    const row = \`<tr class="hover:bg-slate-800/30 transition-colors">
                        <td class="px-6 py-4 font-mono text-xs text-slate-400" data-label="HWID">\${w.hwid}</td>
                        <td class="px-6 py-4 font-mono text-xs text-brand hidden md:table-cell" data-label="Endpoint">\${w.endpoint || 'N/A'}</td>
                        <td class="px-6 py-4 text-xs" data-label="Remark">\${w.remark || 'N/A'}</td>
                        <td class="px-6 py-4 text-xs" data-label="Mode">\${modeText}</td>
                        <td class="px-6 py-4 text-xs" data-label="Status">\${statusText}</td>
                        <td class="px-6 py-4 text-right" data-label="">
                            <button onclick="editWarp('\${w.hwid}')" class="text-indigo-400 hover:text-indigo-300 p-2 rounded-lg" title="Edit"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="copyWarpUri('\${w.hwid}')" class="text-emerald-400 hover:text-emerald-300 p-2 rounded-lg" title="Copy URI"><i class="fa-regular fa-copy"></i></button>
                            <button onclick="toggleWarpAutoMode('\${w.hwid}', \${w.auto_mode === 1 ? 0 : 1})" class="text-amber-400 hover:text-amber-300 p-2 rounded-lg" title="Toggle Auto Mode"><i class="fa-solid fa-arrows-rotate"></i></button>
                            <button onclick="regenerateWarp('\${w.hwid}')" class="text-indigo-400 hover:text-indigo-300 p-2 rounded-lg" title="Regenerate"><i class="fa-solid fa-rotate-right"></i></button>
                            <button onclick="deleteWarp('\${w.hwid}')" class="text-rose-400 hover:text-rose-300 p-2 rounded-lg" title="Delete"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>\`;
                    tbody.innerHTML += row;
                });
            } catch (e) {
                renderTableState('warpTableBody', 6, 'error', e.message, loadWarp);
            }
        }

        async function openGenerateWarpModal() {
            if (globalDevices.length === 0) await loadDevices();
            const select = document.getElementById('warpDeviceHwid');
            select.innerHTML = globalDevices.length === 0 ? '<option value="">-- No Devices available --</option>' : '';
            globalDevices.forEach(d => {
                const osInfo = d.device_info_os || 'Unknown';
                select.innerHTML += \`<option value="\${d.hwid}">\${d.hwid} (\${osInfo})</option>\`;
            });
            document.getElementById('generateWarpForm').reset();
            openModal('generateWarpModal');
        }

        async function submitGenerateWarp(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const btnText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Generating...';

            const hwid = document.getElementById('warpDeviceHwid').value;
            if (!hwid) {
                showToast('Please select a device', 'error');
                btn.disabled = false;
                btn.innerHTML = btnText;
                return;
            }

            try {
                const result = await apiFetch('/warp/generate', 'POST', { hwid });
                showToast('WARP config generated!');
                closeModal('generateWarpModal');
                loadWarp();
            } catch (e) {
                showToast('Failed to generate WARP: ' + e.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = btnText;
            }
        }

        async function regenerateWarp(hwid) {
            if (!confirm('Regenerate WARP config for this device? The old config will be replaced.')) return;
            try {
                await apiFetch(\`/warp/regenerate/\${hwid}\`, 'POST');
                showToast('WARP config regenerated!');
                loadWarp();
            } catch (e) {
                showToast('Failed to regenerate: ' + e.message, 'error');
            }
        }

        async function toggleWarpAutoMode(hwid, newMode) {
            try {
                await apiFetch(\`/warp/\${hwid}\`, 'PATCH', { auto_mode: newMode });
                showToast(newMode ? 'Auto mode enabled' : 'Auto mode disabled');
                loadWarp();
            } catch (e) {
                showToast('Failed to toggle auto mode: ' + e.message, 'error');
            }
        }

        async function deleteWarp(hwid) {
            if (!confirm('Delete this WARP config?')) return;
            try {
                await apiFetch(\`/warp/\${hwid}\`, 'DELETE');
                showToast('WARP config deleted');
                loadWarp();
            } catch (e) {
                showToast('Failed to delete: ' + e.message, 'error');
            }
        }

        function copyWarpUri(hwid) {
            const config = globalWarpConfigs.find(w => w.hwid === hwid);
            if (!config || !config.warp_uri) {
                showToast('No URI to copy', 'error');
                return;
            }
            navigator.clipboard.writeText(config.warp_uri).then(() => {
                showToast('WARP URI copied!');
            });
        }

        function previewWarpUri(fields) {
            const encPriv = encodeURIComponent(fields.private_key || '');
            const encPub = encodeURIComponent(fields.public_key || '');
            const reservedParts = (fields.reserved || '').split(', ');
            const reservedStr = reservedParts.join('%2C%20');
            const encV4 = encodeURIComponent(fields.address_v4 || '');
            const encV6 = fields.address_v6 ? encodeURIComponent(fields.address_v6) : '';
            const addressParam = encV6 ? encV4 + '%2C%20' + encV6 : encV4;
            return 'wireguard://' + encPriv + '@' + (fields.endpoint || '') + '?publickey=' + encPub + '&presharedkey=&reserved=' + reservedStr + '&address=' + addressParam + '&mtu=' + (fields.mtu || 1280) + '#' + (fields.remark || '');
        }

        function updateWarpPreview() {
            const fields = {
                private_key: document.getElementById('editWarpPrivateKey').value,
                public_key: document.getElementById('editWarpPublicKey').value,
                endpoint: document.getElementById('editWarpEndpoint').value,
                address_v4: document.getElementById('editWarpAddressV4').value,
                address_v6: document.getElementById('editWarpAddressV6').value,
                reserved: document.getElementById('editWarpReserved').value,
                mtu: parseInt(document.getElementById('editWarpMtu').value) || 1280,
                remark: document.getElementById('editWarpRemark').value
            };
            document.getElementById('editWarpUriPreview').value = previewWarpUri(fields);
        }

        function editWarp(hwid) {
            const config = globalWarpConfigs.find(w => w.hwid === hwid);
            if (!config) return;

            document.getElementById('editWarpHwid').value = config.hwid;
            document.getElementById('editWarpHwidDisplay').textContent = config.hwid;
            document.getElementById('editWarpEndpoint').value = config.endpoint || '';
            document.getElementById('editWarpRemark').value = config.remark || '';
            document.getElementById('editWarpMtu').value = config.mtu || 1280;
            document.getElementById('editWarpAddressV4').value = config.address_v4 || '';
            document.getElementById('editWarpAddressV6').value = config.address_v6 || '';
            document.getElementById('editWarpReserved').value = config.reserved || '';
            document.getElementById('editWarpPublicKey').value = config.public_key || '';
            document.getElementById('editWarpPrivateKey').value = config.private_key || '';
            document.getElementById('editWarpStatus').value = config.status || 'active';

            updateWarpPreview();
            openModal('editWarpModal');
        }

        async function submitEditWarp(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const btnText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';

            const hwid = document.getElementById('editWarpHwid').value;
            const payload = {
                endpoint: document.getElementById('editWarpEndpoint').value,
                remark: document.getElementById('editWarpRemark').value,
                mtu: parseInt(document.getElementById('editWarpMtu').value) || 1280,
                address_v4: document.getElementById('editWarpAddressV4').value,
                address_v6: document.getElementById('editWarpAddressV6').value,
                reserved: document.getElementById('editWarpReserved').value,
                public_key: document.getElementById('editWarpPublicKey').value,
                private_key: document.getElementById('editWarpPrivateKey').value,
                status: document.getElementById('editWarpStatus').value
            };

            try {
                await apiFetch(\`/warp/\${hwid}\`, 'PUT', payload);
                showToast('WARP config updated!');
                closeModal('editWarpModal');
                loadWarp();
            } catch (err) {
                showToast('Failed to update: ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = btnText;
            }
        }
    </script>
</body>
</html>
`;
