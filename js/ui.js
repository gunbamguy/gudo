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

function insertSpellImageToEditor(imgName, spellName, key) {
    const imgUrl = `https://ddragon.leagueoflegends.com/cdn/${AppState.version}/img/spell/${imgName}`;
    const html = `<img src="${imgUrl}" alt="${spellName}" title="[${key}] ${spellName}" style="width:32px; height:32px; border-radius:4px; vertical-align:middle; margin:0 3px; border:1px solid rgba(255,255,255,0.2);"/>`;
    if ($('#editor').length && $('#editor').summernote) {
        $('#editor').summernote('pasteHTML', html);
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
        $('#my-team').find('.team').children().last().remove();
        $('#enemy-team').find('.team').children().last().remove();
        $('#comparison-buttons').children().last().remove();
        AppState.myTeamSlots--;
        AppState.enemyTeamSlots--;
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
            width: '90%',
            maxWidth: '850px',
            background: 'none',
            boxShadow: 'none'
        }
    });

    const content = $('<div>', {
        class: 'modal-content draggable-modal-content',
        css: {
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            border: '2px solid var(--blue-accent)',
            boxShadow: '0 0 50px rgba(0, 168, 255, 0.4)',
            borderRadius: '12px',
            padding: '20px'
        }
    });

    const header = $('<div>', {
        id: 'compare-modal-header',
        css: {
            display: 'flex',
            justify-content: 'space-between',
            align-items: 'center',
            marginBottom: '15px',
            paddingBottom: '10px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'move',
            userSelect: 'none'
        }
    });
    header.append(`<h3 style="margin:0; color:#fff; font-size:16px; font-weight:700;">✋ Matchup 스탯 비교: <span style="color:var(--blue-accent);">${c1.name}</span> vs <span style="color:var(--accent-color);">${c2.name}</span> <small style="font-size:11px; color:#aaa; font-weight:normal;">(헤더를 잡고 창 이동 가능)</small></h3>`);
    
    const closeBtn = $('<button>', { text: '✕ 닫기', class: 'btn btn-danger btn-sm', click: () => modal.remove() });
    header.append(closeBtn);
    content.append(header);

    // 탭 메뉴 버튼
    const tabNav = $('<div>', { class: 'btn-group', css: { marginBottom: '15px', width: '100%', display: 'flex' } });
    const btnTab1 = $('<button>', { class: 'btn btn-primary nav-tab-btn active', text: '📊 기본 스탯 비교', css: { flex: 1 } });
    const btnTab2 = $('<button>', { class: 'btn btn-default nav-tab-btn', text: '⏱️ 스킬 쿨타임 비교', css: { flex: 1 } });
    const btnTab3 = $('<button>', { class: 'btn btn-default nav-tab-btn', text: '🎯 스킬 사거리 비교', css: { flex: 1 } });
    tabNav.append(btnTab1, btnTab2, btnTab3);
    content.append(tabNav);

    // 탭 1: 기본 스탯
    const page1 = $('<div>', { id: 'cmp-page-1', class: 'cmp-page' });
    const canvas1 = $('<canvas>', { id: 'chart-stat', height: 180 });
    page1.append(canvas1);
    content.append(page1);

    // 탭 2: 스킬 쿨타임
    const page2 = $('<div>', { id: 'cmp-page-2', class: 'cmp-page', css: { display: 'none' } });
    const canvas2 = $('<canvas>', { id: 'chart-skill', height: 180 });
    page2.append(canvas2);
    content.append(page2);

    // 탭 3: 스킬 사거리
    const page3 = $('<div>', { id: 'cmp-page-3', class: 'cmp-page', css: { display: 'none' } });
    const canvas3 = $('<canvas>', { id: 'chart-range', height: 180 });
    page3.append(canvas3);
    content.append(page3);

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

    // Chart.js 수치 숫자 표시 공통 옵션
    const chartOptionsWithLabels = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            datalabels: {
                color: '#ffffff',
                anchor: 'end',
                align: 'top',
                font: { weight: 'bold', size: 11 },
                formatter: (val) => val || 0
            }
        }
    };

    const hasDataLabelsPlugin = typeof ChartDataLabels !== 'undefined';
    const chartPlugins = hasDataLabelsPlugin ? [ChartDataLabels] : [];

    // 1. 기본 스탯 Chart
    new Chart(document.getElementById('chart-stat').getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['공격력', '방어력', '체력', '마나', '이동속도'],
            datasets: [
                { label: c1.name, data: [c1.stats.attackdamage, c1.stats.armor, c1.stats.hp, c1.stats.mp, c1.stats.movespeed], backgroundColor: 'rgba(0, 168, 255, 0.8)' },
                { label: c2.name, data: [c2.stats.attackdamage, c2.stats.armor, c2.stats.hp, c2.stats.mp, c2.stats.movespeed], backgroundColor: 'rgba(232, 65, 24, 0.8)' }
            ]
        },
        plugins: chartPlugins,
        options: chartOptionsWithLabels
    });

    // 2. 스킬 쿨타임 Chart (Q, W, E, R)
    const spellKeys = ['Q', 'W', 'E', 'R'];
    const c1Cooldowns = c1.spells.map((s, idx) => ({ key: spellKeys[idx], cd: s.cooldown[0] || 0 }));
    const c2Cooldowns = c2.spells.map((s, idx) => ({ key: spellKeys[idx], cd: s.cooldown[0] || 0 }));

    new Chart(document.getElementById('chart-skill').getContext('2d'), {
        type: 'bar',
        data: {
            labels: spellKeys.map(k => `스킬 [${k}]`),
            datasets: [
                { label: `${c1.name} 쿨타임(초)`, data: c1Cooldowns.map(c => c.cd), backgroundColor: 'rgba(0, 168, 255, 0.8)' },
                { label: `${c2.name} 쿨타임(초)`, data: c2Cooldowns.map(c => c.cd), backgroundColor: 'rgba(232, 65, 24, 0.8)' }
            ]
        },
        plugins: chartPlugins,
        options: chartOptionsWithLabels
    });

    // 3. 스킬 사거리 Chart (Q, W, E, R)
    const c1Ranges = c1.spells.map(s => parseInt(s.rangeBurn) || 0);
    const c2Ranges = c2.spells.map(s => parseInt(s.rangeBurn) || 0);

    new Chart(document.getElementById('chart-range').getContext('2d'), {
        type: 'bar',
        data: {
            labels: spellKeys.map(k => `스킬 [${k}]`),
            datasets: [
                { label: `${c1.name} 사거리`, data: c1Ranges, backgroundColor: 'rgba(68, 189, 50, 0.8)' },
                { label: `${c2.name} 사거리`, data: c2Ranges, backgroundColor: 'rgba(251, 197, 49, 0.8)' }
            ]
        },
        plugins: chartPlugins,
        options: chartOptionsWithLabels
    });
}

// 요소 드래그 이동 유틸리티 함수 (창 이동 기능)
function makeElementDraggable(dragHandle, targetElement) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    dragHandle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        targetElement.style.transform = 'none';
        targetElement.style.top = (targetElement.offsetTop - pos2) + 'px';
        targetElement.style.left = (targetElement.offsetLeft - pos1) + 'px';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

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





