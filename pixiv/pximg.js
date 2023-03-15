async function handleRequest(request, ctx) {
    let url = new URL(request.url);
    const cacheUrl = new URL(request.url);
    cacheUrl.search = '';
    cacheUrl.protocol = 'https:';

    const cache = caches.default;

    // Check whether the value is already available in the cache
    // if not, you will need to fetch it from origin, and store it in the cache
    let response = await cache.match(cacheUrl);
    if (!response) {
        url.hostname = url.hostname.split('.')[0] + '.pximg.net';
        url.protocol = 'http:';
        let new_request_headers = new Headers(request.headers);

        new_request_headers.set('Host', url.hostname);
        new_request_headers.set('Referer', 'https://www.pixiv.net/');
        let new_request = new Request(url, request);

        response = await fetch(new_request, {
            cf: {
                // Always cache this fetch regardless of content type
                // for a max of 5 seconds before revalidating the resource
                cacheTtl: 31536000,
                cacheEverything: true,
            },
            headers: new_request_headers
        })
        response = new Response(response.body, response);
        response.headers.append('Cache-Control', 's-maxage=31536000');
        ctx.waitUntil(cache.put(cacheUrl, response.clone()));
    } else {
        console.log(`Cache hit for: ${request.url}.`);
    }
    return response;
}

export default {
    async fetch(request, env, ctx) {
        return await handleRequest(request, ctx)
    }
}