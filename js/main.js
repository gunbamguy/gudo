// main.js - 메인 애플리케이션 바인딩 및 에디터 관리

$(document).ready(async function() {
    // 1. 초기 데이터 페치 및 DB 서비스 준비
    await DataDragonService.getChampionList();
    await DBService.init();

    // 2. 드롭다운 요소 초기화
    const memoChampionDropdownMain = $('#memo-champion-dropdown');
    const formationDropdownMain = $('#formation-dropdown');
    const memoChampionDropdownModal = $('#memo-champion-dropdown-modal');
    const formationDropdownModal = $('#formation-dropdown-modal');

    // 메인 및 모달 드롭다운 이벤트 핸들러
    memoChampionDropdownMain.add(memoChampionDropdownModal).on('change', function() {
        const selectedChampionId = $(this).val();
        if (selectedChampionId) {
            enableMemo(selectedChampionId);
            displayChampionInfo(selectedChampionId);
            $('#champion-selection').hide();
        }
    });

    formationDropdownMain.add(formationDropdownModal).on('change', function() {
        const selectedKey = $(this).val();
        if (selectedKey) {
            loadFormation(selectedKey);
            $('#champion-selection').hide();
        }
    });

    // 드롭다운 목록 초기 업데이트
    updateAllDropdowns();

    // 3. 헤더 및 데이터 조작 버튼 바인딩
    $('#import-file-input').on('change', importData);
    $('#import-data-button').on('click', () => $('#import-file-input').click());
    $('#load-data-button').on('click', () => {
        const base64Data = prompt('불러올 데이터 문자열을 입력하세요:');
        if (base64Data) loadDataFromBase64(base64Data);
    });
    $('#copy-to-clipboard-button').on('click', exportDataToClipboard);
    $('#export-url-button').on('click touchstart', exportDataAsUrl);
    $('#export-data-button').on('click', exportData);
    $('#delete-memory-button').on('click', deleteAllData);

    // URL 파라미터 자동 로드
    const urlParams = new URLSearchParams(window.location.search);
    const base64Data = urlParams.get('data');
    if (base64Data) {
        loadDataFromBase64(base64Data);
    }

    // 모달 및 확대 포커스 이벤트
    $('#select-champion-button').on('click', displayRoleSelection);
    $('#close-modal-button').on('click', () => $('#champion-selection').fadeOut(200));
    $('#open-popup-button').on('click', function() {
        $('#main-container').toggleClass('focus-mode');
        $(this).text($('#main-container').hasClass('focus-mode') ? '↙️ 축소하기' : '🔍 밴픽 화면 크게보기');
    });

    // 4. Summernote 에디터 단 1회 초기화
    initSummernoteEditors();

    // 5. 저장 버튼 동작
    $('#save-memo-button').on('click', function() {
        const memoContent = $('#editor').summernote('code');
        if (AppState.currentChampionId) {
            saveMemo(AppState.currentChampionId, { memoContent });
        } else {
            alert('먼저 메모를 작성할 챔피언을 선택하세요.');
        }
    });

    $('#save-formation-button').on('click', saveFormation);
});

// Summernote 에디터 단일 초기화 함수
function initSummernoteEditors() {
    // 챔피언 메모 에디터
    $('#editor').summernote({
        height: 250,
        minHeight: 150,
        lang: 'ko-KR',
        toolbar: [
            ['insert', ['link', 'picture', 'youtubeLink', 'customPyeong', 'skillQ', 'skillW', 'skillE', 'skillR']],
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['view', ['fullscreen', 'codeview']]
        ],
        buttons: {
            youtubeLink: createYouTubeButton(),
            customPyeong: createPyeongButton(),
            skillQ: (ctx) => createSkillButton(ctx, 'Q'),
            skillW: (ctx) => createSkillButton(ctx, 'W'),
            skillE: (ctx) => createSkillButton(ctx, 'E'),
            skillR: (ctx) => createSkillButton(ctx, 'R')
        }
    });

    // 구도 페이지 에디터
    $('#formation-editor').summernote({
        height: 250,
        minHeight: 150,
        lang: 'ko-KR',
        toolbar: [
            ['insert', ['link', 'picture', 'youtubeLink']],
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['view', ['fullscreen', 'codeview']]
        ],
        buttons: {
            youtubeLink: createYouTubeButton()
        }
    });
}

// 툴바용 헬퍼 함수
function createYouTubeButton() {
    return function(context) {
        const ui = $.summernote.ui;
        return ui.button({
            contents: '<i class="note-icon-video"/>',
            tooltip: 'YouTube 영상 삽입',
            click: function() {
                const url = prompt('YouTube URL을 입력하세요:');
                if (url) {
                    let embedUrl = '';
                    let startTime = '';
                    const timeMatch = url.match(/[?&]t=(\d+)/);
                    if (timeMatch) startTime = '?start=' + timeMatch[1];

                    if (url.includes('youtu.be/')) {
                        const videoId = url.split('youtu.be/')[1].split('?')[0];
                        embedUrl = `https://www.youtube.com/embed/${videoId}${startTime}`;
                    } else if (url.includes('watch?v=')) {
                        embedUrl = url.replace("watch?v=", "embed/") + startTime;
                    } else if (url.includes('/shorts/')) {
                        embedUrl = url.replace("/shorts/", "/embed/") + startTime;
                    }

                    if (embedUrl) {
                        const iframeTag = `<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allowfullscreen style="max-width:100%; border-radius: 8px;"></iframe>`;
                        context.invoke('editor.pasteHTML', iframeTag);
                    }
                }
            }
        }).render();
    };
}

function createPyeongButton() {
    return function(context) {
        const ui = $.summernote.ui;
        return ui.button({
            contents: '<b style="color: #ff6b6b;">평</b>',
            tooltip: '평타 텍스트 삽입',
            click: function() {
                context.invoke('editor.pasteHTML', '<span style="font-size: 24px; font-weight: bold; color: #ff6b6b;">평</span>');
            }
        }).render();
    };
}

function createSkillButton(context, skillKey) {
    const ui = $.summernote.ui;
    return ui.button({
        contents: `<span>${skillKey}</span>`,
        tooltip: `스킬 ${skillKey} 아이콘 삽입`,
        click: async function() {
            const championId = AppState.currentChampionId;
            if (!championId) {
                alert('먼저 챔피언을 선택해 주세요.');
                return;
            }
            const champion = await DataDragonService.getChampionDetail(championId);
            if (!champion) return;
            const skillIndex = ['Q', 'W', 'E', 'R'].indexOf(skillKey);
            if (skillIndex !== -1 && champion.spells[skillIndex]) {
                const spell = champion.spells[skillIndex];
                const imgTag = `<img src="https://ddragon.leagueoflegends.com/cdn/${AppState.version}/img/spell/${spell.image.full}" alt="${spell.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; display: inline-block; vertical-align: middle; margin: 0 2px;"/>`;
                context.invoke('editor.pasteHTML', imgTag);
            }
        }
    }).render();
}

async function enableMemo(championId) {
    AppState.currentChampionId = championId;
    window.currentChampionId = championId;
    const content = await DBService.getMemo(championId);
    if ($('#editor').length && $('#editor').summernote) {
        $('#editor').summernote('code', content || '');
    }
}

async function loadFormation(selectedKey) {
    const formations = await DBService.getAllFormations();
    const target = formations.find(f => f.key === selectedKey);
    if (target) {
        if ($('#formation-editor').length && $('#formation-editor').summernote) {
            $('#formation-editor').summernote('code', target.memoContent || '');
        }

        const match = selectedKey.match(/my:([^_]+)_enemy:([^_]+)/);
        if (match) {
            const myChamps = match[1].split('-');
            const enemyChamps = match[2].split('-');

            const myTeamContainer = $('#my-team').find('.team');
            const enemyTeamContainer = $('#enemy-team').find('.team');

            myTeamContainer.children().each(function(i) {
                if (myChamps[i]) setChampionToSlot(this, myChamps[i]);
                else $(this).empty();
            });

            enemyTeamContainer.children().each(function(i) {
                if (enemyChamps[i]) setChampionToSlot(this, enemyChamps[i]);
                else $(this).empty();
            });
        }
    }
}

async function deleteAllData() {
    if (!confirm('정말로 모든 메모 및 구도 데이터를 삭제하시겠습니까?')) return;

    $('#my-team .team .slot, #enemy-team .team .slot').empty();
    if ($('#editor').length) $('#editor').summernote('code', '');
    if ($('#formation-editor').length) $('#formation-editor').summernote('code', '');

    await DBService.clearAll();
    updateAllDropdowns();
    alert('모든 데이터가 초기화되었습니다.');
}