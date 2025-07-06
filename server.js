const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
    
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true}));

app.use(session({
    secret: 'tickitin_secret',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine','ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

const mainRoutes = require('./routes/main');
const authRoutes = require('./routes/auth');

app.use('/', mainRoutes);
app.use('/', authRoutes);

app.listen(PORT, () => {
    console.log(`Tick_It_In is running at http://localhost:${PORT}`);
});
