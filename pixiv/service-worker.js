// service-worker.js
self.addEventListener('install', () => {
	self.skipWaiting()
})

self.addEventListener('activate', event => {
	event.waitUntil(self.clients.claim())
})

const enterprise = "(function(){var w=window,C='___grecaptcha_cfg',cfg=w[C]=w[C]||{},N='grecaptcha';var E='enterprise',a=w[N]=w[N]||{},gr=a[E]=a[E]||{};gr.ready=gr.ready||function(f){(cfg['fns']=cfg['fns']||[]).push(f);};w['__recaptcha_api']='https://www.recaptcha.net/recaptcha/enterprise/';(cfg['enterprise']=cfg['enterprise']||[]).push(true);(cfg['enterprise2fa']=cfg['enterprise2fa']||[]).push(true);(cfg['render']=cfg['render']||[]).push('6LfF1dcZAAAAAOHQX8v16MX5SktDwmQINVD_6mBF');w['__google_recaptcha_client']=true;var d=document,po=d.createElement('script');po.type='text/javascript';po.async=true;po.src='https://www.gstatic.com/recaptcha/releases/O4xzMiFqEvA4YhWjk5t8Xuas/recaptcha__zh_cn.js';po.crossOrigin='anonymous';var e=d.querySelector('script[nonce]'),n=e&&(e['nonce']||e.getAttribute('nonce'));if(n){po.setAttribute('nonce',n);}var s=d.getElementsByTagName('script')[0];s.parentNode.insertBefore(po, s);})();"

const crack_rechapcha = async (request) => {
    let url = new URL(request.url)
    if (url.pathname.startsWith('/recaptcha/enterprise/anchor')) {
        url.searchParams.set('co', "aHR0cHM6Ly93d3cucGl4aXYubmV0OjQ0Mw..")
    }
    else if (url.pathname.startsWith('/recaptcha/enterprise.js')) {
        return new Response(enterprise, {
            headers: {
                'Content-Type': 'application/javascript',
                "Access-Control-Allow-Origin": "*", // CORS
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
            }
        })
    }
    let response = await fetch(url, request)
    let html = await response.text()
    if (url.pathname.startsWith('/recaptcha/releases/')) {
        html = html.replace(/"origin",.*,"co"/g, '"origin","aHR0cHM6Ly93d3cucGl4aXYubmV0OjQ0Mw..","co"')
        // html = html.replace(/[a-zA-Z].parentElement/g, '"https://www.pixiv.cf:443"')
        html = html.replace("pixiv.net", "pixiv.cf")
    }
    return new Response(html, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText
    })
}

const baidu_pximg = async (request) => {
    let url = request.url;
    const org_url = new URL(url);
    url = url.replace(/https:\/\/i.pximg.cf\/(.*)([.jpg|.png])/g, "https:\/\/gimg2.baidu.com/image_search/&app=2020&src=i.pximg.cf/$1$2");
    let response = await fetch(url, {
        mode: 'cors',
        ...request
    });
    if (response.headers.get('Content-Length') == 52) {
        return await fetch(org_url, request);
    }
    return response
}

self.onfetch = event => {
    let url = new URL(event.request.url)
    if (url.hostname == 'i.pximg.cf' && (url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png'))) {
        event.respondWith(baidu_pximg(event.request))
    }
}