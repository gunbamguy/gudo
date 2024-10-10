// data.js

// Data-related variables
let championList = {};
let version = '';
let currentChampionId = null;
let formationMemos = {};

// IndexedDB Setup
let db;
const dbRequest = indexedDB.open('ChampionMemoDB', 3);

dbRequest.onerror = function(event) {
    console.error('IndexedDB Error:', event);
};

dbRequest.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('memos')) {
        db.createObjectStore('memos', { keyPath: 'championId' });
    }
    if (db.objectStoreNames.contains('formations')) {
        db.deleteObjectStore('formations');
    }
    db.createObjectStore('formations', { keyPath: 'key' });
};

dbRequest.onsuccess = function(event) {
    db = event.target.result;

    // Load formationMemos from IndexedDB
    const transaction = db.transaction(['formations'], 'readonly');
    const store = transaction.objectStore('formations');
    const request = store.getAll();

    request.onsuccess = function(event) {
        const formations = event.target.result;
        formations.forEach(formation => {
            formationMemos[formation.key] = formation.memoContent;
        });
    };

    request.onerror = function(event) {
        console.error('Error loading formations:', event.target.error);
    };
};

// Fetch Champion Data
function fetchChampionData() {
    fetch('https://ddragon.leagueoflegends.com/api/versions.json')
        .then(response => response.json())
        .then(versions => {
            version = versions[0];
            return fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`);
        })
        .then(response => response.json())
        .then(data => {
            championList = data.data;
            initializeTeamSlots(); // Make sure this function is accessible
        })
        .catch(error => {
            console.error('Failed to load champion data:', error);
        });
}

// Save Memo
function saveMemo(championId, memo) {
    if (!db) {
        alert('Database is not initialized.');
        return;
    }
    const transaction = db.transaction(['memos'], 'readwrite');
    const store = transaction.objectStore('memos');
    store.put({ championId: championId, memoContent: memo.memoContent });
    alert('챔프 메모 저장완료.');
}

// Load Memo
function loadMemo(championId, callback) {
    if (!db) {
        alert('Database is not initialized.');
        callback({});
        return;
    }
    const transaction = db.transaction(['memos'], 'readonly');
    const store = transaction.objectStore('memos');
    const request = store.get(championId);

    request.onsuccess = function() {
        callback(request.result || {});
    };
}

// Save Formation
function saveFormation() {
    const myTeamFirstSlot = $('#my-team').find('.team').children().eq(0);
    const enemyTeamFirstSlot = $('#enemy-team').find('.team').children().eq(0);

    const myChampionId = myTeamFirstSlot.find('img').attr('alt');
    const enemyChampionId = enemyTeamFirstSlot.find('img').attr('alt');

    if (myChampionId && enemyChampionId) {
        const key = `${myChampionId}-${enemyChampionId}`;
        const memoContent = $('#formation-editor').summernote('code');

        formationMemos[key] = memoContent;

        if (!db) {
            alert('Database is not initialized.');
            return;
        }

        const transaction = db.transaction(['formations'], 'readwrite');
        const store = transaction.objectStore('formations');
        store.put({ key: key, memoContent: memoContent });

        transaction.oncomplete = function() {
            alert('저장 완료.');
        };

        transaction.onerror = function(event) {
            console.error('Error saving formation:', event.target.error);
            alert('Failed to save formation.');
        };
    } else {
        alert('양쪽 챔프를 선택해야 구도 저장됩니다..');
    }
}

// Update Formation Memo
function checkAndUpdateFormationMemo() {
    const myTeamFirstSlot = $('#my-team').find('.team').children().eq(0);
    const enemyTeamFirstSlot = $('#enemy-team').find('.team').children().eq(0);

    const myChampionId = myTeamFirstSlot.find('img').attr('alt');
    const enemyChampionId = enemyTeamFirstSlot.find('img').attr('alt');

    if (myChampionId && enemyChampionId) {
        const key = `${myChampionId}-${enemyChampionId}`;
        if (formationMemos[key]) {
            $('#formation-editor').summernote('code', formationMemos[key]);
        } else {
            $('#formation-editor').summernote('code', '');
        }
    }
}

// Export Data
function exportData() {
    const data = {
        version: version,
        myTeamSlots: myTeamSlots,
        enemyTeamSlots: enemyTeamSlots,
        myTeam: [],
        enemyTeam: [],
        formationMemo: $('#formation-editor').summernote('code'),
        memoContent: $('#editor').summernote('code'), // 일반 메모
        formationMemos: formationMemos, // 포지션 메모
        championMemos: {} // 챔피언별 메모
    };

    // 내 팀 데이터 수집
    const myTeamContainer = $('#my-team').find('.team');
    for (let i = 0; i < myTeamSlots; i++) {
        const slot = myTeamContainer.children().eq(i);
        const img = slot.find('img');
        if (img.length > 0) {
            data.myTeam.push(img.attr('alt'));
        } else {
            data.myTeam.push(null);
        }
    }

    // 상대 팀 데이터 수집
    const enemyTeamContainer = $('#enemy-team').find('.team');
    for (let i = 0; i < enemyTeamSlots; i++) {
        const slot = enemyTeamContainer.children().eq(i);
        const img = slot.find('img');
        if (img.length > 0) {
            data.enemyTeam.push(img.attr('alt'));
        } else {
            data.enemyTeam.push(null);
        }
    }

    // IndexedDB에서 모든 챔피언 메모 가져오기
    if (!db) {
        alert('데이터베이스가 초기화되지 않았습니다.');
        return;
    }

    const transaction = db.transaction(['memos'], 'readonly');
    const store = transaction.objectStore('memos');
    const request = store.getAll();

    request.onsuccess = function() {
        request.result.forEach(record => {
            data.championMemos[record.championId] = record.memoContent;
        });

        // JSON 문자열을 Base64로 인코딩
        const jsonStr = JSON.stringify(data);
        const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));

        // 텍스트 파일로 다운로드
        const blob = new Blob([base64Str], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'champion_data.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    request.onerror = function(event) {
        console.error('챔피언 메모 내보내기 실패:', event.target.error);
        alert('챔피언 메모 내보내기에 실패했습니다.');
    };
}

// Import Data
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const base64Str = e.target.result;
            const jsonStr = decodeURIComponent(escape(atob(base64Str)));
            const data = JSON.parse(jsonStr);

            // 데이터 적용
            version = data.version;
            myTeamSlots = data.myTeamSlots;
            enemyTeamSlots = data.enemyTeamSlots;
            formationMemos = data.formationMemos || {}; // 포지션 메모

            // 챔피언 데이터 다시 로드
            fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`)
                .then(response => response.json())
                .then(championData => {
                    championList = championData.data;

                    // 슬롯 초기화
                    initializeTeamSlots();

                    // 내 팀 챔피언 설정
                    const myTeamContainer = $('#my-team').find('.team');
                    for (let i = 0; i < data.myTeam.length; i++) {
                        const slot = myTeamContainer.children().eq(i)[0];
                        if (data.myTeam[i]) {
                            setChampionToSlot(slot, data.myTeam[i]);
                        }
                    }

                    // 상대 팀 챔피언 설정
                    const enemyTeamContainer = $('#enemy-team').find('.team');
                    for (let i = 0; i < data.enemyTeam.length; i++) {
                        const slot = enemyTeamContainer.children().eq(i)[0];
                        if (data.enemyTeam[i]) {
                            setChampionToSlot(slot, data.enemyTeam[i]);
                        }
                    }

                    // 메모 데이터 설정
                    $('#editor').summernote('code', data.memoContent || '');
                    $('#formation-editor').summernote('code', data.formationMemo || '');

                    // IndexedDB에 formations 저장
                    if (db) {
                        const transaction = db.transaction(['formations'], 'readwrite');
                        const store = transaction.objectStore('formations');
                        store.clear(); // 기존 formations 삭제
                        for (const key in formationMemos) {
                            store.put({ key: key, memoContent: formationMemos[key] });
                        }
                    }

                    // 챔피언 메모 복원
                    if (db && data.championMemos) {
                        const transaction = db.transaction(['memos'], 'readwrite');
                        const store = transaction.objectStore('memos');
                        store.clear(); // 기존 메모 삭제
                        for (const champId in data.championMemos) {
                            store.put({ championId: champId, memoContent: data.championMemos[champId] });
                        }
                    }

                    alert('데이터가 성공적으로 불러와졌습니다.');
                })
                .catch(error => {
                    console.error('챔피언 데이터 로드 실패:', error);
                    alert('챔피언 데이터 로드에 실패했습니다.');
                });
        } catch (error) {
            console.error(error);
            alert('데이터 불러오기에 실패했습니다.');
        }
    };
    reader.readAsText(file);
}


// Export Data to Clipboard
function encodeBase64(input) {
    return btoa(unescape(encodeURIComponent(input)));
}

function decodeBase64(input) {
    return decodeURIComponent(escape(atob(input)));
}


function exportDataToClipboard() {
    const data = {
        version: version,
        myTeamSlots: myTeamSlots,
        enemyTeamSlots: enemyTeamSlots,
        myTeam: [],
        enemyTeam: [],
        formationMemo: $('#formation-editor').summernote ? $('#formation-editor').summernote('code') : '',
        memoContent: $('#editor').summernote ? $('#editor').summernote('code') : '',
        formationMemos: formationMemos,
        championMemos: {}
    };

    // 내 팀 데이터 수집
    const myTeamContainer = $('#my-team').find('.team');
    for (let i = 0; i < myTeamSlots; i++) {
        const slot = myTeamContainer.children().eq(i);
        const img = slot.find('img');
        data.myTeam.push(img.length > 0 ? img.attr('alt') : null);
    }

    // 상대 팀 데이터 수집
    const enemyTeamContainer = $('#enemy-team').find('.team');
    for (let i = 0; i < enemyTeamSlots; i++) {
        const slot = enemyTeamContainer.children().eq(i);
        const img = slot.find('img');
        data.enemyTeam.push(img.length > 0 ? img.attr('alt') : null);
    }

    // IndexedDB에서 모든 챔피언 메모 가져오기
    if (!db) {
        alert('데이터베이스가 초기화되지 않았습니다.');
        return;
    }

    const transaction = db.transaction(['memos'], 'readonly');
    const store = transaction.objectStore('memos');
    const request = store.getAll();

    request.onsuccess = function() {
        request.result.forEach(record => {
            data.championMemos[record.championId] = record.memoContent;
        });

        // JSON 문자열을 Base64로 인코딩 (유니코드 대응)
        const jsonStr = JSON.stringify(data);
        try {
            const base64Str = encodeBase64(jsonStr);
            // 클립보드에 복사
            navigator.clipboard.writeText(base64Str).then(() => {
                alert('데이터가 클립보드에 복사되었습니다.');
            }).catch(err => {
                console.error('클립보드 복사 실패:', err);
                alert('데이터 클립보드 복사에 실패했습니다. 브라우저 설정을 확인해주세요.');
            });
        } catch (error) {
            console.error('Base64 인코딩 오류:', error);
            alert('데이터 인코딩에 실패했습니다.');
        }
    };

    request.onerror = function(event) {
        console.error('챔피언 메모 내보내기 실패:', event.target.error);
        alert('챔피언 메모 내보내기에 실패했습니다.');
    };
}


function exportDataAsUrl() {
    const data = {
        version: version,
        myTeamSlots: myTeamSlots,
        enemyTeamSlots: enemyTeamSlots,
        myTeam: [],
        enemyTeam: [],
        formationMemo: $('#formation-editor').summernote('code'),
        memoContent: $('#editor').summernote('code'),
        formationMemos: formationMemos
    };

    // 내 팀 데이터 수집
    const myTeamContainer = $('#my-team').find('.team');
    for (let i = 0; i < myTeamSlots; i++) {
        const slot = myTeamContainer.children().eq(i);
        const img = slot.find('img');
        data.myTeam.push(img.length > 0 ? img.attr('alt') : null);
    }

    // 상대 팀 데이터 수집
    const enemyTeamContainer = $('#enemy-team').find('.team');
    for (let i = 0; i < enemyTeamSlots; i++) {
        const slot = enemyTeamContainer.children().eq(i);
        const img = slot.find('img');
        data.enemyTeam.push(img.length > 0 ? img.attr('alt') : null);
    }

    // JSON 문자열을 Base64로 인코딩
    const jsonStr = JSON.stringify(data);
    const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));

    // 현재 URL에서 기존 쿼리 파라미터 제거
    const currentUrl = window.location.href.split('?')[0];
    // 새 URL 생성 (예: https://example.com/page.html?data=base64String)
    const newUrl = `${currentUrl}?data=${encodeURIComponent(base64Str)}`;

    // 클립보드에 URL 복사
    navigator.clipboard.writeText(newUrl).then(() => {
        alert('주소가 클립보드에 복사되었습니다.');
    }).catch(err => {
        console.error('클립보드 복사 실패:', err);
        alert('주소 복사에 실패했습니다. 브라우저 설정을 확인해주세요.');
    });
}


// Load Data from Base64
function loadDataFromBase64(base64Data) {
    try {
        const jsonStr = decodeURIComponent(escape(atob(base64Data)));
        const data = JSON.parse(jsonStr);

        // 데이터 적용
        version = data.version;
        myTeamSlots = data.myTeamSlots;
        enemyTeamSlots = data.enemyTeamSlots;
        formationMemos = data.formationMemos || {}; // 포지션 메모

        // 챔피언 데이터 다시 로드
        fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`)
            .then(response => response.json())
            .then(championData => {
                championList = championData.data;

                // 슬롯 초기화
                initializeTeamSlots();

                // 내 팀 챔피언 설정
                const myTeamContainer = $('#my-team').find('.team');
                for (let i = 0; i < data.myTeam.length; i++) {
                    const slot = myTeamContainer.children().eq(i)[0];
                    if (data.myTeam[i]) {
                        setChampionToSlot(slot, data.myTeam[i]);
                    }
                }

                // 상대 팀 챔피언 설정
                const enemyTeamContainer = $('#enemy-team').find('.team');
                for (let i = 0; i < data.enemyTeam.length; i++) {
                    const slot = enemyTeamContainer.children().eq(i)[0];
                    if (data.enemyTeam[i]) {
                        setChampionToSlot(slot, data.enemyTeam[i]);
                    }
                }

                // 메모 데이터 설정
                $('#editor').summernote('code', data.memoContent || '');
                $('#formation-editor').summernote('code', data.formationMemo || '');

                // IndexedDB에 formations 저장
                if (db) {
                    const transaction = db.transaction(['formations'], 'readwrite');
                    const store = transaction.objectStore('formations');
                    store.clear(); // 기존 formations 삭제
                    for (const key in formationMemos) {
                        store.put({ key: key, memoContent: formationMemos[key] });
                    }
                }

                // 챔피언 메모 복원
                if (db && data.championMemos) {
                    const transaction = db.transaction(['memos'], 'readwrite');
                    const store = transaction.objectStore('memos');
                    store.clear(); // 기존 메모 삭제
                    for (const champId in data.championMemos) {
                        store.put({ championId: champId, memoContent: data.championMemos[champId] });
                    }
                }

                alert('데이터가 성공적으로 불러와졌습니다.');
            })
            .catch(error => {
                console.error('챔피언 데이터 로드 실패:', error);
                alert('챔피언 데이터 로드에 실패했습니다.');
            });
    } catch (error) {
        console.error(error);
        alert('데이터 불러오기에 실패했습니다.');
    }
}

// Get Role Tag
function getRoleTag(role) {
    switch (role) {
        case '탑':
            return 'Fighter';
        case '정글':
            return 'Tank';
        case '미드':
            return 'Mage';
        case '원딜':
            return 'Marksman';
        case '서폿':
            return 'Support';
        default:
            return '';
    }
}

// Get Color for Charts
function getColor(championIndex, spellIndex) {
    // Existing code to get color
}

// 챔피언 데이터 가져오기
function fetchChampionDataByIds(champIds) {
    return Promise.all(champIds.map(champId => {
        return fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion/${champId}.json`)
            .then(response => response.json())
            .then(data => data.data[champId]);
    }));
}


