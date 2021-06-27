import express, { Application } from "express"
import dayjs from "dayjs"
import fs from "fs"
import { normalize, denormalize, schema } from 'normalizr'
const bCrypt = require('bcrypt')
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
// USER MODEL:
const userModel = require('../src/userModel')
// CONNECT-MONGO OPTIONS
const advancedOptions = { useNewUrlParser: true, useUnifiedTopology: true }

// PASSPORT\
const passport = require('passport')
import { Strategy as LocalStrategy } from 'passport-local'
// const LocalStrategy = require('passport-local').LocalStrategy

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
app.use(cookieParser())
app.use(express.json())
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
app.use(passport.initialize());
app.use(passport.session());

passport.use('login', new LocalStrategy({
    passReqToCallback : true
  },
  function(req, username, password, done) { 
      debugger;
    // check in mongo if a user with username exists or not
    userModel.findOne({ 'username' :  username }, 
      function(err:any, user:any) {
        // In case of any error, return using the done method
        if (err) {
            console.log(err)
            return done(err);
        }
        // Username does not exist, log error & redirect back
        if (!user){
          console.log('User Not Found with username '+username);
          console.log('message', 'User Not found.');                 
          return done(null, false)
        }
        // User exists but wrong password, log the error 
        if (!isValidPassword(user, password)){
          console.log('Invalid Password');
          console.log('message', 'Invalid Password');
          console.log("username: ", username)
          console.log("password: ", password)
          return done(null, false) 
        }
        // User and password both match, return user from 
        // done method which will be treated like success
        return done(null, user);
      }
    );
  })
);

var isValidPassword = function(user:any, password:any){
  console.log('isValidPassword. user: ', user, typeof user.password)
  console.log('isValidPassword. password: ', password, typeof password)
  console.log("bcrypt: ",  bCrypt.compareSync(password, user.password))
  //BCRYPT ESTA EVALUANDO SIEMPRE COMO FALSO AUNQUE LOS PASSWORDS COINCIDAN
  // return bCrypt.compareSync(password, user.password);
  return (user.password === password)
}

passport.use('register', new LocalStrategy({
    passReqToCallback : true
  },
  function(req, username, password, done) {
    const findOrCreateUser = function(){
      // find a user in Mongo with provided username
      userModel.findOne({'username':username},function(err:any, user:any) {
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
          newUser.username = username;
          newUser.password = createHash(password);

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
  // Generates hash using bCrypt
var createHash = function(password:any){
  return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}
   
// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user:any, done:any) {
  done(null, user._id);
});
 
passport.deserializeUser(function(id:any, done:any) {
  userModel.findById(id, function(err:any, user:any) {
    done(err, user);
  });
});


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
    console.log('SOCKET.OI: se conectó un usuario')
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

app.use(express.static('public')) 
app.use(express.urlencoded({ extended: true }))
app.use('/api', require('./rutas/routing'))
app.use('/productos', require('./rutas/routing'))


// RUTAS:
app.get('/', (req, res) => {
    console.log("location: /")
    if (req.isAuthenticated()) {
        console.log('req.session', req.session)
        console.log('req.user', req.user)
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
    console.log('req.session: ', req.session)
    res.sendFile(path.join(__dirname,'..', 'public/ingreso.html'))
})

app.post('/ingreso', passport.authenticate('login', { failureRedirect: '/failedlogin' }), (req,res) => {
    res.redirect('/') 
})

// REGISTRO:
app.get("/registro", (req, res) => {
    res.sendFile(path.join(__dirname,'..', 'public/registro.html'))
})

app.post('/registro', passport.authenticate('register', { failureRedirect: '/failedregister' }), (req,res) => {
    res.redirect('/') 
})

//LOGOUT:
app.get('/logout', (req, res) => {
    req.logOut()
    res.redirect("/")
})

// ERRORES
app.get('/failedregister', (req, res) => {
    res.send("FALLÓ EL REGISTRO")
})

app.get('/failedlogin', (req, res) => {
    res.send("FALLÓ EL LOGIN")
})

http.listen(7778, () => {
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log("conectado a mongoAtlas")
    })
    //conexion a mongoose
    mongoose.connect('mongodb+srv://emma:borinda@cluster0.ydcxa.mongodb.net/users?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});
    console.log('server is live on port 7778')
})