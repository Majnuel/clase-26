import express, { Application } from "express"
import dayjs from "dayjs"
import fs from "fs"
import { normalize, denormalize, schema } from 'normalizr'
const faker = require('faker')
const app: Application = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const path = require('path')
const session = require('express-session')
const cookieParser = require('cookie-parser')

// MONGO
const mongoStore = require('connect-mongo'); 
const mongoose = require('mongoose');

// PASSPORT
const passport = require('passport')
import { Strategy as LocalStrategy } from 'passport-local'
// const LocalStrategy = require('passport-local').LocalStrategy

// USER MODEL:
const userModel = require('../src/userModel')

// CONNECT-MONGO OPTIONS
const advancedOptions = { useNewUrlParser: true, useUnifiedTopology: true }

// declaro session.user para que TS transpile bien
declare module 'express-session' {
  export interface SessionData {
    user: { [key: string]: any };
  }
}

declare module 'express-session' {
  export interface SessionData {
    password: { [key: string]: any };
  }
}

// MIDDLEWARES:
app.use(express.json())
app.use(cookieParser())
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
    maxAge: 600000
    },
    //CONEXION A MONGO-ATLAS
    store: mongoStore.create({
        mongoUrl:'mongodb+srv://emma:borinda@cluster0.ydcxa.mongodb.net/users?retryWrites=true&w=majority',
        mongoOptions: advancedOptions,
        //  CON TTL NO FUNCIONA, EN MONGO'ATLAS FIGURA COMO: "expires": null
        ttl: 14 * 24 * 60 * 60,

        // autoRemove: 'interval',
        // autoRemoveInterval: 1 // In minutes.
    }),
    
}))

passport.use('login', new LocalStrategy({
    passReqToCallback : true
  },
  function(req:any, username:any, password:any, done:any) { 
    // check in mongo if a user with username exists or not
    userModel.findOne({ 'username' :  username }, 
      function(err:any, user:any) {
        // In case of any error, return using the done method
        if (err)
          return done(err);
        // Username does not exist, log error & redirect back
        if (!user){
          console.log('User Not Found with username '+username);
          console.log('message', 'User Not found.');                 
          return done(null, false)
        }
        // User exists but wrong password, log the error 
        // if (!isValidPassword(user, password)){
        //   console.log('Invalid Password');
        //   console.log('message', 'Invalid Password');
        //   return done(null, false) 
        // }
        // User and password both match, return user from 
        // done method which will be treated like success
        return done(null, user);
      }
    );
  })
);

passport.use('register', new LocalStrategy({
    passReqToCallback : true
  },
  function(req, user, password, done) {
      debugger
      console.log('passport.use: register')
    const findOrCreateUser = function(){
      // find a user in Mongo with provided username
      userModel.findOne({'user':user},function(err:any, user:any) {
        // In case of any error return
        if (err){
          console.log('Error in SignUp: '+err);
          return done(err);
        }
        // already exists
        if (user) {
          console.log('User already exists');
          console.log('message','User Already Exists');
          return done(null, false)
        } else {
          // if there is no user with that email
          // create the user
          let newUser = new userModel();
          // set the user's local credentials
          newUser.user = user;
          newUser.password = password;

          // save the user
          newUser.save(function(err:any) {
            if (err){
              console.log('Error in Saving user: '+err);  
              throw err;  
            }
            console.log('User Registration succesful');    
            return done(null, newUser);
          });
        }
      });
    }
    // Delay the execution of findOrCreateUser and execute 
    // the method in the next tick of the event loop
    process.nextTick(findOrCreateUser);
  })
)



const author = new schema.Entity("author")
const text = new schema.Entity('text', {
    author: author
})
const mensaje = new schema.Entity('msg', {
    author: author,
    text: text
})

let user: string = ''
let obj: any = ""
let objWithNormedMsg: any = ''


// SOCKET.IO
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


// RUTAS:
app.get('/', (req, res) => {
    if (req.session.user) {
        console.log('req.session.user = ', req.session.user)
        res.redirect('/dashboard') 
    } else {
        res.redirect('/ingreso')
    }
})

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname,'..', 'public/dashboard.html'))
})

//INGRESO:
app.get("/ingreso", (req, res) => {
    console.log('req.session.user: ', req.session.user)
    console.log('req.session: ', req.session)
    res.sendFile(path.join(__dirname,'..', 'public/ingreso.html'))
})

app.post("/ingreso", (req, res) => {
    const user = req.body.user;
    const password = req.body.password;
    req.session.user = user
    req.session.password = password
    console.log('user: ', req.session.user)
    console.log('password: ', req.session.password)
    res.sendStatus(200)
})

// REGISTRO:
app.get("/registro", (req, res) => {
    res.sendFile(path.join(__dirname,'..', 'public/registro.html'))
})

app.post('/registro', passport.authenticate('register', { failureRedirect: '/failregister' }), (req,res) => {
    res.redirect('/') 
})

//LOGOUT:
app.get('/logout', (req, res) => {
    req.session.destroy( () => {
        res.redirect('/')
    })
})

// ERRORES
app.get('/failregister', (req, res) => {
    res.send("FALLÓ EL REGISTRO")
})

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