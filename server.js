const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const port = 3000;
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
};
const app = express();
app.use(express.json());
app.listen(port, () => {
    console.log('Server running on port', port);
});
// GET
app.get('/allcards', async (req, res) => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM defaultdb.cards');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error for allcards'});
    }
});
// POST
app.post('/addcards', async (req, res) => {
    const {card_name, card_pic} = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO cards (card_name, card_pic) VALUES (?, ?)', [card_name, card_pic]);
        res.status(201).json({message: 'Card ' + card_name + ' added successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error - could not add card'});
    }
});
app.post('/updatecards/:id', async (req, res) => {
    const {id} = req.params;
    const {card_name, card_pic} = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT card_name FROM cards WHERE id = ?', [id]);
        const displayName = card_name || rows[0].card_name;
        await connection.execute('UPDATE cards SET card_name = ?, card_pic = ? WHERE id = ?', [card_name, card_pic]);
        res.status(201).json({message: 'Card ' + displayName + ' has been updated successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error - could not update card'});
    }
})
app.post('/deletecards/:id', async (req, res) => {
    const {id} = req.params;
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT card_name FROM cards WHERE id = ?', [id]);
        const displayName = rows[0].card_name;
        await connection.execute('DELETE FROM cards WHERE id = ?', [id]);
        res.status(200).json({message: 'Card ' + displayName + ' has been deleted'});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error - could not delete card'});
    }
})