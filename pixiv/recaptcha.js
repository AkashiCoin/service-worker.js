const callback = function (mutationsList) {
    let recaptcha = document.getElementsByClassName('grecaptcha-logo')
    if (recaptcha.length > 0) {
        let iframe = recaptcha[0].getElementsByTagName('iframe')
        console.log(iframe)
        if (iframe.length > 0) {
            iframe[0].src = iframe[0].src.replace(/co=(.*)&hl/, 'co=aHR0cHM6Ly93d3cucGl4aXYubmV0OjQ0Mw..&hl')
            observer.disconnect();
            observer.observe(targetNode, config);
        }
    }
}
po.integrity='sha384-bpPBL/5p/XhI+3o1zxurO6VoL61BdYRfBSl4cVDRK3vpBjy5nc2A8DwuK9SSZWpi';
const observer = new MutationObserver(callback);
// 选择需要观察变动的节点
const targetNode = document.body;
 
// 观察器的配置（需要观察什么变动）
const config = { attributes: true, childList: true, subtree: true, characterData: true, };
 
// 以上述配置开始观察目标节点
observer.observe(targetNode, config);