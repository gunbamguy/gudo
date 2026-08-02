// data.js - IndexedDB 및 데이터 입출력 서비스

// IndexedDB 싱글톤 래퍼 서비스
const DBService = {
    db: null,

    init() {
        return new Promise((resolve, reject) => {
            if (this.db) return resolve(this.db);

            const request = indexedDB.open('ChampionMemoDB', 3);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('memos')) {
                    db.createObjectStore('memos', { keyPath: 'championId' });
                }
                if (db.objectStoreNames.contains('formations')) {
                    db.deleteObjectStore('formations');
                }
                db.createObjectStore('formations', { keyPath: 'key' });
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                window.db = this.db;
                this.loadAllFormations();
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB 오픈 실패:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    async loadAllFormations() {
        if (!this.db) return;
        try {
            const transaction = this.db.transaction(['formations'], 'readonly');
            const store = transaction.objectStore('formations');
            const request = store.getAll();
            request.onsuccess = (e) => {
                const formations = e.target.result || [];
                AppState.formationMemos = {};
                formations.forEach(f => {
                    AppState.formationMemos[f.key] = f.memoContent;
                });
                window.formationMemos = AppState.formationMemos;
            };
        } catch (err) {
            console.error('구도 메모 로드 에러:', err);
        }
    },

    saveMemo(championId, memoContent) {
        return new Promise(async (resolve, reject) => {
            const db = await this.init();
            const tx = db.transaction(['memos'], 'readwrite');
            const store = tx.objectStore('memos');
            const req = store.put({ championId, memoContent });
            req.onsuccess = () => resolve(true);
            req.onerror = (e) => reject(e.target.error);
        });
    },

    getMemo(championId) {
        return new Promise(async (resolve) => {
            const db = await this.init();
            const tx = db.transaction(['memos'], 'readonly');
            const store = tx.objectStore('memos');
            const req = store.get(championId);
            req.onsuccess = () => resolve(req.result ? req.result.memoContent : '');
            req.onerror = () => resolve('');
        });
    },

    saveFormation(key, memoContent) {
        return new Promise(async (resolve, reject) => {
            const db = await this.init();
            const tx = db.transaction(['formations'], 'readwrite');
            const store = tx.objectStore('formations');
            const req = store.put({ key, memoContent });
            req.onsuccess = () => {
                AppState.formationMemos[key] = memoContent;
                resolve(true);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    },

    getAllMemos() {
        return new Promise(async (resolve) => {
            const db = await this.init();
            const tx = db.transaction(['memos'], 'readonly');
            const store = tx.objectStore('memos');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
        });
    },

    clearAll() {
        return new Promise(async (resolve, reject) => {
            const db = await this.init();
            const tx = db.transaction(['memos', 'formations'], 'readwrite');
            tx.objectStore('memos').clear();
            tx.objectStore('formations').clear();
            tx.oncomplete = () => {
                AppState.formationMemos = {};
                resolve(true);
            };
            tx.onerror = (e) => reject(e.target.error);
        });
    }
};

window.DBService = DBService;

// 메모 작성 활성화
async function enableMemo(championId) {
    AppState.currentChampionId = championId;
    window.currentChampionId = championId;
    const memoContent = await DBService.getMemo(championId);
    if ($('#editor').length && $('#editor').summernote) {
        $('#editor').summernote('code', memoContent || '');
    }
}

// 메모 저장
async function saveMemo(championId, data) {
    if (!championId) return;
    await DBService.saveMemo(championId, data.memoContent);
    updateMemoChampionDropdown();
    alert('챔피언 메모가 저장되었습니다.');
}

// 드롭다운 채우기 함수들
async function updateAllDropdowns() {
    await updateMemoChampionDropdown();
    await updateFormationDropdown();
}

async function updateMemoChampionDropdown() {
    const dropdowns = $('#memo-champion-dropdown, #memo-champion-dropdown-modal');
    if (!dropdowns.length) return;

    dropdowns.empty();
    dropdowns.append($('<option>', { value: '', text: '챔피언 메모 선택' }));

    const memos = await DBService.getAllMemos();
    memos.forEach(memo => {
        const champ = AppState.championList[memo.championId];
        const champName = champ ? champ.name : memo.championId;
        dropdowns.append($('<option>', { value: memo.championId, text: champName }));
    });
}

async function updateFormationDropdown() {
    const dropdowns = $('#formation-dropdown, #formation-dropdown-modal');
    if (!dropdowns.length) return;

    dropdowns.empty();
    dropdowns.append($('<option>', { value: '', text: '구도 메모 선택' }));

    for (const key in AppState.formationMemos) {
        const match = key.match(/my:([^_]+)_enemy:([^_]+)/);
        let optionText = key;
        if (match) {
            const myId = match[1].split('-')[0];
            const enemyId = match[2].split('-')[0];
            const myName = AppState.championList[myId] ? AppState.championList[myId].name : myId;
            const enemyName = AppState.championList[enemyId] ? AppState.championList[enemyId].name : enemyId;
            optionText = `${myName} vs ${enemyName}`;
        }
        dropdowns.append($('<option>', { value: key, text: optionText }));
    }
}

// 구도 메모 저장
async function saveFormation() {
    const myTeam = getTeamChampionArray('#my-team');
    const enemyTeam = getTeamChampionArray('#enemy-team');

    const myFirst = myTeam[0];
    const enemyFirst = enemyTeam[0];

    if (!myFirst || !enemyFirst) {
        alert('내 팀과 상대 팀의 첫 번째 슬롯에 챔피언을 선택해야 구도를 저장할 수 있습니다.');
        return;
    }

    const key = `my:${myTeam.join('-')}_enemy:${enemyTeam.join('-')}`;
    const memoContent = $('#formation-editor').length ? $('#formation-editor').summernote('code') : '';

    await DBService.saveFormation(key, memoContent);
    await updateFormationDropdown();
    alert('구도 메모가 저장되었습니다.');
}

// 구도 불러오기
function loadFormation(key) {
    if (!key || !AppState.formationMemos[key]) return;

    const memoContent = AppState.formationMemos[key];
    if ($('#formation-editor').length && $('#formation-editor').summernote) {
        $('#formation-editor').summernote('code', memoContent);
    }

    const match = key.match(/my:([^_]+)_enemy:([^_]+)/);
    if (match) {
        const myChamps = match[1].split('-');
        const enemyChamps = match[2].split('-');

        const mySlots = $('#my-team .team .slot');
        const enemySlots = $('#enemy-team .team .slot');

        mySlots.each((i, slot) => {
            if (myChamps[i] && typeof setChampionToSlot === 'function') {
                setChampionToSlot(slot, myChamps[i]);
            }
        });

        enemySlots.each((i, slot) => {
            if (enemyChamps[i] && typeof setChampionToSlot === 'function') {
                setChampionToSlot(slot, enemyChamps[i]);
            }
        });
    }
}

// 구도 메모 체크 및 자동 업데이트
function checkAndUpdateFormationMemo() {
    const myTeam = getTeamChampionArray('#my-team');
    const enemyTeam = getTeamChampionArray('#enemy-team');

    if (myTeam[0] && enemyTeam[0]) {
        const key = `my:${myTeam.join('-')}_enemy:${enemyTeam.join('-')}`;
        if (AppState.formationMemos[key]) {
            loadFormation(key);
        }
    }
}

// 데이터 내보내기/불러오기
async function exportData() {
    const data = {
        version: AppState.version,
        myTeamSlots: AppState.myTeamSlots,
        enemyTeamSlots: AppState.enemyTeamSlots,
        myTeam: getTeamChampionArray('#my-team'),
        enemyTeam: getTeamChampionArray('#enemy-team'),
        formationMemo: $('#formation-editor').length ? $('#formation-editor').summernote('code') : '',
        memoContent: $('#editor').length ? $('#editor').summernote('code') : '',
        formationMemos: AppState.formationMemos,
        championMemos: {}
    };

    const memos = await DBService.getAllMemos();
    memos.forEach(m => {
        data.championMemos[m.championId] = m.memoContent;
    });

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `lol_gudo_backup_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

async function exportDataToClipboard() {
    const data = {
        version: AppState.version,
        myTeamSlots: AppState.myTeamSlots,
        enemyTeamSlots: AppState.enemyTeamSlots,
        myTeam: getTeamChampionArray('#my-team'),
        enemyTeam: getTeamChampionArray('#enemy-team'),
        formationMemo: $('#formation-editor').length ? $('#formation-editor').summernote('code') : '',
        memoContent: $('#editor').length ? $('#editor').summernote('code') : '',
        formationMemos: AppState.formationMemos,
        championMemos: {}
    };

    const memos = await DBService.getAllMemos();
    memos.forEach(m => {
        data.championMemos[m.championId] = m.memoContent;
    });

    const jsonStr = JSON.stringify(data);
    const base64Str = Base64Util.encode(jsonStr);

    try {
        await navigator.clipboard.writeText(base64Str);
        alert('데이터 문자열이 클립보드에 복사되었습니다.');
    } catch (err) {
        console.error('클립보드 복사 실패:', err);
        alert('클립보드 복사에 실패했습니다. 브라우저 권한을 확인해 주세요.');
    }
}

async function exportDataAsUrl() {
    const data = {
        version: AppState.version,
        myTeamSlots: AppState.myTeamSlots,
        enemyTeamSlots: AppState.enemyTeamSlots,
        myTeam: getTeamChampionArray('#my-team'),
        enemyTeam: getTeamChampionArray('#enemy-team'),
        formationMemo: $('#formation-editor').length ? $('#formation-editor').summernote('code') : '',
        memoContent: $('#editor').length ? $('#editor').summernote('code') : '',
        formationMemos: AppState.formationMemos,
        championMemos: {}
    };

    const memos = await DBService.getAllMemos();
    memos.forEach(m => {
        data.championMemos[m.championId] = m.memoContent;
    });

    const jsonStr = JSON.stringify(data);
    const base64Str = Base64Util.encode(jsonStr);
    const currentUrl = window.location.href.split('?')[0];
    const newUrl = `${currentUrl}?data=${encodeURIComponent(base64Str)}`;

    try {
        await navigator.clipboard.writeText(newUrl);
        alert('주소(URL)가 클립보드에 복사되었습니다.');
    } catch (err) {
        console.error('URL 복사 실패:', err);
        alert('주소 복사에 실패했습니다.');
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        loadDataFromBase64(content.trim());
    };
    reader.readAsText(file);
}

function loadDataFromBase64(base64Data) {
    if (!base64Data) return;
    const jsonStr = Base64Util.decode(base64Data);
    if (!jsonStr) {
        alert('유효하지 않은 데이터 형식입니다.');
        return;
    }

    try {
        const data = JSON.parse(jsonStr);
        applyImportedData(data);
    } catch (err) {
        console.error('JSON 파싱 오류:', err);
        alert('데이터 파싱에 실패했습니다.');
    }
}

async function applyImportedData(data) {
    if (data.version) AppState.version = data.version;
    if (data.myTeamSlots) AppState.myTeamSlots = data.myTeamSlots;
    if (data.enemyTeamSlots) AppState.enemyTeamSlots = data.enemyTeamSlots;
    if (data.formationMemos) AppState.formationMemos = data.formationMemos;

    await DataDragonService.getChampionList();
    if (typeof initializeTeamSlots === 'function') {
        initializeTeamSlots();
    }

    const myTeamContainer = $('#my-team').find('.team');
    if (data.myTeam && Array.isArray(data.myTeam)) {
        data.myTeam.forEach((champId, index) => {
            const slot = myTeamContainer.children().eq(index)[0];
            if (slot && champId && typeof setChampionToSlot === 'function') {
                setChampionToSlot(slot, champId);
            }
        });
    }

    const enemyTeamContainer = $('#enemy-team').find('.team');
    if (data.enemyTeam && Array.isArray(data.enemyTeam)) {
        data.enemyTeam.forEach((champId, index) => {
            const slot = enemyTeamContainer.children().eq(index)[0];
            if (slot && champId && typeof setChampionToSlot === 'function') {
                setChampionToSlot(slot, champId);
            }
        });
    }

    if ($('#editor').length && $('#editor').summernote) {
        $('#editor').summernote('code', data.memoContent || '');
    }
    if ($('#formation-editor').length && $('#formation-editor').summernote) {
        $('#formation-editor').summernote('code', data.formationMemo || '');
    }

    // DB에 복원 저장
    await DBService.clearAll();
    if (data.formationMemos) {
        for (const k in data.formationMemos) {
            await DBService.saveFormation(k, data.formationMemos[k]);
        }
    }
    if (data.championMemos) {
        for (const cid in data.championMemos) {
            await DBService.saveMemo(cid, data.championMemos[cid]);
        }
    }

    updateAllDropdowns();
    alert('데이터를 성공적으로 불러왔습니다.');
}

function getTeamChampionArray(teamContainerId) {
    const container = $(teamContainerId).find('.team');
    const result = [];
    container.children().each(function() {
        const champId = $(this).find('img').attr('alt');
        result.push(champId || null);
    });
    return result;
}

function getRoleTag(role) {
    switch (role) {
        case '탑': return 'Fighter';
        case '정글': return 'Tank';
        case '미드': return 'Mage';
        case '원딜': return 'Marksman';
        case '서폿': return 'Support';
        default: return '';
    }
}
