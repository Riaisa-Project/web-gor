const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all courts
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM courts ORDER BY id ASC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET court by id
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM courts WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Court not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;