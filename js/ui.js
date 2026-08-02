// ui.js - UI 레이아웃, 슬롯 컨트롤 및 차트 비교 서비스

let selectedSlot = null;
let myTeamSlots = 1;
let enemyTeamSlots = 1;

$(document).ready(function() {
    if ($('#main-container').length || $('#main-popup-container').length) {
        $('#add-slot-button').off('click').on('click', addSlots);
        $('#remove-slot-button').off('click').on('click', removeSlots);

        $('#select-champion-button').off('click').on('click', function() {
            if (myTeamSlots > 0) {
                selectedSlot = $('#my-team').find('.team').children().eq(0)[0];
                displayRoleSelection();
            }
        });

        $('#close-modal-button').off('click').on('click', function() {
            $('#champion-selection').hide();
        });

        // 3컬럼 좌/우 및 상/하 드래그바 초기화
        initializeVerticalDrag();
        initializeHorizontalDrag();

        // 초기 팀 슬롯 렌더링
        initializeTeamSlots();
    }
});

// --- 좌/우 3분할 Resizable 드래그바 고도화 ---
function initializeVerticalDrag() {
    const leftDivider = document.getElementById('vertical-divider-left');
    const rightDivider = document.getElementById('vertical-divider-right');
    const splitContainer = document.getElementById('split-container');
    if (!splitContainer) return;

    // 좌측 구분선 드래그 (좌측 챔피언 정보 창 너비 조절)
    if (leftDivider) {
        let isLeftDragging = false;
        leftDivider.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isLeftDragging = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isLeftDragging) return;
            const containerRect = splitContainer.getBoundingClientRect();
            let newWidth = e.clientX - containerRect.left;
            const minWidth = 120;
            const maxWidth = containerRect.width * 0.5;

            if (newWidth < minWidth) newWidth = minWidth;
            if (newWidth > maxWidth) newWidth = maxWidth;

            $('#info-container').css({
                'width': `${newWidth}px`,
                'flex': `0 0 ${newWidth}px`
            });
        });

        document.addEventListener('mouseup', () => {
            if (isLeftDragging) {
                isLeftDragging = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    // 우측 구분선 드래그 (가운데 밴픽 판 너비 조절 ➔ 우측 메모장 자동 유연 조절)
    if (rightDivider) {
        let isRightDragging = false;
        rightDivider.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isRightDragging = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isRightDragging) return;
            const infoRect = document.getElementById('info-container').getBoundingClientRect();
            let newMainWidth = e.clientX - infoRect.right;
            const minWidth = 280; // 가운데 최소 슬롯 360px 대치 유지
            const maxWidth = splitContainer.clientWidth * 0.6;

            if (newMainWidth < minWidth) newMainWidth = minWidth;
            if (newMainWidth > maxWidth) newMainWidth = maxWidth;

            $('#main-container').css({
                'width': `${newMainWidth}px`,
                'flex': `0 0 ${newMainWidth}px`
            });
        });

        document.addEventListener('mouseup', () => {
            if (isRightDragging) {
                isRightDragging = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }
}

// --- 상/하 Resizable 드래그바 ---
function initializeHorizontalDrag() {
    const horizontalDivider = document.getElementById('horizontal-divider');
    const topContainer = document.getElementById('top-container');
    const formationContainer = document.getElementById('formation-container');
    if (!horizontalDivider || !topContainer) return;

    let isDragging = false;

    horizontalDivider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const containerHeight = $('#container').height() || window.innerHeight;
        const containerOffsetTop = $('#container').offset() ? $('#container').offset().top : 0;
        let newTopHeight = e.clientY - containerOffsetTop;

        const minTopHeight = 250;
        const maxTopHeight = containerHeight - 150;

        if (newTopHeight < minTopHeight) newTopHeight = minTopHeight;
        if (newTopHeight > maxTopHeight) newTopHeight = maxTopHeight;

        $(topContainer).css('height', `${newTopHeight}px`);
        if (formationContainer) {
            $(formationContainer).css('height', `${containerHeight - newTopHeight - 15}px`);
        }
    });

    document.addEventListener('mouseup', () => { isDragging = false; });
}

// --- 챔피언 선택 모달 ---
function displayRoleSelection() {
    const modal = $('#champion-selection');
    modal.fadeIn(200);

    const modalContent = modal.find('.modal-content');
    modalContent.empty();

    const headerContainer = $('<div>', {
        css: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }
    }).append('<h2>챔피언 선택</h2>');

    const closeBtn = $('<button>', {
        text: '✕ 닫기',
        class: 'btn btn-danger',
        css: { cursor: 'pointer', borderRadius: '6px' },
        click: () => modal.fadeOut(200)
    });
    headerContainer.append(closeBtn);
    modalContent.append(headerContainer);

    // 검색창
    const searchInput = $('<input>', {
        type: 'text',
        id: 'champion-search',
        placeholder: '🔍 챔피언 이름 검색...',
        class: 'form-control',
        css: { marginBottom: '15px', padding: '10px', fontSize: '15px', width: '100%' }
    });
    modalContent.append(searchInput);

    // 역할 탭
    const roleSelectionDiv = $('<div>', { id: 'role-selection', css: { marginBottom: '15px' } });
    ['전체', ...AppState.roles].forEach(role => {
        const btn = $('<button>', {
            class: `btn ${role === '전체' ? 'btn-primary' : 'btn-default'} role-button`,
            text: role,
            css: { margin: '3px', padding: '6px 14px' },
            click: function() {
                $('.role-button').removeClass('btn-primary').addClass('btn-default');
                $(this).removeClass('btn-default').addClass('btn-primary');
                displayChampionList(role);
            }
        });
        roleSelectionDiv.append(btn);
    });
    modalContent.append(roleSelectionDiv);

    // 챔피언 그리드
    const championListDiv = $('<div>', { id: 'champion-list', css: { maxHeight: '420px', overflowY: 'auto' } });
    modalContent.append(championListDiv);

    displayChampionList('전체');

    $('#champion-search').on('input', function() {
        const term = $(this).val().toLowerCase();
        $('.champion-button').each(function() {
            const name = $(this).text().toLowerCase();
            $(this).toggle(name.includes(term));
        });
    });
}

function displayChampionList(role) {
    const championListDiv = $('#champion-list');
    championListDiv.empty();

    let champions = Object.values(AppState.championList);
    if (role !== '전체') {
        const tag = getRoleTag(role);
        champions = champions.filter(c => c.tags && c.tags.includes(tag));
    }

    champions.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));

    champions.forEach(champ => {
        const btn = $('<button>', {
            class: 'champion-button',
            css: {
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                margin: '5px',
                padding: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
            },
            hover: function() { $(this).css('transform', 'scale(1.05)'); },
            mouseleave: function() { $(this).css('transform', 'scale(1.0)'); }
        });

        const img = $('<img>', {
            src: `https://ddragon.leagueoflegends.com/cdn/${AppState.version}/img/champion/${champ.id}.png`,
            alt: champ.name,
            css: { width: '56px', height: '56px', borderRadius: '6px', marginBottom: '4px' }
        });

        const span = $('<span>', { text: champ.name, css: { fontSize: '12px', whiteSpace: 'nowrap' } });
        btn.append(img, span);

        btn.on('click', () => selectChampion(champ.id));
        championListDiv.append(btn);
    });
}

function selectChampion(championId) {
    if (selectedSlot) {
        setChampionToSlot(selectedSlot, championId);
    }
    $('#champion-selection').fadeOut(200);
}

// --- 단일 고도화 setChampionToSlot 함수 ---
function setChampionToSlot(slot, championId) {
    const $slot = $(slot);
    $slot.empty();

    if (championId) {
        const img = $('<img>', {
            src: `https://ddragon.leagueoflegends.com/cdn/${AppState.version}/img/champion/${championId}.png`,
            alt: championId,
            css: {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }
        });
        $slot.append(img);
    }

    // 슬롯 클릭 이벤트 단일화 및 딜레이 제거
    $slot.off('click dblclick');

    $slot.on('click', function(e) {
        const cid = $slot.find('img').attr('alt');
        if (cid) {
            displayChampionInfo(cid);
            if (typeof enableMemo === 'function') enableMemo(cid);
        } else {
            selectedSlot = slot;
            displayRoleSelection();
        }
        if (typeof checkAndUpdateFormationMemo === 'function') checkAndUpdateFormationMemo();
    });

    $slot.on('dblclick', function(e) {
        e.stopPropagation();
        selectedSlot = slot;
        displayRoleSelection();
    });
}

// --- 챔피언 상세 스탯/스킬 렌더링 ---
async function displayChampionInfo(championId) {
    AppState.currentChampionId = championId;
    window.currentChampionId = championId;

    const champion = await DataDragonService.getChampionDetail(championId);
    const infoDiv = $('#champion-info');
    infoDiv.empty();

    if (!champion) {
        infoDiv.html('<p style="padding:15px; color:#aaa;">챔피언 정보를 불러올 수 없습니다.</p>');
        return;
    }

    // 대표 이미지
    const splashImg = $('<img>', {
        src: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_0.jpg`,
        alt: champion.name,
        css: { width: '100%', borderRadius: '10px', marginBottom: '15px', border: '1px solid var(--border-color)' }
    });
    infoDiv.append(splashImg);

    // 스탯 테이블
    const statsTable = $('<table>', { class: 'table stats-table', css: { fontSize: '13px', marginBottom: '15px' } });
    statsTable.append(`
        <tbody>
            <tr><th>공격력</th><td>${champion.stats.attackdamage} (+${champion.stats.attackdamageperlevel})</td><th>방어력</th><td>${champion.stats.armor} (+${champion.stats.armorperlevel})</td></tr>
            <tr><th>체력</th><td>${champion.stats.hp} (+${champion.stats.hpperlevel})</td><th>마나</th><td>${champion.stats.mp} (+${champion.stats.mpperlevel})</td></tr>
            <tr><th>이동속도</th><td>${champion.stats.movespeed}</td><th>사거리</th><td>${champion.stats.attackrange}</td></tr>
            <tr><th>체력재생</th><td>${champion.stats.hpregen}</td><th>마법저항</th><td>${champion.stats.spellblock}</td></tr>
        </tbody>
    `);
    infoDiv.append(statsTable);

    // 스킬 목록
    const spellsDiv = $('<div>', { class: 'champion-spells', css: { marginTop: '15px' } });
    spellsDiv.append('<h4 style="color:var(--accent-color); margin-bottom:10px;">스킬 정보 <small style="font-size:11px; color:#aaa;">(아이콘 클릭 시 에디터에 삽입)</small></h4>');

    champion.spells.forEach((spell, idx) => {
        const key = ['Q', 'W', 'E', 'R'][idx] || '';
        const spellCard = $(`
            <div class="spell-card" title="클릭하여 메모 에디터에 스킬 아이콘 삽입" style="display:flex; gap:10px; margin-bottom:12px; background:var(--card-bg); padding:10px; border-radius:8px; cursor:pointer; transition:transform 0.15s ease, border-color 0.15s ease; border:1px solid transparent;">
                <img class="spell-icon" src="https://ddragon.leagueoflegends.com/cdn/${AppState.version}/img/spell/${spell.image.full}" alt="${spell.name}" style="width:44px; height:44px; border-radius:6px; flex-shrink:0;"/>
                <div>
                    <h5 style="margin:0 0 4px 0; color:#fff;">[${key}] ${spell.name}</h5>
                    <p style="margin:0 0 4px 0; font-size:12px; color:#ccc;">${spell.description}</p>
                    <p style="margin:0; font-size:11px; color:var(--accent-color);">쿨타임: ${spell.cooldownBurn}s | 사거리: ${spell.rangeBurn}</p>
                </div>
            </div>
        `);

        spellCard.hover(
            function() { $(this).css({ transform: 'translateY(-2px)', borderColor: 'var(--blue-accent)' }); },
            function() { $(this).css({ transform: 'translateY(0)', borderColor: 'transparent' }); }
        );

        spellCard.on('click', function() {
            insertSpellImageToEditor(spell.image.full, spell.name, key);
        });

        spellsDiv.append(spellCard);
    });
    infoDiv.append(spellsDiv);
}

// 에디터 포커스 및 클릭 트래킹
$(document).on('focus mousedown click', '.note-editable', function() {
    if ($(this).closest('#formation-container').length) {
        AppState.lastActiveEditor = '#formation-editor';
    } else {
        AppState.lastActiveEditor = '#editor';
    }
});

function insertSpellImageToEditor(imgName, spellName, key) {
    const imgUrl = `https://ddragon.leagueoflegends.com/cdn/${AppState.version}/img/spell/${imgName}`;
    const targetSelector = AppState.lastActiveEditor || '#editor';
    const $targetEditor = $(targetSelector);

    if ($targetEditor.length && $targetEditor.summernote) {
        $targetEditor.summernote('focus');
        
        // AppState.insertedIconSize 크기(기본 38px)를 사용하여 크게 삽입
        const size = AppState.insertedIconSize || 38;
        const html = `<img src="${imgUrl}" alt="${spellName}" title="[${key}] ${spellName}" style="width:${size}px; height:${size}px; border-radius:5px; vertical-align:middle; margin:0 3px; border:1px solid rgba(255,255,255,0.25);"/>&nbsp;`;
        $targetEditor.summernote('pasteHTML', html);
        
        // DOM Range 커서 이동
        setTimeout(() => {
            $targetEditor.summernote('focus');
            const editable = $targetEditor.next('.note-editor').find('.note-editable')[0] || $targetEditor.siblings('.note-editor').find('.note-editable')[0];
            if (editable) {
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(editable);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }, 10);
    }
}

// --- 슬롯 조작 및 비교 ---
const laneLabels = ['탑', '정글', '미드', '원딜', '서폿'];

function initializeTeamSlots() {
    const myTeamContainer = $('#my-team').find('.team');
    const enemyTeamContainer = $('#enemy-team').find('.team');

    myTeamContainer.empty();
    enemyTeamContainer.empty();
    $('#comparison-buttons').empty();

    for (let i = 0; i < AppState.myTeamSlots; i++) {
        const laneName = laneLabels[i] || `라인${i + 1}`;
        const mySlot = $('<div>', { class: 'slot', text: `아군 ${laneName}` })[0];
        setChampionToSlot(mySlot, null);
        myTeamContainer.append(mySlot);

        const enemySlot = $('<div>', { class: 'slot', text: `적군 ${laneName}` })[0];
        setChampionToSlot(enemySlot, null);
        enemyTeamContainer.append(enemySlot);

        addComparisonButton(i + 1, i + 1, laneName);
    }
}

function addSlots() {
    if (AppState.myTeamSlots < AppState.MAX_SLOTS) {
        AppState.myTeamSlots++;
        AppState.enemyTeamSlots++;

        const idx = AppState.myTeamSlots - 1;
        const laneName = laneLabels[idx] || `라인${AppState.myTeamSlots}`;

        const mySlot = $('<div>', { class: 'slot', text: `아군 ${laneName}` })[0];
        setChampionToSlot(mySlot, null);
        $('#my-team').find('.team').append(mySlot);

        const enemySlot = $('<div>', { class: 'slot', text: `적군 ${laneName}` })[0];
        setChampionToSlot(enemySlot, null);
        $('#enemy-team').find('.team').append(enemySlot);

        addComparisonButton(AppState.myTeamSlots, AppState.enemyTeamSlots, laneName);
    } else {
        alert('최대 5개의 슬롯까지 추가할 수 있습니다.');
    }
}

function removeSlots() {
    if (AppState.myTeamSlots > 1) {
        AppState.myTeamSlots--;
        AppState.enemyTeamSlots--;
        initializeTeamSlots();
    } else {
        alert('최소 1개의 슬롯은 유지되어야 합니다.');
    }
}

function addComparisonButton(myNum, enemyNum, laneName) {
    const label = laneName || `${myNum} VS ${enemyNum}`;
    const btn = $('<button>', {
        class: 'btn compare-btn',
        html: `⚡ VS<br><span style="font-size:10px; color:#aaa;">${label}</span>`,
        click: () => compareSlots(myNum, enemyNum)
    });
    $('#comparison-buttons').append(btn);
}

// --- 차트 및 스탯 3종 비교 모달 (스탯, 스킬쿨, 스킬사거리) ---
async function compareSlots(myNum, enemyNum) {
    const mySlot = $('#my-team').find('.team').children().eq(myNum - 1);
    const enemySlot = $('#enemy-team').find('.team').children().eq(enemyNum - 1);

    const myId = mySlot.find('img').attr('alt');
    const enemyId = enemySlot.find('img').attr('alt');

    if (!myId || !enemyId) {
        alert('비교할 아군과 적군 양쪽에 모두 챔피언이 선택되어 있어야 합니다.');
        return;
    }

    const c1 = await DataDragonService.getChampionDetail(myId);
    const c2 = await DataDragonService.getChampionDetail(enemyId);
    if (!c1 || !c2) {
        alert('챔피언 상세 정보를 불러오지 못했습니다.');
        return;
    }

    // 데미지 타입 판별 유틸
    function getDamageTypeInfo(champ) {
        if (!champ) return { label: '물리 (AD)', color: '#e84118', icon: '⚔️ AD' };
        const attack = champ.info ? champ.info.attack : 5;
        const magic = champ.info ? champ.info.magic : 5;
        const tags = champ.tags || [];

        if (tags.includes('Mage') || magic > attack + 2) {
            return { label: '마법 (AP)', color: '#9c88ff', icon: '🔮 AP' };
        } else if (magic >= 4 && attack >= 4) {
            return { label: '하이브리드 (AD/AP)', color: '#fbc531', icon: '⚡ Hybrid' };
        } else {
            return { label: '물리 (AD)', color: '#e84118', icon: '⚔️ AD' };
        }
    }

    const dt1 = getDamageTypeInfo(c1);
    const dt2 = getDamageTypeInfo(c2);

    // 모달 DOM 생성 및 화면 정중앙 띄움
    $('#compare-modal').remove();

    const modal = $('<div>', {
        class: 'modal compare-dialog-modal',
        id: 'compare-modal',
        css: {
            display: 'block',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 999999,
            width: '92%',
            maxWidth: '900px',
            background: 'none',
            boxShadow: 'none'
        }
    });

    const content = $('<div>', {
        class: 'modal-content draggable-modal-content',
        css: {
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            border: '2px solid var(--blue-accent)',
            boxShadow: '0 0 50px rgba(0, 168, 255, 0.4)',
            borderRadius: '14px',
            padding: '20px'
        }
    });

    const header = $('<div>', {
        id: 'compare-modal-header',
        css: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '10px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'move',
            userSelect: 'none'
        }
    });
    header.append(`<h3 style="margin:0; color:#fff; font-size:16px; font-weight:700;">✋ Matchup 1:1 대치 구도: <span style="color:var(--blue-accent);">${c1.name}</span> vs <span style="color:var(--accent-color);">${c2.name}</span></h3>`);
    
    const closeBtn = $('<button>', { text: '✕ 닫기', class: 'btn btn-danger btn-sm', click: () => modal.remove() });
    header.append(closeBtn);
    content.append(header);

    // 데미지 타입 및 역할군 서머리 바
    const summaryBar = $(`
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.4); padding:10px 16px; border-radius:10px; margin-bottom:15px; border:1px solid rgba(255,255,255,0.08);">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:700; color:var(--blue-accent);">${c1.name}</span>
                <span style="font-size:11px; padding:2px 8px; border-radius:12px; background:${dt1.color}; color:#fff; font-weight:bold;">${dt1.icon} ${dt1.label}</span>
                <span style="font-size:11px; color:#aaa;">(${(c1.tags || []).join(', ')})</span>
            </div>
            <span style="font-weight:800; font-size:14px; color:#fbc531;">VS</span>
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:11px; color:#aaa;">(${(c2.tags || []).join(', ')})</span>
                <span style="font-size:11px; padding:2px 8px; border-radius:12px; background:${dt2.color}; color:#fff; font-weight:bold;">${dt2.icon} ${dt2.label}</span>
                <span style="font-weight:700; color:var(--accent-color);">${c2.name}</span>
            </div>
        </div>
    `);
    content.append(summaryBar);

    // 탭 메뉴 버튼 (4개 탭)
    const tabNav = $('<div>', { class: 'btn-group', css: { marginBottom: '15px', width: '100%', display: 'flex', gap: '4px' } });
    const btnTab1 = $('<button>', { class: 'btn btn-primary nav-tab-btn active', text: '📊 기본 스탯', css: { flex: 1 } });
    const btnTab2 = $('<button>', { class: 'btn btn-default nav-tab-btn', text: '⏱️ 스킬 쿨타임 (가로 슬라이드)', css: { flex: 1 } });
    const btnTab3 = $('<button>', { class: 'btn btn-default nav-tab-btn', text: '🎯 스킬 사거리 (레이더 맵)', css: { flex: 1 } });
    const btnTab4 = $('<button>', { class: 'btn btn-default nav-tab-btn', text: '💡 라이엇 카운터 팁', css: { flex: 1 } });
    tabNav.append(btnTab1, btnTab2, btnTab3, btnTab4);
    content.append(tabNav);

    // 탭 1: 기본 스탯 (세로 막대)
    const page1 = $('<div>', { id: 'cmp-page-1', class: 'cmp-page' });
    const canvas1 = $('<canvas>', { id: 'chart-stat', height: 180 });
    page1.append(canvas1);
    content.append(page1);

    // 탭 2: 스킬 쿨타임 (가로 슬라이드 탄력 애니메이션)
    const page2 = $('<div>', { id: 'cmp-page-2', class: 'cmp-page', css: { display: 'none' } });
    const canvas2 = $('<canvas>', { id: 'chart-skill', height: 180 });
    page2.append(canvas2);
    content.append(page2);

    // 탭 3: 스킬 사거리 (레이더 커버리지 차트)
    const page3 = $('<div>', { id: 'cmp-page-3', class: 'cmp-page', css: { display: 'none' } });
    const canvas3 = $('<canvas>', { id: 'chart-range', height: 200 });
    page3.append(canvas3);
    content.append(page3);

    // 탭 4: 라이엇 카운터 & 상대법 팁
    const page4 = $('<div>', { id: 'cmp-page-4', class: 'cmp-page', css: { display: 'none', padding: '10px' } });
    
    const allyTipsHtml = (c1.allytips && c1.allytips.length) 
        ? c1.allytips.map(t => `<li style="margin-bottom:6px; color:#dcdde1;">${t}</li>`).join('') 
        : '<li style="color:#888;">등록된 아군 운용 팁이 없습니다.</li>';

    const enemyTipsHtml = (c2.enemytips && c2.enemytips.length) 
        ? c2.enemytips.map(t => `<li style="margin-bottom:6px; color:#ff7979;">${t}</li>`).join('') 
        : '<li style="color:#888;">등록된 대처 카운터 팁이 없습니다.</li>';

    const tipBox = $(`
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div style="background:rgba(0,168,255,0.08); border:1px solid rgba(0,168,255,0.3); border-radius:10px; padding:14px;">
                <h4 style="margin:0 0 10px 0; color:var(--blue-accent); font-size:14px;">💡 ${c1.name} 핵심 플레이 팁</h4>
                <ul style="margin:0; padding-left:18px; font-size:13px; line-height:1.5;">${allyTipsHtml}</ul>
            </div>
            <div style="background:rgba(232,65,24,0.08); border:1px solid rgba(232,65,24,0.3); border-radius:10px; padding:14px;">
                <h4 style="margin:0 0 10px 0; color:var(--accent-color); font-size:14px;">⚠️ ${c2.name} 상대 대처법 & 카운터 포인트</h4>
                <ul style="margin:0; padding-left:18px; font-size:13px; line-height:1.5;">${enemyTipsHtml}</ul>
            </div>
        </div>
    `);
    page4.append(tipBox);
    content.append(page4);

    modal.append(content);
    $('body').append(modal);

    // 드래그 이동 기능 적용
    makeElementDraggable(header[0], modal[0]);

    // 탭 전환 이벤트
    btnTab1.on('click', function() {
        $('.nav-tab-btn').removeClass('btn-primary active').addClass('btn-default');
        $(this).removeClass('btn-default').addClass('btn-primary active');
        $('.cmp-page').hide();
        page1.show();
    });

    btnTab2.on('click', function() {
        $('.nav-tab-btn').removeClass('btn-primary active').addClass('btn-default');
        $(this).removeClass('btn-default').addClass('btn-primary active');
        $('.cmp-page').hide();
        page2.show();
    });

    btnTab3.on('click', function() {
        $('.nav-tab-btn').removeClass('btn-primary active').addClass('btn-default');
        $(this).removeClass('btn-default').addClass('btn-primary active');
        $('.cmp-page').hide();
        page3.show();
    });

    btnTab4.on('click', function() {
        $('.nav-tab-btn').removeClass('btn-primary active').addClass('btn-default');
        $(this).removeClass('btn-default').addClass('btn-primary active');
        $('.cmp-page').hide();
        page4.show();
    });

    // --- Canvas 그라디언트 생성 유틸 ---
    function makeGradient(ctx, topColor, bottomColor) {
        const g = ctx.createLinearGradient(0, 0, 0, 220);
        g.addColorStop(0, topColor);
        g.addColorStop(1, bottomColor);
        return g;
    }

    const ctxStat = document.getElementById('chart-stat').getContext('2d');
    const ctxSkill = document.getElementById('chart-skill').getContext('2d');
    const ctxRange = document.getElementById('chart-range').getContext('2d');

    const blueGrad = makeGradient(ctxStat, '#00d2ff', 'rgba(0, 168, 255, 0.15)');
    const redGrad = makeGradient(ctxStat, '#ff4757', 'rgba(232, 65, 24, 0.15)');

    const hasDataLabelsPlugin = typeof ChartDataLabels !== 'undefined';
    const chartPlugins = hasDataLabelsPlugin ? [ChartDataLabels] : [];

    // 1. 기본 스탯 Chart (세로 팝핑 바)
    new Chart(ctxStat, {
        type: 'bar',
        data: {
            labels: ['공격력', '방어력', '체력', '마나', '이동속도'],
            datasets: [
                { label: c1.name, data: [c1.stats.attackdamage, c1.stats.armor, c1.stats.hp, c1.stats.mp, c1.stats.movespeed], backgroundColor: blueGrad, borderColor: '#00d2ff', borderWidth: 2, borderRadius: 6 },
                { label: c2.name, data: [c2.stats.attackdamage, c2.stats.armor, c2.stats.hp, c2.stats.mp, c2.stats.movespeed], backgroundColor: redGrad, borderColor: '#ff4757', borderWidth: 2, borderRadius: 6 }
            ]
        },
        plugins: chartPlugins,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 1000, easing: 'easeInOutQuart', delay: (ctx) => ctx.dataIndex * 100 },
            plugins: {
                legend: { labels: { color: '#fff', font: { weight: 'bold' } } },
                datalabels: { color: '#fff', anchor: 'end', align: 'top', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: 4 }
            },
            scales: {
                x: { ticks: { color: '#e0e0e0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.08)' } }
            }
        }
    });

    // 2. 스킬 쿨타임 Chart (가로 슬라이드 탄력 Bounce 애니메이션)
    const spellKeys = ['Q', 'W', 'E', 'R'];
    const c1Cooldowns = c1.spells.map((s, idx) => ({ key: spellKeys[idx], cd: s.cooldown[0] || 0 }));
    const c2Cooldowns = c2.spells.map((s, idx) => ({ key: spellKeys[idx], cd: s.cooldown[0] || 0 }));

    new Chart(ctxSkill, {
        type: 'bar',
        data: {
            labels: spellKeys.map(k => `스킬 [${k}]`),
            datasets: [
                { label: `${c1.name} 쿨타임(초)`, data: c1Cooldowns.map(c => c.cd), backgroundColor: blueGrad, borderColor: '#00d2ff', borderWidth: 2, borderRadius: 6 },
                { label: `${c2.name} 쿨타임(초)`, data: c2Cooldowns.map(c => c.cd), backgroundColor: redGrad, borderColor: '#ff4757', borderWidth: 2, borderRadius: 6 }
            ]
        },
        plugins: chartPlugins,
        options: {
            indexAxis: 'y', // 가로 슬라이드 차트로 변환
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 1300,
                easing: 'easeOutBack', // 탄력 있는 바운스 애니메이션
                delay: (ctx) => ctx.dataIndex * 150
            },
            plugins: {
                legend: { labels: { color: '#fff', font: { weight: 'bold' } } },
                datalabels: { color: '#fff', anchor: 'end', align: 'right', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: 4, formatter: (v) => `${v}초` }
            },
            scales: {
                x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                y: { ticks: { color: '#e0e0e0', font: { weight: 'bold' } }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // 3. 스킬 사거리 Chart (스파이더 레이더 차트 Radar Map)
    const c1Ranges = c1.spells.map(s => parseInt(s.rangeBurn) || 0);
    const c2Ranges = c2.spells.map(s => parseInt(s.rangeBurn) || 0);

    new Chart(ctxRange, {
        type: 'radar',
        data: {
            labels: spellKeys.map(k => `스킬 [${k}] 사거리`),
            datasets: [
                { label: c1.name, data: c1Ranges, backgroundColor: 'rgba(0, 210, 255, 0.25)', borderColor: '#00d2ff', pointBackgroundColor: '#00d2ff', pointRadius: 5 },
                { label: c2.name, data: c2Ranges, backgroundColor: 'rgba(255, 71, 87, 0.25)', borderColor: '#ff4757', pointBackgroundColor: '#ff4757', pointRadius: 5 }
            ]
        },
        plugins: chartPlugins,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 1400,
                easing: 'easeOutElastic'
            },
            plugins: {
                legend: { labels: { color: '#fff', font: { weight: 'bold' } } },
                datalabels: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: 3 }
            },
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.15)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#ffffff', font: { weight: 'bold', size: 12 } },
                    ticks: { display: false }
                }
            }
        }
    });
}

// 요소 드래그 이동 유틸리티 함수 (순간이동 튐 없는 Smooth Draggable)
function makeElementDraggable(dragHandle, targetElement) {
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
    dragHandle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
        e.preventDefault();

        // 현재 모달의 화면상 실제 픽셀 위치를 즉시 추출
        const rect = targetElement.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        // transform 제거 후 픽셀 좌표계 고정 (순간이동 튐 방지)
        targetElement.style.transform = 'none';
        targetElement.style.margin = '0';
        targetElement.style.left = `${initialLeft}px`;
        targetElement.style.top = `${initialTop}px`;

        startX = e.clientX;
        startY = e.clientY;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        targetElement.style.left = `${initialLeft + dx}px`;
        targetElement.style.top = `${initialTop + dy}px`;
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// 드래그바 초기화 함수 (상하)
function initializeHorizontalDrag() {
    const horizontalDivider = document.getElementById('horizontal-divider');
    if (!horizontalDivider) return;
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

        const minTopHeight = 100;
        const maxTopHeight = containerHeight - 200;

        if (newTopHeight < minTopHeight) newTopHeight = minTopHeight;
        if (newTopHeight > maxTopHeight) newTopHeight = maxTopHeight;

        $('#top-container').css('flex-basis', `${newTopHeight}px`);
        $('#formation-container').css('flex-basis', `${containerHeight - newTopHeight - horizontalDivider.offsetHeight}px`);

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

function generateExportData() {
    const exportData = {
        version: AppState.version,
        myTeamSlots: AppState.myTeamSlots,
        enemyTeamSlots: AppState.enemyTeamSlots,
        memoContent: $('#editor').length ? $('#editor').summernote('code') : '',
        formationMemo: $('#formation-editor').length ? $('#formation-editor').summernote('code') : ''
    };
    return JSON.stringify(exportData);
}

// --- 룬 선택 시스템 모달 (Rune Selection System - Central Grid & Size Controller) ---
async function openRuneSelectionModal() {
    const runes = await DataDragonService.getRunes();
    if (!runes || !runes.length) {
        alert('룬 데이터를 불러오지 못했습니다.');
        return;
    }

    $('#rune-modal').remove();

    const modalWidth = Math.min(window.innerWidth * 0.88, 850);
    const modalHeight = Math.min(window.innerHeight * 0.85, 700);
    const initialLeft = Math.max((window.innerWidth - modalWidth) / 2, 10);
    const initialTop = Math.max((window.innerHeight - modalHeight) / 2, 10);

    const modal = $('<div>', {
        class: 'modal compare-dialog-modal',
        id: 'rune-modal',
        css: {
            display: 'block',
            position: 'fixed',
            top: `${initialTop}px`,
            left: `${initialLeft}px`,
            transform: 'none',
            zIndex: 9999999,
            width: `${modalWidth}px`,
            background: 'none',
            boxShadow: 'none'
        }
    });

    const content = $('<div>', {
        class: 'modal-content draggable-modal-content',
        css: {
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            border: '2px solid #9c88ff',
            boxShadow: '0 0 50px rgba(156, 136, 255, 0.4)',
            borderRadius: '14px',
            padding: '20px'
        }
    });

    const header = $('<div>', {
        id: 'rune-modal-header',
        css: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '10px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'move',
            userSelect: 'none'
        }
    });
    header.append('<h3 style="margin:0; color:#fff; font-size:16px; font-weight:700;">✋ 🔮 롤 룬 세팅 패널 <small style="font-size:11px; color:#aaa; font-weight:normal;">(창 이동 가능 / 룬 클릭 시 활성 에디터에 대형 삽입)</small></h3>');
    const closeBtn = $('<button>', { text: '✕ 닫기', class: 'btn btn-danger btn-sm', click: () => modal.remove() });
    header.append(closeBtn);
    content.append(header);

    // 아이콘 크기 조절 옵션 컨트롤바
    const curSize = AppState.insertedIconSize || 38;
    const sizeControlBar = $(`
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.35); padding:8px 14px; border-radius:8px; margin-bottom:14px; border:1px solid rgba(255,255,255,0.08);">
            <span style="font-size:12px; color:#ddd; font-weight:bold;">🖼️ 에디터 삽입 아이콘 크기 설정:</span>
            <div class="btn-group btn-group-sm" id="icon-size-selector">
                <button type="button" class="btn ${curSize === 30 ? 'btn-primary' : 'btn-default'}" data-size="30">보통 (30px)</button>
                <button type="button" class="btn ${curSize === 38 ? 'btn-primary' : 'btn-default'}" data-size="38">크게 (38px)</button>
                <button type="button" class="btn ${curSize === 48 ? 'btn-primary' : 'btn-default'}" data-size="48">왕대형 (48px)</button>
            </div>
        </div>
    `);

    sizeControlBar.find('#icon-size-selector button').on('click', function() {
        const newSize = parseInt($(this).attr('data-size')) || 38;
        AppState.insertedIconSize = newSize;
        sizeControlBar.find('button').removeClass('btn-primary').addClass('btn-default');
        $(this).removeClass('btn-default').addClass('btn-primary');
    });

    content.append(sizeControlBar);

    // 룬 시스템 2대 페이지 모드 (오리지널 vs 클래식)
    const modeNav = $(`
        <div class="btn-group" style="margin-bottom:14px; display:flex; width:100%;">
            <button type="button" class="btn btn-primary rune-mode-btn" data-mode="original" style="flex:1; font-weight:bold;">⚡ 오리지널 룬 (현재 시즌)</button>
            <button type="button" class="btn btn-default rune-mode-btn" data-mode="classic" style="flex:1; font-weight:bold;">📜 클래식 룬 (구 룬/특성 시스템)</button>
        </div>
    `);

    content.append(modeNav);

    // 1. 오리지널 룬 메인 영역
    const originalContainer = $('<div>', { id: 'rune-original-container' });
    const runeColors = ['#c8aa6e', '#dc4040', '#9c88ff', '#2ed573', '#00a8ff'];
    const tabNav = $('<div>', { class: 'btn-group', css: { marginBottom: '16px', width: '100%', display: 'flex', gap: '4px' } });
    
    runes.forEach((rTree, idx) => {
        const btn = $('<button>', {
            class: `btn ${idx === 0 ? 'btn-primary active' : 'btn-default'} rune-tab-btn`,
            html: `<span style="color:${runeColors[idx] || '#fff'}; font-weight:bold;">✦ ${rTree.name}</span>`,
            css: { flex: 1, fontSize: '13px', padding: '8px 0' }
        });
        btn.on('click', function() {
            $('.rune-tab-btn').removeClass('btn-primary active').addClass('btn-default');
            $(this).removeClass('btn-default').addClass('btn-primary active');
            $('.rune-page').hide();
            $(`#rune-page-${rTree.id}`).show();
        });
        tabNav.append(btn);
    });
    originalContainer.append(tabNav);

    runes.forEach((rTree, idx) => {
        const page = $('<div>', { id: `rune-page-${rTree.id}`, class: 'rune-page', css: { display: idx === 0 ? 'block' : 'none', textAlign: 'center' } });
        
        rTree.slots.forEach((s, sIdx) => {
            const slotTitle = sIdx === 0 ? '🌟 핵심 룬 (Keystone)' : `보조 룬 슬롯 ${sIdx}`;
            page.append(`<h5 style="color:${runeColors[idx] || '#fbc531'}; margin:16px 0 10px 0; font-weight:700; text-align:center; font-size:14px;">${slotTitle}</h5>`);
            
            const grid = $('<div>', { css: { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '14px' } });
            s.runes.forEach(rune => {
                const runeUrl = `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;
                const card = $(`
                    <div class="rune-card" title="${rune.name}: ${rune.shortDesc.replace(/<[^>]*>?/gm, '')}" style="display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.5); padding:8px 14px; border-radius:10px; cursor:pointer; border:1px solid rgba(255,255,255,0.15); transition:all 0.2s ease;">
                        <img src="${runeUrl}" alt="${rune.name}" style="width:${sIdx === 0 ? '42px' : '34px'}; height:${sIdx === 0 ? '42px' : '34px'};"/>
                        <span style="font-weight:bold; color:#fff; font-size:13px;">${rune.name}</span>
                    </div>
                `);
                card.hover(
                    function() { $(this).css({ transform: 'translateY(-3px)', borderColor: runeColors[idx] || '#00d2ff', boxShadow: `0 0 14px ${runeColors[idx] || '#00d2ff'}` }); },
                    function() { $(this).css({ transform: 'translateY(0)', borderColor: 'rgba(255,255,255,0.15)', boxShadow: 'none' }); }
                );
                card.on('click', () => {
                    insertRuneImageToEditor(runeUrl, rune.name);
                });
                grid.append(card);
            });
            page.append(grid);
        });
        originalContainer.append(page);
    });

    content.append(originalContainer);

    // 2. 클래식 룬 메인 영역 (구 롤 룬/특성 시스템)
    const classicContainer = $('<div>', { id: 'rune-classic-container', css: { display: 'none', textAlign: 'center' } });
    const classicRunesData = [
        { type: '🔴 표식 (Mark)', color: '#e84118', items: [
            { name: '상급 공격력 표식', stat: '+0.95 공격력', icon: '7201_Mark_1.png' },
            { name: '상급 방어구 관통력 표식', stat: '+1.28 방어구 관통력', icon: '7201_Mark_2.png' },
            { name: '상급 마법 관통력 표식', stat: '+0.87 마법 관통력', icon: '7201_Mark_3.png' },
            { name: '상급 공격 속도 표식', stat: '+1.7% 공격 속도', icon: '7201_Mark_4.png' }
        ]},
        { type: '🟡 인장 (Seal)', color: '#fbc531', items: [
            { name: '상급 방어력 인장', stat: '+1.0 방어력', icon: '7202_Seal_1.png' },
            { name: '상급 성장 체력 인장', stat: '18레벨 체력 +24', icon: '7202_Seal_2.png' },
            { name: '상급 마나 재생 인장', stat: '+0.41 마나 재생/5초', icon: '7202_Seal_3.png' }
        ]},
        { type: '🔵 문양 (Glyph)', color: '#00a8ff', items: [
            { name: '상급 마법 저항력 문양', stat: '+1.34 마법 저항력', icon: '7203_Glyph_1.png' },
            { name: '상급 주문력 문양', stat: '+1.19 주문력', icon: '7203_Glyph_2.png' },
            { name: '상급 재쿨감 문양', stat: '-0.83% 재사용 대기시간', icon: '7203_Glyph_3.png' }
        ]},
        { type: '🟣 정수 (Quintessence)', color: '#9c88ff', items: [
            { name: '상급 이동 속도 정수', stat: '+1.5% 이동 속도', icon: '7204_Quint_1.png' },
            { name: '상급 공격력 정수', stat: '+2.25 공격력', icon: '7204_Quint_2.png' },
            { name: '상급 주문력 정수', stat: '+4.95 주문력', icon: '7204_Quint_3.png' },
            { name: '상급 생명력 흡수 정수', stat: '+1.5% 생명력 흡수', icon: '7204_Quint_4.png' }
        ]}
    ];

    classicRunesData.forEach(cGroup => {
        classicContainer.append(`<h5 style="color:${cGroup.color}; margin:16px 0 10px 0; font-weight:700; text-align:center;">${cGroup.type}</h5>`);
        const cGrid = $('<div>', { css: { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '14px' } });
        
        cGroup.items.forEach(cRune => {
            const fallbackIconUrl = `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/7200_Domination.png`;
            const card = $(`
                <div class="rune-card" title="${cRune.name} (${cRune.stat})" style="display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.5); padding:8px 14px; border-radius:10px; cursor:pointer; border:1px solid ${cGroup.color}; transition:all 0.2s ease;">
                    <span style="font-size:18px;">💎</span>
                    <div style="display:flex; flex-direction:column; text-align:left;">
                        <span style="font-weight:bold; color:#fff; font-size:12px;">${cRune.name}</span>
                        <span style="font-size:10px; color:${cGroup.color}; font-weight:bold;">${cRune.stat}</span>
                    </div>
                </div>
            `);
            card.on('click', () => {
                insertRuneImageToEditor(fallbackIconUrl, cRune.name);
            });
            cGrid.append(card);
        });
        classicContainer.append(cGrid);
    });

    content.append(classicContainer);

    // 룬 모드 전환 클릭 핸들러
    modeNav.find('.rune-mode-btn').on('click', function() {
        modeNav.find('.rune-mode-btn').removeClass('btn-primary').addClass('btn-default');
        $(this).removeClass('btn-default').addClass('btn-primary');
        const mode = $(this).attr('data-mode');
        if (mode === 'classic') {
            originalContainer.hide();
            classicContainer.show();
        } else {
            classicContainer.hide();
            originalContainer.show();
        }
    });

    modal.append(content);
    $('body').append(modal);

    // 드래그 이동 기능 적용
    makeElementDraggable(header[0], modal[0]);
}

function insertRuneImageToEditor(runeUrl, runeName) {
    const size = AppState.insertedIconSize || 38;
    const html = `<img src="${runeUrl}" alt="${runeName}" title="${runeName}" style="width:${size}px; height:${size}px; vertical-align:middle; margin:0 3px; border-radius:5px;"/>&nbsp;`;
    const targetSelector = AppState.lastActiveEditor || '#editor';
    const $targetEditor = $(targetSelector);

    if ($targetEditor.length && $targetEditor.summernote) {
        $targetEditor.summernote('focus');
        $targetEditor.summernote('pasteHTML', html);
        $targetEditor.summernote('focus');
    }
}


// --- 아이템 비교 차트 모달 (Item Comparison System) ---
async function openItemComparisonModal() {
    const items = await DataDragonService.getItems();
    if (!items || !Object.keys(items).length) {
        alert('아이템 데이터를 불러오지 못했습니다.');
        return;
    }

    $('#item-modal').remove();

    const modalWidth = Math.min(window.innerWidth * 0.90, 860);
    const modalHeight = Math.min(window.innerHeight * 0.85, 700);
    const initialLeft = Math.max((window.innerWidth - modalWidth) / 2, 10);
    const initialTop = Math.max((window.innerHeight - modalHeight) / 2, 10);

    const modal = $('<div>', {
        class: 'modal compare-dialog-modal',
        id: 'item-modal',
        css: {
            display: 'block',
            position: 'fixed',
            top: `${initialTop}px`,
            left: `${initialLeft}px`,
            transform: 'none',
            zIndex: 9999999,
            width: `${modalWidth}px`,
            background: 'none',
            boxShadow: 'none'
        }
    });

    const content = $('<div>', {
        class: 'modal-content draggable-modal-content',
        css: {
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            border: '2px solid #fbc531',
            boxShadow: '0 0 50px rgba(251, 197, 49, 0.4)',
            borderRadius: '14px',
            padding: '20px'
        }
    });

    const header = $('<div>', {
        id: 'item-modal-header',
        css: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '10px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'move',
            userSelect: 'none'
        }
    });
    header.append('<h3 style="margin:0; color:#fff; font-size:16px; font-weight:700;">✋ ⚔️ 아이템 스탯 비교 & 템트리 패널 <small style="font-size:11px; color:#aaa; font-weight:normal;">(아이템 선택 후 삽입 버튼을 누르면 메모장에 찍힙니다)</small></h3>');
    const closeBtn = $('<button>', { text: '✕ 닫기', class: 'btn btn-danger btn-sm', click: () => modal.remove() });
    header.append(closeBtn);
    content.append(header);

    // 아이콘 크기 조절 컨트롤바
    const curSize = AppState.insertedIconSize || 38;
    const sizeControlBar = $(`
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.35); padding:8px 14px; border-radius:8px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.08);">
            <span style="font-size:12px; color:#ddd; font-weight:bold;">🖼️ 에디터 삽입 아이콘 크기 설정:</span>
            <div class="btn-group btn-group-sm" id="item-icon-size-selector">
                <button type="button" class="btn ${curSize === 30 ? 'btn-primary' : 'btn-default'}" data-size="30">보통 (30px)</button>
                <button type="button" class="btn ${curSize === 38 ? 'btn-primary' : 'btn-default'}" data-size="38">크게 (38px)</button>
                <button type="button" class="btn ${curSize === 48 ? 'btn-primary' : 'btn-default'}" data-size="48">왕대형 (48px)</button>
            </div>
        </div>
    `);

    sizeControlBar.find('#item-icon-size-selector button').on('click', function() {
        const newSize = parseInt($(this).attr('data-size')) || 38;
        AppState.insertedIconSize = newSize;
        sizeControlBar.find('button').removeClass('btn-primary').addClass('btn-default');
        $(this).removeClass('btn-default').addClass('btn-primary');
    });

    content.append(sizeControlBar);

    // 아이템 카테고리 필터 탭
    let currentCategory = 'ALL';
    const categoryNav = $(`
        <div class="btn-group btn-group-sm" style="margin-bottom:12px; display:flex; width:100%;">
            <button type="button" class="btn btn-primary item-cat-btn" data-cat="ALL" style="flex:1;">ALL 전체</button>
            <button type="button" class="btn btn-default item-cat-btn" data-cat="AD" style="flex:1;">⚔️ 물리 (AD)</button>
            <button type="button" class="btn btn-default item-cat-btn" data-cat="AP" style="flex:1;">🔮 마법 (AP)</button>
            <button type="button" class="btn btn-default item-cat-btn" data-cat="DEF" style="flex:1;">🛡️ 방어/체력</button>
            <button type="button" class="btn btn-default item-cat-btn" data-cat="BOOTS" style="flex:1;">👞 신발</button>
        </div>
    `);

    categoryNav.find('.item-cat-btn').on('click', function() {
        categoryNav.find('.item-cat-btn').removeClass('btn-primary').addClass('btn-default');
        $(this).removeClass('btn-default').addClass('btn-primary');
        currentCategory = $(this).attr('data-cat');
        renderItemGrid($('#item-search-input').val().trim());
    });

    content.append(categoryNav);

    // 아이템 검색창
    const searchBar = $(`
        <div style="margin-bottom:12px; display:flex; gap:10px;">
            <input type="text" id="item-search-input" class="form-control" placeholder="🔍 아이템 이름 검색 (예: 무한의 대검, 존야, 몰락)..." style="background:var(--card-bg); color:#fff; border:1px solid var(--border-color); font-size:13px;"/>
        </div>
    `);
    content.append(searchBar);

    // 스탯 비교 차트 영역
    const chartBox = $('<div>', { css: { background: 'rgba(0,0,0,0.35)', padding: '12px', borderRadius: '10px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.08)' } });
    const canvas = $('<canvas>', { id: 'item-chart', height: 160 });
    chartBox.append(canvas);
    content.append(chartBox);

    // 선택된 아이템 태그 목록 및 카드 Grid
    const selectedItemIds = [];
    const itemGrid = $('<div>', { id: 'item-grid-list', css: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxHeight: '200px', overflowY: 'auto', padding: '4px' } });
    content.append(itemGrid);

    // 선택한 아이템 메모장 일괄 삽입 액션 바
    const insertActionBar = $(`
        <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.45); padding:10px 16px; border-radius:10px; border:1px solid #fbc531;">
            <span id="selected-item-count-text" style="color:#fff; font-size:13px; font-weight:bold;">선택된 아이템: <span style="color:#fbc531;">0</span>개</span>
            <button id="insert-selected-items-btn" class="btn btn-warning btn-sm" style="font-weight:bold;">📥 선택한 아이템 메모장에 삽입</button>
        </div>
    `);

    insertActionBar.find('#insert-selected-items-btn').on('click', function() {
        if (!selectedItemIds.length) {
            alert('에디터에 삽입할 아이템을 목록에서 먼저 선택하세요.');
            return;
        }
        const ver = AppState.version;
        selectedItemIds.forEach(id => {
            const item = items[id];
            if (item) {
                const imgUrl = `https://ddragon.leagueoflegends.com/cdn/${ver}/img/item/${id}.png`;
                insertItemImageToEditor(imgUrl, item.name);
            }
        });
    });

    content.append(insertActionBar);

    // 아이템 스탯 요약 파싱 헬퍼
    function getItemStatSummary(stats) {
        if (!stats) return '';
        const parts = [];
        if (stats.FlatPhysicalDamageMod) parts.push(`AD +${stats.FlatPhysicalDamageMod}`);
        if (stats.FlatMagicDamageMod) parts.push(`AP +${stats.FlatMagicDamageMod}`);
        if (stats.FlatHPPool) parts.push(`HP +${stats.FlatHPPool}`);
        if (stats.FlatArmorMod) parts.push(`방어 +${stats.FlatArmorMod}`);
        if (stats.FlatSpellBlockMod) parts.push(`마저 +${stats.FlatSpellBlockMod}`);
        if (stats.PercentAttackSpeedMod) parts.push(`공속 +${Math.round(stats.PercentAttackSpeedMod * 100)}%`);
        if (stats.FlatCritChanceMod) parts.push(`치명타 +${Math.round(stats.FlatCritChanceMod * 100)}%`);
        if (stats.FlatMovementSpeedMod) parts.push(`이속 +${stats.FlatMovementSpeedMod}`);
        return parts.slice(0, 2).join(' | ');
    }

    // 아이템 배열 가공 & 정렬 (소환사의 협곡 전용 & 가격 내림차순)
    function renderItemGrid(filterText = '') {
        itemGrid.empty();
        const ver = AppState.version;
        content.find('#selected-item-count-text').html(`선택된 아이템: <span style="color:#fbc531; font-size:14px;">${selectedItemIds.length}</span>개`);

        const itemList = [];
        for (const id in items) {
            const item = items[id];

            // 클래식 & 정통 롤 아이템 수용 (구매 가능 상점 아이템 대상)
            if (!item.gold || !item.gold.purchasable || item.gold.total < 300) continue;
            if (item.inStore === false) continue;
            if (item.tags && item.tags.includes('Trinket')) continue;

            const tags = item.tags || [];
            const stats = item.stats || {};

            // 2. 카테고리별 정밀 필터링 판별
            if (currentCategory === 'AD') {
                const isAD = tags.includes('Damage') || tags.includes('CriticalStrike') || tags.includes('AttackSpeed') || (stats.FlatPhysicalDamageMod > 0);
                if (!isAD) continue;
            } else if (currentCategory === 'AP') {
                const isAP = tags.includes('SpellDamage') || tags.includes('MagicPenetration') || (stats.FlatMagicDamageMod > 0);
                if (!isAP) continue;
            } else if (currentCategory === 'DEF') {
                const isDEF = tags.includes('Health') || tags.includes('Armor') || tags.includes('SpellBlock') || tags.includes('HealthRegen') || (stats.FlatHPPool > 0) || (stats.FlatArmorMod > 0) || (stats.FlatSpellBlockMod > 0);
                if (!isDEF) continue;
            } else if (currentCategory === 'BOOTS') {
                const isBoots = tags.includes('Boots');
                if (!isBoots) continue;
            }

            if (filterText && !item.name.includes(filterText)) continue;

            itemList.push({ id, ...item });
        }

        // 가격 내림차순 정렬 (비싸고 완성도 높은 전설/핵심 아이템 상단 배치)
        itemList.sort((a, b) => b.gold.total - a.gold.total);

        itemList.forEach(item => {
            const id = item.id;
            const isSelected = selectedItemIds.includes(id);
            const imgUrl = `https://ddragon.leagueoflegends.com/cdn/${ver}/img/item/${id}.png`;
            const statText = getItemStatSummary(item.stats);

            const card = $(`
                <div class="item-card" title="${item.name}: ${statText || '특수 아이템'}" style="display:flex; align-items:center; gap:8px; background:${isSelected ? 'rgba(0,168,255,0.4)' : 'rgba(0,0,0,0.5)'}; padding:6px 12px; border-radius:8px; cursor:pointer; border:1px solid ${isSelected ? '#00d2ff' : 'rgba(255,255,255,0.12)'}; transition:all 0.15s ease;">
                    <img src="${imgUrl}" alt="${item.name}" style="width:30px; height:30px; border-radius:5px;"/>
                    <div style="display:flex; flex-direction:column;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="font-size:12px; color:#fff; font-weight:700;">${item.name}</span>
                            <span style="font-size:10px; color:#fbc531; font-weight:bold;">${item.gold.total}G</span>
                        </div>
                        ${statText ? `<span style="font-size:10px; color:#00a8ff; font-weight:bold;">${statText}</span>` : ''}
                    </div>
                </div>
            `);

            card.on('click', function() {
                if (selectedItemIds.includes(id)) {
                    const idx = selectedItemIds.indexOf(id);
                    selectedItemIds.splice(idx, 1);
                } else {
                    if (selectedItemIds.length >= 6) selectedItemIds.shift();
                    selectedItemIds.push(id);
                }
                renderItemGrid($('#item-search-input').val().trim());
                updateItemChart();
            });

            itemGrid.append(card);
        });
    }

    let itemChartInstance = null;

    function updateItemChart() {
        if (!selectedItemIds.length) return;
        const ctx = document.getElementById('item-chart').getContext('2d');

        const labels = selectedItemIds.map(id => items[id].name);
        const adData = selectedItemIds.map(id => (items[id].stats ? items[id].stats.FlatPhysicalDamageMod || 0 : 0));
        const apData = selectedItemIds.map(id => (items[id].stats ? items[id].stats.FlatMagicDamageMod || 0 : 0));
        const hpData = selectedItemIds.map(id => (items[id].stats ? items[id].stats.FlatHPPool || 0 : 0));
        const armorData = selectedItemIds.map(id => (items[id].stats ? items[id].stats.FlatArmorMod || 0 : 0));
        const goldData = selectedItemIds.map(id => (items[id].gold ? (items[id].gold.total / 10) || 0 : 0));

        if (itemChartInstance) itemChartInstance.destroy();

        itemChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: '공격력(AD)', data: adData, backgroundColor: 'rgba(232, 65, 24, 0.85)', borderRadius: 4 },
                    { label: '주문력(AP)', data: apData, backgroundColor: 'rgba(156, 136, 255, 0.85)', borderRadius: 4 },
                    { label: '체력(HP)', data: hpData, backgroundColor: 'rgba(76, 209, 55, 0.85)', borderRadius: 4 },
                    { label: '방어력(Armor)', data: armorData, backgroundColor: 'rgba(251, 197, 49, 0.85)', borderRadius: 4 },
                    { label: '가격 (10G 단위)', data: goldData, backgroundColor: 'rgba(0, 168, 255, 0.65)', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: { duration: 900, easing: 'easeInOutQuart' },
                plugins: {
                    legend: { labels: { color: '#fff', font: { weight: 'bold' } } }
                },
                scales: {
                    x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.08)' } }
                }
            }
        });
    }

    content.find('#item-search-input').on('input', function() {
        renderItemGrid($(this).val().trim());
    });

    modal.append(content);
    $('body').append(modal);

    makeElementDraggable(header[0], modal[0]);
    renderItemGrid();
}

function insertItemImageToEditor(imgUrl, itemName) {
    const size = AppState.insertedIconSize || 38;
    const html = `<img src="${imgUrl}" alt="${itemName}" title="${itemName}" style="width:${size}px; height:${size}px; border-radius:5px; vertical-align:middle; margin:0 3px; border:1px solid rgba(255,255,255,0.25);"/>&nbsp;`;
    const targetSelector = AppState.lastActiveEditor || '#editor';
    const $targetEditor = $(targetSelector);

    if ($targetEditor.length && $targetEditor.summernote) {
        $targetEditor.summernote('focus');
        $targetEditor.summernote('pasteHTML', html);
        $targetEditor.summernote('focus');
    }
}





