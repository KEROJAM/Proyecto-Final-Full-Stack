// Cargar variables de entorno (solo si no están ya cargadas)
if (!process.env.DATABASE_URL && !process.env.VERCEL) {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const createConnectionPool = require('./database/connection');
const coverService = require('./services/coverService');
const { runMigrations } = require('./database/migrations');

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

app.get('/api/debug/jwt', (req, res) => {
    const crypto = require('crypto');
    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex').substring(0, 8);
    const hasCustomSecret = !!process.env.JWT_SECRET;
    
    res.json({
        jwt_configured: hasCustomSecret,
        jwt_secret_hash: secretHash,
        message: hasCustomSecret ? 'JWT_SECRET está configurado en vars de entorno' : 'USANDO VALOR POR DEFECTO - debes configurar JWT_SECRET en Vercel'
    });
});

app.post('/api/debug/verify-token', (req, res) => {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
    const token = req.headers.authorization?.startsWith('Bearer ') 
        ? req.headers.authorization.substring(7)
        : null;
    
    if (!token) {
        return res.status(400).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
            valid: true,
            decoded,
            jwt_secret_hash: require('crypto').createHash('sha256').update(JWT_SECRET).digest('hex').substring(0, 8)
        });
    } catch (error) {
        res.status(401).json({
            valid: false,
            error: error.message,
            error_name: error.name,
            jwt_secret_hash: require('crypto').createHash('sha256').update(JWT_SECRET).digest('hex').substring(0, 8)
        });
    }
});

app.post('/api/debug/jwt-status', (req, res) => {
    const crypto = require('crypto');
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
    const token = req.headers.authorization?.startsWith('Bearer ') 
        ? req.headers.authorization.substring(7)
        : req.body?.token;
    
    const secretHash = crypto.createHash('sha256').update(JWT_SECRET).digest('hex').substring(0, 8);
    const hasCustomSecret = !!process.env.JWT_SECRET;
    
    let tokenAnalysis = null;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            tokenAnalysis = {
                valid: true,
                decoded: decoded,
                expiresAt: new Date(decoded.exp * 1000)
            };
        } catch (error) {
            tokenAnalysis = {
                valid: false,
                error: error.message,
                errorName: error.name
            };
        }
    }
    
    res.json({
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL,
            DEBUG_AUTH: process.env.DEBUG_AUTH
        },
        jwt_secret: {
            configured: hasCustomSecret,
            hash: secretHash,
            defaultUsed: !hasCustomSecret
        },
        token_analysis: tokenAnalysis,
        available_env_vars: Object.keys(process.env).filter(k => k.includes('JWT') || k.includes('SECRET') || k.includes('DB'))
    });
});

app.get('/api/health', async (req, res) => {
    try {
        console.log('[HEALTH CHECK] ========== INICIANDO ==========');
        const pool = await createConnectionPool();
        let dbStatus = 'disconnected';
        let reviewCount = 0;
        let reviewsWithCovers = 0;
        let reviewsWithoutCovers = 0;
        let reviewsData = [];
        let dbError = null;
        
        console.log('[HEALTH CHECK] Pool obtenido:', !!pool);
        
        if (pool) {
            try {
                console.log('[HEALTH CHECK] Intentando query de conteo...');
                const countResult = await pool.query('SELECT COUNT(*) as count FROM reviews');
                reviewCount = parseInt(countResult.rows[0]?.count) || 0;
                console.log('[HEALTH CHECK] Total de reviews:', reviewCount);
                
                console.log('[HEALTH CHECK] Obteniendo detalles de reviews...');
                const detailsResult = await pool.query(
                    'SELECT id, media_title, cover FROM reviews ORDER BY id LIMIT 20'
                );
                reviewsData = detailsResult.rows;
                
                reviewsWithCovers = reviewsData.filter(r => r.cover).length;
                reviewsWithoutCovers = reviewsData.filter(r => !r.cover).length;
                
                console.log('[HEALTH CHECK] Reviews con covers:', reviewsWithCovers);
                console.log('[HEALTH CHECK] Reviews sin covers:', reviewsWithoutCovers);
                
                reviewsData.forEach((review, idx) => {
                    console.log(`[HEALTH CHECK] Review ${idx + 1}:`, {
                        id: review.id,
                        title: review.media_title,
                        hasCover: !!review.cover,
                        coverUrl: review.cover ? review.cover.substring(0, 60) + '...' : 'NULL'
                    });
                });
                
                dbStatus = 'connected';
                console.log('[HEALTH CHECK] Query exitosa');
            } catch (queryError) {
                console.error('[HEALTH CHECK] Error en query:', queryError.message);
                console.error('[HEALTH CHECK] Query error stack:', queryError.stack);
                dbStatus = 'error: ' + queryError.message;
            }
        } else {
            console.log('[HEALTH CHECK] Pool es null');
            dbStatus = 'pool_null';
        }
        
        console.log('[HEALTH CHECK] ========== RESPONDIENDO ==========');
        res.json({ 
            status: 'ok', 
            message: 'Servidor funcionando',
            database: dbStatus,
            reviewCount: reviewCount,
            reviewsWithCovers: reviewsWithCovers,
            reviewsWithoutCovers: reviewsWithoutCovers,
            sampleReviews: reviewsData.map(r => ({
                id: r.id,
                title: r.media_title,
                hasCover: !!r.cover,
                coverLength: r.cover ? r.cover.length : 0,
                coverDomain: r.cover ? new URL(r.cover).hostname : null
            })),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[HEALTH CHECK] Error general:', error.message);
        console.error('[HEALTH CHECK] Error stack:', error.stack);
        res.status(500).json({ 
            status: 'error', 
            message: error.message,
            database: 'failed',
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/proxy-image', async (req, res) => {
    try {
        let imageUrl = req.query.url;
        console.log('[PROXY] Solicitud de imagen:', imageUrl ? imageUrl.substring(0, 50) + '...' : 'sin URL');
        
        if (!imageUrl) {
            console.log('[PROXY] Error: URL requerida');
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
            'images-na.ssl-images-amazon.com',
            'upload.wikimedia.org',
            'graphql.anilist.co',
            'cdn.anilist.co',
            'image.api.nintendo.com',
            'imgix.metmuseum.org',
            'itunes.apple.com',
            'is1-ssl.mzstatic.com',
            'is2-ssl.mzstatic.com',
            'is3-ssl.mzstatic.com',
            'is4-ssl.mzstatic.com',
            'is5-ssl.mzstatic.com',
            'v2.sg.media-imdb.com',
            'media-1.rawg.io',
            'media.rawg.io',
            'steamuserimages-a.akamaihd.net',
            'cdn.akamai.steamstatic.com',
            'cdn.steamstatic.com',
            'store.steampowered.com',
            'genius.com',
            'images.genius.com'
        ];
        
        const urlObj = new URL(imageUrl);
        const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));
        
        console.log('[PROXY] Hostname:', urlObj.hostname, '- Permitido:', isAllowed);
        
        if (!isAllowed) {
            console.log('[PROXY] Dominio no permitido:', urlObj.hostname);
            return res.status(403).json({ error: 'Dominio no permitido' });
        }

        console.log('[PROXY] Descargando imagen...');
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
        console.log('[PROXY] Imagen descargada exitosamente - Content-Type:', contentType);
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(response.data);
    } catch (error) {
        console.error('[PROXY] Error:', error.message);
        console.error('[PROXY] Stack:', error.stack);
        res.status(500).json({ error: 'Error al obtener imagen', details: error.message });
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
    res.status(404).json({ error: 'Ruta no encontrada' });
});

async function startServer() {
    try {
        await createConnectionPool();
        console.log('Iniciando servidor...');
        
        // Ejecutar migraciones
        console.log('✓ Ejecutando migraciones de BD...');
        try {
            await runMigrations();
        } catch (migrationError) {
            console.warn('⚠️  Advertencia en migraciones:', migrationError.message);
        }
        
        const isVercel = process.env.VERCEL === '1';
        
        if (!isVercel) {
            await updateCovers();
        }
        
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
        app.listen(PORT, () => {
            console.log(`Servidor corriendo (sin DB) en http://localhost:${PORT}`);
        });
    }
}

async function updateCovers() {
    try {
        const db = await createConnectionPool();
        
        const reviews = await db.query('SELECT id, media_type, media_title, cover FROM reviews WHERE cover IS NULL OR cover = \'\'');
        
        if (reviews.rows.length === 0) {
            console.log('Todas las reviews ya tienen portada');
            return;
        }
        
        console.log(`Buscando portadas para ${reviews.rows.length} reviews...`);
        
        for (const review of reviews.rows) {
            console.log(`Buscando: ${review.media_title} (${review.media_type})`);
            
            const cover = await coverService.searchCover(review.media_type, review.media_title);
            
            if (cover) {
                await db.query('UPDATE reviews SET cover = $1 WHERE id = $2', [cover, review.id]);
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

const isVercel = process.env.VERCEL === '1';

if (isVercel) {
    module.exports = app;
    module.exports.getApp = app;
} else {
    startServer();
}
