require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const createConnectionPool = require('./database/connection');
const coverService = require('./services/coverService');

const app = express();
const PORT = process.env.PORT || 5000;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes'));
    }
});

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    req.upload = upload;
    next();
});

require('./routes/index')(app);

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando' });
});

app.get('/api/proxy-image', async (req, res) => {
    try {
        let imageUrl = req.query.url;
        if (!imageUrl) {
            return res.status(400).json({ error: 'URL requerida' });
        }

        if (!imageUrl.startsWith('http')) {
            imageUrl = 'https://' + imageUrl;
        }

        const allowedDomains = [
            'image.tmdb.org',
            'm.media-amazon.com',
            'covers.openlibrary.org',
            'media-amazon.com',
            'upload.wikimedia.org',
            'graphql.anilist.co',
            'imgix.metmuseum.org',
            'itunes.apple.com',
            'v2.sg.media-imdb.com',
            'media-1.rawg.io',
            'media.rawg.io',
            'steamuserimages-a.akamaihd.net',
            'cdn.akamai.steamstatic.com',
            'cdn.steamstatic.com',
            'store.steampowered.com'
        ];
        
        const urlObj = new URL(imageUrl);
        const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));
        
        if (!isAllowed) {
            return res.status(403).json({ error: 'Dominio no permitido' });
        }

        const response = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).json({ error: 'Error al obtener imagen' });
    }
});

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

async function startServer() {
    try {
        const pool = await createConnectionPool;
        console.log('Conectado a MySQL');
        
        await updateCovers();
        
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

async function updateCovers() {
    try {
        const db = await createConnectionPool;
        
        const [reviews] = await db.execute('SELECT id, media_type, media_title, cover FROM reviews WHERE cover IS NULL OR cover = ""');
        
        if (reviews.length === 0) {
            console.log('Todas las reviews ya tienen portada');
            return;
        }
        
        console.log(`Buscando portadas para ${reviews.length} reviews...`);
        
        for (const review of reviews) {
            console.log(`Buscando: ${review.media_title} (${review.media_type})`);
            
            const cover = await coverService.searchCover(review.media_type, review.media_title);
            
            if (cover) {
                await db.execute('UPDATE reviews SET cover = ? WHERE id = ?', [cover, review.id]);
                console.log(`  ✓ Portada encontrada`);
            } else {
                console.log(`  ✗ No encontrada`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        console.log('✓ Portadas actualizadas');
    } catch (error) {
        console.warn('Error actualizando portadas:', error.message);
    }
}

startServer();
