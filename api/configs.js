import axios from 'axios';

export default async function handler(req, res) {
  const { method, url } = req;
  const droneId = url.split('/').pop();
  if (method !== 'GET') return res.status(405).send('Method Not Allowed');

  try {
    const response = await axios.get('https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_E_T_2IasrAJK4aeo5XoONiaA/exec');
    const drone = response.data.find(d => d.drone_id == droneId);
    if (!drone) return res.status(404).json({ error: 'Drone not found' });

    const { drone_id, drone_name, light, country, weight } = drone;
    res.json({ drone_id, drone_name, light, country, weight });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drone config' });
  }
}
