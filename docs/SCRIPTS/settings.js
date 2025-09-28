 // Role-Based Access Control Configuration
      const userRoles = {
        admin: {
          settings: { 
            view: true, 
            modify: true, 
            users: { create: true, edit: true, delete: true },
            system: { modify: true },
            backup: { create: true, restore: true }
          }
        },
        doctor: {
          settings: { 
            view: true, 
            modify: false, 
            users: { create: false, edit: false, delete: false },
            system: { modify: false },
            backup: { create: false, restore: false }
          }
        },
        pharmacist: {
          settings: { 
            view: true, 
            modify: false, 
            users: { create: false, edit: false, delete: false },
            system: { modify: false },
            backup: { create: false, restore: false }
          }
        },
        cashier: {
          settings: { 
            view: false, 
            modify: false, 
            users: { create: false, edit: false, delete: false },
            system: { modify: false },
            backup: { create: false, restore: false }
          }
        }
      };

      // Current user role (this would typically come from your authentication system)
      let currentUserRole = 'admin'; // Default to admin

      // Sample data for users
      let users = [
        { id: 1, name: "John Doe", email: "john.doe@lunarcancercare.com", role: "admin", department: "administration", active: true, avatar: "JD" },
        { id: 2, name: "Dr. Achieng", email: "dr.achieng@lunarcancercare.com", role: "doctor", department: "oncology", active: true, avatar: "DA" },
        { id: 3, name: "Nurse Jane", email: "nurse.jane@lunarcancercare.com", role: "nurse", department: "oncology", active: true, avatar: "NJ" },
        { id: 4, name: "Pharmacist John", email: "pharmacist.john@lunarcancercare.com", role: "pharmacist", department: "pharmacy", active: true, avatar: "PJ" }
      ];

      // Sample permissions matrix
      const permissionsMatrix = {
        admin: {
          "View Patients": true,
          "Edit Patients": true,
          "Manage Appointments": true,
          "Manage Inventory": true,
          "Manage Billing": true,
          "Generate Reports": true,
          "System Settings": true
        },
        doctor: {
          "View Patients": true,
          "Edit Patients": true,
          "Manage Appointments": true,
          "Manage Inventory": false,
          "Manage Billing": false,
          "Generate Reports": true,
          "System Settings": false
        },
        nurse: {
          "View Patients": true,
          "Edit Patients": true,
          "Manage Appointments": true,
          "Manage Inventory": false,
          "Manage Billing": false,
          "Generate Reports": true,
          "System Settings": false
        },
        pharmacist: {
          "View Patients": true,
          "Edit Patients": false,
          "Manage Appointments": false,
          "Manage Inventory": true,
          "Manage Billing": false,
          "Generate Reports": true,
          "System Settings": false
        },
        cashier: {
          "View Patients": false,
          "Edit Patients": false,
          "Manage Appointments": false,
          "Manage Inventory": false,
          "Manage Billing": true,
          "Generate Reports": true,
          "System Settings": false
        },
        manager: {
          "View Patients": true,
          "Edit Patients": true,
          "Manage Appointments": true,
          "Manage Inventory": true,
          "Manage Billing": true,
          "Generate Reports": true,
          "System Settings": false
        }
      };

      // System settings
      let systemSettings = {
        hospitalName: "Lunar Cancer Care",
        hospitalAddress: "123 Medical Plaza, Nairobi, Kenya",
        hospitalPhone: "+254 700 123 456",
        hospitalEmail: "info@lunarcancercare.com",
        timezone: "east-africa",
        dateFormat: "dd-mm-yyyy",
        timeFormat: "12h",
        reportPeriod: "monthly"
      };

      // Backup information
      let backupInfo = {
        lastBackup: "2023-11-20T02:00:00",
        backupSize: "245 MB",
        backupStatus: "completed"
      };

      // DOM elements
      const navBtns = document.querySelectorAll('.nav-btn');
      const settingsSections = document.querySelectorAll('.settings-section');
      const addUserBtn = document.getElementById('add-user-btn');
      const usersContainer = document.getElementById('users-container');
      const permissionsTable = document.getElementById('permissions-table');
      const cancelUserChangesBtn = document.getElementById('cancel-user-changes');
      const saveUserChangesBtn = document.getElementById('save-user-changes');
      const cancelPreferencesBtn = document.getElementById('cancel-preferences');
      const savePreferencesBtn = document.getElementById('save-preferences');
      const downloadBackupBtn = document.getElementById('download-backup-btn');
      const createBackupBtn = document.getElementById('create-backup-btn');
      const restoreBackupBtn = document.getElementById('restore-backup-btn');
      const lastBackupDetails = document.getElementById('last-backup-details');
      const editUserModal = document.getElementById('edit-user-modal');
      const cancelEditUserBtn = document.getElementById('cancel-edit-user');
      const saveEditUserBtn = document.getElementById('save-edit-user');
      const restoreBackupModal = document.getElementById('restore-backup-modal');
      const cancelRestoreBtn = document.getElementById('cancel-restore');
      const confirmRestoreBtn = document.getElementById('confirm-restore');
      const alertContainer = document.getElementById('alert-container');
      const cancelSecurityBtn = document.getElementById('cancel-security');
      const saveSecurityBtn = document.getElementById('save-security');
      const cancelModulesBtn = document.getElementById('cancel-modules');
      const saveModulesBtn = document.getElementById('save-modules');
      const cancelNotificationsBtn = document.getElementById('cancel-notifications');
      const saveNotificationsBtn = document.getElementById('save-notifications');

      // Initialize the application
      function init() {
        renderUsers();
        renderPermissionsTable();
        updateLastBackupDetails();
        setupEventListeners();
        applyRolePermissions();
        loadSystemSettings();
      }

      // Set up event listeners
      function setupEventListeners() {
        // Navigation buttons
        navBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            switchSection(section);
          });
        });

        // Add user button
        addUserBtn.addEventListener('click', addUser);

        // Save/Cancel buttons
        cancelUserChangesBtn.addEventListener('click', resetUserForm);
        saveUserChangesBtn.addEventListener('click', saveUserChanges);
        cancelPreferencesBtn.addEventListener('click', resetPreferencesForm);
        savePreferencesBtn.addEventListener('click', savePreferences);
        cancelSecurityBtn.addEventListener('click', resetSecurityForm);
        saveSecurityBtn.addEventListener('click', saveSecuritySettings);
        cancelModulesBtn.addEventListener('click', resetModulesForm);
        saveModulesBtn.addEventListener('click', saveModulesSettings);
        cancelNotificationsBtn.addEventListener('click', resetNotificationsForm);
        saveNotificationsBtn.addEventListener('click', saveNotificationsSettings);

        // Backup buttons
        downloadBackupBtn.addEventListener('click', downloadBackup);
        createBackupBtn.addEventListener('click', createBackup);
        restoreBackupBtn.addEventListener('click', openRestoreBackupModal);

        // Modal buttons
        cancelEditUserBtn.addEventListener('click', () => editUserModal.style.display = 'none');
        saveEditUserBtn.addEventListener('click', saveEditedUser);
        cancelRestoreBtn.addEventListener('click', () => restoreBackupModal.style.display = 'none');
        confirmRestoreBtn.addEventListener('click', restoreBackup);

        // Role switcher for demonstration (remove in production)
        addRoleSwitcher();
      }

      // Switch settings section
      function switchSection(section) {
        // Update active button
        navBtns.forEach(btn => {
          if (btn.getAttribute('data-section') === section) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });

        // Show corresponding section
        settingsSections.forEach(sectionEl => {
          sectionEl.style.display = 'none';
        });
        document.getElementById(`${section}-section`).style.display = 'block';
      }

      // Render users
      function renderUsers() {
        usersContainer.innerHTML = '';
        
        users.forEach(user => {
          const userCard = document.createElement('div');
          userCard.className = 'user-card';
          
          userCard.innerHTML = `
            <div class="user-header">
              <div class="user-avatar">${user.avatar}</div>
              <div class="user-details">
                <div class="user-name">${user.name} ${!user.active ? '(Inactive)' : ''}</div>
                <div class="user-role">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}${user.department ? ` - ${user.department.charAt(0).toUpperCase() + user.department.slice(1)}` : ''}</div>
              </div>
              <div class="user-actions">
                <button class="action-btn btn-edit" data-id="${user.id}">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn btn-delete" data-id="${user.id}">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          `;
          
          usersContainer.appendChild(userCard);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            openEditUserModal(id);
          });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            deleteUser(id);
          });
        });
      }

      // Render permissions table
      function renderPermissionsTable() {
        const permissions = Object.keys(permissionsMatrix.admin);
        const roles = Object.keys(permissionsMatrix);
        
        let tableHTML = `
          <thead>
            <tr>
              <th>Permission</th>
              ${roles.map(role => `<th class="permission-check">${role.charAt(0).toUpperCase() + role.slice(1)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
        `;
        
        permissions.forEach(permission => {
          tableHTML += `
            <tr>
              <td>${permission}</td>
              ${roles.map(role => `
                <td class="permission-check">
                  ${permissionsMatrix[role][permission] ? 
                    '<i class="fas fa-check" style="color: var(--success)"></i>' : 
                    '<i class="fas fa-times" style="color: var(--accent)"></i>'}
                </td>
              `).join('')}
            </tr>
          `;
        });
        
        tableHTML += '</tbody>';
        permissionsTable.innerHTML = tableHTML;
      }

      // Update last backup details
      function updateLastBackupDetails() {
        const lastBackupDate = new Date(backupInfo.lastBackup);
        const formattedDate = lastBackupDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const formattedTime = lastBackupDate.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        lastBackupDetails.innerHTML = `
          <p><strong>Date:</strong> ${formattedDate}, ${formattedTime}</p>
          <p><strong>Size:</strong> ${backupInfo.backupSize}</p>
          <p><strong>Status:</strong> ${backupInfo.backupStatus}</p>
        `;
      }

      // Add new user
      function addUser() {
        if (!userRoles[currentUserRole].settings.users.create) {
          showAlert('You do not have permission to add users.', 'error');
          return;
        }
        
        const name = document.getElementById('new-user-name').value;
        const email = document.getElementById('new-user-email').value;
        const role = document.getElementById('new-user-role').value;
        const department = document.getElementById('new-user-department').value;
        
        if (!name || !email || !role) {
          showAlert('Please fill in all required fields.', 'error');
          return;
        }
        
        // Generate avatar initials
        const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        // Create new user
        const newUser = {
          id: Date.now(),
          name,
          email,
          role,
          department,
          active: true,
          avatar
        };
        
        users.push(newUser);
        renderUsers();
        resetUserForm();
        
        showAlert('User added successfully!', 'success');
      }

      // Open edit user modal
      function openEditUserModal(id) {
        if (!userRoles[currentUserRole].settings.users.edit) {
          showAlert('You do not have permission to edit users.', 'error');
          return;
        }
        
        const user = users.find(u => u.id == id);
        if (!user) return;
        
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-user-name').value = user.name;
        document.getElementById('edit-user-email').value = user.email;
        document.getElementById('edit-user-role').value = user.role;
        document.getElementById('edit-user-department').value = user.department || '';
        document.getElementById('edit-user-active').checked = user.active;
        
        editUserModal.style.display = 'flex';
      }

      // Save edited user
      function saveEditedUser() {
        const id = document.getElementById('edit-user-id').value;
        const name = document.getElementById('edit-user-name').value;
        const email = document.getElementById('edit-user-email').value;
        const role = document.getElementById('edit-user-role').value;
        const department = document.getElementById('edit-user-department').value;
        const active = document.getElementById('edit-user-active').checked;
        
        if (!name || !email || !role) {
          showAlert('Please fill in all required fields.', 'error');
          return;
        }
        
        const userIndex = users.findIndex(u => u.id == id);
        if (userIndex === -1) return;
        
        // Generate new avatar if name changed
        const avatar = users[userIndex].name !== name ? 
          name.split(' ').map(n => n[0]).join('').toUpperCase() : 
          users[userIndex].avatar;
        
        users[userIndex] = {
          ...users[userIndex],
          name,
          email,
          role,
          department,
          active,
          avatar
        };
        
        renderUsers();
        editUserModal.style.display = 'none';
        
        showAlert('User updated successfully!', 'success');
      }

      // Delete user
      function deleteUser(id) {
        if (!userRoles[currentUserRole].settings.users.delete) {
          showAlert('You do not have permission to delete users.', 'error');
          return;
        }
        
        if (confirm('Are you sure you want to delete this user?')) {
          users = users.filter(u => u.id != id);
          renderUsers();
          showAlert('User deleted successfully!', 'success');
        }
      }

      // Reset user form
      function resetUserForm() {
        document.getElementById('new-user-name').value = '';
        document.getElementById('new-user-email').value = '';
        document.getElementById('new-user-role').value = '';
        document.getElementById('new-user-department').value = '';
      }

      // Save user changes
      function saveUserChanges() {
        // In a real app, this would save changes to the backend
        showAlert('User changes saved successfully!', 'success');
      }

      // Load system settings
      function loadSystemSettings() {
        document.getElementById('hospital-name').value = systemSettings.hospitalName;
        document.getElementById('hospital-address').value = systemSettings.hospitalAddress;
        document.getElementById('hospital-phone').value = systemSettings.hospitalPhone;
        document.getElementById('hospital-email').value = systemSettings.hospitalEmail;
        document.getElementById('timezone').value = systemSettings.timezone;
        document.getElementById('date-format').value = systemSettings.dateFormat;
        document.getElementById('time-format').value = systemSettings.timeFormat;
        document.getElementById('report-period').value = systemSettings.reportPeriod;
      }

      // Reset preferences form
      function resetPreferencesForm() {
        loadSystemSettings();
      }

      // Save preferences
      function savePreferences() {
        systemSettings = {
          hospitalName: document.getElementById('hospital-name').value,
          hospitalAddress: document.getElementById('hospital-address').value,
          hospitalPhone: document.getElementById('hospital-phone').value,
          hospitalEmail: document.getElementById('hospital-email').value,
          timezone: document.getElementById('timezone').value,
          dateFormat: document.getElementById('date-format').value,
          timeFormat: document.getElementById('time-format').value,
          reportPeriod: document.getElementById('report-period').value
        };
        
        showAlert('System preferences saved successfully!', 'success');
      }

      // Reset security form
      function resetSecurityForm() {
        // This would reset to saved values in a real app
      }

      // Save security settings
      function saveSecuritySettings() {
        showAlert('Security settings saved successfully!', 'success');
      }

      // Reset modules form
      function resetModulesForm() {
        // This would reset to saved values in a real app
      }

      // Save modules settings
      function saveModulesSettings() {
        showAlert('Module settings saved successfully!', 'success');
      }

      // Reset notifications form
      function resetNotificationsForm() {
        // This would reset to saved values in a real app
      }

      // Save notifications settings
      function saveNotificationsSettings() {
        showAlert('Notification settings saved successfully!', 'success');
      }

      // Download backup
      function downloadBackup() {
        if (!userRoles[currentUserRole].settings.backup.create) {
          showAlert('You do not have permission to download backups.', 'error');
          return;
        }
        
        // In a real app, this would download the actual backup file
        // For this demo, we'll simulate the download
        
        alert('Downloading backup file...');
        
        // Simulate download process
        setTimeout(() => {
          // Create a dummy file for download
          const content = `Lunar Cancer Care Backup\nDate: ${new Date().toLocaleDateString()}\nThis is a demo backup file.`;
          const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", `lunar_backup_${new Date().toISOString().slice(0, 10)}.txt`);
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
          
          showAlert('Backup downloaded successfully!', 'success');
        }, 1000);
      }

      // Create backup
      function createBackup() {
        if (!userRoles[currentUserRole].settings.backup.create) {
          showAlert('You do not have permission to create backups.', 'error');
          return;
        }
        
        // In a real app, this would create a backup on the server
        // For this demo, we'll simulate the process
        
        showAlert('Creating backup...', 'success');
        
        setTimeout(() => {
          // Update backup info
          backupInfo = {
            lastBackup: new Date().toISOString(),
            backupSize: '250 MB',
            backupStatus: 'completed'
          };
          
          updateLastBackupDetails();
          showAlert('Backup created successfully!', 'success');
        }, 2000);
      }

      // Open restore backup modal
      function openRestoreBackupModal() {
        if (!userRoles[currentUserRole].settings.backup.restore) {
          showAlert('You do not have permission to restore backups.', 'error');
          return;
        }
        
        restoreBackupModal.style.display = 'flex';
      }

      // Restore backup
      function restoreBackup() {
        const fileInput = document.getElementById('backup-file');
        const confirmCheckbox = document.getElementById('backup-confirm');
        
        if (!fileInput.files.length) {
          showAlert('Please select a backup file.', 'error');
          return;
        }
        
        if (!confirmCheckbox.checked) {
          showAlert('Please confirm that you understand this will replace all current data.', 'error');
          return;
        }
        
        // In a real app, this would upload and restore the backup
        // For this demo, we'll simulate the process
        
        showAlert('Restoring backup...', 'success');
        
        setTimeout(() => {
          restoreBackupModal.style.display = 'none';
          showAlert('Backup restored successfully!', 'success');
        }, 2000);
      }

      // Show alert
      function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
        alert.innerHTML = `
          <div class="alert-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
          </div>
          <div>${message}</div>
        `;
        
        alertContainer.appendChild(alert);
        
        // Remove alert after 5 seconds
        setTimeout(() => {
          alert.remove();
        }, 5000);
      }

      // Apply role permissions
      function applyRolePermissions() {
        const permissions = userRoles[currentUserRole];
        
        // Show/hide elements based on permissions
        addUserBtn.style.display = permissions.settings.users.create ? 'flex' : 'none';
        document.querySelectorAll('.btn-edit').forEach(btn => {
          btn.style.display = permissions.settings.users.edit ? 'flex' : 'none';
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
          btn.style.display = permissions.settings.users.delete ? 'flex' : 'none';
        });
        saveUserChangesBtn.style.display = permissions.settings.modify ? 'flex' : 'none';
        savePreferencesBtn.style.display = permissions.settings.system.modify ? 'flex' : 'none';
        downloadBackupBtn.style.display = permissions.settings.backup.create ? 'flex' : 'none';
        createBackupBtn.style.display = permissions.settings.backup.create ? 'flex' : 'none';
        restoreBackupBtn.style.display = permissions.settings.backup.restore ? 'flex' : 'none';
        
        // Hide entire settings section if user has no view permissions
        if (!permissions.settings.view) {
          document.querySelector('.settings-content').innerHTML = `
            <div class="alert alert-error">
              <div class="alert-icon">
                <i class="fas fa-exclamation-circle"></i>
              </div>
              <div>
                <strong>Access Denied</strong>
                <p>You do not have permission to access system settings.</p>
              </div>
            </div>
          `;
        }
        
        // Update user info based on role
        const userName = document.getElementById('current-user-name');
        const userRole = document.getElementById('current-user-role');
        
        if (userName && userRole) {
          userName.textContent = `${currentUserRole} User`;
          userRole.textContent = `${currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1)}`;
        }
      }

      // Add role switcher for demonstration (remove in production)
      function addRoleSwitcher() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;
        
        const roleSwitcher = document.createElement('select');
        roleSwitcher.id = 'role-switcher';
        roleSwitcher.innerHTML = `
          <option value="admin" selected>Admin</option>
          <option value="doctor">Doctor</option>
          <option value="pharmacist">Pharmacist</option>
          <option value="cashier">Cashier</option>
        `;
        roleSwitcher.value = currentUserRole;
        roleSwitcher.style.marginRight = '10px';
        roleSwitcher.onchange = function() {
          currentUserRole = this.value;
          applyRolePermissions();
        };
        
        headerActions.insertBefore(roleSwitcher, headerActions.firstChild);
      }

      // Logout function
      function logout() {
        if (confirm('Are you sure you want to logout?')) {
          alert('Logging out...');
          // In a real application, this would redirect to the login page
          // window.location.href = 'index.html';
        }
      }

      // Initialize the application when the DOM is loaded
      document.addEventListener('DOMContentLoaded', init);