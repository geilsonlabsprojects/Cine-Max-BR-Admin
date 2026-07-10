/**
 * Service to interact with TMDB API.
 */

const TMDB_API_KEY = "184bf16ea3adb096d92e089bb1beea77";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/original";

/**
 * Searches for a movie or TV show on TMDB.
 * Falls back to English if Portuguese results are empty.
 */
export async function searchTMDB(query, type = 'movie') {
    const searchType = type === 'movie' ? 'movie' : 'tv';

    const fetchResults = async (lang) => {
        const langParam = lang ? `&language=${lang}` : '';
        const url = `${TMDB_BASE_URL}/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}${langParam}&include_adult=false`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 401) throw new Error("Chave de API inválida ou expirada");
            throw new Error(`Erro na API (${response.status})`);
        }

        const data = await response.json();
        return data.results || [];
    };

    try {
        // Try Portuguese
        let results = await fetchResults('pt-BR');

        // If no results, try without language (defaults to English)
        if (results.length === 0) {
            results = await fetchResults('');
        }

        return results;
    } catch (error) {
        console.error("TMDB Search Error:", error);
        throw error;
    }
}

/**
 * Gets detailed information for a specific item.
 */
export async function getTMDBDetails(id, type = 'movie') {
    const searchType = type === 'movie' ? 'movie' : 'tv';
    const append = type === 'movie' ? 'videos,credits,release_dates' : 'videos,credits,content_ratings';

    try {
        // Try Portuguese details
        let url = `${TMDB_BASE_URL}/${searchType}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=${append}`;
        let response = await fetch(url);
        let data = await response.json();

        // If data is very sparse (like missing overview or videos), try English and merge
        const enUrl = `${TMDB_BASE_URL}/${searchType}/${id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=${append}`;
        const enResponse = await fetch(enUrl);
        const enData = await enResponse.json();

        if (!data.overview) data.overview = enData.overview;

        // Combine video results from both languages to find the best trailer
        const allVideos = [
            ...(data.videos?.results || []),
            ...(enData.videos?.results || [])
        ];

        // Improved Trailer Selection Logic:
        // 1. Official Trailer in Portuguese
        // 2. Any Trailer in Portuguese
        // 3. Official Trailer in English
        // 4. Any Trailer in English
        // 5. Any Teaser/Clip as last resort
        const trailer =
            allVideos.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.iso_639_1 === 'pt') ||
            allVideos.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.name.toLowerCase().includes('dublado')) ||
            allVideos.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.official === true) ||
            allVideos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
            allVideos.find(v => (v.type === 'Teaser' || v.type === 'Clip') && v.site === 'YouTube');

        // Get director/cast
        const director = data.credits?.crew?.find(c => c.job === 'Director')?.name ||
                          enData.credits?.crew?.find(c => c.job === 'Director')?.name || "";
        const cast = (data.credits?.cast || enData.credits?.cast)?.slice(0, 5).map(c => c.name).join(", ") || "";

        // Format Duration
        let duration = "";
        const runtime = data.runtime || enData.runtime;
        if (type === 'movie' && runtime) {
            const h = Math.floor(runtime / 60);
            const m = runtime % 60;
            duration = h > 0 ? `${h}h ${m}min` : `${m}min`;
        } else if (type === 'tv' && (data.episode_run_time?.length || enData.episode_run_time?.length)) {
            const ert = data.episode_run_time?.[0] || enData.episode_run_time?.[0];
            duration = `${ert}min por ep`;
        }

        // Get Rating (BR)
        let rating = "L";
        const relDates = data.release_dates || enData.release_dates;
        const contRatings = data.content_ratings || enData.content_ratings;

        if (type === 'movie' && relDates) {
            const br = relDates.results.find(r => r.iso_3166_1 === 'BR');
            if (br && br.release_dates[0].certification) {
                rating = br.release_dates[0].certification;
            }
        } else if (type === 'tv' && contRatings) {
            const br = contRatings.results.find(r => r.iso_3166_1 === 'BR');
            if (br) rating = br.rating;
        }

        return {
            title: data.title || data.name || enData.title || enData.name,
            originalTitle: data.original_title || data.original_name || enData.original_title || enData.original_name,
            year: (data.release_date || data.first_air_date || enData.release_date || enData.first_air_date || "").split("-")[0],
            desc: data.overview || "Sem descrição disponível no momento.",
            poster: data.poster_path ? TMDB_IMAGE_BASE + data.poster_path : (enData.poster_path ? TMDB_IMAGE_BASE + enData.poster_path : null),
            banner: data.backdrop_path ? TMDB_IMAGE_BASE + data.backdrop_path : (enData.backdrop_path ? TMDB_IMAGE_BASE + enData.backdrop_path : null),
            genres: data.genres?.length ? data.genres.map(g => g.name).join(", ") : (enData.genres?.map(g => g.name).join(", ") || ""),
            director: director,
            cast: cast,
            duration: duration,
            rating: rating,
            trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "",
            studio: data.production_companies?.[0]?.name || enData.production_companies?.[0]?.name || "",
            distributor: data.production_companies?.[1]?.name || data.production_companies?.[0]?.name || enData.production_companies?.[1]?.name || ""
        };
    } catch (error) {
        console.error("TMDB Details Error:", error);
        return null;
    }
}
