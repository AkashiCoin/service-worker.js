const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Max-Age": "31536000",
}

let CACHE

const get_key_from_url = async (url) => {
    let key = url.pathname.split('.urlset')[0]
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
    let options = {
        metadata: {
            timestamp: Date.now() / 1000
        },
        expirationTtl: 7200
    };
    await CACHE.put(key, value, options);
}

const delete_key = async (url) => {
    let key = await get_key_from_url(url);
    await CACHE.delete(key);
}

const get_search = async (url) => {
    let key = await get_key_from_url(url);
    let value = await CACHE.get(key);
    if (value) {
        return value;
    }
    else {
        return false;
    }
}

const get_search_metadata = async (url) => {
    let key = await get_key_from_url(url);
    let value = await CACHE.getWithMetadata(key);
    console.log(value);
    if (value) {
        return value;
    }
    else {
        return false;
    }
}


async function handleRequest(request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                ...corsHeaders,
                "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers"),
            }
        })
    }
    let url = new URL(request.url);
    if (url.pathname.endsWith('master.m3u8')) {
        await save_url(url);
    }
    else if (url.pathname.search('.urlset') > 0) {
        let search = await get_search(url);
        if (search) {
            url.search = search;
        }
        else {
            return new Response(null, { status: 404 });
        }
    }
    url.hostname = url.hostname.split('.')[0] + '.phncdn.com';
    let new_request_headers = new Headers(request.headers);
    console.log(new_request_headers);

    new_request_headers.set('Host', url.hostname);
    new_request_headers.set('origin', url.hostname);
    new_request_headers.set('Referer', new_request_headers.get('Referer') ? new_request_headers.get('Referer').replace('pornhubc.cf', 'pornhub.com') : "https://www.pornhub.com");
    console.log(url);
    let new_request = new Request(url, request);

    const someCustomKey = `https://${url.hostname}${url.pathname}`;
    return await fetch(new_request, {
        cf: {
            // Always cache this fetch regardless of content type
            // for a max of 5 seconds before revalidating the resource
            cacheTtl: 31536000,
            cacheEverything: true,
            //Enterprise only feature, see Cache API for other plans
            cacheKey: someCustomKey,
            cacheTtlByStatus: {
                "200-299": 31536000
            }
        },
        headers: new_request_headers
    })
}

export default {
    async fetch(request, env) {
        CACHE = env.CACHE
        return await handleRequest(request)
    }
}
