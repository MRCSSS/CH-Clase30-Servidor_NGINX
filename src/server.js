/* ============================ MODULOS ============================= */
import bcrypt from 'bcrypt';
import connectMongo from 'connect-mongo';
import * as dotenv from 'dotenv';
import express from 'express';
import { create } from 'express-handlebars';
import session from 'express-session';
import { createServer } from 'http';
import { normalize, schema } from 'normalizr';
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import path from 'path';
import { Server } from 'socket.io';
import { msgsDao, productsDao, usersDao } from './daos/index.js';
import register from './routes/register.routes.js';
import randoms from './routes/randoms.routes.js';
import info from './routes/info.routes.js';

dotenv.config();

/* ====================== INSTANCIA DE SERVER ======================= */
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const exphbs = create({
    defaultLayout: null,
    extname: 'hbs'
})

/* ================== PERSISTENCIA DE SESION MONGO ================== */
const MongoStore = connectMongo.create({
    mongoUrl: process.env.MONGO_URL,
    ttl: 10 *60 // Minutos *60
})

/* ========================== MIDDLEWARES =========================== */
// app.use(express.static('public'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true}));
app.use((req, res, next) => {
    req.io = io;
    next();
});

    /* --------------------- Session Setup --------------------- */
app.use(session({
    store: MongoStore,
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    rolling: true
}))

    /* ----------------- Session Authorization ----------------- */
function auth(req, res, next) {
    if(req.isAuthenticated()){
        return next()
    }
    return res.redirect('/');
}

    /* ----------------------- Passport ------------------------ */
passport.use(new LocalStrategy(
    async function(username, password, done) {
        const user = await usersDao.searchUser(username);

        if (user === null) {
            return done(null, false);
        } else {
            const match = await bcrypt.compare(password, user.password);

            if(!match){
                return done(null, false);
            }
            return done(null, user);
        }
    }
));

passport.serializeUser((user, done)=>{
    done(null, user.username);
});

passport.deserializeUser( async (username, done)=>{
    const user = await usersDao.searchUser(username);
    done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

    /* ------------------ Motor de Plantillas ------------------ */
app.engine('hbs', exphbs.engine);
app.set('views', path.join(process.cwd(), 'src/views'));
app.set('view engine', 'hbs');

/* ============================== RUTAS ============================= */
app.get('/', (req, res) => {
    if(!req.session.user) {
        res.redirect('/login');
    } else {
        res.redirect('/home');
    }
})

app.get('/home', auth, async (req, res) => {
    const user = await usersDao.searchUser(req.session.passport.user);
    res.render('partials/home', {layout: 'home', user: user.username , email: user.email});
});

app.get('/login', (req, res) => {
    res.render('partials/login', {layout: 'login'});
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/home', 
    failureRedirect: '/login-error'
}));

app.get('/login-error', (req, res)=>{
    res.render('partials/login-error', {layout: 'login'});
})

app.get('/logout', async (req, res)=> {
    const user = await usersDao.searchUser(req.session.passport.user);

    req.session.destroy(err=>{
        if (err) {
            res.json({err});
        } else {
            res.render('partials/logout', { layout: 'logout', user: user.username });
        }
    });
});

app.use('/register', register);
app.use('/api', randoms);
app.use('/info', info);

/* ===================== NORMALIZANDO MENSAJES ====================== */
const authorSchema = new schema.Entity('author', {}, { idAttribute: 'email' });
const messageSchema = new schema.Entity('post', { author: authorSchema }, { idAttribute: 'id' });
const msgsSchema = new schema.Entity('posts', { messages: [messageSchema] }, { idAttribute: 'id' });
const normalizing = (fullMsgs) => normalize(fullMsgs, msgsSchema);

async function getAllNormalized() {
    const msgs = await msgsDao.getAll();
    const normalized = normalizing({ id: 'messages', msgs})

    return normalized;
}

/* ============================ WEBSOCKET =========================== */
io.on('connection', async (socket) => {
    console.log(`Client conected: ${socket.id}`);

    socket.emit('serv-msgs', await getAllNormalized());
    socket.emit('serv-prods', await productsDao.getAll());

    socket.on('client-msg', async (msg) => {
        await msgsDao.save(msg);
        io.sockets.emit('serv-msgs', await getAllNormalized());
    })
    socket.on('client-prods', async (prod) => {
        await productsDao.save(prod);
        io.sockets.emit('serv-prods', await productsDao.getAll());
    })
})

/* ====================== MODULOS EXPORTADOS ======================== */
export default httpServer;