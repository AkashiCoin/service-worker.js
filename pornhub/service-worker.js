// service-worker.js
let replace_domains = {
    'pornhub.com': 'pornhubc.cf',
    'phncdn.com': 'phncdn.cf',
}

let block_url = [
    'pornhub.com/_xa/',
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
}