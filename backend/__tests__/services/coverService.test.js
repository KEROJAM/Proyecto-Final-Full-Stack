const axios = require('axios');

jest.mock('axios');

const coverService = require('../../services/coverService');

describe('coverService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('searchCover', () => {
        it('should return null if title is empty', async () => {
            const result = await coverService.searchCover('movie', '');
            expect(result).toBeNull();
        });

        it('should return null if title is null', async () => {
            const result = await coverService.searchCover('movie', null);
            expect(result).toBeNull();
        });

        it('should call searchOMDB for movies', async () => {
            axios.get.mockResolvedValue({ data: { Poster: 'poster.jpg' } });

            const result = await coverService.searchCover('movie', 'Test Movie');

            expect(axios.get).toHaveBeenCalled();
        });

        it('should call searchOMDB for TV shows', async () => {
            axios.get.mockResolvedValue({ data: { Poster: 'poster.jpg' } });

            const result = await coverService.searchCover('tv', 'Test Show');

            expect(axios.get).toHaveBeenCalled();
        });

        it('should call searchSteam for games', async () => {
            axios.get.mockResolvedValue({ data: { items: [] } });

            const result = await coverService.searchCover('game', 'Test Game');

            expect(axios.get).toHaveBeenCalled();
        });

        it('should call searchOpenLibrary for books', async () => {
            axios.get.mockResolvedValue({ data: { docs: [] } });

            const result = await coverService.searchCover('book', 'Test Book');

            expect(axios.get).toHaveBeenCalled();
        });

        it('should call searchITunes for music', async () => {
            axios.get.mockResolvedValue({ data: { results: [] } });

            const result = await coverService.searchCover('music', 'Test Album');

            expect(axios.get).toHaveBeenCalled();
        });

        it('should call searchAniList for anime', async () => {
            axios.post.mockResolvedValue({ data: { data: { anime: { results: [] } } } });

            const result = await coverService.searchCover('anime', 'Test Anime');

            expect(axios.post).toHaveBeenCalled();
        });

        it('should return null for unknown media type', async () => {
            const result = await coverService.searchCover('unknown', 'Test');
            expect(result).toBeNull();
        });
    });

    describe('searchOMDB', () => {
        it('should return poster from OMDB', async () => {
            axios.get
                .mockResolvedValueOnce({ data: { Poster: 'poster.jpg' } })
                .mockResolvedValueOnce({ data: { d: [] } });

            const result = await coverService.searchOMDB('movie', 'Test Movie');

            expect(result).toBe('poster.jpg');
        });

        it('should return null if no poster found', async () => {
            axios.get
                .mockResolvedValueOnce({ data: { Poster: 'N/A' } })
                .mockResolvedValueOnce({ data: { d: [] } });

            const result = await coverService.searchOMDB('movie', 'Test Movie');

            expect(result).toBeNull();
        });

        it('should return null if both OMDB and fallback fail', async () => {
            axios.get
                .mockResolvedValueOnce({ data: { Poster: 'N/A' } })
                .mockResolvedValueOnce({ data: { d: [] } });

            const result = await coverService.searchOMDB('movie', 'Test Movie');

            expect(result).toBeNull();
        });
    });

    describe('searchSteam', () => {
        it('should return null if no results', async () => {
            axios.get.mockResolvedValue({ data: { items: [] } });

            const result = await coverService.searchSteam('Unknown Game');

            expect(result).toBeNull();
        });
    });

    describe('searchOpenLibrary', () => {
        it('should return cover from OpenLibrary', async () => {
            axios.get.mockResolvedValue({
                data: {
                    docs: [{ cover_i: 12345 }]
                }
            });

            const result = await coverService.searchOpenLibrary('Test Book');

            expect(result).toBe('https://covers.openlibrary.org/b/id/12345-L.jpg');
        });

        it('should return null if no results', async () => {
            axios.get.mockResolvedValue({ data: { docs: [] } });

            const result = await coverService.searchOpenLibrary('Unknown Book');

            expect(result).toBeNull();
        });
    });

    describe('searchITunes', () => {
        it('should return artwork from iTunes', async () => {
            axios.get.mockResolvedValue({
                data: {
                    results: [{ artworkUrl100: 'http://example.com/100x100.jpg' }]
                }
            });

            const result = await coverService.searchITunes('Test Album');

            expect(result).toBe('http://example.com/600x600.jpg');
        });

        it('should return null if no results', async () => {
            axios.get.mockResolvedValue({ data: { results: [] } });

            const result = await coverService.searchITunes('Unknown Album');

            expect(result).toBeNull();
        });
    });

    describe('searchAniList', () => {
        it('should return cover from AniList', async () => {
            axios.post.mockResolvedValue({
                data: {
                    data: {
                        anime: {
                            results: [
                                { coverImage: { large: 'large.jpg', medium: 'medium.jpg' } }
                            ]
                        }
                    }
                }
            });

            const result = await coverService.searchAniList('Test Anime');

            expect(result).toBe('large.jpg');
        });

        it('should return null if no results', async () => {
            axios.post.mockResolvedValue({
                data: { data: { anime: { results: [] } } }
            });

            const result = await coverService.searchAniList('Unknown Anime');

            expect(result).toBeNull();
        });
    });

    describe('searchGoogleBooks', () => {
        it('should return thumbnail from Google Books', async () => {
            axios.get.mockResolvedValue({
                data: {
                    items: [
                        {
                            volumeInfo: {
                                imageLinks: { thumbnail: 'http://example.com/thumb.jpg' }
                            }
                        }
                    ]
                }
            });

            const result = await coverService.searchGoogleBooks('Test Book');

            expect(result).toBe('https://example.com/thumb.jpg');
        });

        it('should return null if no results', async () => {
            axios.get.mockResolvedValue({ data: {} });

            const result = await coverService.searchGoogleBooks('Unknown Book');

            expect(result).toBeNull();
        });
    });

    describe('searchGenius', () => {
        it('should return artwork from Genius', async () => {
            axios.get.mockResolvedValue({
                data: {
                    response: {
                        hits: [
                            {
                                result: {
                                    song_art_image_thumbnail_url: 'thumb.jpg',
                                    song_art_image_url: 'full.jpg'
                                }
                            }
                        ]
                    }
                }
            });

            const result = await coverService.searchGenius('Test Song');

            expect(result).toBe('thumb.jpg');
        });

        it('should return null if no results', async () => {
            axios.get.mockResolvedValue({ data: { response: { hits: [] } } });

            const result = await coverService.searchGenius('Unknown Song');

            expect(result).toBeNull();
        });
    });
});
