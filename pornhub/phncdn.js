const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Max-Age": "31536000",
}

let CACHE

const get_key_from_url = async (url) => {
    let sp = url.pathname.split('/').pop()
    let key = url.hostname + url.pathname.replace('/' + sp, '').replace('.urlset', '');
    return key;
}

const save_url = async (url) => {
    let key = await get_key_from_url(url);
    let v = await get_search_metadata(url)
    if (v.value && v.metadata.timestamp + 5400 < Date.now() / 1000) {
        await delete_key(url);
    }
    else if (v.value) {
        return
    }
    let value = url.search;
    let ttl = url.searchParams.get('ttl') ? url.searchParams.get('ttl') : url.searchParams.get('validto');
    let options = {
        metadata: {
            timestamp: Date.now() / 1000
        },
        expiration: ttl ? ttl : parseInt(Date.now() / 1000) + 3600
    };
    return await CACHE.put(key, value, options);
}

const delete_key = async (url) => {
    let key = await get_key_from_url(url);
    await CACHE.delete(key);
}

const get_search = async (url) => {
    let key = await get_key_from_url(url);
    let value = await CACHE.get(key, { cacheTtl: 3600 });
    if (value) {
        return value;
    }
    else {
        return false;
    }
}

const get_search_metadata = async (url) => {
    let key = await get_key_from_url(url);
    let value = await CACHE.getWithMetadata(key, { cacheTtl: 7200 });
    console.log(value);
    if (value) {
        return value;
    }
    else {
        return false;
    }
}


async function handleRequest(request, ctx) {
    if (request.method === 'OPTIONS') {
        let headers = request.headers;
        if (
            headers.get("Origin") !== null &&
            headers.get("Access-Control-Request-Method") !== null &&
            headers.get("Access-Control-Request-Headers") !== null
        ) {
            // Handle CORS pre-flight request.
            // If you want to check or reject the requested method + headers
            // you can do that here.
            let respHeaders = {
                ...corsHeaders,
                // Allow all future content Request headers to go back to browser
                // such as Authorization (Bearer) or X-Client-Name-Version
                "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers"),
            }

            return new Response(null, {
                headers: respHeaders,
            })
        }
        else {
            // Handle standard OPTIONS request.
            // If you want to allow other HTTP Methods, you can do that here.
            return new Response(null, {
                headers: {
                    Allow: "GET, HEAD, POST, OPTIONS",
                },
            })
        }
    }
    let url = new URL(request.url);
    const cacheUrl = new URL(request.url);
    cacheUrl.search = '';

    const cache = caches.default;

    // Check whether the value is already available in the cache
    // if not, you will need to fetch it from origin, and store it in the cache
    let response = await cache.match(cacheUrl);
    if (!response) {
        url.hostname = url.hostname.split('.')[0] + '.phncdn.com';

        let new_request_headers = new Headers(request.headers);

        new_request_headers.set('Host', url.hostname);
        new_request_headers.set('origin', url.hostname);
        new_request_headers.set('Referer', new_request_headers.get('Referer') ? new_request_headers.get('Referer').replace('pornhubc.cf', 'pornhub.com') : "https://www.pornhub.com");
        console.log(url);
        let new_request = new Request(url, request);

        response =  await fetch(new_request, {
            cf: {
                // Always cache this fetch regardless of content type
                // for a max of 5 seconds before revalidating the resource
                cacheTtl: 31536000,
                cacheEverything: true,
                cacheKey: cacheUrl.toString(),
            },
            headers: new_request_headers
        })
        if ((response.status >= 200 && response.status < 300) || response.status == 304) {
            response = new Response(response.body, response);
            response.headers.append('Cache-Control', 's-maxage=31536000');
            ctx.waitUntil(cache.put(cacheUrl, response.clone()));
            console.log(`[MISS] Cache put for: ${cacheUrl}.`);
        }
        else {
            console.log(`[ERROR] Response is not ok.`);
        }
        let log_headers = []
        response.headers.forEach((value, key) => {
            log_headers.push(`${key}: ${value}`);
        });
        console.log(...log_headers, response.status);
    } else {
        console.log(`[HIT] Cache hit for: ${cacheUrl}.`);
    }

    // if (url.pathname.endsWith('master.m3u8')) {
    //     await save_url(url);
    // }
    // else if (url.pathname.startsWith('/hls/videos')) {
    //     let search = await get_search(url);
    //     if (search) {
    //         url.search = search;
    //     }
    //     else {
    //         return new Response(null, { status: 404 });
    //     }
    // }

    return response;
}

export default {
    async fetch(request, env, ctx) {
        CACHE = env.CACHE
        return await handleRequest(request, ctx)
    }
}
