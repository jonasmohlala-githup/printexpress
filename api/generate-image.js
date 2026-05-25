const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  const API_KEY = process.env.KIE_API_KEY;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'KIE_API_KEY not configured' });
  }

  try {
    const createRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nano-banana-2',
        input: {
          prompt,
          resolution: '2K',
          aspect_ratio: '16:9',
          output_format: 'jpg',
        },
      }),
    });

    const createData = await createRes.json();
    const taskId = createData?.data?.taskId || createData?.taskId;

    if (!createRes.ok || !taskId) {
      return res.status(502).json({ error: 'Failed to create task', detail: createData });
    }

    const maxAttempts = 40;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 3000));

      const pollRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` },
      });

      const pollData = await pollRes.json();
      const taskData = pollData?.data;
      if (!taskData) continue;

      if (taskData.state === 'success') {
        let imageUrl = null;
        try {
          const result = JSON.parse(taskData.resultJson);
          imageUrl = result?.resultUrls?.[0];
        } catch (_) {}

        if (!imageUrl) {
          return res.status(502).json({ error: 'Task succeeded but no image URL found', detail: taskData });
        }
        return res.json({ imageUrl });
      }

      if (taskData.state === 'failed') {
        return res.status(502).json({ error: 'Image generation failed', detail: taskData });
      }
    }

    res.status(504).json({ error: 'Timed out waiting for image generation' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
