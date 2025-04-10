const express = require('express');
const axios = require('axios');
const multer = require('multer'); // Moved this line up
const cors = require('cors');

const app = express();
const upload = multer(); // Now multer is declared before usage

const CONFIG_URL = 'https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec';
const LOG_URL = 'https://app-tracking.pockethost.io/api/collections/drone_logs/records';
const POCKETBASE_TOKEN = '20250301efx'; // Authorization token

app.use(express.json());
app.use(cors());

app.get('/configs/:id', async (req, res) => {
    const droneId = Number(req.params.id);
    try {
        const response = await axios.get(CONFIG_URL);
        const configs = response.data.data;
        const config = configs.find(c => c.drone_id === droneId);

        if (!config) {
            return res.status(404).json({ error: "Drone config not found" });
        }
      
        delete config.condition;
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: "Error fetching drone config" });
    }
});

app.get('/status/:id', async (req, res) => {
    const droneId = Number(req.params.id);
    try {
        const logResponse = await axios.get(CONFIG_URL);
        const logs = logResponse.data.data;
        const droneLog = logs.find(log => log.drone_id === droneId);

        if (!droneLog) {
            return res.status(404).json({ error: "Drone log not found" });
        }

        const condition = droneLog.condition || "unknown";
        res.json({ condition: condition });
    } catch (error) {
        res.status(500).json({ error: "Error fetching drone status" });
    }
});

app.get('/logs/:id', async (req, res) => { // Changed to accept dynamic drone_id
    const droneId = Number(req.params.id);
    try {
        const MAX_ITEMS = 25;
        const response = await axios.get(
            `${LOG_URL}?filter=(drone_id=${droneId})&sort=-created&perPage=${MAX_ITEMS}`,
            {
                headers: {
                    'Authorization': `Bearer ${POCKETBASE_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.data?.items) {
            return res.status(404).json({ 
                error: "No logs found",
                message: "ไม่พบข้อมูลที่เกี่ยวกับ Log สำหรับ Drone ID นี้"
            });
        }

        res.json(response.data.items);

    } catch (error) {
        console.error("Server Error:", {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data
        });
        
        res.status(500).json({ 
            error: "Failed to fetch logs",
            details: error.response?.data || error.message,
            message: "มีข้อผิดพลาดเกิดขึ้นในการดึงข้อมูล Logs"
        });
    }
});

app.post("/logs", async (req, res) => { // Removed multer
    const { celsius, country = "Thailand", drone_id, drone_name } = req.body;

    if (!celsius || !drone_id || !drone_name) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const { data } = await axios.post(LOG_URL, {
            celsius,
            country,
            drone_id,
            drone_name
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${POCKETBASE_TOKEN}`
            }
        });
        
        res.status(201).json({
            message: "Insert complete",
            generated_data: data
        });
    } catch (error) {
        console.error("Error: ", error.message);
        res.status(500).json({ error: "Error handling the data" });
    }
});

module.exports = app;