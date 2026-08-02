// common.js - 공통 상태 및 서비스 모듈

// 1. 애플리케이션 전역 상태 객체
const AppState = {
    version: '',
    championList: {},
    myTeamSlots: 1,
    enemyTeamSlots: 1,
    MAX_SLOTS: 5,
    roles: ['탑', '정글', '미드', '원딜', '서폿'],
    selectedSlot: null,
    currentChampionId: null,
    lastActiveEditor: '#editor', // 클릭 및 활성화된 에디터 추적
    insertedIconSize: 38, // 에디터 삽입 아이콘 크기 (38px 기본)
    formationMemos: {},
    selectedItemsData: [],
    sortableStats: new Set(),
    selectedStats: new Set()
};

// 전역 호환성을 위해 window 객체에 맵핑 (기존 스크립트 참조용)
window.AppState = AppState;
window.roles = AppState.roles;
window.MAX_SLOTS = AppState.MAX_SLOTS;

// 2. 안전한 유니코드 Base64 인코딩 / 디코딩 헬퍼
const Base64Util = {
    encode(str) {
        try {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode('0x' + p1);
            }));
        } catch (e) {
            console.error('Base64 Encoding Error:', e);
            return '';
        }
    },
    decode(str) {
        try {
            return decodeURIComponent(Array.prototype.map.call(atob(str.trim()), (c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        } catch (e) {
            console.error('Base64 Decoding Error:', e);
            return null;
        }
    }
};

window.Base64Util = Base64Util;

// 3. Data Dragon API 서비스 (메모리 캐싱 탑재)
const DataDragonService = {
    async getLatestVersion() {
        if (AppState.version) return AppState.version;
        try {
            const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
            const versions = await res.json();
            AppState.version = versions[0];
            window.version = versions[0];
            return versions[0];
        } catch (err) {
            console.error('Data Dragon 버전 로드 실패:', err);
            return '14.1.1'; // 기본 폴백 버전
        }
    },

    async getChampionList() {
        if (Object.keys(AppState.championList).length > 0) {
            return AppState.championList;
        }
        const ver = await this.getLatestVersion();
        try {
            const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/ko_KR/champion.json`);
            const data = await res.json();
            AppState.championList = data.data;
            window.championList = data.data;
            return data.data;
        } catch (err) {
            console.error('챔피언 목록 로드 실패:', err);
            return {};
        }
    },

    async getChampionDetail(championId) {
        if (!championId) return null;
        const ver = await this.getLatestVersion();
        try {
            const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/ko_KR/champion/${championId}.json`);
            const data = await res.json();
            return data.data[championId];
        } catch (err) {
            console.error(`챔피언 상세 정보 로드 실패 (${championId}):`, err);
            return null;
        }
    },

    async getRunes() {
        if (AppState.runeList && AppState.runeList.length > 0) return AppState.runeList;
        const ver = await this.getLatestVersion();
        try {
            const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/ko_KR/runesReforged.json`);
            const data = await res.json();
            AppState.runeList = data;
            return data;
        } catch (err) {
            console.error('룬 데이터 로드 실패:', err);
            return [];
        }
    },

    async getItems() {
        if (AppState.itemList && Object.keys(AppState.itemList).length > 0) return AppState.itemList;
        const ver = await this.getLatestVersion();
        try {
            const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/ko_KR/item.json`);
            const data = await res.json();
            AppState.itemList = data.data;
            return data.data;
        } catch (err) {
            console.error('아이템 데이터 로드 실패:', err);
            return {};
        }
    }
};

window.DataDragonService = DataDragonService;

// 기존 레거시 함수 호환용 래퍼
function fetchLatestVersion() {
    return DataDragonService.getLatestVersion();
}

function fetchChampionData() {
    return DataDragonService.getChampionList();
}

