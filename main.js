// main.js

// Editor Initialization and Event Handlers

$(document).ready(function() {

	// 스탯 내보내기 버튼 이벤트 핸들러 수정 (이동기, CC기 여부 표시 - 한국어 키워드 사용)
	$('#copy-stats-button').on('click', function() {
	    const myTeamContainer = $('#my-team').find('.team');
	    const enemyTeamContainer = $('#enemy-team').find('.team');
	
	    let championsToFetch = [];
	    let championStatsText = '';
	
	    // 내 팀 슬롯에 있는 챔피언 정보 수집
	    myTeamContainer.children().each(function() {
	        const championId = $(this).find('img').attr('alt');
	        if (championId) {
	            championsToFetch.push(championId);
	        }
	    });
	
	    // 상대 팀 슬롯에 있는 챔피언 정보 수집
	    enemyTeamContainer.children().each(function() {
	        const championId = $(this).find('img').attr('alt');
	        if (championId) {
	            championsToFetch.push(championId);
	        }
	    });
	
	    // 챔피언이 없다면 경고 메시지 출력
	    if (championsToFetch.length === 0) {
	        alert('양 팀에 선택된 챔피언이 없습니다.');
	        return;
	    }
	
	    // 챔피언 데이터 가져오기 및 클립보드에 복사
	    Promise.all(championsToFetch.map(championId => {
	        return fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion/${championId}.json`)
	            .then(response => response.json())
	            .then(data => {
	                const champion = data.data[championId];
	                let statsText = `챔피언: ${champion.name}\n`;
	
	                // 스킬 정보 추가 (쿨다운, 사거리, 이동기 여부, CC기 여부)
	                champion.spells.forEach((spell, index) => {
	                    const spellKey = getSpellKey(index);
	                    const cooldown = spell.cooldownBurn;
	                    const range = spell.rangeBurn || '알 수 없음';
	                    const description = spell.description;
	
	                    // 이동기 여부 판단
	                    const isMobility = /(돌진|점멸|도약|순간이동|점프)/.test(description) ? '이동기' : '';
	
	                    // CC기 여부 판단
	                    const isCC = /(기절|속박|이동 불가|공중에 띄움|억제|침묵|공포|도발|수면|변이|둔화)/.test(description) ? 'CC기' : '';
	
	                    // 스킬 정보 텍스트 작성
	                    statsText += `${spellKey}: 쿨다운 ${cooldown}초, 사거리 ${range}`;
	                    if (isMobility) statsText += `, ${isMobility}`;
	                    if (isCC) statsText += `, ${isCC}`;
	                    statsText += `\n`;
	                });
	
	                return statsText;
	            });
	    }))
	    .then(statsArray => {
	        championStatsText = statsArray.join('----------------------\n\n');
	        // 클립보드에 복사
	        navigator.clipboard.writeText(championStatsText).then(() => {
	            alert('양 팀의 스킬 정보가 클립보드에 복사되었습니다.');
	        }).catch(err => {
	            console.error('클립보드 복사 실패:', err);
	            alert('클립보드에 복사하는 중 오류가 발생했습니다.');
	        });
	    })
	    .catch(error => {
	        console.error('챔피언 정보 로드 실패:', error);
	    });
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
	
	$('#export-url-button').on('click', function() {
                exportDataAsUrl();
            });

            // 페이지가 로드될 때 URL에 데이터가 있으면 처리
        const urlParams = new URLSearchParams(window.location.search);
        const base64Data = urlParams.get('data');
        if (base64Data) {
            loadDataFromBase64(base64Data);
        }
});

// 모든 메모리와 인덱스 데이터베이스 삭제 함수
function deleteAllData() {
    // 일반 메모 삭제
    $('#editor').summernote('code', '');

    // 구도 메모 삭제
    $('#formation-editor').summernote('code', '');

    // IndexedDB 모든 데이터 삭제
    if (db) {
        // memos 데이터 삭제
        let transaction = db.transaction(['memos'], 'readwrite');
        let memosStore = transaction.objectStore('memos');
        memosStore.clear();

        // formations 데이터 삭제
        transaction = db.transaction(['formations'], 'readwrite');
        let formationsStore = transaction.objectStore('formations');
        formationsStore.clear();
    }
}

