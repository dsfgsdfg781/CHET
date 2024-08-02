const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// שמירת רשימת משתמשים מחוברים והודעות
let connectedUsers = {};
let messages = []; // אחסון זמני להודעות

// שירות קבצים סטטיים מתוך תיקיית 'public'
app.use(express.static('public'));

// הגדרת נתיבים לדפי HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// טיפול בחיבורים של סוקטים
io.on('connection', (socket) => {
    console.log('משתמש חדש התחבר');

    // הוספת משתמש חדש
    socket.on('new user', (username) => {
        connectedUsers[socket.id] = username;
        io.emit('user list', Object.values(connectedUsers)); // עדכון רשימת משתמשים לכל המחוברים
    });

    // שליחת כל ההודעות הקיימות ללקוח החדש
    messages.forEach((message) => {
        socket.emit('chat message', message);
    });

    // הקשבה להודעות צ'אט
    socket.on('chat message', (data) => {
        messages.push(data); // שמירת ההודעה במערך
        io.emit('chat message', data); // שליחה לכל הלקוחות כולל שם המשתמש
    });

    // הקשבה להודעות קבצים
    socket.on('file message', (file) => {
        messages.push(file); // שמירת הקובץ במערך
        io.emit('file message', file); // שליחה לכל הלקוחות כולל שם המשתמש
    });

    // ניהול מחיקת הודעות
    socket.on('delete message', (id) => {
        // מחיקת ההודעה עם ה-ID מהמערך
        const index = messages.findIndex(msg => msg.id === id);
        if (index !== -1) {
            messages.splice(index, 1);
            io.emit('delete message', id); // שליחת הודעת מחיקה לכל הלקוחות
        }
    });

    // טיפול בהתנתקות
    socket.on('disconnect', () => {
        console.log('משתמש התנתק');
        delete connectedUsers[socket.id];
        io.emit('user list', Object.values(connectedUsers)); // עדכון רשימת משתמשים לכל המחוברים
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`שרת פועל על פורט ${PORT}`);
});
