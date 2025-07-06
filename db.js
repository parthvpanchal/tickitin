const mysql = require('mysql2');
const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'244466666',
    database:'tick_it_in'
})

connection.connect((err) => {
    if (err) throw err;
    console.log('MySQL Connected');
});

module.exports = connection;