const express = require('express');
const app = express();

// app.set('port', process.env.PORT || 3000);

app.use(express.urlencoded({extended: false}));
app.use(express.json);

// Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'});

app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

// Establecemos el motor de platntilla ejs
app.set('view engine', 'ejs');

// Invocamos a bcryptjs
const bcryptjs = require('bcryptjs');

// Var de session
const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Invocamos al módulo de conexión de la BD
const connection = require('./database/db');

app.get("/login",(req,res)=>{
    // res.send("Hola Mundo desde Node JS");
    res.render('login');
});

app.get("/register",(req,res)=>{
    // res.send("Hola Mundo desde Node JS");
    res.render('registrar');
});

app.post('/registrar', async (req, res) => {
    const user = req.body.user;
    const name = req.body.name;
    const rol = req.body.rol;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass, 8);
    connection.query('INSERT INTO users SET ?', {user:user, name:name, rol:rol, pass:passwordHaash}, async(error, results) => {
        if (error) {
            console.log(error);
        } else {
            res.render('registrar', {
                alert: true,
                alertTitle: "Registración",
                alertMessage: "¡Registración Exitosa",
                alertIcon: 'success',
                showConfirmButton: false,
                timer:1500,
                ruta: ''
            })
        }
    })
});

app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass, 8);
    if (user && pass) {
        connection.query('SELECT * FROM users WHERE user = ?', {user}, async (error, results) => {
            if (results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass))) {
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Usuarion y/o password incorrectos",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer:false,
                    ruta: 'login'
                });
            } else {
                req.session.loggedin = true;
                req.session.name = results[0].name
                res.render('login', {
                    alert: true,
                    alertTitle: "Conexión exitosa",
                    alertMessage: "¡LOGIN CORRECTO!",
                    alertIcon: 'success',
                    showConfirmButton: false,
                    timer:false,
                    ruta: ''
                });
            }
        });
    } else {
        res.render('login', {
            alert: true,
            alertTitle: "Advertencia",
            alertMessage: "¡Por favor ingrese un usuario y/o password!",
            alertIcon: 'warnig',
            showConfirmButton: false,
            timer:1500,
            ruta: 'login'
        });
    }

})

// Auth pages 
app.get('/', (req, res) => {
    if (req.session.loggedin) {
        res.render('index', {
            login: true,
            name: req.session.name
        });
    } else {
        res.render('index', {
            login: false,
            name: 'Debe iniciar sesión'
        });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    })
})

app.listen(3000, () => {
    console.log(`Servidor en el puerto http://localhost:3000`);
});