// ui.js

// UI-related variables
let selectedSlot = null;
let myTeamSlots = 1;
let enemyTeamSlots = 1;
const MAX_SLOTS = 5;
const roles = ['탑', '정글', '미드', '원딜', '서폿'];

// Document Ready
$(document).ready(function() {
    // Event Listeners


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
    


    // Initialize Drags
    initializeVerticalDrag();
    initializeHorizontalDrag();
    $('#save-formation-button').appendTo('#formation-container');

    // Load Initial Data
    fetchChampionData();
	
});

// Initialize Vertical Drag
function initializeVerticalDrag() {
    // Existing code for vertical drag
}

// Initialize Horizontal Drag
function initializeHorizontalDrag() {
    // Existing code for horizontal drag
}

// Display Role Selection
function displayRoleSelection() {
    const modal = $('#champion-selection');
    modal.show();

    const roleSelectionDiv = $('#role-selection');
    roleSelectionDiv.empty();

    roles.forEach(role => {
        const roleButton = $('<button>', {
            text: role,
            css: { margin: '5px' },
            click: () => displayChampionList(role)
        });
        roleSelectionDiv.append(roleButton);
    });

    const allButton = $('<button>', {
        text: '전체',
        css: { margin: '5px' },
        click: () => displayChampionList('전체')
    });
    roleSelectionDiv.append(allButton);
}

// Display Champion List
function displayChampionList(role) {
    const championListDiv = $('#champion-list');
    championListDiv.empty();

    let champions;
    if (role === '전체') {
        champions = Object.values(championList);
    } else {
        champions = Object.values(championList).filter(champion => {
            return champion.tags.includes(getRoleTag(role));
        });
    }

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

        const champName = $('<span>', {
            text: champion.name
        });
        champButton.append(champName);

        champButton.on('click', () => selectChampion(champion.id));
        championListDiv.append(champButton);
    });
}

// Select Champion
function selectChampion(championId) {
    if (selectedSlot) {
        setChampionToSlot(selectedSlot, championId);
    }
    $('#champion-selection').hide();
}

// Set Champion to Slot
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

    let clickTimeout = null;
    $(slot).off('click').on('click', function(event) {
        if (clickTimeout !== null) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
            selectedSlot = slot;
            displayRoleSelection();
        } else {
            clickTimeout = setTimeout(() => {
                const championId = $(slot).find('img').attr('alt');
                if (championId) {
                    displayChampionInfo(championId);
                    enableMemo(championId);
                }
                clickTimeout = null;
            }, 300);
        }

        const slotIndex = $(slot).index();
        const teamContainer = $(slot).parent().parent().attr('id');

        if (slotIndex === 0 && (teamContainer === 'my-team' || teamContainer === 'enemy-team')) {
            checkAndUpdateFormationMemo();
        }
    });
}

// 챔피언 정보 표시
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
                    maxWidth: '600px',
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

            // 스킬 정보 (쿨다운, 사거리, 데미지)
            champion.spells.forEach((spell, index) => {
                const spellDiv = $('<div>', {
                    css: {
                        display: 'flex',
                        alignItems: 'center',
                        margin: '10px 0',
                        cursor: 'pointer'
                    },
                    click: () => insertSpellEmbedToEditor(spell.name, spell.image.full)
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

                // 스킬 데미지 처리
                let damageText = '없음'; // 기본값
                if (spell.effectBurn && spell.effectBurn.length > 0) {
                    damageText = spell.effectBurn.join(' / '); // 각 레벨별 데미지를 '/'로 구분
                }

                const spellDesc = $('<div>').html(`
                    <strong>${spell.name} (${getSpellKey(index)})</strong>: ${spell.description} <br>
                    쿨다운: ${spell.cooldownBurn} 초 <br>
                    사거리: ${spell.rangeBurn || '알 수 없음'} <br>
                    데미지: ${damageText}
                `);
                spellDiv.append(spellDesc);

                infoDiv.append(spellDiv);
            });

            // 패시브 스킬
            const passiveDiv = $('<div>', {
                css: {
                    display: 'flex',
                    alignItems: 'center',
                    margin: '10px 0',
                    cursor: 'pointer'
                },
                click: () => insertSpellEmbedToEditor(champion.passive.name, `passive/${champion.passive.image.full}`)
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

// 스킬 키(Q, W, E, R)를 반환하는 함수
function getSpellKey(index) {
    switch (index) {
        case 0:
            return 'Q';
        case 1:
            return 'W';
        case 2:
            return 'E';
        case 3:
            return 'R';
        default:
            return '';
    }
}




// Insert Spell Embed to Editor
function insertSpellEmbedToEditor(spellName, spellImage) {
    const embedCode = `<img src="https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spellImage}" alt="${spellName}" width="64" height="64" style="object-fit: cover; border-radius: 4px; overflow: hidden;">`;
    $('#editor').summernote('editor.pasteHTML', embedCode);
}

// Initialize Team Slots
// 팀 슬롯 초기화 함수
function initializeTeamSlots() {
    const myTeamContainer = $('#my-team').find('.team');
    const enemyTeamContainer = $('#enemy-team').find('.team');
    
    // 기존 슬롯의 데이터를 저장
    const myTeamData = [];
    const enemyTeamData = [];

    myTeamContainer.children().each(function () {
        const championId = $(this).find('img').attr('alt');
        myTeamData.push(championId);
    });

    enemyTeamContainer.children().each(function () {
        const championId = $(this).find('img').attr('alt');
        enemyTeamData.push(championId);
    });

    // 슬롯 초기화
    myTeamContainer.empty();
    enemyTeamContainer.empty();

    // 기존 데이터가 있으면 그에 맞춰 슬롯 수를 조정, 없으면 1로 설정
    myTeamSlots = myTeamData.length > 0 ? myTeamData.length : 1;
    enemyTeamSlots = enemyTeamData.length > 0 ? enemyTeamData.length : 1;

    // 슬롯을 재생성하며 기존 데이터를 설정
    for (let i = 0; i < myTeamSlots; i++) {
        const mySlot = $('<div>', {
            class: 'slot',
            text: `우리팀${i + 1}`,
            click: (event) => handleSlotClick(event, mySlot[0])
        });
        if (myTeamData[i]) {
            setChampionToSlot(mySlot[0], myTeamData[i]);
        }
        myTeamContainer.append(mySlot);
    }

    for (let i = 0; i < enemyTeamSlots; i++) {
        const enemySlot = $('<div>', {
            class: 'slot',
            text: `적팀${i + 1}`,
            click: (event) => handleSlotClick(event, enemySlot[0])
        });
        if (enemyTeamData[i]) {
            setChampionToSlot(enemySlot[0], enemyTeamData[i]);
        }
        enemyTeamContainer.append(enemySlot);
    }

    // 비교 버튼 초기화 및 재설정
    $('#comparison-buttons').empty();
    addComparisonButton(myTeamSlots, enemyTeamSlots);
}

// 슬롯 클릭 핸들러
function handleSlotClick(event, slot) {
    const clickCount = event.detail;
    if (clickCount === 1) {
        const championId = $(slot).find('img').attr('alt');
        if (championId) {
            displayChampionInfo(championId);
            enableMemo(championId);
        }
    } else if (clickCount === 2) {
        selectedSlot = slot;
        displayRoleSelection();
    }
}

// 슬롯 추가 함수
function addSlots() {
    const myTeamContainer = $('#my-team').find('.team');
    const enemyTeamContainer = $('#enemy-team').find('.team');

    if (myTeamSlots < MAX_SLOTS) {
        myTeamSlots++;
        enemyTeamSlots++;

        const mySlot = $('<div>', {
            class: 'slot',
            text: `우리팀 ${myTeamSlots}`,
            click: (event) => handleSlotClick(event, mySlot[0])
        });
        myTeamContainer.append(mySlot);

        const enemySlot = $('<div>', {
            class: 'slot',
            text: `적팀 ${enemyTeamSlots}`,
            click: (event) => handleSlotClick(event, enemySlot[0])
        });
        enemyTeamContainer.append(enemySlot);

        addComparisonButton(myTeamSlots, enemyTeamSlots);
    } else {
        alert('최대 슬롯 수에 도달했습니다.');
    }
}

// 챔피언을 슬롯에 설정하는 함수
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
}

// 비교 버튼 추가 함수
function addComparisonButton(mySlotNumber, enemySlotNumber) {
    const comparisonContainer = $('#comparison-buttons');
    const comparisonButton = $('<button>', {
        class: 'compare-btn',
        text: `Compare ${mySlotNumber}/${enemySlotNumber}`,
        click: () => {
            console.log(`Compare button clicked: My Team Slot ${mySlotNumber}, Enemy Team Slot ${enemySlotNumber}`);
            compareSlots(mySlotNumber, enemySlotNumber);
        }
    });
    comparisonContainer.append(comparisonButton);
}


// Remove Slots
function removeSlots() {
    if (myTeamSlots > 1) {
        const myTeamContainer = $('#my-team').find('.team');
        myTeamContainer.children().last().remove();
        myTeamSlots--;
    }

    if (enemyTeamSlots > 1) {
        const enemyTeamContainer = $('#enemy-team').find('.team');
        enemyTeamContainer.children().last().remove();
        enemyTeamSlots--;
    }

    if ($('#comparison-buttons').children().length > 1) {
        $('#comparison-buttons').children().last().remove();
    }
}

// Add Comparison Button
function addComparisonButton(mySlotNumber, enemySlotNumber) {
    const comparisonContainer = $('#comparison-buttons');
    const comparisonButton = $('<button>', {
        class: 'compare-btn',
        text: `비교 ${mySlotNumber}/${enemySlotNumber}`,
        click: () => {
            console.log(`Compare button clicked: My Team Slot ${mySlotNumber}, Enemy Team Slot ${enemySlotNumber}`);
            compareSlots(mySlotNumber, enemySlotNumber);
        }
    });
    comparisonContainer.append(comparisonButton);
}

// Enable Memo
function enableMemo(championId) {
    currentChampionId = championId;
    $('#memo-container').show();
    loadMemo(championId, memo => {
        $('#editor').summernote('code', memo.memoContent || '');
    });
}

// Compare Slots
function compareSlots(mySlotNumber, enemySlotNumber) {
    // Existing code to compare slots and display charts
}

// Insert Spell Image to Editor
function insertSpellImageToEditor(imageName, spellName) {
    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${imageName}`;
    $('#editor').summernote('insertImage', imageUrl, spellName);
}

// Show Page
function showPage(pageNumber) {
    if (pageNumber === 1) {
        $('#compare-page-1').show();
        $('#compare-page-2').hide();
    } else if (pageNumber === 2) {
        $('#compare-page-1').hide();
        $('#compare-page-2').show();
    }
}

// 비교 기능 관련 함수들

// compareSlots 함수
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
    const page3Button = $('<button>', { text: '스킬 사거리', click: () => showPage(3) });
    pageNav.append(page1Button, page2Button, page3Button);

    // 페이지 컨텐츠 생성
    const page1 = $('<div>', { class: 'compare-page', id: 'compare-page-1' });
    const page2 = $('<div>', { class: 'compare-page', id: 'compare-page-2', css: { display: 'none' } });
    const page3 = $('<div>', { class: 'compare-page', id: 'compare-page-3', css: { display: 'none' } });

    const statCanvas = $('<canvas>', { id: 'stat-comparison-chart', width: 400, height: 200 });
    const skillCanvas = $('<canvas>', { id: 'skill-comparison-chart', width: 400, height: 200 });
    const rangeCanvas = $('<canvas>', { id: 'range-comparison-chart', width: 400, height: 200 });
    page1.append(statCanvas);
    page2.append(skillCanvas);
    page3.append(rangeCanvas);

    // 슬롯에서 챔피언 ID 가져오기
    const myTeamContainer = $('#my-team').find('.team');
    const enemyTeamContainer = $('#enemy-team').find('.team');

    const mySlot = myTeamContainer.children().eq(mySlotIndex);
    const enemySlot = enemyTeamContainer.children().eq(enemySlotIndex);

    const myChampionId = mySlot.find('img').attr('alt');
    const enemyChampionId = enemySlot.find('img').attr('alt');

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
        const statCtx = document.getElementById('stat-comparison-chart').getContext('2d');
        const skillCtx = document.getElementById('skill-comparison-chart').getContext('2d');
        const rangeCtx = document.getElementById('range-comparison-chart').getContext('2d');

        const statLabels = ['공격력', '방어력', '체력', '마나', '이동속도'];
        const skillLabels = ['Q', 'W', 'E', 'R'];
        const rangeLabels = ['Q', 'W', 'E', 'R'];

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
                backgroundColor: index === 0 ? 'rgba(255, 99, 132, 0.2)' : 'rgba(54, 162, 235, 0.2)',
                borderColor: index === 0 ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            };
        });

        // 스킬 쿨타임 데이터셋 생성 (레벨별로 다르게 표시, 내 스킬과 적 스킬을 나란히 비교)
        const skillDatasets = [];
        const levels = ['레벨 1', '레벨 2', '레벨 3', '레벨 4', '레벨 5'];

        for (let i = 0; i < skillLabels.length; i++) {
            skillDatasets.push(
                {
                    label: `${championsData[0].name} ${skillLabels[i]}`,
                    data: championsData[0].spells[i].cooldown,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: `${championsData[1].name} ${skillLabels[i]}`,
                    data: championsData[1].spells[i].cooldown,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            );
        }

        // 스킬 사거리 데이터셋 생성
        const rangeDatasets = championsData.map((champion, index) => {
            return {
                label: champion.name,
                data: champion.spells.map(spell => spell.rangeBurn),
                backgroundColor: index === 0 ? 'rgba(153, 102, 255, 0.2)' : 'rgba(255, 206, 86, 0.2)',
                borderColor: index === 0 ? 'rgba(153, 102, 255, 1)' : 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            };
        });

        // 스탯 차트 생성
        new Chart(statCtx, {
            type: 'radar',
            data: {
                labels: statLabels,
                datasets: statDatasets
            },
            options: {
                scale: {
                    ticks: {
                        beginAtZero: true
                    }
                }
            }
        });

        // 스킬 쿨타임 차트 생성 (레벨별 데이터 포함, 내 스킬과 적 스킬을 나란히 비교, 간격 조정)
        new Chart(skillCtx, {
            type: 'bar',
            data: {
                labels: levels,
                datasets: skillDatasets
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                // 막대의 간격 조정
                categoryPercentage: 0.6, // 막대 그룹 간 간격 조정
                barPercentage: 0.8 // 각 막대의 너비 조정
            }
        });

        // 스킬 사거리 차트 생성
        new Chart(rangeCtx, {
            type: 'bar',
            data: {
                labels: rangeLabels,
                datasets: rangeDatasets
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    });

    // 모달 표시
    modalContent.append(closeButton, pageNav, page1, page2, page3);
    modal.append(modalContent);
    $('body').append(modal);
    modal.show();

    // 페이지 네비게이션 함수
    function showPage(pageNumber) {
        $('.compare-page').hide();
        $(`#compare-page-${pageNumber}`).show();
    }
}









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
function initializeHorizontalDrag() {
    const horizontalDivider = document.getElementById('horizontal-divider');
    let isDragging = false;

    horizontalDivider.addEventListener('mousedown', function (e) {
        e.preventDefault();
        isDragging = true;
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;

        const containerOffsetTop = $('#container').offset().top;
        const pointerRelativeYpos = e.clientY - containerOffsetTop;

        const containerHeight = $('#container').height();
        let newTopHeight = pointerRelativeYpos - (horizontalDivider.offsetHeight / 2);

        // 최소 높이 설정
        const minTopHeight = 100;
        const maxTopHeight = containerHeight - 200;

        if (newTopHeight < minTopHeight) newTopHeight = minTopHeight;
        if (newTopHeight > maxTopHeight) newTopHeight = maxTopHeight;

        $('#top-container').css('flex-basis', `${newTopHeight}px`);
        $('#formation-container').css('flex-basis', `${containerHeight - newTopHeight - horizontalDivider.offsetHeight}px`);

        // 추가: memo-container의 최소 너비 보장
        if ($('#memo-container').width() < 300) {
            $('#memo-container').css('min-width', '300px');
        }

        $('#editor').summernote('resize');
        $('#formation-editor').summernote('resize');
    });

    document.addEventListener('mouseup', function () {
        isDragging = false;
    });
}




// main.js

// ... 기존 코드 ...

// loadDataFromBase64 함수 수정




function generateExportData() {
    // 현재 페이지 또는 저장할 데이터를 문자열로 변환하는 로직
    const exportData = {
        version: '1.0', // 예시 데이터
        myTeamSlots: myTeamSlots,
        enemyTeamSlots: enemyTeamSlots,
        memoContent: $('#editor').summernote('code'), // 메모 내용 가져오기
        formationMemo: $('#formation-editor').summernote('code'), // 구도 메모 내용 가져오기
    };

    return JSON.stringify(exportData); // 데이터를 JSON 문자열로 반환
}



