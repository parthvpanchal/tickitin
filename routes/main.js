const express = require('express');
const router = express.Router();
const db = require("../db");

// home page
router.get('/', (req,res) => {
    res.render('index', { user: req.session.user });
});



// events page
router.get('/events', (req,res) => {
    const sql = 'select * from events order by date asc';

    db.query(sql, (err,results) => {
        if(err) {
            console.error('Error fetching events: ',err);
            return res.send('Error handling events');
        }
        res.render('events', {
            events: results,
            user: req.session.user
        });
    });
});

router.get('/logout', (req,res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;

router.post('/book/:id', (req,res) => {
    const eventId = req.params.id;

    if (!req.session.user) {
        return res.send(`
            <html>
            <head>
            <title>events</title>
            <link rel="stylesheet" href="/css/style.css">
            <script>
                setTimeout(() => {
                    window.location.href="/login";
                    }, 2000);
            </script>
            </head>
            <body class="pop-up-b">
                <div class="message-box">
                    You have to log in first<br>
                    Redirecting you to login page...
                </div>
            </body>
            </html>
            `);
    }
    const userId = req.session.user.id;

    const checkSeatsQuery = 'select seats from events where id=?';
    db.query(checkSeatsQuery, [eventId], (err,results) => {
        if (err) return res.send('Error checking seats availability');
        if (results.length === 0) return res.send('Event not found');

        const availableSeats = results[0].seats;
        if(availableSeats <= 0) {
            return res.send('Sorry, this event is fully booked');
        }

        const insertBooking = 'insert into bookings (user_id, event_id) values (?,?)';
        db.query(insertBooking, [userId, eventId], (err, result) => {
            if(err) {
                console.log('Booking Error: ',err);
                return res.send('You may have already booked this event');
            }

            const updateSeats = 'update events set seats = seats - 1 where id = ?';
            db.query(updateSeats, [eventId], (err) => {
                if (err) return res.send('Error updating seats');

                res.send('✅ Booking Successful');
            });
        });
    });
});

// create-event page
router.get('/create-event', (req,res) => {
    if (!req.session.user || req.session.user.role !== 'organizer') {
        return res.send('Only Organizers can create events');
    }
    res.render('create-event');
});

router.post('/create-event', (req,res) => {
    if (!req.session.user || req.session.user.role !== 'organizer') {
        return res.send('Unauthorized access. ');
    } 

    const {title, description, location, date, seats} = req.body;
    const created_by = req.session.user.id;

    const sql = 'insert into events (title, description, location, date, seats, created_by) values (?,?,?,?,?,?)';
    db.query(sql, [title, description, location, date, seats, created_by], (err) => {
        if(err) {
            console.error('Event creation error: ',err);
            return res.send('Error creating event');
        }
        res.send(`
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Event Created</title>
                <link rel="stylesheet" href="/css/style.css">
                <script>
                    setTimeout(() => {
                        window.location.href='/events';
                        },2000);
                </script>
            </head>
            <body class="pop-up-b">
                <div class="message-box">
                    ✅ Event created Successfully<br>
                    Redirecting to Events page...
                </div>
            </body>
            </html>
        `);
    });
});


// my-booking page
router.get('/my-bookings', (req,res) => {
    if(!req.session.user) {
        return res.send(`
            <html>
            <head>
            <title>my-booked-events</title>
            <link rel="stylesheet" href="/css/style.css">
            <script>
                setTimeout(() => {
                    window.location.href="/login";
                    }, 2000);
            </script>
            </head>
            <body class="pop-up-b">
                <div class="message-box">
                    You have to log in first<br>
                    Redirecting you to login page...
                </div>
            </body>
            </html>
            `);
    }

    const userId = req.session.user.id;
    const sql = `
        select events.title, events.description, events.location, events.date, bookings.booked_at
        from bookings
        join events on bookings.event_id = events.id
        where bookings.user_id = ?
        order by bookings.booked_at desc`;
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching bookings', err);
            return res.send('Error loading your bookings');
        }
        res.render('my-bookings', { bookings: results});
    });
});

// organizer-dashboard page
router.get('/organizer', (req,res) => {
    if(!req.session.user ||  req.session.user.role !== 'organizer') {
        return res.send('Access denied. Only organizers can view this page');
    }

    const organizerId = req.session.user.id;
    sql = 'select * from events where created_by=? order by date asc';
    db.query(sql, [organizerId], (err, results) => {
        if (err) {
            console.error('Error fetching organizer events', err);
            return res.send('Error loading your events');
        }

        res.render('organizer', { events: results});
    });
});