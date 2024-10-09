// main.js

// 전역 변수 선언
let championList = {};
let version = '';
let selectedSlot = null; // 현재 챔피언을 할당할 슬롯을 추적하기 위한 변수
let myTeamSlots = 1; // 현재 내 팀의 슬롯 개수 추적 (초기값 1)
let enemyTeamSlots = 1; // 현재 상대 팀의 슬롯 개수 추적 (초기값 1)
let currentChampionId = null; // 현재 활성화된 챔피언 ID
const MAX_SLOTS = 5;  // 최대 5개의 슬롯
let formationMemos = {}; // 구도 메모를 저장하는 객체 추가

// 포지션 정의
const roles = ['탑', '정글', '미드', '원딜', '서폿'];

// IndexedDB 설정
let db;
const dbRequest = indexedDB.open('ChampionMemoDB', 3); // 버전을 3으로 증가

dbRequest.onerror = function(event) {
    console.error('IndexedDB 오류:', event);
};

dbRequest.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('memos')) {
        db.createObjectStore('memos', { keyPath: 'championId' });
    }
    if (db.objectStoreNames.contains('formations')) {
        db.deleteObjectStore('formations');
    }
    db.createObjectStore('formations', { keyPath: 'key' }); // keyPath를 'key'로 변경
};

dbRequest.onsuccess = function(event) {
    db = event.target.result;

    // IndexedDB에서 formationMemos 불러오기
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
        console.error('구도 불러오기 오류:', event.target.error);
    };
};

// 페이지 로드 시 실행
$(document).ready(function() {
	$('#load-data-button').on('click', function() {
        const base64Data = prompt('불러올 데이터를 입력하세요:');
        if (base64Data) {
            loadDataFromBase64(base64Data);
        }
		});
    // Summernote 에디터 초기화 (챔피언 메모)
    $('#editor').summernote({
        height: 'auto',
        minHeight: 150,
        maxHeight: null,
        focus: true,
        lang: 'ko-KR',
        toolbar: [
            ['insert', ['link', 'picture', 'youtubeLinkEditor1', 'customImage']], // 링크, 이미지, YouTube 링크, 커스텀 이미지 삽입 버튼 추가
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['view', ['fullscreen', 'codeview', 'help']]
        ],
        buttons: {
            // YouTube 링크 삽입 버튼
            youtubeLinkEditor1: function(context) {
                var ui = $.summernote.ui;
                var button = ui.button({
                    contents: '<i class="note-icon-video"/>',
                    tooltip: 'Insert YouTube Link',
                    click: function() {
                        var url = prompt('YouTube URL을 입력하세요:');
                        if (url) {
                            var embedUrl;
                            var startTime = '';

                            // 시간 파라미터 추출 (예: ?t=211 또는 &t=211)
                            var timeMatch = url.match(/[?&]t=(\d+)/);
                            if (timeMatch) {
                                startTime = '?start=' + timeMatch[1]; // 시간 파라미터를 추출하여 embed URL에 추가
                            }
                           
                            // 짧은 YouTube 링크 처리 (https://youtu.be/ 형식)
                            if (url.includes('https://youtu.be/')) {
                                var videoId = url.split('https://youtu.be/')[1].split('?')[0]; // 비디오 ID 추출
                                embedUrl = 'https://www.youtube.com/embed/' + videoId + startTime;
                            }
                            // 표준 YouTube 링크 처리 (https://www.youtube.com/watch?v= 형식 포함)
                            else if (url.includes('https://www.youtube.com/watch?v=') || url.includes('https://youtube.com/watch?v=')) {
                                embedUrl = url.replace("watch?v=", "embed/") + startTime;
                            }
                            // YouTube Shorts 링크 처리 (https://www.youtube.com/shorts/ 형식 포함)
                            else if (url.includes('https://www.youtube.com/shorts/') || url.includes('https://youtube.com/shorts/')) {
                                embedUrl = url.replace("/shorts/", "/embed/") + startTime;
                            }

                            // iframe을 Summernote 에디터에 삽입
                            var iframeTag = '<iframe width="560" height="315" src="' + embedUrl + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
                            context.invoke('editor.pasteHTML', iframeTag);
                        }
                    }
                });
                return button.render();
            },
            // 커스텀 이미지 삽입 버튼
            customImage: function(context) {
                var ui = $.summernote.ui;
                var button = ui.button({
                    contents: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAACXElEQVR4nO2Yv6rqQBDG915uJ+SAhcFKUFiwCramMuAj+Ocd0mntI+wb5AHENJYWahebgJBKVFIECSYpLMKmPqcIiDfRHLOusZlftQybme9zd7JrEAIAAAAAAACAvHz/D6WULc9fvrKKh9GAqqrf+VFVla96xGygXq8X9lQ2/7hnzEZRlEqlwjFh0QZWqxXfhIwGTNPcbDYIoXa7fRuPosiyLEmSSqXSbTyebJomq863kWhTwzAQQoZhJOKP5sNrtPAe0HU9HvR6PS4JizbQ7/fjwe2+eoWiDfDSfQV64DkIIV9fX8vlkntmRgO2bd+NS5J094U4Go3YCv0KowFRFBNHVczd4BVBEOITDaVOQGYYDfi+z3Yzk2U5HvDqZsYm9jyP4SlBENjKZcC4Aq7rJiJRFMUD3/cRQpRSSqnrumEYOo5zPB6n0+krQh/x5x1JnyHR61EUiaLIkIe/AYzxYDCQZblarTYajURbB0Hged5+vz+dTuPxmHv1l8AYLxaL5/9hUkpnsxnG+NPCEUIIqapKKX1e/RXf94fD4YfVK4rCpv66FMzrwKcHDMNIH0xRFNm2fT6fwzCMI4Ig3G0MhJCu69eL6gdI/6iTySRjPiEkvZEKU3uHtIHs+Rjj9C5iK83nNhoEQeJjiW3b8/ncNM3tdns4HOIgxrjb7bZarU6nk8jw6HZYEOktkZd3fLTLR64TIIGmaR9WH6NpWt6XKaU0u92LBmNMCLEs61fdlmURQl6v+MbLnKIozWazXC7XarU44jjO5XLZ7Xbr9fp9dQEAAAAAAAAAAIBi+AESI/IlUWYc/gAAAABJRU5ErkJggg==" alt="Custom Image" width="20" height="20"/>',
                    tooltip: 'Insert Custom Image',
                    click: function() {
                        // base64 이미지 데이터
                        var imgTag = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAACXElEQVR4nO2Yv6rqQBDG915uJ+SAhcFKUFiwCramMuAj+Ocd0mntI+wb5AHENJYWahebgJBKVFIECSYpLMKmPqcIiDfRHLOusZlftQybme9zd7JrEAIAAAAAAACAvHz/D6WULc9fvrKKh9GAqqrf+VFVla96xGygXq8X9lQ2/7hnzEZRlEqlwjFh0QZWqxXfhIwGTNPcbDYIoXa7fRuPosiyLEmSSqXSbTyebJomq863kWhTwzAQQoZhJOKP5sNrtPAe0HU9HvR6PS4JizbQ7/fjwe2+eoWiDfDSfQV64DkIIV9fX8vlkntmRgO2bd+NS5J094U4Go3YCv0KowFRFBNHVczd4BVBEOITDaVOQGYYDfi+z3Yzk2U5HvDqZsYm9jyP4SlBENjKZcC4Aq7rJiJRFMUD3/cRQpRSSqnrumEYOo5zPB6n0+krQh/x5x1JnyHR61EUiaLIkIe/AYzxYDCQZblarTYajURbB0Hged5+vz+dTuPxmHv1l8AYLxaL5/9hUkpnsxnG+NPCEUIIqapKKX1e/RXf94fD4YfVK4rCpv66FMzrwKcHDMNIH0xRFNm2fT6fwzCMI4Ig3G0MhJCu69eL6gdI/6iTySRjPiEkvZEKU3uHtIHs+Rjj9C5iK83nNhoEQeJjiW3b8/ncNM3tdns4HOIgxrjb7bZarU6nk8jw6HZYEOktkZd3fLTLR64TIIGmaR9WH6NpWt6XKaU0u92LBmNMCLEs61fdlmURQl6v+MbLnKIozWazXC7XarU44jjO5XLZ7Xbr9fp9dQEAAAAAAAAAAIBi+AESI/IlUWYc/gAAAABJRU5ErkJggg==" alt="Custom Image" width="64" height="64"/>';
                        context.invoke('editor.pasteHTML', imgTag);
                    }
                });
                return button.render();
            }
        }
    });

    // 두 번째 Summernote 에디터 초기화 (구도페이지 메모)
    $('#formation-editor').summernote({
        height: 'auto',
        minHeight: 150,
        maxHeight: null,
        focus: true,
        lang: 'ko-KR',
        toolbar: [
            ['insert', ['link', 'picture', 'youtubeLinkEditor2']], // 링크, 이미지, YouTube 링크 삽입 버튼 추가
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['view', ['fullscreen', 'codeview', 'help']]
        ],
        buttons: {
            youtubeLinkEditor2: function(context) {
                var ui = $.summernote.ui;
                var button = ui.button({
                    contents: '<i class="note-icon-video"/>',
                    tooltip: 'Insert YouTube Link',
                    click: function() {
                        var url = prompt('YouTube URL을 입력하세요:');
                        if (url) {
                            var embedUrl;
                            var startTime = '';

                            // 시간 파라미터 추출 (예: ?t=211 또는 &t=211)
                            var timeMatch = url.match(/[?&]t=(\d+)/);
                            if (timeMatch) {
                                startTime = '?start=' + timeMatch[1]; // 시간 파라미터를 추출하여 embed URL에 추가
                            }

                            // 짧은 YouTube 링크 처리 (https://youtu.be/ 형식)
                            if (url.includes('https://youtu.be/')) {
                                var videoId = url.split('https://youtu.be/')[1].split('?')[0]; // 비디오 ID 추출
                                embedUrl = 'https://www.youtube.com/embed/' + videoId + startTime;
                            }
                            // 표준 YouTube 링크 처리 (https://www.youtube.com/watch?v= 형식 포함)
                            else if (url.includes('https://www.youtube.com/watch?v=') || url.includes('https://youtube.com/watch?v=')) {
                                embedUrl = url.replace("watch?v=", "embed/") + startTime;
                            }
                            // YouTube Shorts 링크 처리 (https://www.youtube.com/shorts/ 형식 포함)
                            else if (url.includes('https://www.youtube.com/shorts/') || url.includes('https://youtube.com/shorts/')) {
                                embedUrl = url.replace("/shorts/", "/embed/") + startTime;
                            }

                            // iframe을 Summernote 에디터에 삽입
                            var iframeTag = '<iframe width="560" height="315" src="' + embedUrl + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
                            context.invoke('editor.pasteHTML', iframeTag);
                        }
                    }
                });
                return button.render();
            }
        }
    });

    // 이벤트 리스너 추가
    $('#add-slot-button').on('click', addSlots);
    $('#remove-slot-button').on('click', removeSlots);
    $('#select-champion-button').on('click', function() {
        if (myTeamSlots > 0) {
            selectedSlot = $('#my-team').find('.team').children().eq(0)[0];
            displayRoleSelection();
        }
    });
    $('#close-modal-button').on('click', function() {
        $('#champion-selection').hide();
    });
    $('#save-formation-button').on('click', saveFormation); // 구도 저장 버튼
    $('#export-data-button').on('click', exportData);
    $('#import-data-button').on('click', function() {
        $('#import-file-input').click();
    });
    $('#import-file-input').on('change', importData);
    $('#save-memo-button').on('click', function() {
        const memoContent = $('#editor').summernote('code');
        if (currentChampionId) {
            saveMemo(currentChampionId, { memoContent: memoContent });
        } else {
            alert('챔피언이 선택되지 않았습니다.');
        }
    });
    $('#copy-to-clipboard-button').on('click', function() {
        exportDataToClipboard();
    });

    // 드래그바 초기화 (좌우)
    initializeVerticalDrag();
	initializeHorizontalDrag();
	$('#save-formation-button').appendTo('#formation-container');

    // 초기 데이터 로딩
    fetchChampionData();
});

// 드래그바 초기화 함수 (좌우)
function initializeVerticalDrag() {
    // 좌우 드래그바 (왼쪽)
    const verticalDividerLeft = document.getElementById('vertical-divider-left');
    let isDraggingLeft = false;

    verticalDividerLeft.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isDraggingLeft = true;
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDraggingLeft) return;

        const containerOffsetLeft = $('#split-container').offset().left;
        const pointerRelativeXpos = e.clientX - containerOffsetLeft;

        const containerWidth = $('#split-container').width();
        let newLeftWidth = pointerRelativeXpos - (verticalDividerLeft.offsetWidth / 2);

        // 최소 및 최대 너비 설정
        const minWidth = 150;
        const maxWidth = containerWidth - minWidth - verticalDividerLeft.offsetWidth - 250; // 250px은 오른쪽 최소 너비

        if (newLeftWidth < minWidth) newLeftWidth = minWidth;
        if (newLeftWidth > maxWidth) newLeftWidth = maxWidth;

        $('#info-container').css('flex', `0 0 ${newLeftWidth}px`);
        $('#main-container').css('flex', `2 1 auto`); // Adjust main-container flex if needed
        // Adjust Summernote editors
        $('#editor').summernote('resize');
        $('#formation-editor').summernote('resize');
    });

    document.addEventListener('mouseup', function() {
        isDraggingLeft = false;
    });

    // 오른쪽 드래그바
    const verticalDividerRight = document.getElementById('vertical-divider-right');
    let isDraggingRight = false;

    verticalDividerRight.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isDraggingRight = true;
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDraggingRight) return;

        const containerOffsetLeft = $('#split-container').offset().left;
        const containerWidth = $('#split-container').width();
        const pointerRelativeXpos = e.clientX - containerOffsetLeft;

        // 현재 왼쪽 영역의 너비
        const leftWidth = $('#info-container').width();

        // 전체 너비에서 왼쪽과 드래그바 너비를 뺀 나머지 너비
        let newRightWidth = containerWidth - pointerRelativeXpos - (verticalDividerRight.offsetWidth / 2);

        // 최소 및 최대 너비 설정
        const minWidth = 250;
        const maxWidth = containerWidth - minWidth - leftWidth - verticalDividerRight.offsetWidth;

        if (newRightWidth < minWidth) newRightWidth = minWidth;
        if (newRightWidth > maxWidth) newRightWidth = maxWidth;

        $('#memo-container').css('flex', `0 0 ${newRightWidth}px`);
        $('#main-container').css('flex', `2 1 auto`); // Adjust main-container flex if needed
        // Adjust Summernote editors
        $('#editor').summernote('resize');
        $('#formation-editor').summernote('resize');
    });

    document.addEventListener('mouseup', function() {
        isDraggingRight = false;
    });

    // 터치 이벤트 (모바일 지원)
    // 왼쪽 드래그바
    verticalDividerLeft.addEventListener('touchstart', function(e) {
        e.preventDefault();
        isDraggingLeft = true;
    });

    document.addEventListener('touchmove', function(e) {
        if (!isDraggingLeft) return;
        const touch = e.touches[0];
        const containerOffsetLeft = $('#split-container').offset().left;
        const pointerRelativeXpos = touch.clientX - containerOffsetLeft;

        const containerWidth = $('#split-container').width();
        let newLeftWidth = pointerRelativeXpos - (verticalDividerLeft.offsetWidth / 2);

        // 최소 및 최대 너비 설정
        const minWidth = 150;
        const maxWidth = containerWidth - minWidth - verticalDividerLeft.offsetWidth - 250; // 250px은 오른쪽 최소 너비

        if (newLeftWidth < minWidth) newLeftWidth = minWidth;
        if (newLeftWidth > maxWidth) newLeftWidth = maxWidth;

        $('#info-container').css('flex', `0 0 ${newLeftWidth}px`);
        $('#main-container').css('flex', `2 1 auto`); // Adjust main-container flex if needed
        // Adjust Summernote editors
        $('#editor').summernote('resize');
        $('#formation-editor').summernote('resize');
    });

    document.addEventListener('touchend', function() {
        isDraggingLeft = false;
    });

    // 오른쪽 드래그바
    verticalDividerRight.addEventListener('touchstart', function(e) {
        e.preventDefault();
        isDraggingRight = true;
    });

    document.addEventListener('touchmove', function(e) {
        if (!isDraggingRight) return;
        const touch = e.touches[0];
        const containerOffsetLeft = $('#split-container').offset().left;
        const containerWidth = $('#split-container').width();
        const pointerRelativeXpos = touch.clientX - containerOffsetLeft;

        // 현재 왼쪽 영역의 너비
        const leftWidth = $('#info-container').width();

        // 전체 너비에서 왼쪽과 드래그바 너비를 뺀 나머지 너비
        let newRightWidth = containerWidth - pointerRelativeXpos - (verticalDividerRight.offsetWidth / 2);

        // 최소 및 최대 너비 설정
        const minWidth = 250;
        const maxWidth = containerWidth - minWidth - leftWidth - verticalDividerRight.offsetWidth;

        if (newRightWidth < minWidth) newRightWidth = minWidth;
        if (newRightWidth > maxWidth) newRightWidth = maxWidth;

        $('#memo-container').css('flex', `0 0 ${newRightWidth}px`);
        $('#main-container').css('flex', `2 1 auto`); // Adjust main-container flex if needed
        // Adjust Summernote editors
        $('#editor').summernote('resize');
        $('#formation-editor').summernote('resize');
    });

    document.addEventListener('touchend', function() {
        isDraggingRight = false;
    });
}

// 챔피언 데이터 가져오기
function fetchChampionData() {
    fetch('https://ddragon.leagueoflegends.com/api/versions.json')
        .then(response => response.json())
        .then(versions => {
            version = versions[0]; // 가장 최신 버전 사용
            return fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`);
        })
        .then(response => response.json())
        .then(data => {
            championList = data.data;
            initializeTeamSlots();
        })
        .catch(error => {
            console.error('챔피언 데이터 로드 실패:', error);
        });
}

// 역할 선택 및 챔피언 리스트 표시
function displayRoleSelection() {
    const modal = $('#champion-selection');
    modal.show();

    const roleSelectionDiv = $('#role-selection');
    roleSelectionDiv.empty();

    // 포지션 버튼 추가
    roles.forEach(role => {
        const roleButton = $('<button>', {
            text: role,
            css: { margin: '5px' },
            click: () => displayChampionList(role)
        });
        roleSelectionDiv.append(roleButton);
    });

    // "전체" 버튼 추가
    const allButton = $('<button>', {
        text: '전체',
        css: { margin: '5px' },
        click: () => displayChampionList('전체')  // '전체' 선택 시 모든 챔피언 표시
    });
    roleSelectionDiv.append(allButton);
}

// 역할별 챔피언 리스트 표시
function displayChampionList(role) {
    const championListDiv = $('#champion-list');
    championListDiv.empty();

    // '전체' 버튼을 누른 경우 모든 챔피언을 표시
    let champions;
    if (role === '전체') {
        champions = Object.values(championList);  // 전체 챔피언 리스트
    } else {
        // 선택된 역할에 맞는 챔피언만 필터링
        champions = Object.values(championList).filter(champion => {
            return champion.tags.includes(getRoleTag(role));
        });
    }

    // 챔피언 버튼 추가
    champions.forEach(champion => {
        const champButton = $('<button>', {
            css: { 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: '10px', 
                border: '1px solid #000', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '4px', 
                textAlign: 'center', 
                cursor: 'pointer' 
            }
        });
        // 챔피언 이미지 추가
        const champImg = $('<img>', {
            src: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.id}.png`,
            alt: champion.name,
            css: { 
                width: '80px', 
                height: '80px', 
                objectFit: 'cover', 
                marginBottom: '5px' 
            }
        });
        champButton.append(champImg);

        // 챔피언 이름 추가
        const champName = $('<span>', {
            text: champion.name
        });
        champButton.append(champName);

        champButton.on('click', () => selectChampion(champion.id));
        championListDiv.append(champButton);
    });
}

// 역할에 맞는 태그 반환
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

// 챔피언을 선택했을 때 호출되는 함수
function selectChampion(championId) {
    if (selectedSlot) {
        setChampionToSlot(selectedSlot, championId);
    }

    // 모달 닫기
    $('#champion-selection').hide();
}

// 슬롯에 챔피언 설정
function setChampionToSlot(slot, championId) {
    $(slot).empty();
    const img = $('<img>', {
        src: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`,
        alt: championId,
        css: { 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            borderRadius: '4px' 
        }
    });
    $(slot).append(img);

    // 슬롯 클릭 시 챔피언 상세 정보 및 메모 활성화 (한 번 클릭 시 정보 표시, 두 번 클릭 시 챔피언 재선택)
    let clickTimeout = null;
    $(slot).off('click').on('click', function(event) {
        if (clickTimeout !== null) {
            // 두 번 클릭 (더블 클릭)
            clearTimeout(clickTimeout);
            clickTimeout = null;
            selectedSlot = slot;
            displayRoleSelection();
        } else {
            // 한 번 클릭
            clickTimeout = setTimeout(() => {
                const championId = $(slot).find('img').attr('alt');
                if (championId) {
                    displayChampionInfo(championId);
                    enableMemo(championId);
                }
                clickTimeout = null;
            }, 300); // 300ms 내에 두 번 클릭이 없으면 단일 클릭으로 간주
        }

        // 첫 번째 슬롯 변경 시 구도 메모 업데이트
        const slotIndex = $(slot).index();
        const teamContainer = $(slot).parent().parent().attr('id'); // 'my-team' 또는 'enemy-team'

        if (slotIndex === 0 && (teamContainer === 'my-team' || teamContainer === 'enemy-team')) {
            checkAndUpdateFormationMemo();
        }
    });
}

// 챔피언 상세 정보 표시
function displayChampionInfo(championId) {
    currentChampionId = championId;
    fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion/${championId}.json`)
        .then(response => response.json())
        .then(data => {
            const champion = data.data[championId];
            const infoDiv = $('#champion-info');
            infoDiv.empty();

            // 챔피언 이미지
            const img = $('<img>', {
                src: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_0.jpg`,
                alt: champion.name,
                css: {
                    width: '100%',
                    borderRadius: '8px',
                    maxWidth: '600px', // 이미지 크기 제한
                    height: 'auto'
                }
            });
            infoDiv.append(img);

            // 기본 스펙
            const statsDiv = $('<div>').html(`
                <h3>기본 스펙</h3>
                <p>공격력: ${champion.stats.attackdamage}</p>
                <p>방어력: ${champion.stats.armor}</p>
                <p>체력: ${champion.stats.hp}</p>
                <p>마나: ${champion.stats.mp}</p>
                <p>이동 속도: ${champion.stats.movespeed}</p>
            `);
            infoDiv.append(statsDiv);

            // 스킬 아이콘 및 설명
            champion.spells.forEach(spell => {
                const spellDiv = $('<div>', {
                    css: {
                        display: 'flex',
                        alignItems: 'center',
                        margin: '10px 0',
                        cursor: 'pointer' // 스킬 클릭 가능하도록 포인터로 변경
                    },
                    click: () => insertSpellImageToEditor(spell.image.full, spell.name) // 클릭 시 이미지 삽입
                });

                const spellImg = $('<img>', {
                    src: `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.image.full}`,
                    alt: spell.name,
                    css: {
                        width: '50px',
                        height: '50px',
                        marginRight: '10px'
                    }
                });
                spellDiv.append(spellImg);

                const spellDesc = $('<div>').html(`<strong>${spell.name}</strong>: ${spell.description} <br>쿨타임: ${spell.cooldownBurn}`);
                spellDiv.append(spellDesc);

                infoDiv.append(spellDiv);
            });

            // 패시브 스킬
            const passiveDiv = $('<div>', {
                css: {
                    display: 'flex',
                    alignItems: 'center',
                    margin: '10px 0',
                    cursor: 'pointer' // 패시브 클릭 가능
                },
                click: () => insertSpellImageToEditor(`passive/${champion.passive.image.full}`, champion.passive.name) // 클릭 시 패시브 이미지 삽입
            });

            const passiveImg = $('<img>', {
                src: `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/${champion.passive.image.full}`,
                alt: champion.passive.name,
                css: {
                    width: '50px',
                    height: '50px',
                    marginRight: '10px'
                }
            });
            passiveDiv.append(passiveImg);

            const passiveDesc = $('<div>').html(`<strong>${champion.passive.name}</strong>: ${champion.passive.description}`);
            passiveDiv.append(passiveDesc);

            infoDiv.append(passiveDiv);
        })
        .catch(error => {
            console.error('챔피언 정보 로드 실패:', error);
        });
}

// 팀 슬롯 초기화 함수
function initializeTeamSlots() {
    const myTeamContainer = $('#my-team').find('.team');
    const enemyTeamContainer = $('#enemy-team').find('.team');
    myTeamContainer.empty();
    enemyTeamContainer.empty();

    myTeamSlots = 1; // 초기 슬롯 개수를 1로 설정
    enemyTeamSlots = 1;

    // 내 팀 슬롯 생성
    const mySlot = $('<div>', {
        class: 'slot',
        text: '내 팀 슬롯 1',
        click: (event) => handleSlotClick(event, mySlot[0])
    });
    myTeamContainer.append(mySlot);

    // 상대 팀 슬롯 생성
    const enemySlot = $('<div>', {
        class: 'slot',
        text: '상대 팀 슬롯 1',
        click: (event) => handleSlotClick(event, enemySlot[0])
    });
    enemyTeamContainer.append(enemySlot);

    // 비교 버튼 추가
    $('#comparison-buttons').empty(); // 기존 버튼 초기화
    addComparisonButton(1, 1);
}

// 슬롯 클릭 이벤트 처리
function handleSlotClick(event, slot) {
    const clickCount = event.detail;
    if (clickCount === 1) {
        // 한 번 클릭 시 챔피언 정보와 메모 활성화
        const championId = $(slot).find('img').attr('alt');
        if (championId) {
            displayChampionInfo(championId);
            enableMemo(championId);
        }
    } else if (clickCount === 2) {
        // 두 번 클릭 시 챔피언 선택 모달 열기
        selectedSlot = slot;
        displayRoleSelection();
    }
}

// 슬롯 추가 함수 (+ 버튼을 누를 때 호출)
// 슬롯 추가 함수 (+ 버튼을 누를 때 호출)
function addSlots() {
    const myTeamContainer = $('#my-team').find('.team');
    const enemyTeamContainer = $('#enemy-team').find('.team');

    if (myTeamSlots < MAX_SLOTS) { // 최대 5개의 슬롯
        myTeamSlots++;
        enemyTeamSlots++;

        // 내 팀 슬롯 추가
        const mySlot = $('<div>', {
            class: 'slot',
            text: `내 팀 슬롯 ${myTeamSlots}`,
            click: (event) => handleSlotClick(event, mySlot[0])
        });
        myTeamContainer.append(mySlot);

        // 상대 팀 슬롯 추가
        const enemySlot = $('<div>', {
            class: 'slot',
            text: `상대 팀 슬롯 ${enemyTeamSlots}`,
            click: (event) => handleSlotClick(event, enemySlot[0])
        });
        enemyTeamContainer.append(enemySlot);

        // 비교 버튼 추가
        addComparisonButton(myTeamSlots, enemyTeamSlots);
    } else {
        alert('최대 슬롯 개수에 도달했습니다.');
    }
}


// 슬롯 제거 함수 (- 버튼을 누를 때 호출)
function removeSlots() {
    // 내 팀 슬롯 제거
    if (myTeamSlots > 1) { // 최소 1개의 슬롯은 유지
        const myTeamContainer = $('#my-team').find('.team');
        myTeamContainer.children().last().remove();
        myTeamSlots--;
    }

    // 상대 팀 슬롯 제거
    if (enemyTeamSlots > 1) { // 최소 1개의 슬롯은 유지
        const enemyTeamContainer = $('#enemy-team').find('.team');
        enemyTeamContainer.children().last().remove();
        enemyTeamSlots--;
    }

    // 마지막 슬롯과 연결된 비교 버튼 제거
    if ($('#comparison-buttons').children().length > 1) {
        $('#comparison-buttons').children().last().remove();  // 마지막 비교 버튼 삭제
    }
}


// 비교 버튼 추가 함수 (슬롯 번호에 맞춰 추가)
function addComparisonButton(mySlotNumber, enemySlotNumber) {
    const comparisonContainer = $('#comparison-buttons');
    const comparisonButton = $('<button>', {
        class: 'compare-btn',
        text: `비교 ${mySlotNumber}/${enemySlotNumber}`,
        click: () => {
            console.log(`비교 버튼 클릭됨: 내 팀 슬롯 ${mySlotNumber}, 상대 팀 슬롯 ${enemySlotNumber}`);
            compareSlots(mySlotNumber, enemySlotNumber);
        }
    });
    comparisonContainer.append(comparisonButton);
}



// 데이터 내보내기 함수
function exportData() {
    const data = {
        version: version,
        myTeamSlots: myTeamSlots,
        enemyTeamSlots: enemyTeamSlots,
        myTeam: [],
        enemyTeam: [],
        formationMemo: $('#formation-editor').summernote('code'),
        memoContent: $('#editor').summernote('code'), // 챔피언 메모 에디터 내용 추가
        formationMemos: formationMemos // formationMemos 추가
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
}

// 데이터 불러오기 함수
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
            formationMemos = data.formationMemos || {}; // formationMemos 추가

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

// 메모 저장
function saveMemo(championId, memo) {
    if (!db) {
        alert('데이터베이스가 초기화되지 않았습니다.');
        return;
    }
    const transaction = db.transaction(['memos'], 'readwrite');
    const store = transaction.objectStore('memos');
    store.put({ championId: championId, memoContent: memo.memoContent });
    alert('메모가 저장되었습니다.');
}

// 메모 불러오기
function loadMemo(championId, callback) {
    if (!db) {
        alert('데이터베이스가 초기화되지 않았습니다.');
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

// 메모 기능 활성화
function enableMemo(championId) {
    currentChampionId = championId;
    // '챔피언 메모' 섹션 표시
    $('#memo-container').show();
    // 메모 에디터 내용을 불러옵니다.
    loadMemo(championId, memo => {
        $('#editor').summernote('code', memo.memoContent || '');
    });
}

// 구도 저장 함수
function saveFormation() {
    // Get the champion IDs in the first slots
    const myTeamFirstSlot = $('#my-team').find('.team').children().eq(0);
    const enemyTeamFirstSlot = $('#enemy-team').find('.team').children().eq(0);

    const myChampionId = myTeamFirstSlot.find('img').attr('alt');
    const enemyChampionId = enemyTeamFirstSlot.find('img').attr('alt');

    if (myChampionId && enemyChampionId) {
        const key = `${myChampionId}-${enemyChampionId}`;
        const memoContent = $('#formation-editor').summernote('code');

        formationMemos[key] = memoContent;

        if (!db) {
            alert('데이터베이스가 초기화되지 않았습니다.');
            return;
        }

        const transaction = db.transaction(['formations'], 'readwrite');
        const store = transaction.objectStore('formations');
        store.put({ key: key, memoContent: memoContent });

        transaction.oncomplete = function() {
            alert('구도가 저장되었습니다.');
        };

        transaction.onerror = function(event) {
            console.error('구도 저장 오류:', event.target.error);
            alert('구도 저장에 실패했습니다.');
        };
    } else {
        alert('내 팀과 상대 팀의 첫 번째 슬롯에 모두 챔피언을 선택해야 합니다.');
    }
}

// 첫 번째 슬롯 변경 시 구도 메모 업데이트 함수
function checkAndUpdateFormationMemo() {
    // Get the champion IDs in the first slots
    const myTeamFirstSlot = $('#my-team').find('.team').children().eq(0);
    const enemyTeamFirstSlot = $('#enemy-team').find('.team').children().eq(0);

    const myChampionId = myTeamFirstSlot.find('img').attr('alt');
    const enemyChampionId = enemyTeamFirstSlot.find('img').attr('alt');

    if (myChampionId && enemyChampionId) {
        const key = `${myChampionId}-${enemyChampionId}`;
        if (formationMemos[key]) {
            // A memo exists for this combination
            $('#formation-editor').summernote('code', formationMemos[key]);
        } else {
            // No memo exists, clear the editor
            $('#formation-editor').summernote('code', '');
        }
    }
}

// 데이터 클립보드로 내보내기 함수
// 두 번째 exportDataToClipboard() 함수 유지
function exportDataToClipboard() {
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
    try {
        const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
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
}


// 비교 기능 관련 함수들 (compareSlots, getColor 등)

// Function to compare slots and show graph
// Function to compare slots and show graph
function compareSlots(mySlotNumber, enemySlotNumber) {
    // 1-based index를 0-based index로 변환
    const mySlotIndex = mySlotNumber - 1;
    const enemySlotIndex = enemySlotNumber - 1;

    // 모달 생성
    const modal = $('<div>', {
        class: 'modal',
        id: 'compare-modal'
    });

    const modalContent = $('<div>', {
        class: 'modal-content'
    });

    const closeButton = $('<button>', {
        text: '닫기',
        click: () => modal.remove(),
        css: { marginBottom: '10px' }
    });

    // 페이지 네비게이션 생성
    const pageNav = $('<div>', {
        class: 'page-nav',
        css: { marginBottom: '10px' }
    });
    const page1Button = $('<button>', { text: '스탯', click: () => showPage(1) });
    const page2Button = $('<button>', { text: '스킬쿨', click: () => showPage(2) });
    pageNav.append(page1Button, page2Button);

    // 페이지 컨텐츠 생성
    const page1 = $('<div>', { class: 'compare-page', id: 'compare-page-1' });
    const page2 = $('<div>', { class: 'compare-page', id: 'compare-page-2', css: { display: 'none' } });

    const statCanvas = $('<canvas>', { id: 'stat-comparison-chart', width: 400, height: 200 });
    const skillCanvas = $('<canvas>', { id: 'skill-comparison-chart', width: 400, height: 200 });
    page1.append(statCanvas);
    page2.append(skillCanvas);

    // 슬롯에서 챔피언 ID 가져오기
    const myTeamContainer = $('#my-team').find('.team');
    const enemyTeamContainer = $('#enemy-team').find('.team');

    const mySlot = myTeamContainer.children().eq(mySlotIndex);
    const enemySlot = enemyTeamContainer.children().eq(enemySlotIndex);

    const myChampionId = mySlot.find('img').attr('alt');
    const enemyChampionId = enemySlot.find('img').attr('alt');

    console.log('CompareSlots 호출됨');
    console.log('My Champion ID:', myChampionId);
    console.log('Enemy Champion ID:', enemyChampionId);


    if (!myChampionId || !enemyChampionId) {
        alert('비교할 챔피언이 선택되지 않았습니다.');
        modal.remove(); // 모달 제거
        return;
    }

    // 챔피언 데이터 요청
    const champIds = [myChampionId, enemyChampionId];
    const championDataPromises = champIds.map(champId => {
        return fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion/${champId}.json`)
            .then(response => response.json())
            .then(data => data.data[champId]);
    });

    Promise.all(championDataPromises).then(championsData => {
        const allCooldowns = [];

        championsData.forEach(champion => {
            champion.spells.forEach(spell => {
                allCooldowns.push(...spell.cooldown); // 스킬 쿨다운을 allCooldowns 배열에 추가
            });
        });

        const maxCooldownValue = Math.max(...allCooldowns); // 최대 쿨다운 값 계산

        const statCtx = document.getElementById('stat-comparison-chart').getContext('2d');
        const skillCtx = document.getElementById('skill-comparison-chart').getContext('2d');

        const statLabels = ['공격력', '방어력', '체력', '마나', '이동속도'];
        const skillLabels = ['레벨 1', '레벨 2', '레벨 3', '레벨 4', '레벨 5'];

        // 스탯 데이터셋 생성
		
		
		
		
        const statDatasets = championsData.map((champion, index) => {
            return {
                label: champion.name,
                data: [
                    champion.stats.attackdamage,
                    champion.stats.armor,
                    champion.stats.hp,
                    champion.stats.mp,
                    champion.stats.movespeed
                ],
                backgroundColor: getColor(index, 0),
                borderColor: getColor(index, 1),
                borderWidth: 1
            };
        });

        // 스킬 쿨다운 데이터셋 생성
        const skillDatasets = championsData.map((champion, championIndex) => {
            return champion.spells.map((spell, spellIndex) => {
                return {
                    label: `${champion.name} - ${spell.name}`,
                    data: spell.cooldown.slice(0, 5), // 첫 5개의 레벨만 사용
                    borderColor: getColor(championIndex, spellIndex),
                    backgroundColor: 'rgba(0, 0, 0, 0)', // 배경을 투명하게 설정
                    fill: false,
                    borderWidth: 2
                };
            });
        }).flat(); // 중첩된 배열을 평평하게 만듦

        // 스탯 비교 차트 생성
        new Chart(statCtx, {
            type: 'bar',
            data: {
                labels: statLabels,
                datasets: statDatasets
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        formatter: function(value) {
                            return value.toFixed(1); // 소수점 한 자리로 표시
                        },
                        color: '#000'
                    }
                }
            }
        });

        // 스킬 쿨다운 비교 차트 생성
		new Chart(skillCtx, {
			type: 'bar', // 막대형 차트로 설정
			data: {
				labels: skillLabels,
				datasets: skillDatasets // 데이터셋은 이미 준비된 상태입니다.
			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						position: 'top', // 범례 위치
					},
					tooltip: {
						mode: 'index',
						intersect: true // 막대가 교차된 지점에서만 툴팁을 표시하도록 설정
					}
				},
				scales: {
					x: {
						stacked: false // x축 스택을 해제하여 막대가 나란히 배치되도록 설정
					},
					y: {
						beginAtZero: true // y축의 시작점을 0으로 설정
					}
				},
				interaction: {
					mode: 'nearest', // 가장 가까운 막대와 상호작용
					axis: 'x', // x축 기준으로 상호작용
					intersect: true // 교차된 부분에 대해서만 반응하도록 설정
				},
				barPercentage: 0.6, // 각 데이터셋의 막대 너비 비율 설정 (0~1 사이 값으로 조정 가능)
				categoryPercentage: 0.8 // 그룹 내 막대들의 너비 비율 설정
			}
		});
    }).catch(error => {
        console.error('챔피언 데이터 로드 실패:', error);
        alert('챔피언 데이터 로드에 실패했습니다.');
    });

    // 모달을 화면에 추가 및 표시
    modalContent.append(closeButton, pageNav, page1, page2);
    modal.append(modalContent);
    $('body').append(modal);
    modal.show();
}


// 페이지 전환 함수



// 색상 가져오기 함수


// getColor 함수 추가
// 스킬 인덱스에 따라 색상을 결정하는 함수
function getColor(championIndex, spellIndex) {
    const baseColors = [
        'rgba(255, 99, 132, ',   // 빨강
        'rgba(54, 162, 235, ',   // 파랑
        'rgba(255, 206, 86, ',   // 노랑
        'rgba(75, 192, 192, ',   // 초록
        'rgba(153, 102, 255, ',  // 보라
        'rgba(255, 159, 64, '    // 주황
    ];

    // 챔피언과 스킬 인덱스를 기반으로 색상 생성
    const opacity = 0.5 + (spellIndex * 0.05); // 각 스킬마다 투명도를 줄여서 구분
    return `${baseColors[championIndex % baseColors.length]}${opacity})`;
}

function insertSpellImageToEditor(imageName, spellName) {
    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${imageName}`;
    
    // Summernote 에디터에 이미지 삽입
    $('#editor').summernote('insertImage', imageUrl, spellName);
}

// Function to show the selected page
function showPage(pageNumber) {
    if (pageNumber === 1) {
        $('#compare-page-1').show();
        $('#compare-page-2').hide();
    } else if (pageNumber === 2) {
        $('#compare-page-1').hide();
        $('#compare-page-2').show();
    }
}

// Function to compare slots and show graph (already implemented above)

    // This function is already implemented above.
    // It's included here to ensure no duplication errors.


// 드래그바 초기화 함수 (상하)
// 드래그바 초기화 함수 (상하)
function initializeHorizontalDrag() {
    const horizontalDivider = document.getElementById('horizontal-divider');
    let isDragging = false;

    horizontalDivider.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isDragging = true;
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        // 창의 전체 높이에서 마우스의 Y 위치를 기준으로 상단과 하단의 높이를 설정
        const containerOffsetTop = $('#container').offset().top;
        const pointerRelativeYpos = e.clientY - containerOffsetTop;

        const containerHeight = $('#container').height();
        let newTopHeight = pointerRelativeYpos - (horizontalDivider.offsetHeight / 2);

        // 최소 및 최대 높이 설정
        const minHeight = 100; // 상단 최소 높이
        const maxHeight = containerHeight - minHeight - horizontalDivider.offsetHeight - 200; // 하단 최소 높이 (200px로 설정)

        if (newTopHeight < minHeight) newTopHeight = minHeight;
        if (newTopHeight > maxHeight) newTopHeight = maxHeight;

        $('#top-container').css('flex', `0 0 ${newTopHeight}px`);
        $('#formation-container').css('flex', `0 0 ${containerHeight - newTopHeight - horizontalDivider.offsetHeight}px`);

        // Summernote 에디터 리사이즈
        $('#editor').summernote('resize');
        $('#formation-editor').summernote('resize');
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // 터치 이벤트 (모바일 지원)
    horizontalDivider.addEventListener('touchstart', function(e) {
        e.preventDefault();
        isDragging = true;
    });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        const touch = e.touches[0];
        const containerOffsetTop = $('#container').offset().top;
        const pointerRelativeYpos = touch.clientY - containerOffsetTop;

        const containerHeight = $('#container').height();
        let newTopHeight = pointerRelativeYpos - (horizontalDivider.offsetHeight / 2);

        // 최소 및 최대 높이 설정
        const minHeight = 100; // 상단 최소 높이
        const maxHeight = containerHeight - minHeight - horizontalDivider.offsetHeight - 200; // 하단 최소 높이 (200px로 설정)

        if (newTopHeight < minHeight) newTopHeight = minHeight;
        if (newTopHeight > maxHeight) newTopHeight = maxHeight;

        $('#top-container').css('flex', `0 0 ${newTopHeight}px`);
        $('#formation-container').css('flex', `0 0 ${containerHeight - newTopHeight - horizontalDivider.offsetHeight}px`);

        // Summernote 에디터 리사이즈
        $('#editor').summernote('resize');
        $('#formation-editor').summernote('resize');
    });

    document.addEventListener('touchend', function() {
        isDragging = false;
    });
}


// main.js

// ... 기존 코드 ...

function loadDataFromBase64(base64Data) {
    try {
        const jsonStr = decodeURIComponent(escape(atob(base64Data)));
        const data = JSON.parse(jsonStr);

        // 데이터 적용
        version = data.version;
        myTeamSlots = data.myTeamSlots;
        enemyTeamSlots = data.enemyTeamSlots;
        formationMemos = data.formationMemos || {}; // 추가된 부분

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

// 기존 데이터 로딩 버튼 이벤트 리스너 수정


