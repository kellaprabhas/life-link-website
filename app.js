const loginForm = document.querySelector('#loginForm');
const passwordInput = document.querySelector('#password');
const togglePassword = document.querySelector('.toggle-password');
const formStatus = document.querySelector('#formStatus');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.textContent = isPassword ? 'Hide' : 'Show';
        togglePassword.setAttribute('aria-label', `${isPassword ? 'Hide' : 'Show'} password`);
        togglePassword.setAttribute('aria-pressed', String(isPassword));
    });
}

if (loginForm && formStatus) {
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        localStorage.setItem('lifelinkLoggedIn', 'true');
        window.location.href = 'dashboard.html';
    });
}
