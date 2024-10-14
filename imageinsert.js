// 전역 상태 관리 객체

const AppState = {
    selectedItemsData: [],
    version: null
};

$(document).ready(async function() {
    try {
        // 데이터 드래곤 버전 설정
        AppState.version = await fetchDataDragonVersion();
        console.log("Data Dragon Version:", AppState.version);

        // 룬 카테고리 버튼 이벤트 추가
        $('#select-rune-category-button').on('click', () => {
            displayCategorySelectionModal('룬 카테고리 선택', 'rune');
        });

        // 아이템 카테고리 버튼 이벤트 추가
        $('#select-item-category-button').on('click', () => {
            displayCategorySelectionModal('아이템 카테고리 선택', 'item');
        });
    } catch (error) {
        alert('데이터 드래곤 버전을 불러오는 데 실패했습니다.');
        console.error(error);
    }
});

// 공통 모달 생성 함수
function createModal(id, title) {
    const modal = $('<div>', { class: 'modal-modified', id: id });
    const modalContent = $('<div>', { class: 'modal-content-modified' });

    const closeButton = $('<button>', {
        text: '닫기',
        class: 'close-button',
        click: () => modal.remove()
    });

    // **Added: Export Images Button**
    let exportButton;
    if (id === 'item-selection-modal-modified') { // Only add to item selection modal
        exportButton = $('<button>', {
            text: '이미지 내보내기',
            class: 'export-button',
            click: () => {
                exportSelectedItemsToEditor();
            }
        });
    }

    const modalTitle = $('<h2>', { text: title });
    
    // Append buttons
    if (exportButton) {
        modalContent.append(closeButton, exportButton, modalTitle);
    } else {
        modalContent.append(closeButton, modalTitle);
    }

    modal.append(modalContent);
    $('body').append(modal);
    modal.show();

    return modalContent;
}

// 카테고리 선택 모달 표시 함수
function displayCategorySelectionModal(title, category) {
    const modalContent = createModal('category-selection-modal-modified', title);
    const categoryListDiv = $('<div>', { id: 'category-list-modified', class: 'category-list' });

    if (category === 'rune') {
        loadRuneCategories(categoryListDiv);
    } else if (category === 'item') {
        loadItemCategories(categoryListDiv);
    }

    modalContent.append(categoryListDiv);
}

// 룬 카테고리 로드 함수
async function loadRuneCategories(container) {
    const apiUrl = `https://ddragon.leagueoflegends.com/cdn/${AppState.version}/data/ko_KR/runesReforged.json`;

    try {
        const data = await fetchData(apiUrl);
        data.forEach(tree => {
            const categoryButton = $('<button>', {
                text: tree.name,
                class: 'btn btn-primary category-button',
                click: () => {
                    $('#category-selection-modal-modified').remove();
                    displayImageSelectionModal(`${tree.name} 룬 선택`, tree);
                }
            });
            container.append(categoryButton);
        });
    } catch (error) {
        console.error('룬 카테고리를 불러오는 중 오류 발생:', error);
        container.append('<p>룬 카테고리를 불러오는 데 실패했습니다.</p>');
    }
}

// 아이템 카테고리 로드 함수
function loadItemCategories(container) {
    const categories = ["공격력", "방어력", "마법", "기타"];

    categories.forEach(category => {
        const categoryButton = $('<button>', {
            text: category,
            class: 'btn btn-primary category-button',
            click: function() {
                $('#category-selection-modal-modified').remove();
                displayItemSelectionModal(category);
            }
        });
        container.append(categoryButton);
    });
}

// 아이템 선택 모달 표시 함수
function displayItemSelectionModal(category) {

    const modalContent = createModal('item-selection-modal-modified', `${category} 아이템 선택`);
	resetItemSelection();
    // 상단: 검색, 정렬 드롭다운 및 아이템 목록
    const topContainer = $('<div>', { class: 'modal-top-container' });

    // 왼쪽: 검색 및 아이템 목록
    const searchAndListContainer = $('<div>', { class: 'search-and-list-container' });

    // 검색창 추가 (이벤트 핸들러 제거)
    const searchInput = $('<input>', {
        type: 'text',
        id: 'item-search-input',
        placeholder: '아이템 검색...',
        class: 'item-search-input'
    });

    // 정렬 컨테이너
    const sortContainer = $('<div>', { class: 'sort-container' });

    // 정렬 기준 드롭다운
    const sortBySelect = $('<select>', { id: 'sort-by-select', class: 'sort-select' });
    sortBySelect.append('<option value="name">이름</option>');
    sortBySelect.append('<option value="FlatPhysicalDamageMod">공격력</option>');
    sortBySelect.append('<option value="FlatMagicDamageMod">마법력</option>');
    sortBySelect.append('<option value="FlatArmorMod">방어력</option>');
    sortBySelect.append('<option value="FlatSpellBlockMod">마법 저항력</option>');
    sortBySelect.append('<option value="FlatHPPoolMod">체력</option>');
    sortBySelect.append('<option value="PercentCooldownMod">재사용 감소 (%)</option>');

    // 정렬 순서 드롭다운
    const sortOrderSelect = $('<select>', { id: 'sort-order-select', class: 'sort-select' });
    sortOrderSelect.append('<option value="asc">오름차순</option>');
    sortOrderSelect.append('<option value="desc">내림차순</option>');

    sortContainer.append('<label for="sort-by-select">정렬 기준:</label>', sortBySelect, '<label for="sort-order-select">정렬 순서:</label>', sortOrderSelect);

    // 선택 가능한 아이템 목록
    const itemListDiv = $('<div>', { id: 'item-list-modified' });

    // 왼쪽 컨테이너에 검색창, 정렬 컨테이너 및 아이템 목록 추가
    searchAndListContainer.append(searchInput, sortContainer, itemListDiv);

    // 오른쪽: 선택된 아이템 및 비교 표
    const selectedAndComparisonContainer = $('<div>', { id: 'selected-and-comparison-container' });

    // 선택된 아이템 목록
    const selectedItemsDiv = $('<div>', { id: 'selected-items' });
    selectedItemsDiv.append('<h3>선택된 아이템</h3>');

    // 비교 표 컨테이너
    const comparisonTableContainer = $('<div>', { id: 'comparison-table-container' });
    comparisonTableContainer.append('<h3>아이템 능력치 비교</h3>');
    const comparisonTable = $('<table>', { id: 'comparison-table' });
    comparisonTableContainer.append(comparisonTable);

    // 비교 그래프 컨테이너
    const comparisonGraphContainer = $('<div>', { id: 'comparison-graph-container' });
    const comparisonChartCanvas = $('<canvas>', { id: 'comparison-chart' });
    comparisonGraphContainer.append(comparisonChartCanvas);

    // 오른쪽 컨테이너에 선택된 아이템과 비교 표 추가
    selectedAndComparisonContainer.append(selectedItemsDiv, comparisonTableContainer, comparisonGraphContainer);

    // 상단 컨테이너에 좌우 추가
    topContainer.append(searchAndListContainer, selectedAndComparisonContainer);

    // 모달 콘텐츠에 구성 요소 추가
    modalContent.append(topContainer);

    // 아이템 리스트 로드 및 정렬 이벤트 핸들러 설정
    loadItemsByCategory(category, itemListDiv, selectedItemsDiv, searchInput);
}

// 카테고리에 따른 아이템 로드 함수
let currentItemList = []; // 현재 표시 중인 아이템 리스트

async function loadItemsByCategory(category, container, selectedItemsDiv, searchInput) {
    const apiUrl = `https://ddragon.leagueoflegends.com/cdn/${AppState.version}/data/ko_KR/item.json`;

    try {
        const data = await fetchData(apiUrl);
        const items = data.data;
        currentItemList = []; // 기존 리스트 초기화

        for (const itemId in items) {
            const item = items[itemId];
            item.id = itemId; // 아이템의 id를 설정합니다.
            if (isItemInCategory(item, category)) {
                currentItemList.push(item);
            }
        }

        // 렌더링 함수 정의
        function renderItemList() {
            const searchQuery = searchInput.val().toLowerCase();
            const sortBy = $('#sort-by-select').val();
            const sortOrder = $('#sort-order-select').val();

            // 필터링된 리스트
            let filteredList = currentItemList.filter(item => item.name.toLowerCase().includes(searchQuery));

            // 정렬
            filteredList.sort((a, b) => {
                let aValue, bValue;

                if (sortBy === 'name') {
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                    return 0;
                } else {
                    aValue = a.stats[sortBy] || 0;
                    bValue = b.stats[sortBy] || 0;
                    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                }
            });

            // 아이템 목록 비우기
            container.empty();

            // 정렬된 아이템 추가
            filteredList.forEach(item => {
                const itemButton = $('<button>', {
                    class: 'item-button',
                    click: function() {
                        // 클릭 시 아이템 추가
                        addSelectedItem(item, selectedItemsDiv);
                    }
                });

                const itemImg = $('<img>', {
                    src: `https://ddragon.leagueoflegends.com/cdn/${AppState.version}/img/item/${item.image.full}`,
                    alt: item.name
                });
                itemButton.append(itemImg);

                const itemName = $('<span>', { text: item.name });
                itemButton.append(itemName);

                // + 버튼
                const addButton = $('<button>', {
                    text: '+',
                    class: 'add-button',
                    click: function(event) {
                        event.stopPropagation(); // 이벤트 버블링 방지
                        addSelectedItem(item, selectedItemsDiv);
                    }
                });
                itemButton.append(addButton);

                container.append(itemButton);
            });
        }

        // 초기 렌더링
        renderItemList();

        // 정렬 이벤트 핸들러 설정
        $('#sort-by-select, #sort-order-select').on('change', function() {
            renderItemList();
        });

        // 검색 이벤트 핸들러 설정
        searchInput.on('input', function() {
            renderItemList();
        });

    } catch (error) {
        console.error('아이템 데이터를 불러오는 중 오류 발생:', error);
        container.append('<p>아이템 데이터를 불러오는 데 실패했습니다.</p>');
    }
}



async function loadItemsByCategory(category, container, selectedItemsDiv, searchInput) {
    const apiUrl = `https://ddragon.leagueoflegends.com/cdn/${AppState.version}/data/ko_KR/item.json`;

    try {
        const data = await fetchData(apiUrl);
        const items = data.data;
        currentItemList = []; // 기존 리스트 초기화

        for (const itemId in items) {
            const item = items[itemId];
            item.id = itemId; // 아이템의 id를 설정합니다.
            if (isItemInCategory(item, category)) {
                currentItemList.push(item);
            }
        }

        // 렌더링 함수 정의
        function renderItemList() {
            const searchQuery = searchInput.val().toLowerCase();
            const sortBy = $('#sort-by-select').val();
            const sortOrder = $('#sort-order-select').val();

            // 필터링된 리스트
            let filteredList = currentItemList.filter(item => item.name.toLowerCase().includes(searchQuery));

            // 정렬
            filteredList.sort((a, b) => {
                let aValue, bValue;

                if (sortBy === 'name') {
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                    return 0;
                } else {
                    aValue = a.stats[sortBy] || 0;
                    bValue = b.stats[sortBy] || 0;
                    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                }
            });

            // 아이템 목록 비우기
            container.empty();

            // 정렬된 아이템 추가
            filteredList.forEach(item => {
                const itemButton = $('<button>', {
                    class: 'item-button',
                    click: function() {
                        // 클릭 시 아이템 추가
                        addSelectedItem(item, selectedItemsDiv);
                    }
                });

                const itemImg = $('<img>', {
                    src: `https://ddragon.leagueoflegends.com/cdn/${AppState.version}/img/item/${item.image.full}`,
                    alt: item.name
                });
                itemButton.append(itemImg);

                const itemName = $('<span>', { text: item.name });
                itemButton.append(itemName);

                // + 버튼
                const addButton = $('<button>', {
                    text: '+',
                    class: 'add-button',
                    click: function(event) {
                        event.stopPropagation(); // 이벤트 버블링 방지
                        addSelectedItem(item, selectedItemsDiv);
                    }
                });
                itemButton.append(addButton);

                container.append(itemButton);
            });
        }

        // 초기 렌더링
        renderItemList();

        // 정렬 이벤트 핸들러 설정
        $('#sort-by-select, #sort-order-select').on('change', function() {
            renderItemList();
        });

        // 검색 이벤트 핸들러 설정
        searchInput.on('input', function() {
            renderItemList();
        });

    } catch (error) {
        console.error('아이템 데이터를 불러오는 중 오류 발생:', error);
        container.append('<p>아이템 데이터를 불러오는 데 실패했습니다.</p>');
    }
}

// 이미지 선택 모달 표시 함수
function displayImageSelectionModal(title, data) {
    const modalContent = createModal('image-selection-modal-modified', title);
    const imageListDiv = $('<div>', { id: 'image-list-modified' });

    if (data.slots) {
        loadRunes(data, imageListDiv);
    } else {
        // 필요 시 아이템 이미지 로드 함수 구현
        imageListDiv.append('<p>이미지를 불러오는 기능이 구현되지 않았습니다.</p>');
    }

    modalContent.append(imageListDiv);
}

// 룬 이미지 로드 함수
function loadRunes(tree, container) {
    tree.slots.forEach(slot => {
        slot.runes.forEach(rune => {
            const runeButton = $('<button>', {
                class: 'rune-button',
                click: function() {
                    insertRuneEmbedToMemoEditor(rune.name, rune.icon);
                    $('#image-selection-modal-modified').remove();
                }
            });

            const runeImg = $('<img>', {
                src: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`,
                alt: rune.name
            });
            runeButton.append(runeImg);

            const runeName = $('<span>', { text: rune.name });
            runeButton.append(runeName);

            container.append(runeButton);
        });
    });
}

// 룬을 메모 에디터에 삽입하는 함수
function insertRuneEmbedToMemoEditor(name, image) {
    const embedCode = `<img src="https://ddragon.leagueoflegends.com/cdn/img/${image}" alt="${name}" width="64" height="64" style="object-fit: cover; border-radius: 4px; overflow: hidden;">`;
    if ($('#editor').length && $('#editor').summernote) {
        $('#editor').summernote('editor.pasteHTML', embedCode);
    } else {
        alert('에디터가 초기화되지 않았습니다.');
    }
}

// 아이템을 메모 에디터에 삽입하는 함수
function insertItemEmbedToMemoEditor(item) {
    const embedCode = `<img src="https://ddragon.leagueoflegends.com/cdn/${AppState.version}/img/item/${item.image.full}" alt="${item.name}" width="64" height="64" style="object-fit: cover; border-radius: 4px; overflow: hidden;">`;
    if ($('#editor').length && $('#editor').summernote) {
        $('#editor').summernote('editor.pasteHTML', embedCode);
    } else {
        alert('에디터가 초기화되지 않았습니다.');
    }
}

// **Added: Export Selected Items to Editor Function**
function exportSelectedItemsToEditor() {
    if (AppState.selectedItemsData.length === 0) {
        alert('선택된 아이템이 없습니다.');
        return;
    }
    AppState.selectedItemsData.forEach(item => {
        insertItemEmbedToMemoEditor(item);
    });
    // Optionally, close the modal after exporting
    $('#item-selection-modal-modified').remove();
}

// 아이템이 해당 카테고리에 속하는지 확인하는 함수
function isItemInCategory(item, category) {
    const tags = item.tags || [];
    switch (category) {
        case "공격력":
            return tags.includes("Damage");
        case "방어력":
            return tags.includes("Armor") || tags.includes("Health") || tags.includes("SpellBlock");
        case "마법":
            return tags.includes("SpellDamage");
        case "기타":
            return !tags.includes("Damage") && !tags.includes("Armor") && !tags.includes("Health") && !tags.includes("SpellBlock") && !tags.includes("SpellDamage");
        default:
            return false;
    }
}

// 데이터 드래곤 버전 설정 함수
async function fetchDataDragonVersion() {
    const apiUrl = 'https://ddragon.leagueoflegends.com/api/versions.json';

    try {
        const versions = await fetchData(apiUrl);
        if (versions && versions.length > 0) {
            return versions[0];
        } else {
            throw new Error('버전 정보가 비어 있습니다.');
        }
    } catch (error) {
        console.error('버전 정보를 불러오는 중 오류 발생:', error);
        throw error;
    }
}

// 범용 AJAX GET 함수
async function fetchData(url) {
    try {
        const response = await $.ajax({ url, method: 'GET' });
        return response;
    } catch (error) {
        console.error(`데이터를 불러오는 중 오류 발생:`, error);
        throw error;
    }
}

// 선택된 아이템 추가 함수
function addSelectedItem(item, selectedItemsDiv) {
    if (AppState.selectedItemsData.find(selectedItem => selectedItem.id === item.id)) {
        alert('이미 선택된 아이템입니다.');
        return;
    }

    AppState.selectedItemsData.push(item);
    renderSelectedItems(selectedItemsDiv);
    updateComparisonTable();
}

// 선택된 아이템 렌더링 함수
function renderSelectedItems(container) {
    container.empty();
    container.append('<h3>선택된 아이템</h3>');
    AppState.selectedItemsData.forEach(item => {
        const selectedItem = $('<div>', {
            class: 'selected-item'
        });

        const itemName = $('<span>', { text: item.name });

        // 제거 버튼
        const removeButton = $('<button>', {
            text: '−',
            class: 'remove-button',
            click: function() {
                AppState.selectedItemsData = AppState.selectedItemsData.filter(selected => selected.id !== item.id);
                renderSelectedItems(container);
                updateComparisonTable();
            }
        });

        selectedItem.append(itemName, removeButton);
        container.append(selectedItem);
    });
}

// 선택된 아이템의 능력치 비교표 및 그래프 업데이트 함수
let comparisonChart;

function updateComparisonTable() {
    const comparisonTable = $('#comparison-table');
    comparisonTable.empty(); // 기존 표 내용 비우기

    if (AppState.selectedItemsData.length === 0) {
        comparisonTable.append('<tr><td>선택된 아이템이 없습니다.</td></tr>');
        if (comparisonChart) {
            comparisonChart.destroy();
        }
        return;
    }

    // 비교할 능력치 항목 정의
    const stats = ['FlatPhysicalDamageMod', 'FlatMagicDamageMod', 'FlatArmorMod', 'FlatSpellBlockMod', 'FlatHPPoolMod', 'PercentCooldownMod'];

    // 능력치 표시 이름 매핑
    const statDisplayNames = {
        'FlatPhysicalDamageMod': '공격력',
        'FlatMagicDamageMod': '마법력',
        'FlatArmorMod': '방어력',
        'FlatSpellBlockMod': '마법 저항력',
        'FlatHPPoolMod': '체력',
        'PercentCooldownMod': '재사용 감소 (%)',
    };

    // 표 헤더 생성
    const headerRow = $('<tr>');
    headerRow.append('<th>능력치</th>');
    AppState.selectedItemsData.forEach(item => {
        const th = $('<th>', { text: item.name });
        
        // **Added: Double-Click Event to Remove Item**
        th.css('cursor', 'pointer'); // Indicate that the header is interactive
        th.attr('title', '더블 클릭하여 제거'); // Tooltip for user guidance
        th.on('dblclick', () => {
            removeItem(item.id);
        });
        
        headerRow.append(th);
    });
    comparisonTable.append(headerRow);

    // 각 능력치에 대한 행 생성
    stats.forEach(stat => {
        const row = $('<tr>');
        row.append(`<td>${statDisplayNames[stat] || stat}</td>`);
        AppState.selectedItemsData.forEach(item => {
            // 능력치가 없는 경우 0으로 표시
            const statValue = item.stats[stat] || 0;
            row.append(`<td>${statValue}</td>`);
        });
        comparisonTable.append(row);
    });

    // 그래프 업데이트
    updateComparisonChart(stats, statDisplayNames);
}

// **Added: Remove Item Function**
function removeItem(itemId) {
    AppState.selectedItemsData = AppState.selectedItemsData.filter(item => item.id !== itemId);
    renderSelectedItems($('#selected-items'));
    updateComparisonTable();
}

// 그래프 업데이트 함수
function updateComparisonChart(stats, statDisplayNames) {
    const labels = stats.map(stat => statDisplayNames[stat] || stat);
    const datasets = AppState.selectedItemsData.map((item, index) => {
        return {
            label: item.name,
            data: stats.map(stat => item.stats[stat] || 0),
            backgroundColor: getColor(index),
        };
    });

    // 기존 차트가 있으면 파괴합니다.
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    // 새로운 차트를 생성합니다.
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: '아이템 능력치 비교 그래프'
                }
            },
            scales: {
                x: {
                    stacked: false,
                },
                y: {
                    beginAtZero: true,
                }
            }
        }
    });
}

// 색상 팔레트
function getColor(index) {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    return colors[index % colors.length];
}

// 공통 모달 생성 함수
function createModal(id, title, onClose) { // onClose 추가
    const modal = $('<div>', { class: 'modal-modified', id: id });
    const modalContent = $('<div>', { class: 'modal-content-modified' });

    const closeButton = $('<button>', {
        text: '닫기',
        class: 'close-button',
        click: () => {
            modal.remove();
            if (typeof onClose === 'function') {
                onClose(); // onClose 콜백 실행
            }
        }
    });

    // **Added: Export Images Button**
    let exportButton;
    if (id === 'item-selection-modal-modified') { // Only add to item selection modal
        exportButton = $('<button>', {
            text: '이미지 내보내기',
            class: 'export-button',
            click: () => {
                exportSelectedItemsToEditor();
            }
        });
    }

    const modalTitle = $('<h2>', { text: title });
    
    // Append buttons
    if (exportButton) {
        modalContent.append(closeButton, exportButton, modalTitle);
    } else {
        modalContent.append(closeButton, modalTitle);
    }

    modal.append(modalContent);
    $('body').append(modal);
    modal.show();

    return modalContent;
}

// 아이템 선택 초기화 함수
function resetItemSelection() {
    // 선택된 아이템 데이터 초기화
    AppState.selectedItemsData = [];

    // 선택된 아이템 UI 초기화
    const selectedItemsDiv = $('#selected-items');
    if (selectedItemsDiv.length) {
        selectedItemsDiv.empty();
        selectedItemsDiv.append('<h3>선택된 아이템</h3>');
    }

    // 비교 표 및 그래프 초기화
    updateComparisonTable();
}
