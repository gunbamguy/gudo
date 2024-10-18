// common.js

// 공통으로 사용되는 함수들

function fetchLatestVersion() {
    return fetch('https://ddragon.leagueoflegends.com/api/versions.json')
        .then(response => response.json())
        .then(versions => {
            return versions[0]; // 가장 최신 버전은 첫 번째 항목
        })
        .catch(error => {
            console.error('버전 정보 로드 실패:', error);
        });
}

function fetchChampionData() {
    // 최신 버전을 자동으로 가져와서 챔피언 데이터를 불러오는 로직
    fetchLatestVersion().then(version => {
        fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`)
            .then(response => response.json())
            .then(data => {
                window.championList = data.data;
                // 추가 로직 (예: 챔피언 리스트 렌더링)
            })
            .catch(error => {
                console.error('챔피언 데이터 로드 실패:', error);
            });
    });
}

function addSlots() {
    // 슬롯 추가 로직
    if (window.myTeamSlots < window.MAX_SLOTS) {
        window.myTeamSlots++;
        // 추가 슬롯 HTML 생성 및 삽입
        const team = document.querySelector('#my-team .team');
        if (team) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.textContent = `슬롯 ${window.myTeamSlots}`;
            team.appendChild(slot);
        }
    }
}

function removeSlots() {
    // 슬롯 제거 로직
    if (window.myTeamSlots > 1) {
        window.myTeamSlots--;
        // 슬롯 제거 HTML 삭제
        const team = document.querySelector('#my-team .team');
        if (team && team.lastElementChild) {
            team.removeChild(team.lastElementChild);
        }
    }
}

function displayRoleSelection() {
    // 역할 선택 모달 표시 로직
    $('#champion-selection').show();
}

// 초기화할 전역 변수
window.myTeamSlots = 1;
window.enemyTeamSlots = 1;
window.MAX_SLOTS = 5;
window.roles = ['탑', '정글', '미드', '원딜', '서폿'];

// 기타 공통 함수들
