async function handleRequest(request) {
    let url = new URL(request.url);
    console.log(url);
    url.hostname = url.hostname.split('.')[0] + '.phncdn.com';
    let new_request_headers = new Headers(request.headers);
    console.log(new_request_headers);
  
    new_request_headers.set('Host', url.hostname);
    new_request_headers.set('origin', url.hostname);
    new_request_headers.set('Referer', new_request_headers.get('Referer') ? new_request_headers.get('Referer').replace('pornhubc.cf', 'pornhub.com') : "https://www.pornhub.com");
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
      return await handleRequest(request)
    }
  }
  