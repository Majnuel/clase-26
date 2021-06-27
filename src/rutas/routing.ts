import express, { Application, Request, Response } from "express"
import { Store } from "express-session"
const Product = require(".././classModule")
const app: Application = express()
const router = express.Router()
const path = require('path')
const userModel = require('../userModel')

export let id: number = 1
export let productos: any[] = []

let login = false
let gotTime = true
let name: any = ''

declare module 'express-session' {
    interface SessionData {
        login: boolean;
        name: string;
    }
}


router.post('/login', (req, res) => {
        name = req.body.name
        console.log(name)
        req.session.login = true
        req.session.name = name
        console.log("req.session: ", req.sessionID)
        res.sendStatus(200)
})

// //INGRESO:
// router.get("/ingreso", (req, res) => {
//     res.sendFile(path.join(__dirname+'/ingreso.html'))
// })

// router.post("/ingreso", (req, res) => {
//     const user = req.body.user;
//     const password = req.body.password;
//     console.log(user, password)
//     res.sendStatus(200)
// })

// REGISTRO:
router.get("/registro", (req, res) => {
    res.sendFile(path.join(__dirname+'/registro.html'))
})

// router.post("/registro", (req, res) => {
//     const user = req.body.user;
//     const password = req.body.password;
//     const newUser = new userModel({ user: user, password: password })
//     newUser.save()
//      .then(() => {
//          req.session.login = true
//          req.session.name = user
//          console.log("req.session: ", req.sessionID)
//          console.log('usuario exitosamente agregado')
//         res.sendStatus(201)
//     })
//     .catch((err:any) => {
//         console.log(err)
//         res.sendStatus(500)
//     })   
// })


// router.get('/login', (req, res) => {
//     const payload = {
//         id: req.sessionID,
//         gotTime: gotTime,
//         name: req.session.name
//     }
//     res.send(payload)
// })

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (!err) {
            res.redirect('/api/hastaluego');
        }
    })
})

// router.get('/vista', (req, res) => {
//     res.render("main", {
//         productos: productos, listExists: true
//     })
// })

router.get('/hastaluego', (req, res) => {
    res.sendFile(path.join(__dirname + '../../rutas/hastaLuego.html'))
})

router.get('/hastaluegoNombre', (req, res) => {
    res.send(name)
})

router.get('/', (req, res) => {
    res.send('Pagina principal de la API')
})

router.get('/productos', (req, res) => {
    res.json(productos)
})

router.patch('/productos/:id', (req, res) => {

    const id: number = parseInt(req.params.id)
    const queryParams = req.query

    const product = productos.find(item => item.id === id)
    if (!product) {
        res.sendStatus(404)
    }
    if (Object.values(queryParams).length > 1) {
        res.send('You may only modify one property at a time')
    }
    const key = Object.keys(queryParams)[0]
    const newValue = Object.values(queryParams)[0]
    console.log('id: ', id)
    console.log(typeof id)
    console.log('query params', queryParams)
    console.log(Object.keys(queryParams))
    console.log(key, newValue)

    // product.key = newValue
    //ME AGREGA LA PROPIEDAD KEY EN LUGAR DEL VALOR DE LA VARIABLE KEY. 
    //COMO DEBERIA HACERLO PARA NO USAR EL SWITCH? GONZA???

    switch (key) {
        case 'title':
            product.title = newValue
            console.log(product)
            break;
        case 'price':
            product.price = newValue
            console.log(product)
            break;
        case 'thumbnail':
            product.thumbnail = newValue
            console.log(product)
            break
        default:
            res.send('No such property on product')
            break;
    }
    res.sendStatus(204)
})

router.post('/productos', (req, res) => {
    if (!gotTime) {
        req.session.destroy(err => {
            if (!err) {
                res.send(false)
            }
        })
    } else {
        console.log(`post en /productos recibido, body: , ${req.body}`)
        console.log(req.body)
        const { title, price, thumbnail } = req.body
        const newProduct: any = new Product(title, price, thumbnail, id++)
        productos.push(newProduct.showProduct())
        res.sendStatus(201)
    }
})

router.delete('/productos/:id', (req, res) => {
    const id: number = parseInt(req.params.id)
    const product = productos.find(item => item.id === id)
    if (!product) {
        res.sendStatus(404)
    }
    productos = productos.filter(product => product.id != id)
    res.sendStatus(200)
})

router.get('/productos/:id', (req, res) => {
    const id: number = parseInt(req.params.id)
    const product = productos.find(item => item.id === id)
    if (!product) {
        res.sendStatus(404)
    }
    res.json(product)
})

module.exports = router

