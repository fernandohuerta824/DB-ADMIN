const errorMessage = document.querySelector('.error-message');


errorMessage.style.opacity = 1;

setTimeout(() => {
    errorMessage.style.opacity = 0;
}, 5000);

setTimeout(() => {
    errorMessage.style.display = 'none';
}, 5300);