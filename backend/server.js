const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 5000;

const DB_URI = process.env.MONGO_URI || 'mongodb://db-service:27017/devopsdb';

mongoose.connect(DB_URI)
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch(err => console.error('MongoDB Connection Failed:', err));

app.get('/status', (req, res) => {
    // process.env.HOSTNAME কন্টেইনারের ইউনিক আইডি রিটার্ন করবে
    res.json({ 
        message: `Hello! Request processed by Backend Machine ID: [${process.env.HOSTNAME}]` 
    });
});

app.listen(PORT, () => {
    console.log(`Backend API Server running on port ${PORT}`);
});
