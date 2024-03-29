// service-worker.js
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
    // if (url.pathname.startsWith('/video/get_media')) {
    //     url.hostname = "jsproxy.moehome.repl.co"
    //     url.pathname = "/pornhub" + url.pathname
    //     return event.respondWith(fetch(new Request(url.href, event.request)))
    // }
    // if (url.pathname.startsWith('/hls/videos')) {
    //     if (url.pathname.endsWith('master.m3u8')) {
    //         url.hostname = url.hostname.replace('phncdn.com','phncdn.cf')
    //         return event.respondWith(fetch(new Request(url.href, event.request)))
    //     }
    //     url.search = ''
    //     let request = new Request(url.href, event.request)
    //     return event.respondWith(fetch(request))
    // }
    for (let domain in replace_domains) {
        if (url.hostname.endsWith(domain)) {
            url.hostname = url.hostname.replace(domain, replace_domains[domain])
            let request = new Request(url.href, event.request)
            return event.respondWith(fetch(request))
        }
    }
}