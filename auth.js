(() => {
    const isLoginPage = document.body.classList.contains('login-page');

    if (!isLoginPage && localStorage.getItem('lifelinkLoggedIn') !== 'true') {
        window.location.replace('index.html');
        return;
    }

    window.logout = () => {
        localStorage.removeItem('lifelinkLoggedIn');
        window.location.href = 'index.html';
    };
})();
