export default {
    async fetch(request, env) {
        return await handleRequest(request);
    },
};

async function handleRequest(request) {
    let url = new URL(request.url);
    const cacheUrl = new URL(request.url);
    cacheUrl.search = "";
    cacheUrl.protocol = "https:";
    const cache = caches.default;
    let response = await cache.match(cacheUrl);
    if (!response) {
        url.host = url.host.split(".")[0] + ".pixivsketch.net";
        let new_request_headers = new Headers(request.headers);

        let method = request.method;
        let body = request.body;

        new_request_headers.set("Host", url.host);
        new_request_headers.set("Referer", "https://sketch.pixiv.net");

        let new_request = new Request(url, request);
        if (url.pathname.endsWith("m3u8")) {
            let original_response = await fetch(new_request, {
                method: method,
                body: body,
                headers: new_request_headers,
            });
            response = new Response((await original_response.text()).replace(
                /pixivsketch.net/g,
                "pixivsketch.cf"
            ), original_response);
        } else {
            let original_response = await fetch(new_request, {
                cf: {
                    // Always cache this fetch regardless of content type
                    // for a max of 5 seconds before revalidating the resource
                    cacheTtl: 31536000,
                    cacheEverything: true,
                    cacheKey: cacheUrl.toString(),
                },
                headers: new_request_headers,
            });
            response = new Response(original_response.body, original_response);
            cache.put(cacheUrl, response.clone());
            console.log(`[MISS] Cache put for: ${cacheUrl}.`);
        }
    } else {
        console.log(`[HIT] Cache hit for: ${cacheUrl}.`);
    }
    return response;
}