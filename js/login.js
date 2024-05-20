'use strict'

let timer;

console.log(document.querySelector(".form"));
        document.querySelector(".form").addEventListener("submit", function(event) {
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            console.log(validateUser(username) && validatePassword(password));
            console.log(username, password)
            if (validateUser(username) && validatePassword(password)) {
                
                window.location.href = "/home";
            } else {
                event.preventDefault();
                document.querySelector(".error-message").style.opacity = 1;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    document.querySelector(".error-message").style.opacity = 0;
                }, 3000);
                    

            }
        });
    
        function validateUser(user) {
            return user === "tuspelis_admin";
        }
    
        function validatePassword(pass) {
            return pass === "badbunnyeselmejorcantante";
        }

