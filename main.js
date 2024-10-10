// main.js

// Editor Initialization and Event Handlers

$(document).ready(function() {
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

