const AppState = {
    selectedItemsData: [],
    version: null,
    availableStats: new Set(),
};

$(document).ready(async function() {
    try {
        AppState.version = await fetchDataDragonVersion();
        console.log("Data Dragon Version:", AppState.version);

        $('#select-rune-category-button').on('click', () => {
            displayCategorySelectionModal('룬 카테고리 선택', 'rune');
        });

        $('#select-item-category-button').on('click', () => {
            displayCategorySelectionModal('아이템 카테고리 선택', 'item');
        });
    } catch (error) {
        alert('데이터 드래곤 버전을 불러오는 데 실패했습니다.');
        console.error(error);
    }
});

function createModal(id, title, onClose) {
    const modal = $('<div>', { class: 'modal-modified', id: id });
    const modalContent = $('<div>', { class: 'modal-content-modified' });

    const closeButton = $('<button>', {
        text: '닫기',
        class: 'close-button',
        click: () => {
            modal.remove();
            if (typeof onClose === 'function') {
                onClose();
            }
        }
    });

    let exportButton;
    if (id === 'item-selection-modal-modified') {
        exportButton = $('<button>', {
            text: '이미지 내보내기',
            class: 'export-button',
            click: () => {
                exportSelectedItemsToEditor();
            }
        });
    }

    const modalTitle = $('<h2>', { text: title });

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

function displayItemSelectionModal(category) {
    const modalContent = createModal('item-selection-modal-modified', `${category} 아이템 선택`);
    resetItemSelection();

    const topContainer = $('<div>', { class: 'modal-top-container' });

    const searchAndListContainer = $('<div>', { class: 'search-and-list-container' });

    const searchInput = $('<input>', {
        type: 'text',
        id: 'item-search-input',
        placeholder: '아이템 검색...',
        class: 'item-search-input'
    });

    const sortContainer = $('<div>', { class: 'sort-container' });

    // 수정된 정렬 드롭다운 생성 (능력치 기반으로 동적으로 작성)
    const sortByLabel = $('<label>', { for: 'sort-by-select', text: '정렬 기준:' });
    const sortBySelect = $('<select>', { id: 'sort-by-select', class: 'sort-select' });
    // 초기 옵션으로 '선택 안함' 추가
    sortBySelect.append('<option value="">선택 안함</option>');

    const sortOrderLabel = $('<label>', { for: 'sort-order-select', text: ' 정렬 순서:' });
    const sortOrderSelect = $('<select>', { id: 'sort-order-select', class: 'sort-select' });
    sortOrderSelect.append('<option value="asc">오름차순</option>');
    sortOrderSelect.append('<option value="desc">내림차순</option>');

    sortContainer.append(sortByLabel, sortBySelect, sortOrderLabel, sortOrderSelect);

    const itemListDiv = $('<div>', { id: 'item-list-modified' });

    searchAndListContainer.append(searchInput, sortContainer, itemListDiv);

    const selectedAndComparisonContainer = $('<div>', { id: 'selected-and-comparison-container' });

    const selectedItemsDiv = $('<div>', { id: 'selected-items' });
    selectedItemsDiv.append('<h3>선택된 아이템</h3>');

    const comparisonTableContainer = $('<div>', { id: 'comparison-table-container' });
    comparisonTableContainer.append('<h3>아이템 비교(가성비 높을수록좋음)</h3>');
    const comparisonTable = $('<table>', { id: 'comparison-table' });
    comparisonTableContainer.append(comparisonTable);

    const comparisonGraphContainer = $('<div>', { id: 'comparison-graph-container' });
    const comparisonChartCanvas = $('<canvas>', { id: 'comparison-chart' });
    comparisonGraphContainer.append(comparisonChartCanvas);

    selectedAndComparisonContainer.append(selectedItemsDiv, comparisonTableContainer, comparisonGraphContainer);

    topContainer.append(searchAndListContainer, selectedAndComparisonContainer);

    modalContent.append(topContainer);

    loadItemsByCategory(category, itemListDiv, selectedItemsDiv, searchInput, sortBySelect, sortOrderSelect);
}

let currentItemList = [];
async function loadItemsByCategory(category, container, selectedItemsDiv, searchInput, sortBySelect, sortOrderSelect) {
    const apiUrl = `https://ddragon.leagueoflegends.com/cdn/${AppState.version}/data/ko_KR/item.json`;

    try {
        const data = await fetchData(apiUrl);
        const items = data.data;
        currentItemList = [];

        for (const itemId in items) {
            const item = items[itemId];
            item.id = itemId;

            if (item.maps[11] && item.gold.purchasable && isItemInCategory(item, category)) {
                // "description"에서 값 파싱
                item.parsedDescription = parseStatsFromDescription(item.description);
                currentItemList.push(item);
            }
        }

        // 사용 가능한 모든 능력치 수집
        const availableStats = new Set();
        currentItemList.forEach(item => {
            if (item.parsedDescription) {
                Object.keys(item.parsedDescription).forEach(stat => {
                    if (stat !== 'descriptionText' && stat !== 'price') {
                        availableStats.add(stat);
                    }
                });
            }
        });

        // '가격'도 정렬 기준에 포함
        availableStats.add('price');

        // AppState에 업데이트
        AppState.availableStats = availableStats;

        // 정렬 드롭다운에 옵션 추가
        sortBySelect.empty(); // 기존 옵션 제거
        sortBySelect.append('<option value="">선택 안함</option>'); // 기본 옵션 추가

        availableStats.forEach(statKey => {
            const displayName = statDisplayNames[statKey] || statKey;
            sortBySelect.append(`<option value="${statKey}">${displayName}</option>`);
        });

        function renderItemList() {
            const searchQuery = searchInput.val().toLowerCase();
            const sortBy = sortBySelect.val();
            const sortOrder = sortOrderSelect.val();

            let filteredList = currentItemList.filter(item => {
                const itemName = item.name.toLowerCase();
                const itemColloq = item.colloq ? item.colloq.toLowerCase() : "";
                return itemName.includes(searchQuery) || itemColloq.includes(searchQuery);
            });

            filteredList.sort((a, b) => {
                if (!sortBy) {
                    return 0; // 정렬 기준이 없으면 변경 없음
                }

                let aValue, bValue;

                if (sortBy === 'name') {
                    // 이름으로 정렬 (추가 옵션인 경우)
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                    return 0;
                } else if (sortBy === 'description') {
                    // 설명으로 정렬 (추가 옵션인 경우)
                    aValue = a.description.toLowerCase();
                    bValue = b.description.toLowerCase();
                    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                    return 0;
                } else if (sortBy === 'price') {
                    // 가격으로 정렬
                    aValue = a.gold ? a.gold.total || 0 : 0;
                    bValue = b.gold ? b.gold.total || 0 : 0;
                } else {
                    // 능력치로 정렬
                    aValue = a.parsedDescription && a.parsedDescription[sortBy] !== undefined ? a.parsedDescription[sortBy] : 0;
                    bValue = b.parsedDescription && b.parsedDescription[sortBy] !== undefined ? b.parsedDescription[sortBy] : 0;
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                    return 0;
                } else {
                    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                }
            });

            container.empty();

            filteredList.forEach(item => {
                const itemButton = $('<button>', {
                    class: 'item-button',
                    click: function() {
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

                const addButton = $('<button>', {
                    text: '+',
                    class: 'add-button',
                    click: function(event) {
                        event.stopPropagation();
                        addSelectedItem(item, selectedItemsDiv);
                    }
                });
                itemButton.append(addButton);

                container.append(itemButton);
            });
        }

        renderItemList();
        sortBySelect.on('change', renderItemList);
        sortOrderSelect.on('change', renderItemList);
        searchInput.on('input', renderItemList);

    } catch (error) {
        console.error('아이템 데이터를 불러오는 중 오류 발생:', error);
        container.append('<p>아이템 데이터를 불러오는 데 실패했습니다.</p>');
    }
}

function parseStatsFromDescription(description) {
    const stats = {};

    // 모든 <태그>내용</태그> 형식의 데이터를 파싱
    const tagPattern = /<[^>]+>/g;
    let cleanedDescription = description.replace(tagPattern, '');

    // 정규식을 사용하여 "능력치 +숫자" 또는 "능력치 숫자%" 패턴 추출
    const statPatterns = [
        { regex: /공격력\s*\+?(\d+)/g, key: '공격력' },
        { regex: /물리 관통력\s*\+?(\d+)/g, key: '물리 관통력' },
        { regex: /마법 관통력\s*\+?(\d+)/g, key: '마법 관통력' },
        { regex: /방어구 관통력\s*\+?(\d+)/g, key: '방어구 관통력' },
        { regex: /방어력\s*\+?(\d+)/g, key: '방어력' },
        { regex: /마법 저항력\s*\+?(\d+)/g, key: '마법 저항력' },
        { regex: /주문력\s*\+?(\d+)/g, key: '주문력' },
        { regex: /체력\s*\+?(\d+)/g, key: '체력' },
        { regex: /마나\s*\+?(\d+)/g, key: '마나' },
        { regex: /공격 속도\s*\+?(\d+)%/g, key: '공격 속도 (%)' },
        { regex: /치명타 확률\s*\+?(\d+)%/g, key: '치명타 확률 (%)' },
        { regex: /스킬 가속\s*\+?(\d+)/g, key: '스킬 가속' },
        { regex: /생명력 흡수\s*\+?(\d+)%/g, key: '생명력 흡수 (%)' },
        { regex: /이동 속도\s*\+?(\d+)%/g, key: '이동 속도 (%)' },
        { regex: /체력 재생\s*\+?(\d+)/g, key: '체력 재생' },
        { regex: /마나 재생\s*\+?(\d+)/g, key: '마나 재생' },
        // 필요한 다른 스탯 패턴을 여기에 추가하세요.
    ];

    // Iterate over statPatterns and extract stats
    statPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(cleanedDescription)) !== null) {
            const value = parseFloat(match[1]);
            stats[pattern.key] = value;

            // Remove this matched string from cleanedDescription
            cleanedDescription = cleanedDescription.replace(match[0], '');
        }
    });

    // 가격 정보도 포함
    // Assuming price is extracted elsewhere; if not, you can extract it similarly

    // 기타 설명 텍스트 저장 (능력치가 제거된 상태)
    stats['descriptionText'] = cleanedDescription.trim();

    return stats;
}

function displayImageSelectionModal(title, data) {
    const modalContent = createModal('image-selection-modal-modified', title);
    const imageListDiv = $('<div>', { id: 'image-list-modified' });

    if (data.slots) {
        loadRunes(data, imageListDiv);
    } else {
        imageListDiv.append('<p>이미지를 불러오는 기능이 구현되지 않았습니다.</p>');
    }

    modalContent.append(imageListDiv);
}

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

function insertRuneEmbedToMemoEditor(name, image) {
    const embedCode = `<img src="https://ddragon.leagueoflegends.com/cdn/img/${image}" alt="${name}" width="64" height="64" style="object-fit: cover; border-radius: 4px; overflow: hidden;">`;
    if ($('#editor').length && $('#editor').summernote) {
        $('#editor').summernote('editor.pasteHTML', embedCode);
    } else {
        alert('에디터가 초기화되지 않았습니다.');
    }
}

function insertItemEmbedToMemoEditor(item) {
    const embedCode = `<img src="https://ddragon.leagueoflegends.com/cdn/${AppState.version}/img/item/${item.image.full}" alt="${item.name}" width="64" height="64" style="object-fit: cover; border-radius: 4px; overflow: hidden;">`;
    if ($('#editor').length && $('#editor').summernote) {
        $('#editor').summernote('editor.pasteHTML', embedCode);
    } else {
        alert('에디터가 초기화되지 않았습니다.');
    }
}

function exportSelectedItemsToEditor() {
    if (AppState.selectedItemsData.length === 0) {
        alert('선택된 아이템이 없습니다.');
        return;
    }
    AppState.selectedItemsData.forEach(item => {
        insertItemEmbedToMemoEditor(item);
    });
    $('#item-selection-modal-modified').remove();
}

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

const statDisplayNames = {
    "공격력": "공격력",
    "물리 관통력": "물리 관통력",
    "방어구 관통력": "방어구 관통력",
    "마법 관통력": "마법 관통력",
    "방어력": "방어력",
    "마법 저항력": "마법 저항력",
    "주문력": "주문력",
    "체력": "체력",
    "마나": "마나",
    "공격 속도 (%)": "공격 속도 (%)",
    "치명타 확률 (%)": "치명타 확률 (%)",
    "스킬 가속": "스킬 가속",
    "생명력 흡수 (%)": "생명력 흡수 (%)",
    "이동 속도 (%)": "이동 속도 (%)",
    "체력 재생": "체력 재생",
    "마나 재생": "마나 재생",
    "price": "가격",
    // 추가적으로 필요한 Display Names을 여기에 추가하세요.
};

function addSelectedItem(item, selectedItemsDiv) {
    if (AppState.selectedItemsData.find(selectedItem => selectedItem.id === item.id)) {
        alert('이미 선택된 아이템입니다.');
        return;
    }

    AppState.selectedItemsData.push(item);
    renderSelectedItems(selectedItemsDiv);
    updateComparisonTable();
}

function renderSelectedItems(container) {
    container.empty();
    container.append('<h3>선택</h3>');
    AppState.selectedItemsData.forEach(item => {
        const selectedItem = $('<div>', {
            class: 'selected-item',
            'data-id': item.id,
            style: 'text-align: center;' // 이미지와 텍스트를 중앙 정렬
        });

        // 아이템 이미지를 추가합니다.
        const itemImg = $('<img>', {
            src: `https://ddragon.leagueoflegends.com/cdn/${AppState.version}/img/item/${item.image.full}`,
            alt: item.name,
            width: '64',
            height: '64',
            style: 'object-fit: cover; border-radius: 4px; overflow: hidden;'
        });

        // 아이템 이름을 이미지 아래에 표시합니다.
        const itemName = $('<div>', {
            text: item.name,
            style: 'margin-top: 8px;' // 이미지와 텍스트 간 간격을 조정
        });

        const removeButton = $('<button>', {
            text: '−',
            class: 'remove-button',
            click: function() {
                AppState.selectedItemsData = AppState.selectedItemsData.filter(selected => selected.id !== item.id);
                renderSelectedItems(container);
                updateComparisonTable();
            }
        });

        selectedItem.append(itemImg, itemName, removeButton);
        container.append(selectedItem);
    });
}



function updateAvailableStats() {
    AppState.availableStats.clear();
    AppState.selectedItemsData.forEach(item => {
        if (item.parsedDescription) {
            Object.keys(item.parsedDescription).forEach(stat => {
                if (stat !== 'descriptionText') {
                    AppState.availableStats.add(stat);
                }
            });
        }
    });
    AppState.availableStats.add('price');
}

let comparisonChart;

function updateComparisonTable() {
    const comparisonTable = $('#comparison-table');
    comparisonTable.empty();

    if (AppState.selectedItemsData.length === 0) {
        comparisonTable.append('<tr><td>선택된 아이템이 없습니다.</td></tr>');
        return;
    }

    // 모든 사용 가능한 스탯 수집
    const allStats = new Set();
    AppState.selectedItemsData.forEach(item => {
        if (item.parsedDescription) {
            Object.keys(item.parsedDescription).forEach(stat => {
                if (stat !== 'descriptionText') {
                    allStats.add(stat);
                }
            });
        }
    });
    allStats.add('price'); // 가격 추가

    // 스탯 Display Names을 기반으로 스탯 정렬
    const sortedStats = Array.from(allStats).sort((a, b) => {
        return a.localeCompare(b);
    });

    // 테이블 헤더 생성
    const headerRow = $('<tr>');
    headerRow.append('<th>아이템 이름</th>');
    sortedStats.forEach(statKey => {
        const displayName = statDisplayNames[statKey] || statKey;
        headerRow.append(`<th>${displayName}</th>`);
    });
    // 기타 설명 열 제거
    comparisonTable.append(headerRow);

    // 테이블 스타일 적용
    comparisonTable.css({
        'width': '100%',
        'border-collapse': 'collapse'
    });

    // 각 아이템에 대한 행 추가
    AppState.selectedItemsData.forEach(item => {
        const itemRow = $('<tr>');

        // 아이템 이름 셀에 툴팁 추가
        const itemNameCell = $('<td>', {
            text: item.name,
            title: item.parsedDescription && item.parsedDescription.descriptionText ? item.parsedDescription.descriptionText : ''
        });
        itemRow.append(itemNameCell);

        sortedStats.forEach(statKey => {
            let statValue = '';

            if (statKey === 'price') {
                statValue = item.gold ? item.gold.total || 0 : '';
            } else if (item.parsedDescription && item.parsedDescription[statKey] !== undefined) {
                statValue = item.parsedDescription[statKey];
                // 가격 대비 성능비 계산
                const price = item.gold ? item.gold.total || 0 : 1; // 가격이 0일 경우를 대비하여 1로 설정
                const ratio = price > 0 ? (statValue / price).toFixed(4) : '0';
                statValue = `${statValue} (${ratio})`; // 예: 30 (0.02)
            }

            itemRow.append(`<td>${statValue}</td>`);
        });

        // 기타 설명 셀 제거
        comparisonTable.append(itemRow);
    });

    // 테이블 셀 스타일 적용
    comparisonTable.find('th, td').css({
        'border': '1px solid #ddd',
        'padding': '8px',
        'text-align': 'center',
        'vertical-align': 'top'
    });

    comparisonTable.find('th').css({
        'background-color': '#f2f2f2',
        'font-weight': 'bold'
    });

    // 차트 업데이트
    updateComparisonChart(sortedStats);
}

function updateComparisonChart(stats) {
    const labels = stats.map(stat => statDisplayNames[stat] || stat);
    const datasets = AppState.selectedItemsData.map((item, index) => {
        const data = stats.map(stat => {
            if (stat === 'price') {
                return item.gold ? item.gold.total || 0 : 0;
            } else if (item.parsedDescription && item.parsedDescription[stat] !== undefined) {
                return item.parsedDescription[stat];
            } else {
                return 0;
            }
        });

        return {
            label: item.name,
            data: data,
            backgroundColor: getColor(index),
        };
    });

    if (comparisonChart) {
        comparisonChart.destroy();
    }

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
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
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

function getItemTooltipContent(item) {
    let tooltipContent = `<strong>${item.name}</strong><br><br>`;

    if (item.parsedDescription) {
        Object.keys(item.parsedDescription).forEach(stat => {
            if (stat !== 'descriptionText') {
                const statName = statDisplayNames[stat] || stat;
                const statValue = item.parsedDescription[stat];
                tooltipContent += `${statName}: ${statValue}<br>`;
            }
        });
    }

    if (item.description) {
        tooltipContent += `<br><strong>설명:</strong><br>${item.description}`;
    }

    return tooltipContent;
}

function removeItem(itemId) {
    AppState.selectedItemsData = AppState.selectedItemsData.filter(item => item.id !== itemId);
    renderSelectedItems($('#selected-items'));
    updateAvailableStats();
    updateComparisonTable();
}

function getColor(index) {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    return colors[index % colors.length];
}

function resetItemSelection() {
    AppState.selectedItemsData = [];

    const selectedItemsDiv = $('#selected-items');
    if (selectedItemsDiv.length) {
        selectedItemsDiv.empty();
        selectedItemsDiv.append('<h3>선택된 아이템</h3>');
    }

    updateAvailableStats();
    updateComparisonTable();
}

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

async function fetchData(url) {
    try {
        const response = await $.ajax({ url, method: 'GET' });
        return response;
    } catch (error) {
        console.error(`데이터를 불러오는 중 오류 발생:`, error);
        throw error;
    }
}
