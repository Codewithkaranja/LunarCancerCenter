// dashboard.js

// Global variables
let currentUser = null;
let userRoles = [];
let settings = {};
let notifications = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    // Load user data and settings from localStorage or backend
    loadUserData();
    loadSettings();
    loadNotifications();
    
    // Initialize charts
    initializeCharts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check and apply user role restrictions
    applyRoleBasedAccess();
    
    // Update UI based on loaded data
    updateUI();
}

// Load user data (simulated - replace with actual backend call)
function loadUserData() {
    // In a real application, this would come from an API or authentication system
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    } else {
        // Default user for demonstration
        currentUser = {
            id: 1,
            name: 'Dr. Achieng',
            role: 'doctor',
            email: 'dr.achieng@lunarcancer.org',
            department: 'Oncology',
            avatar: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjF2LTJhNCA0IDAgMCAwLTQgNEg4YTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCI+PC9jaXJjbGU+PC9zdmc+'
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    // Set user roles based on current user
    userRoles = [currentUser.role];
    
    // Update user info in the header
    document.querySelector('.user-details h3').textContent = currentUser.name;
    document.querySelector('.user-details p').textContent = currentUser.department;
    document.querySelector('.welcome-section h1').textContent = `Welcome, ${currentUser.name}`;
}

// Load settings (simulated - replace with actual backend call)
function loadSettings() {
    const savedSettings = localStorage.getItem('appSettings');
    
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    } else {
        // Default settings
        settings = {
            theme: 'light',
            language: 'en',
            notifications: true,
            autoSave: true,
            fontSize: 'medium',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h'
        };
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }
    
    applySettings();
}

// Load notifications (simulated - replace with actual backend call)
function loadNotifications() {
    // In a real application, this would come from an API
    notifications = [
        {
            id: 1,
            type: 'warning',
            title: 'Upcoming Appointments',
            message: 'You have 3 appointments in the next hour',
            timestamp: new Date(),
            read: false
        },
        {
            id: 2,
            type: 'info',
            title: 'Test Results Ready',
            message: 'Lab results for Patient #12345 are available',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            read: false
        },
        {
            id: 3,
            type: 'alert',
            title: 'Critical Patient Alert',
            message: 'Patient #67890 requires immediate attention',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            read: false
        }
    ];
    
    updateNotificationBadge();
}

// Initialize charts
function initializeCharts() {
    // Patient Visits Chart
    const visitsCtx = document.getElementById('patientVisitsChart').getContext('2d');
    const visitsChart = new Chart(visitsCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Patient Visits',
                data: [12, 19, 15, 17, 14, 11, 13],
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Diagnosis Chart
    const diagnosisCtx = document.getElementById('diagnosisChart').getContext('2d');
    const diagnosisChart = new Chart(diagnosisCtx, {
        type: 'doughnut',
        data: {
            labels: ['Breast Cancer', 'Lung Cancer', 'Prostate Cancer', 'Colorectal Cancer', 'Other'],
            datasets: [{
                data: [35, 25, 15, 12, 13],
                backgroundColor: [
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(243, 156, 18, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: [
                    'rgba(155, 89, 182, 1)',
                    'rgba(52, 152, 219, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(243, 156, 18, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
    
    // Store charts for potential updates
    window.visitsChart = visitsChart;
    window.diagnosisChart = diagnosisChart;
}

// Set up event listeners
function setupEventListeners() {
    // Notification bell click
    document.querySelector('.notification').addEventListener('click', toggleNotificationsPanel);
    
    // Logout button
    document.querySelector('.btn-logout').addEventListener('click', handleLogout);
    
    // Chart period selectors
    document.querySelectorAll('.chart-actions select').forEach(select => {
        select.addEventListener('change', handleChartPeriodChange);
    });
    
    // Quick action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', handleQuickAction);
    });
    
    // Metric cards
    document.querySelectorAll('.metric-card').forEach(card => {
        card.addEventListener('click', handleMetricCardClick);
    });
    
    // Settings menu item
    document.querySelector('a[href="settings.html"]').addEventListener('click', function(e) {
        e.preventDefault();
        openSettingsModal();
    });
    
    // View reports button
    document.querySelector('.view-reports').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'reports.html';
    });
    
    // Sidebar menu items
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', handleMenuNavigation);
    });
}

// Apply role-based access control
function applyRoleBasedAccess() {
    const menuItems = document.querySelectorAll('.sidebar-menu a');
    const actionButtons = document.querySelectorAll('.action-btn');
    
    // Define permissions for each role - UPDATED TO INCLUDE ALL MENU ITEMS
    const permissions = {
        doctor: ['dashboard', 'patients', 'appointments', 'pharmacy', 'billing', 'reports', 'settings'],
        nurse: ['dashboard', 'patients', 'appointments', 'pharmacy'],
        admin: ['dashboard', 'patients', 'appointments', 'inventory', 'staff', 'billing', 'reports', 'settings', 'pharmacy'],
        pharmacist: ['dashboard', 'inventory', 'pharmacy', 'patients', 'billing'],
        cashier: ['dashboard', 'billing', 'patients', 'appointments']
    };
    
    // Hide menu items based on role
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        // Skip logout button
        if (href === 'index.html') return;
        
        const page = href.replace('.html', '');
        if (!permissions[currentUser.role] || !permissions[currentUser.role].includes(page)) {
            item.style.display = 'none';
        } else {
            item.style.display = 'flex';
        }
    });
    
    // Hide action buttons based on role
    const actionPermissions = {
        'Add Patient': ['doctor', 'admin', 'nurse'],
        'Create Treatment Plan': ['doctor', 'nurse'],
        'Schedule Follow-up': ['doctor', 'nurse'],
        'Send to Billing': ['doctor', 'admin', 'nurse']
    };
    
    actionButtons.forEach(btn => {
        const action = btn.querySelector('span').textContent;
        if (actionPermissions[action] && !actionPermissions[action].includes(currentUser.role)) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'flex';
        }
    });
    
    // Additionally, update the UI based on role
    updateUIForRole();
}

// New function to update UI based on role
function updateUIForRole() {
    // Update metrics based on role
    const roleMetrics = {
        doctor: {
            titles: ['PATIENTS TODAY', 'APPOINTMENTS', 'REFERRALS PENDING', 'CRITICAL ALERTS'],
            icons: ['user-injured', 'calendar-check', 'clipboard-list', 'exclamation-triangle']
        },
        nurse: {
            titles: ['PATIENTS TODAY', 'MEDICATIONS DUE', 'VITAL CHECKS', 'TASKS PENDING'],
            icons: ['user-injured', 'pills', 'heartbeat', 'clipboard-check']
        },
        admin: {
            titles: ['TOTAL STAFF', 'ACTIVE USERS', 'PENDING REQUESTS', 'SYSTEM ALERTS'],
            icons: ['user-md', 'users', 'clipboard-list', 'exclamation-triangle']
        },
        pharmacist: {
            titles: ['PRESCRIPTIONS', 'LOW STOCK ITEMS', 'ORDERS PENDING', 'EXPIRING SOON'],
            icons: ['prescription', 'pills', 'clipboard-list', 'calendar-exclamation']
        },
        cashier: {
            titles: ['PENDING BILLS', 'PAID TODAY', 'INSURANCE CLAIMS', 'REFUND REQUESTS'],
            icons: ['file-invoice', 'money-bill', 'file-medical', 'undo']
        }
    };
    
    // Update metric cards based on role
    const metrics = roleMetrics[currentUser.role] || roleMetrics.doctor;
    const metricCards = document.querySelectorAll('.metric-card');
    
    metricCards.forEach((card, index) => {
        if (metrics.titles[index]) {
            card.querySelector('.metric-title').textContent = metrics.titles[index];
            card.querySelector('.metric-icon i').className = `fas fa-${metrics.icons[index]}`;
            
            // Update metric card class for color coding
            card.className = `metric-card ${currentUser.role}`;
        }
    });
    
    // Update welcome message based on role
    const welcomeSection = document.querySelector('.welcome-section');
    const roleWelcomeMessages = {
        doctor: "Here's what's happening with your patients and appointments today.",
        nurse: "Here's your nursing tasks and patient updates for today.",
        admin: "System overview and administrative tasks for today.",
        pharmacist: "Pharmacy inventory and prescription status for today.",
        cashier: "Billing and payment overview for today."
    };
    
    if (welcomeSection && roleWelcomeMessages[currentUser.role]) {
        welcomeSection.querySelector('p').textContent = roleWelcomeMessages[currentUser.role];
    }
}

// Apply settings to UI
function applySettings() {
    // Apply theme
    if (settings.theme === 'dark') {
        document.documentElement.style.setProperty('--light', '#2c3e50');
        document.documentElement.style.setProperty('--dark', '#ecf0f1');
        document.body.style.backgroundColor = '#1a2530';
        document.body.style.color = '#ecf0f1';
    } else {
        document.documentElement.style.setProperty('--light', '#ecf0f1');
        document.documentElement.style.setProperty('--dark', '#2c3e50');
        document.body.style.backgroundColor = '#f5f7fa';
        document.body.style.color = '#333';
    }
    
    // Apply font size
    document.body.style.fontSize = settings.fontSize === 'large' ? '18px' : 
                                 settings.fontSize === 'small' ? '14px' : '16px';
}

// Update UI based on loaded data
function updateUI() {
    updateNotificationBadge();
    updateMetricCards();
}

// Update notification badge
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.querySelector('.notification .badge');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Update metric cards with real data (simulated)
function updateMetricCards() {
    // In a real application, this would come from an API
    const metricsData = {
        patientsToday: 24,
        appointments: {
            total: 18,
            completed: 12,
            scheduled: 4,
            missed: 2
        },
        referralsPending: 3,
        criticalAlerts: 2
    };
    
    document.querySelectorAll('.metric-value')[0].textContent = metricsData.patientsToday;
    document.querySelectorAll('.metric-value')[1].textContent = metricsData.appointments.total;
    document.querySelectorAll('.metric-value')[2].textContent = metricsData.referralsPending;
    document.querySelectorAll('.metric-value')[3].textContent = metricsData.criticalAlerts;
    
    const appointmentText = `${metricsData.appointments.completed} Completed, ${metricsData.appointments.scheduled} Scheduled, ${metricsData.appointments.missed} Missed`;
    document.querySelectorAll('.metric-change')[1].innerHTML = `<span>${appointmentText}</span>`;
}

// Toggle notifications panel
function toggleNotificationsPanel() {
    // This would open a notifications panel in a real application
    alert('Notifications panel would open here. Unread: ' + 
          notifications.filter(n => !n.read).length);
    
    // Mark notifications as read
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
}

// Handle logout
function handleLogout(e) {
    e.preventDefault();
    
    if (confirm('Are you sure you want to logout?')) {
        // Clear user data
        localStorage.removeItem('currentUser');
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
}

// Handle chart period change
function handleChartPeriodChange(e) {
    const select = e.target;
    const period = select.value;
    const chartContainer = select.closest('.chart-container');
    const chartTitle = chartContainer.querySelector('.chart-title').textContent;
    
    // In a real application, this would fetch new data from the backend
    console.log(`Changing ${chartTitle} to show data for: ${period}`);
    
    // Simulate data loading
    alert(`Loading ${chartTitle} data for ${period}. This would fetch from backend in a real application.`);
}

// Handle quick action clicks
function handleQuickAction(e) {
    const actionText = this.querySelector('span').textContent;
    
    switch(actionText) {
        case 'Add Patient':
            window.location.href = 'patients.html?action=add';
            break;
        case 'Create Treatment Plan':
            window.location.href = 'appointments.html?action=create-plan';
            break;
        case 'Schedule Follow-up':
            window.location.href = 'appointments.html?action=follow-up';
            break;
        case 'Send to Billing':
            window.location.href = 'invoice.html?action=create';
            break;
        default:
            console.log('Action not implemented:', actionText);
    }
}

// Handle metric card clicks
function handleMetricCardClick() {
    const metricTitle = this.querySelector('.metric-title').textContent;
    
    switch(metricTitle) {
        case 'PATIENTS TODAY':
            window.location.href = 'patients.html';
            break;
        case 'APPOINTMENTS':
            window.location.href = 'appointments.html';
            break;
        case 'REFERRALS PENDING':
            alert('Showing referrals pending approval');
            break;
        case 'CRITICAL ALERTS':
            alert('Showing critical patient alerts');
            break;
        default:
            console.log('Metric action not implemented:', metricTitle);
    }
}

// Handle menu navigation
function handleMenuNavigation(e) {
    e.preventDefault();
    const targetPage = this.getAttribute('href');
    
    if (targetPage === 'settings.html') {
        openSettingsModal();
    } else if (targetPage === 'index.html') {
        handleLogout(e);
    } else {
        window.location.href = targetPage;
    }
}

// Open settings modal
function openSettingsModal() {
    // Create modal HTML
    const modalHTML = `
        <div class="settings-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        ">
            <div style="
                background: white;
                padding: 20px;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>Settings</h2>
                    <button class="close-settings" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                
                <div class="settings-section">
                    <h3>Appearance</h3>
                    <div class="setting-item">
                        <label>Theme:</label>
                        <select id="themeSetting">
                            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Font Size:</label>
                        <select id="fontSizeSetting">
                            <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                            <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Preferences</h3>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="notificationsSetting" ${settings.notifications ? 'checked' : ''}>
                            Enable Notifications
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="autoSaveSetting" ${settings.autoSave ? 'checked' : ''}>
                            Auto-Save Changes
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Date & Time</h3>
                    <div class="setting-item">
                        <label>Date Format:</label>
                        <select id="dateFormatSetting">
                            <option value="MM/DD/YYYY" ${settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY" ${settings.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD" ${settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Time Format:</label>
                        <select id="timeFormatSetting">
                            <option value="12h" ${settings.timeFormat === '12h' ? 'selected' : ''}>12-hour</option>
                            <option value="24h" ${settings.timeFormat === '24h' ? 'selected' : ''}>24-hour</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: right;">
                    <button id="saveSettings" style="
                        background: var(--secondary);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Save Settings</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners to modal
    document.querySelector('.close-settings').addEventListener('click', closeSettingsModal);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
}

// Close settings modal
function closeSettingsModal() {
    const modal = document.querySelector('.settings-modal');
    if (modal) {
        modal.remove();
    }
}

// Save settings
function saveSettings() {
    // Get values from form
    settings.theme = document.getElementById('themeSetting').value;
    settings.fontSize = document.getElementById('fontSizeSetting').value;
    settings.notifications = document.getElementById('notificationsSetting').checked;
    settings.autoSave = document.getElementById('autoSaveSetting').checked;
    settings.dateFormat = document.getElementById('dateFormatSetting').value;
    settings.timeFormat = document.getElementById('timeFormatSetting').value;
    
    // Save to localStorage
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    // Apply new settings
    applySettings();
    
    // Close modal
    closeSettingsModal();
    
    // Show confirmation
    alert('Settings saved successfully!');
}

// API integration functions (stubs for backend integration)
function apiRequest(endpoint, method = 'GET', data = null) {
    // This is a stub for actual API requests
    return new Promise((resolve, reject) => {
        console.log(`API ${method} request to ${endpoint}`, data);
        
        // Simulate API response
        setTimeout(() => {
            // Mock responses for different endpoints
            const mockResponses = {
                '/api/patients': { data: [], count: 0 },
                '/api/appointments': { data: [], count: 0 },
                '/api/metrics': { 
                    patientsToday: 24, 
                    appointments: 18,
                    referrals: 3,
                    alerts: 2
                }
            };
            
            if (mockResponses[endpoint]) {
                resolve(mockResponses[endpoint]);
            } else {
                resolve({ status: 'success', message: 'Operation completed' });
            }
        }, 500);
    });
}

// Export functions for use in other modules
window.dashboardApp = {
    initializeApp,
    loadUserData,
    loadSettings,
    apiRequest,
    currentUser: () => currentUser,
    settings: () => settings
};