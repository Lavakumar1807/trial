const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const s3Client = require('./storjClient'); 

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middlewares
app.use(bodyParser.json());
app.use(cors());

const BUCKET_NAME = 'task2'; 
const BASE_FOLDER = 'base/'; 

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('update-frameworks', (frameworks) => {
        io.emit('frameworks-updated', frameworks);
    });

    socket.on('code-updated', (updatedFile) => {
        io.emit('file-updated', updatedFile); 
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});



app.get('/frameworks', async (req, res) => {
    try {
        const data = await s3Client.listObjectsV2({ Bucket: BUCKET_NAME, Prefix: BASE_FOLDER, Delimiter: '/' }).promise();
        const frameworks = data.CommonPrefixes.map((prefix) => prefix.Prefix.split('/')[1]);
        res.status(200).json(frameworks);
    } catch (error) {
        console.error('Error fetching frameworks:', error);
        res.status(500).json({ error: 'Failed to fetch frameworks.' });
    }
});


app.get('/framework/:name', async (req, res) => {
    const framework = req.params.name;

    try {
        const data = await s3Client.listObjectsV2({ Bucket: BUCKET_NAME, Prefix: `base/${framework}/` }).promise();
        if (!data.Contents.length) {
            return res.status(404).json({ error: 'Framework not found.' });
        }

        const files = data.Contents.map((file) => ({
            key: file.Key,
            size: file.Size,
        }));
        res.status(200).json(files);
    } catch (error) {
        console.error('Error retrieving framework files:', error);
        res.status(500).json({ error: 'Failed to retrieve framework files.' });
    }
});

app.get('/file', async (req, res) => {
    const { key } = req.query;

    if (!key) {
        return res.status(400).json({ error: 'File key is required.' });
    }

    try {
        const params = { Bucket: BUCKET_NAME, Key: key };
        const data = await s3Client.getObject(params).promise();
        res.status(200).send(data.Body.toString('utf-8'));
    } catch (error) {
        console.error('Error retrieving file content:', error);
        res.status(500).json({ error: 'Failed to retrieve file content.' });
    }
});


app.get('/', (req, res) => {
    res.send('Server for Task 1 is running!');
});


server.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
