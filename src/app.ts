import express from 'express';
const app = express();

app.use(express.json());

app.get('/status', (_, res) => {
    res.json({
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
