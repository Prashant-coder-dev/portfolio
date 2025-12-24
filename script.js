// Common JavaScript for all pages

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer (if element exists)
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

