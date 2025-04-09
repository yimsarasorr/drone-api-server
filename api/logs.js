import axios from 'axios';

const POCKETBASE_URL = 'https://app-tracking.pockethost.io/api/collections/drone_logs/records';

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    const droneId = req.query.drone_id;
    if (!droneId) return res.status(400).json({ error: 'Missing drone_id' });

    try {
      const response = await axios.get(POCKETBASE_URL, {
        params: {
          filter: `drone_id="${droneId}"`,
          sort: '-created',
          perPage: 25
        }
      });

      const logs = response.data.items.map(log => ({
        drone_id: log.drone_id,
        drone_name: log.drone_name,
        created: log.created,
        country: log.country,
        celsius: log.celsius
      }));

      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }

  } else if (method === 'POST') {
    const token = process.env.POCKETBASE_TOKEN; // Authorization token
    const { drone_id, drone_name, country, celsius } = req.body;

    if (!drone_id || !drone_name || !country || !celsius) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const result = await axios.post(POCKETBASE_URL, {
        drone_id, drone_name, country, celsius
      }, {
        headers: {
          Authorization: `Bearer ${token}`, // Add Authorization header
          'Content-Type': 'application/json'
        }
      });

      res.status(201).json(result.data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create log' });
    }

  } else {
    res.status(405).send('Method Not Allowed');
  }
}
