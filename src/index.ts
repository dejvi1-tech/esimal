// Proxy endpoint for /api/esim/order
app.post('/api/esim/order', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api-dev.getroamify.com/api/esim/order',
      req.body,
      {
        headers: {
          'Authorization': 'Bearer WcDVM1wpHjmcSko6HNczNGiw3f3SWkSwhU2yt5iuYZEVk3ci6LMVyM8pucQ7mTzu1jib2dQXG1hWNw7zYc9pEsFT8R399sy3FPB7KeMXt3aNjSPHb4vxJN3oBjjH4LzrPhhs2sxFKeWQf8mVAUWnWHNm6LuQrc1wv3FK2EKrCkK9frqewL2fuocTyN',
          'Content-Type': 'application/json',
        },
      }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        message: 'Proxy error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}); 