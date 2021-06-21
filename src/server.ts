import express, { Application } from "express"
import dayjs from "dayjs"
import fs from "fs"
import { normalize, denormalize, schema } from 'normalizr'
const faker = require('faker')
const app: Application = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const mongoStore = require('connect-mongo'); 
const passport = require('passport')
const localStrategy = require('passport-local').localStrategy
const mongoose = require('mongoose');

const session = require('express-session')
const cookieParser = require('cookie-parser')
const advancedOptions = { useNewUrlParser: true, useUnifiedTopology: true }

// middleware: los aplico con app.use
app.use(express.json())
app.use(cookieParser())
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    //CONEXION A MONGO-ATLAS
    store: mongoStore.create({
        mongoUrl:'mongodb+srv://emma:borinda@cluster0.ydcxa.mongodb.net/users?retryWrites=true&w=majority',
        mongoOptions: advancedOptions,
        //  CON TTL NO FUNCIONA, EN MONGO'ATLAS FIGURA: "expires": null
        ttl: 14 * 24 * 60 * 60,

        // autoRemove: 'interval',
        // autoRemoveInterval: 1 // In minutes.
    }),
}))


const author = new schema.Entity("author")
const text = new schema.Entity('text', {
    author: author
})
const mensaje = new schema.Entity('msg', {
    author: author,
    text: text
})


if (!fs.existsSync('./chatLog.txt')) {
    fs.writeFileSync('./chatLog.txt', '')
    console.log('chatLog.txt creado')
}

let user: string = ''
let obj: any = ""
let objWithNormedMsg: any = ''

io.on('connection', (socket: any) => {
    console.log('se conectó un usuario')
    socket.on('newProduct', (producto: object) => {
        console.log("nuevo producto via socket.io: ", producto)
        io.emit('newProduct', producto)
    })
    socket.on("email", (newChat: any) => {
        console.log('chat iniciado')
        console.log(newChat)
        user = newChat
    })
    socket.on("chat", (newChatMsg: any) => {
        console.log(newChatMsg)
        const timestamp = dayjs()
        obj = {
            id: faker.datatype.uuid(),
            author: {
                id: faker.datatype.uuid(),
                user: user,
                timestamp: timestamp,
                age: Math.floor(Math.random() * (100 - 12 + 1)) + 12,
                alias: faker.hacker.noun(),
                avatar: faker.image.avatar()
            }, text: {
                id: faker.datatype.uuid(),
                text: newChatMsg
            }
        }
        console.log('obj in server: ', obj)
        const normalizedObj = normalize(obj, mensaje)
        //ESTO ESTA MAL, ESTOY DUPLICANDO EL OBJETO Y LLAMANDO A FAKER OTRA VEZ
        objWithNormedMsg = {
            ...obj,
            normalizedObj: normalizedObj
        }

        io.emit("chat", objWithNormedMsg)

        const stringified = JSON.stringify(obj)
        fs.appendFileSync('./chatLog.txt', '\n' + stringified)
    })
})

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(express.json())
app.use('/api', require('./rutas/routing'))
app.use('/productos', require('./rutas/routing'))

http.listen(7777, () => {
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log("conectado a mongoAtlas")
    })
    //conexion a mongoose
    mongoose.connect('mongodb+srv://emma:borinda@cluster0.ydcxa.mongodb.net/users?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});
    console.log('server is live on port 7777')
})