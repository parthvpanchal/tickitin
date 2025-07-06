const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

router.get('/login', (req,res) => {
    res.render('login');
});

router.get('/register', (req,res) => {
    const role = req.query.role || 'user';
    res.render('register', {role});
});

// Handling the registration form
router.post('/register', async(req,res) => {
    const { name, email, password, role} = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'insert into users (name, email, password, role) values (?,?,?,?)';

        db.query(sql, [name, email, hashedPassword, role], (err,result) => {
            if(err) {
                console.error('Error during Registration',err);
                return res.send('Error Registrating user');
            }
            console.log('User Registered');
            res.redirect('/login');
        });
    } catch(error) {
        res.send('Something went wrong');
    }
});

// Handling the login form
router.post('/login', (req,res) => {
    const {email, password} = req.body;

    const sql = 'select * from users where email = ?';
    db.query(sql, [email], async(err, results) => {
        if(err) {
            console.error('Error during login: ',err);
            return res.send('Database error');
        }

        if (results.length === 0) {
            return res.send('No user found with that email');
        }

        const user = results[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            console.log('Login Successful for: ',user.email);
            req.session.user = user;
            res.redirect('/events');
        }
        else {
            res.send('Incorrect Password');
        }
    });
});

module.exports = router;