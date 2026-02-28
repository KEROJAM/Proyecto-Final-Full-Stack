const axios = require('axios');

const COVER_API_KEY = process.env.OMDB_API_KEY || '4a3b711b';

const coverService = {
    async searchCover(mediaType, title) {
        if (!title) return null;

        try {
            switch (mediaType) {
                case 'movie':
                    return await this.searchOMDB('movie', title);
                case 'tv':
                    return await this.searchOMDB('tv', title);
                case 'game':
                    return await this.searchSteam(title);
                case 'book':
                    return await this.searchOpenLibrary(title) || await this.searchGoogleBooks(title);
                case 'music':
                    return await this.searchITunes(title) || await this.searchGenius(title);
                case 'anime':
                    return await this.searchAniList(title) || await this.searchKitsu(title);
                default:
                    return null;
            }
        } catch (error) {
            console.warn('Error searching cover:', error.message);
            return null;
        }
    },

    async searchRAWG(title) {
        try {
            const apiKey = process.env.RAWG_API_KEY || 'a5915d0a1f0a4d5a9c0f0c7c9c5c5c5';
            const response = await axios.get(`https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(title)}&page_size=1`, { timeout: 15000 });
            
            if (response.data && response.data.results && response.data.results.length > 0) {
                const game = response.data.results[0];
                const gameName = game.name.toLowerCase().replace(/\s+/g, '-');
                
                try {
                    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(game.name)}&l=english&cc=US`;
                    const steamResponse = await axios.get(searchUrl, { timeout: 10000 });
                    if (steamResponse.data && steamResponse.data.items && steamResponse.data.items.length > 0) {
                        const appId = steamResponse.data.items[0].id;
                        return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
                    }
                } catch (e) {
                    console.warn('Steam lookup error:', e.message);
                }
                
                return game.background_image || null;
            }
        } catch (error) {
            console.warn('RAWG error:', error.message);
        }
        
        return null;
    },

    async searchSteam(title) {
        const gameNames = [title];
        
        if (title.toLowerCase().includes('stardew')) {
            gameNames.push('stardew valley');
        }
        if (title.toLowerCase().includes('elden')) {
            gameNames.push('elden ring');
        }
        
        for (const name of gameNames) {
            try {
                const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(name)}&l=english&cc=US`;
                const response = await axios.get(searchUrl, { timeout: 15000 });
                
                if (response.data && response.data.items && response.data.items.length > 0) {
                    const item = response.data.items[0];
                    const appId = item.id;
                    if (appId) {
                        return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
                    }
                    return item.tiny_image || item.header_image || null;
                }
            } catch (error) {
                console.warn(`Steam store error for "${name}":`, error.message);
            }
        }
        
        return null;
    },

    async searchOpenLibrary(title) {
        try {
            const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=1`, { timeout: 10000 });
            
            if (response.data && response.data.docs && response.data.docs.length > 0) {
                const book = response.data.docs[0];
                if (book.cover_i) {
                    return `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
                }
            }
        } catch (error) {
            console.warn('OpenLibrary error:', error.message);
        }
        return null;
    },

    async searchITunes(title) {
        try {
            const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=music&entity=album&limit=1`, { timeout: 10000 });
            
            if (response.data && response.data.results && response.data.results.length > 0) {
                return response.data.results[0].artworkUrl100?.replace('100x100', '600x600') || null;
            }
        } catch (error) {
            console.warn('iTunes error:', error.message);
        }
        return null;
    },

    async searchOMDB(mediaType, title) {
        const titleMappings = {
            'dune 2': 'dune part two',
            'dune part two': 'dune part two',
            'oppenheimer': 'oppenheimer'
        };
        
        let searchTitle = title.toLowerCase().trim();
        if (titleMappings[searchTitle]) {
            searchTitle = titleMappings[searchTitle];
        }
        
        try {
            const type = mediaType === 'tv' ? 'series' : 'movie';
            const response = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(searchTitle)}&type=${type}&apikey=${COVER_API_KEY}`, { timeout: 10000 });
            if (response.data && response.data.Poster && response.data.Poster !== 'N/A') {
                return response.data.Poster;
            }
        } catch (error) {
            console.warn('OMDB error:', error.message);
        }
        
        try {
            const searchUrl = `https://v2.sg.media-imdb.com/suggestion/${encodeURIComponent(searchTitle.charAt(0).toLowerCase())}/${encodeURIComponent(searchTitle)}.json`;
            const response = await axios.get(searchUrl, { timeout: 10000 });
            if (response.data && response.data.d && response.data.d.length > 0) {
                const result = response.data.d.find(item => item.q === 'feature' || item.q === 'TV series');
                if (result && result.i) {
                    return result.i.imageUrl;
                }
            }
        } catch (error) {
            console.warn('IMDB suggestion error:', error.message);
        }
        
        return null;
    },

    async searchAniList(title) {
        try {
            const query = `
                query ($search: String) {
                    anime: Page(perPage: 1) {
                        results: media(search: $search, type: ANIME) {
                            coverImage {
                                large
                                medium
                            }
                        }
                    }
                }
            `;

            const response = await axios.post('https://graphql.anilist.co', 
                { query, variables: { search: title } },
                { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
            );

            if (response.data && response.data.data && response.data.data.anime && response.data.data.anime.results && response.data.data.anime.results.length > 0) {
                const anime = response.data.data.anime.results[0];
                return anime.coverImage.large || anime.coverImage.medium || null;
            }
        } catch (error) {
            console.warn('AniList error:', error.message);
        }
        return null;
    },

    async searchSteamStore(title) {
        try {
            const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`;
            const response = await axios.get(searchUrl, { timeout: 10000 });
            
            if (response.data && response.data.items && response.data.items.length > 0) {
                const item = response.data.items[0];
                return item.tiny_image || item.header_image || null;
            }
        } catch (error) {
            console.warn('Steam store error:', error.message);
        }
        
        return null;
    },

    async searchGoogleBooks(title) {
        try {
            const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=1`);
            if (response.data && response.data.items && response.data.items.length > 0) {
                const book = response.data.items[0].volumeInfo;
                return book.imageLinks?.thumbnail?.replace('http:', 'https:') || null;
            }
        } catch (error) {
            console.warn('Google Books error:', error.message);
        }
        return null;
    },

    async searchSpotify(title) {
        try {
            const clientId = process.env.SPOTIFY_CLIENT_ID;
            const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

            if (!clientId || !clientSecret) {
                return this.searchGenius(title);
            }

            const authResponse = await axios.post('https://accounts.spotify.com/api/token', 
                new URLSearchParams({ grant_type: 'client_credentials' }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
                    }
                }
            );

            const searchResponse = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(title)}&type=album&limit=1`, {
                headers: { 'Authorization': `Bearer ${authResponse.data.access_token}` }
            });

            if (searchResponse.data && searchResponse.data.albums && searchResponse.data.albums.items.length > 0) {
                return searchResponse.data.albums.items[0].images[0]?.url || null;
            }
        } catch (error) {
            console.warn('Spotify error:', error.message);
        }
        return this.searchGenius(title);
    },

    async searchGenius(title) {
        try {
            const accessToken = process.env.GENIUS_ACCESS_TOKEN || 'qU3W2V1xGv_yJK44kh5d_4n5iG-7tKV0O1qT5rYc4oM';
            
            const response = await axios.get(`https://api.genius.com/search?q=${encodeURIComponent(title)}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                timeout: 10000
            });

            if (response.data && response.data.response && response.data.response.hits && response.data.response.hits.length > 0) {
                const song = response.data.response.hits[0].result;
                return song.song_art_image_thumbnail_url || song.song_art_image_url || null;
            }
        } catch (error) {
            console.warn('Genius error:', error.message);
        }
        return null;
    }
};

module.exports = coverService;
