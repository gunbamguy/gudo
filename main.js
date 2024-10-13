// main.js

// Editor Initialization and Event Handlers

$(document).ready(function() {
     //드롭 다운 메뉴 정보갱신
    populateMemoChampionDropdown($('#memo-champion-dropdown'));
    populateFormationDropdown($('#formation-dropdown'));
	
	const urlParams = new URLSearchParams(window.location.search);
    const base64Data = urlParams.get('data');
    if (base64Data) {
        loadDataFromBase64(base64Data);
    }
    // 메인 페이지에서만 실행되는 코드
    if ($('#main-container').length) {
        // 챔피언 선택 버튼 이벤트 리스너
        $('#select-champion-button').on('click', function() {
            displayRoleSelection();
        });

        // 닫기 버튼 이벤트 리스너
        $('#close-modal-button').on('click', function() {
            $('#champion-selection').hide();
        });

        // 초기 데이터 로드
        fetchChampionData();
    }

    // 팝업 창에서만 실행되는 코드 (필요한 경우)
    if (window.opener && window.opener !== window) {
        // 팝업 창 관련 기능 초기화
    }
});

    // Event Listeners for the buttons
    $('#load-data-button').on('click', function() {
        const base64Data = prompt('불러올 데이터를 입력하세요:');
        if (base64Data) {
            loadDataFromBase64(base64Data);
        }
    });

    $('#delete-memory-button').on('click', function() {
        if (confirm('현재 챔프 데이터 삭제하시겠습니까?')) {
            deleteAllData();
            alert('챔프 데이터 삭제되었습니다.');
        } else {
            alert('삭제가 취소되었습니다.');
        }
    });

    $('#editor').summernote({
        height: 'auto',
        minHeight: 150,
        maxHeight: null,
        focus: true,
        lang: 'ko-KR',
        toolbar: [
            ['insert', ['link', 'picture', 'youtubeLinkEditor1', 'customImage', 'skillQ', 'skillW', 'skillE', 'skillR']], // 스킬 버튼 추가
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

                            var timeMatch = url.match(/[?&]t=(\d+)/);
                            if (timeMatch) {
                                startTime = '?start=' + timeMatch[1];
                            }

                            if (url.includes('https://youtu.be/')) {
                                var videoId = url.split('https://youtu.be/')[1].split('?')[0];
                                embedUrl = 'https://www.youtube.com/embed/' + videoId + startTime;
                            } else if (url.includes('https://www.youtube.com/watch?v=')) {
                                embedUrl = url.replace("watch?v=", "embed/") + startTime;
                            } else if (url.includes('https://www.youtube.com/shorts/')) {
                                embedUrl = url.replace("/shorts/", "/embed/") + startTime;
                            }

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
                    contents: '<span style="font-size: 13px;">평</span>',
                    tooltip: 'Insert 평',
                    click: function() {
                        var textTag = '<span style="font-size: 36px;">평</span><span style="font-size: inherit;">';
                        context.invoke('editor.pasteHTML', textTag);
                    }
                });
                return button.render();
            },
            // 스킬 버튼 (Q, W, E, R)
            skillQ: function(context) {
                return createSkillButton(context, 'Q');
            },
            skillW: function(context) {
                return createSkillButton(context, 'W');
            },
            skillE: function(context) {
                return createSkillButton(context, 'E');
            },
            skillR: function(context) {
                return createSkillButton(context, 'R');
            }
        }
    });

    // 스킬 버튼 생성 함수
    function createSkillButton(context, skillKey) {
        var ui = $.summernote.ui;
        var button = ui.button({
            contents: `<span>${skillKey}</span>`,
            tooltip: `Insert Skill ${skillKey}`,
            click: function() {
                const championId = currentChampionId; // 선택된 챔피언 ID를 가져옵니다.
                if (!championId) {
                    alert('챔피언이 선택되지 않았습니다.');
                    return;
                }
                
                fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion/${championId}.json`)
                    .then(response => response.json())
                    .then(data => {
                        const champion = data.data[championId];
                        const skillIndex = ['Q', 'W', 'E', 'R'].indexOf(skillKey);
                        if (skillIndex !== -1 && champion.spells[skillIndex]) {
                            var skill = champion.spells[skillIndex];
                            var imgUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${skill.image.full}`;
                            context.invoke('editor.pasteHTML', imgUrl); // 이미지 URL을 에디터에 삽입
                        }
                    })
                    .catch(error => console.error('챔피언 데이터 로드 실패:', error));
            }
        });
        return button.render();
    }

    // 스킬 버튼 생성 함수
    function createSkillButton(context, skillKey) {
        var ui = $.summernote.ui;
        var button = ui.button({
            contents: `<span>${skillKey}</span>`,
            tooltip: `Insert Skill ${skillKey}`,
            click: function() {
                const championId = currentChampionId; // 선택된 챔피언 ID를 가져옵니다.
                if (!championId) {
                    alert('챔피언이 선택되지 않았습니다.');
                    return;
                }
                
                fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion/${championId}.json`)
                    .then(response => response.json())
                    .then(data => {
                        const champion = data.data[championId];
                        const skillIndex = ['Q', 'W', 'E', 'R'].indexOf(skillKey);
                        if (skillIndex !== -1 && champion.spells[skillIndex]) {
                            var skill = champion.spells[skillIndex];
                            var imgTag = `<img src="https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${skill.image.full}" alt="${skill.name}" style="width: 64px; height: 64px; object-fit: cover;"/>`;
                            context.invoke('editor.pasteHTML', imgTag);
                        }
                    })
                    .catch(error => console.error('챔피언 데이터 로드 실패:', error));
            }
        });
        return button.render();
    }


    // 두 번째 Summernote 에디터 초기화 (구도페이지 메모)
    $('#formation-editor').summernote({
        height: 'auto',
        minHeight: 150,
        maxHeight: 500,
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

    $('#copy-to-clipboard-button').on('click', function() {
        exportDataToClipboard();
    });
	
	$('#export-url-button').on('click touchstart', function() {
    exportDataAsUrl();
});


    $('#export-data-button').on('click', exportData);
    $('#import-data-button').on('click', function() {
        $('#import-file-input').click();
    });
    $('#import-file-input').on('change', importData);
    // Initialize Summernote Editor (Champion Memo)
    $('#editor').summernote({
        height: 'auto',
        minHeight: 150,
        maxHeight: null,
        focus: true,
        lang: 'ko-KR',
        toolbar: [
            ['insert', ['link', 'picture', 'youtubeLinkEditor1', 'customImage']],
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['view', ['fullscreen', 'codeview', 'help']]
        ],
        buttons: {
            youtubeLinkEditor1: function(context) {
                // Existing code for YouTube link button
            },
            customImage: function(context) {
                // Existing code for custom image button
            }
        }
    });

    // Initialize Second Summernote Editor (Formation Memo)
    $('#formation-editor').summernote({
        height: 'auto',
        minHeight: 150,
        maxHeight: null,
        focus: true,
        lang: 'ko-KR',
        toolbar: [
            ['insert', ['link', 'picture', 'youtubeLinkEditor2']],
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
                // Existing code for YouTube link button
            }
        }
    });

    // Event Listeners for Editor Actions
    $('#save-memo-button').on('click', function() {
        const memoContent = $('#editor').summernote('code');
        if (currentChampionId) {
            saveMemo(currentChampionId, { memoContent: memoContent });
        } else {
            alert('챔프를 선택하세요.');
        }
    });

    $('#save-formation-button').on('click', saveFormation);
	
	// export-url-button 클릭 핸들러 수정
$('#export-url-button').on('click touchstart', function() {
    exportDataAsUrl();
});

			

// 모든 메모리와 인덱스 데이터베이스 삭제 함수
function deleteAllData() {
    // 팀 슬롯 안의 내용만 비우기
    $('#my-team .team .slot').each(function() {
        $(this).empty();  // 슬롯 내의 이미지만 비웁니다.
    });
    $('#enemy-team .team .slot').each(function() {
        $(this).empty();  // 상대 팀 슬롯의 내용도 비웁니다.
    });

    // 메모 에디터 비우기
    $('#editor').summernote('code', '');  // 일반 메모 초기화
    $('#formation-editor').summernote('code', '');  // 구도 메모 초기화

    // IndexedDB 모든 데이터 삭제
    if (db) {
        let transaction = db.transaction(['memos', 'formations'], 'readwrite');

        // memos 데이터 삭제
        transaction.objectStore('memos').clear();

        // formations 데이터 삭제
        transaction.objectStore('formations').clear();
    }

    // 메모 데이터 초기화
    formationMemos = {};

    alert('모든 데이터가 삭제되었습니다.');
}


// 선택한 챔피언에 대한 메모를 활성화하는 함수
function enableMemo(championId) {
    loadMemo(championId, function(memo) {
        $('#editor').summernote('code', memo.memoContent || '');
    });
}
