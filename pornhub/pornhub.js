const config = {
    pornhub_domain: 'pornhubc.cf',
    phncdn_domain: 'phncdn.cf',
}

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Max-Age": "31536000",
}

async function sw() {
    return new Response(`// service-worker.js
    let replace_domains = {
        'pornhub.com': 'pornhubc.cf',
        'phncdn.com': 'phncdn.cf',
    }
    
    let block_url = [
        '/_xa/ads',
        'static.trafficjunky.com',
        'www.google',
        'hubt.pornhub',
        'etahub.com',
    ]
    
    self.addEventListener('install', () => {
        self.skipWaiting()
    })
    
    self.addEventListener('activate', event => {
        event.waitUntil(self.clients.claim())
    })
    
    self.onfetch = event => {
        let url = new URL(event.request.url)
        for (let i = 0; i < block_url.length; i++) {
            if (url.href.search(block_url[i]) !== -1) {
                return event.respondWith(new Response(null, {status: 204}))
            }
        }
        for (let domain in replace_domains) {
            if (url.hostname.endsWith(domain)) {
                url.hostname = url.hostname.replace(domain, replace_domains[domain])
                let request = new Request(url.href, event.request)
                return event.respondWith(fetch(request))
            }
        }
    }`, {
        cf: {
            minify: { javascript: true, css: true, html: true },
        },
        headers: {
            ...corsHeaders,
            "content-type": "application/javascript"
        }
    });
}

async function handleRequest(request) {
    let url = new URL(request.url);
    let origin = url.hostname;
    if (url.pathname.endsWith('sw.js')) {
        return await sw();
    }

    console.log(url);
    url.host = url.host.split('.')[0] + '.pornhub.com';
    let new_request_headers = new Headers(request.headers);

    let response = null;
    let res_body = null;

    let method = request.method;
    let body = request.body;

    new_request_headers.set('Host', url.hostname);
    new_request_headers.set('Origin', url.hostname);
    new_request_headers.set('Referer', 'https://wwww.pornhub.com');

    let original_response = await fetch(url.href, {
        cf: {
            minify: { javascript: true, css: true, html: true },
        },
        method: method,
        body: body,
        headers: new_request_headers
    })

    if (!url.hostname.startsWith('hubt') && original_response.headers.get('content-type').startsWith('text/html')) {
        res_body = await original_response.text();
        res_body = res_body.replace(/pornhub.com/g, config.pornhub_domain);
        res_body = res_body.replace(/phncdn.com/g, config.phncdn_domain);
        res_body = res_body.replace(/!func.isInWhitelist\(\)/g, 'false');
        // res_body = res_body.replace(/static.trafficjunky/g, 'block_trafficjunky');
        // res_body = res_body.replace(/www.etahub/g, 'block_etahub');
        // res_body = res_body.replace(/js_error.php/g, 'block_js_error');
        // res_body = res_body.replace(/www.google/g, 'block_google');
        res_body = res_body.replace(/window.navigator && 'serviceWorker' in navigator/g, 'false');
        res_body = res_body.replace(/<head>/g,`<head><script>if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
        console.log('Registration succeeded. Scope is ' + reg.scope);
    }).catch(function (error) {
        console.log('Registration failed with ' + error);
    });
}</script>`);
    }
    else {
        res_body = original_response.body;
    }

    let new_headers = new Headers(original_response.headers);
    new_headers.set('Access-Control-Allow-Origin', '*');
    if (new_headers.get('set-cookie')) {
        new_headers.set('set-cookie', new_headers.get('set-cookie').replace(/pornhub.com/g, config.pornhub_domain))
    }
    if (new_request_headers.get('cookie')) {
        new_headers.set('Access-Control-Allow-Origin', origin);
        new_headers.set('Access-Control-Allow-Credentials', 'true');
    }
    if (new_headers.get('location')) {
        new_headers.set('location', new_headers.get('location').replace(/pornhub.com/g, config.pornhub_domain))
    }
    response = new Response(res_body, {
        status: original_response.status,
        headers: new_headers
    })
    return response;
}

export default {
    async fetch(request, env) {
        return await handleRequest(request)
    }
}