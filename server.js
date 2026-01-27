const express = require('express');
const mysql = require('mysql2/promise');
const cors = require("cors");
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
const allowedOrigins = [
    "http://localhost:3000",
    "https://card-app-starter-rvxg.onrender.com"
];
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: false,
    })
);
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
const DEMO_USER = {id: 1, username: "admin", password: "admin123"};
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
app.post("/login", (req, res) => {
   const {username, password} = req.body;
   if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
       return res.status(401).json({error: "Invalid credentials"});
   }
   const token = jwt.sign(
       {userId: DEMO_USER.id, username: DEMO_USER.username},
       JWT_SECRET,
       {expiresIn: "1h"}
   );
   res.json({token});
});
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({error: "Missing Authorization Header"});
    }
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || token) {
        return res.status(401).json({error: "Invalid Authorization Format"});
    } try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({error: "Invalid/Expired Token"});
    }
}
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
app.put('/updatecards/:id', async (req, res) => {
    const {id} = req.params;
    const {card_name, card_pic} = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT card_name FROM cards WHERE id = ?', [id]);
        const displayName = card_name || rows[0].card_name;
        await connection.execute('UPDATE cards SET card_name=?, card_pic=? WHERE id = ?', [card_name, card_pic, id]);
        res.status(201).json({message: 'Card ' + displayName + ' has been updated successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error - could not update card'});
    }
})
app.delete('/deletecards/:id', async (req, res) => {
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