            "use strict"; 
            const socket = io();
            const form = document.getElementById('form');
            const tableBody = document.getElementById('table-body')
            const titleInput = document.getElementById('titleInput')
            const priceInput = document.getElementById('priceInput')
            const thumbnailInput = document.getElementById('thumbnailInput')
            const emailForm = document.getElementById("emailForm")
            const emailInput = document.getElementById("emailInput")
            const chatForm = document.getElementById('chat')
            const chatInput = document.getElementById('message')
            const msgCenter = document.getElementById("centroDeMensajes")
            const ul = document.getElementById('ul')
            const loginForm = document.getElementById('login')
            const loginInput = document.getElementById('loginInput')
            const nav = document.getElementById('nav')
            const buttonWrapper = document.getElementById('logoutButtonWrapper')
            const newA = document.createElement('a')

            const loginCleanUp = () => {
                const buttonToRemove = document.getElementsByClassName('logout-button')
                console.log(buttonToRemove)
                console.log('login cleanup')
                nav.removeChild(document.getElementById('bienvenido'))
                loginForm.classList.remove('hidden')
                newA.setAttribute('id', 'logoutButtonWrapper')
                newA.setAttribute('href', 'http://localhost:7777/api/hastaluego')
                nav.prepend(newA)
                nav.removeChild(buttonWrapper)
                document.getElementById("logoutButtonWrapper").removeChild(document.getElementById('logoutButton'))
               
            }

            //LOGOUT BUTTON
            const logoutButton = (parentNode) => {
                const button = document.createElement('button')
                button.innerText = 'logout'
                button.classList.add('logout-button')
                button.setAttribute("id", "logoutButton")
                button.addEventListener('click', () => {
                    axios.get('/api/logout')
                    .then((response) => console.log(response.data))
                    .catch((error) => {console.log("error: ", error)});
                })
                parentNode.prepend(button)
                return
            }

            

            //login form
            loginForm.addEventListener('submit', (event) => {
                event.preventDefault()
                if (loginInput.value.length < 3) {
                    alert("ingrese un nombre completo")
                } else {
                    const greeting = document.createElement('div')
                    greeting.textContent = `Bienvenido ${loginInput.value}`
                    greeting.setAttribute('id', 'bienvenido')
                    loginForm.classList.add('hidden')
                    nav.prepend(greeting)
                    logoutButton(buttonWrapper)
                    logoutButton(newA)  
                    axios.post('/api/login', {
                        name : loginInput.value
                    })
                    .then(function (response) {
                            console.log("response: ", response);
                        })
                    .catch(function (error) {
                            console.log("error: ", error);
                        });
                }
            })

            //EMAIL FORM EVENT LISTENER
            emailForm.addEventListener("submit", (event) => {
                event.preventDefault()
                const chatDiv = document.getElementById('chat');
                if (emailInput.value) {
                    chatDiv.classList.remove('chatDiv')
                    socket.emit("email", emailInput.value)
                    emailForm.classList.add("chatDiv")
                    console.log("chat iniciado")

                } else {
                    alert('ingrese un email')
                }
            })

            //emito el mensaje cuando se hace click en submit
            chatForm.addEventListener("submit", (event) => {
                event.preventDefault();
                socket.emit("chat", chatInput.value)

            })

            socket.on("chat", (payload) => {
                const newMsg = document.createElement('li')
                newMsg.textContent = `${payload.author.user} ${payload.author.timestamp}: ${payload.text.text}`;
                ul.appendChild(newMsg)
                chatInput.value = '';
                console.log(payload.normalizedObj)
            })

            //CHECK IF USER IS LOGGED IN
            const checkForLogin = () => {
                axios.get('/api/login')
                .then(response => {
                    if (response.data.name) {
                    const greeting = document.createElement('div')
                    greeting.textContent = `Bienvenido ${response.data.name}`
                    loginForm.classList.add('hidden')
                    nav.prepend(greeting)
                    logoutButton(buttonWrapper)
                    }
                })
                .catch(error => console.log(error));
            }


            const checkForProducts = () => {
                axios.get('/api/productos')
                    .then((products) => {
                        if (products.data.length == 0) {
                            console.log('no hay productos en db')
                            // const newTR = document.createElement('tr')
                            // tableBody.appendChild(newTR)
                            // const newTH = document.createElement('th')
                            // newTH.setAttribute('scope', 'row')
                            // newTH.textContent = "No hay productos"
                            // newTR.appendChild(newTH)
                        } else {
                            console.log(products.data)
                            products.data.forEach(element => {
                                const newTR = document.createElement('tr')
                                tableBody.appendChild(newTR)
                                const newTH = document.createElement('th')
                                newTH.setAttribute('scope', 'row')
                                newTH.textContent = element.title
                                newTR.appendChild(newTH)
                                //TD
                                const newTD = document.createElement('td')
                                newTR.appendChild(newTD)
                                newTD.textContent = `$ ${element.price}`
                                const thumbnail = document.createElement('td')
                                thumbnail.innerHTML = `<img src=${element.thumbnail}>`
                                newTR.appendChild(thumbnail)
                            });
                        }
                    })
            }

            // NEW PRODUCT SUBMIT
            form.addEventListener('submit', (event) => {
                event.preventDefault()
                if (titleInput.value && priceInput.value && thumbnailInput.value) {
                    axios.post("/api/productos", {
                        'title': titleInput.value,
                        'price': priceInput.value,
                        'thumbnail': thumbnailInput.value
                    })
                        .then(function (response) {
                            console.log(response.data)
                            console.log(typeof response.data)
                            if (response.data === false) {
                                loginCleanUp()

                            }
                            console.log(response);
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                    socket.emit('newProduct', {
                        'title': titleInput.value,
                        'price': priceInput.value,
                        'thumbnail': thumbnailInput.value
                    })
                } else {
                    alert('Debe completar todos los campos')
                }
                titleInput.value = '';
                priceInput.value = '';
            })

            socket.on('newProduct', (producto) => {
                const newTR = document.createElement('tr')
                tableBody.appendChild(newTR)
                const newTH = document.createElement('th')
                newTH.setAttribute('scope', 'row')
                newTH.textContent = producto.title
                newTR.appendChild(newTH)
                //TD
                const newTD = document.createElement('td')
                newTR.appendChild(newTD)
                newTD.textContent = `$ ${producto.price}`
                const thumbnail = document.createElement('td')
                thumbnail.innerHTML = `<img src=${producto.thumbnail}>`
                newTR.appendChild(thumbnail)
            })
