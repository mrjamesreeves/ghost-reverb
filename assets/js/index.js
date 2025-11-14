// Sidebar functionality
document.querySelectorAll('.sidebar-toggle').forEach((sidebarToggle) => {
    sidebarToggle.addEventListener('click', (e) => {
        document.body.classList.toggle('sidebar--opened');
        e.preventDefault();
    });
});
const siteOverlay = document.querySelector('.sidebar-overlay');
if (siteOverlay) {
    siteOverlay.addEventListener('click', (e) => {
        document.body.classList.remove('sidebar--opened');
        e.preventDefault();
    });
}


//Light+Dark
document.addEventListener("DOMContentLoaded", function () {
    const sunIcons = document.querySelectorAll('.sun');
    const moonIcons = document.querySelectorAll('.moon');

    const currentTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", currentTheme);

    function updateIcons(theme) {
        sunIcons.forEach(sun => {
            sun.style.opacity = theme === "dark" ? "1" : "0";
            sun.style.transform = theme === "dark" ? "scale(1)" : "scale(0.5)";
        });

        moonIcons.forEach(moon => {
            moon.style.opacity = theme === "light" ? "1" : "0";
            moon.style.transform = theme === "light" ? "scale(1)" : "scale(0.5)";
        });
    }

    updateIcons(currentTheme);

    const themeToggleBtns = document.querySelectorAll(".theme-button");
    themeToggleBtns.forEach(btn => {
        btn.addEventListener("click", function () {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "light" ? "dark" : "light";

            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            updateIcons(newTheme);
        });
    });
});