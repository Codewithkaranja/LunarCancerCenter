// auth.js

// Get token from localStorage
export function getToken() {
  return localStorage.getItem('token');
}

// Check if user is logged in
export function isLoggedIn() {
  return !!getToken();
}

// Logout function
export function logout() {
  localStorage.removeItem('token'); // remove token
  sessionStorage.clear();           // optional: clear sessionStorage too
  window.location.href = "/docs/index.html"; // redirect to login
}

// Protect page: call this on page load
export function protectPage() {
  if (!isLoggedIn()) {
    logout(); // if not logged in, force logout
  }
}
