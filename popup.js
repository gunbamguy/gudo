// popup.js

$(document).ready(function() {
    // 챔피언 선택 버튼 클릭 이벤트
    $('#select-champion-button').on('click', function() {
        displayRoleSelection();
    });

    // 챔피언 선택 모달 닫기 버튼 클릭 이벤트
    $('#close-modal-button').on('click', function() {
        $('#champion-selection').hide();
    });

    // 챔피언 목록에서 챔피언 클릭 시 해당 챔피언 정보 표시
    $(document).on('click', '.champion-button', function() {
        const championId = $(this).data('champion-id');
        displayChampionInfo(championId);
        $('#champion-selection').hide();
    });

    // 초기 데이터 로드
    fetchChampionData();

    // 역할 선택 모달에 검색창 추가
    const searchInput = $('<input>', {
        type: 'text',
        id: 'role-search',
        placeholder: '역할 검색',
        css: {
            marginBottom: '10px',
            padding: '5px',
            width: '95%'
        }
    });
    $('#role-selection').before(searchInput);

    // 검색 기능 구현
    $('#role-search').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('.champion-button').each(function() {
            const championName = $(this).text().toLowerCase();
            if (championName.includes(searchTerm)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
});

function displayRoleSelection() {
    const modal = $('#champion-selection');
    modal.show();

    const championListDiv = $('#champion-list');
    championListDiv.empty();

    // 검색창 추가
    const searchInput = $('<input>', {
        type: 'text',
        id: 'champion-search',
        placeholder: '챔피언 이름 검색',
        css: {
            marginBottom: '10px',
            padding: '5px',
            width: '95%'
        }
    });
    championListDiv.append(searchInput);

    // 챔피언 데이터를 가져와서 리스트 생성
    Object.values(window.championList).forEach(champion => {
        const champButton = $('<button>', {
            class: 'champion-button',
            'data-champion-id': champion.id,
            text: champion.name,
            css: {
                margin: '5px',
                padding: '10px',
                cursor: 'pointer'
            }
        });
        championListDiv.append(champButton);
    });

    // 검색 기능 구현
    $('#champion-search').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('.champion-button').each(function() {
            const championName = $(this).text().toLowerCase();
            if (championName.includes(searchTerm)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
}

function displayChampionInfo(championId) {
    const champion = window.championList[championId];
    const infoDiv = $('#champion-info');
    infoDiv.empty();

    const name = $('<h3>', { text: champion.name });
    infoDiv.append(name);

    const title = $('<p>', { text: champion.title });
    infoDiv.append(title);

    // 스킬 정보 표시
    champion.spells.forEach(spell => {
        const spellDiv = $('<div>', { css: { marginTop: '10px' } });
        spellDiv.append(`<strong>${spell.name}</strong>: ${spell.description}`);
        infoDiv.append(spellDiv);
    });
}