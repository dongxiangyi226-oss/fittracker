/**
 * FitTracker 主应用逻辑
 */

// ==================== 全局状态 ====================
let currentPage = 'dashboard';
let currentFoodDate = new Date().toISOString().split('T')[0];
let currentWorkoutDate = new Date().toISOString().split('T')[0];
let currentStudyDate = new Date().toISOString().split('T')[0];
let currentWeightDate = new Date().toISOString().split('T')[0];
let currentMealFilter = 'all';
let currentStudyFilter = 'all';
let currentPeriod = 'week';
let studyTasks = []; // 临时存储学习任务

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // 设置当前日期显示
    updateCurrentDate();

    // 初始化日期选择器
    document.getElementById('foodDatePicker').value = currentFoodDate;
    document.getElementById('workoutDatePicker').value = currentWorkoutDate;
    document.getElementById('studyDatePicker').value = currentStudyDate;
    document.getElementById('weightDatePicker').value = currentWeightDate;

    // 初始化导航
    initNavigation();

    // 初始化表单事件
    initFormEvents();

    // 初始化其他事件
    initOtherEvents();

    // 加载设置
    loadSettings();

    // 加载仪表盘数据
    loadDashboard();

    // 检查URL hash
    const hash = window.location.hash.slice(1);
    if (hash) {
        navigateTo(hash);
    }
}

// ==================== 日期显示 ====================
function updateCurrentDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('zh-CN', options);
}

// ==================== 导航功能 ====================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            navigateTo(page);
        });
    });

    // 移动端菜单
    document.getElementById('mobileMenuBtn').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('open');
    });
}

function navigateTo(page) {
    currentPage = page;

    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // 更新页面显示
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === `page-${page}`);
    });

    // 更新页面标题
    const titles = {
        dashboard: '仪表盘',
        food: '食物记录',
        workout: '运动记录',
        analytics: '数据分析',
        notes: '笔记',
        study: '学习记录',
        weight: '体重记录',
        settings: '设置'
    };
    document.getElementById('pageTitle').textContent = titles[page] || '';

    // 关闭移动端侧边栏
    document.getElementById('sidebar').classList.remove('open');

    // 加载页面数据
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'food':
            loadFoodRecords();
            break;
        case 'workout':
            loadWorkoutRecords();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'notes':
            loadNotes();
            break;
        case 'study':
            loadStudyRecords();
            break;
        case 'weight':
            loadWeightPage();
            break;
        case 'settings':
            loadSettings();
            break;
    }

    // 更新URL
    window.location.hash = page;
}

// ==================== 仪表盘 ====================
function loadDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const settings = Storage.getSettings();

    // 加载今日摄入
    const foodSummary = Storage.getDailySummary(today);
    document.getElementById('todayCaloriesIn').textContent = Math.round(foodSummary.calories);
    document.getElementById('carbsGrams').textContent = Math.round(foodSummary.carbs);
    document.getElementById('proteinGrams').textContent = Math.round(foodSummary.protein);
    document.getElementById('fatGrams').textContent = Math.round(foodSummary.fat);

    // 加载今日运动消耗
    const workoutSummary = Storage.getDailyWorkoutSummary(today);
    document.getElementById('todayCaloriesOut').textContent = Math.round(workoutSummary.calories);

    // 热量差
    const balance = Math.round(foodSummary.calories - workoutSummary.calories);
    document.getElementById('calorieBalance').textContent = balance;

    // 连续记录天数
    document.getElementById('streakDays').textContent = Storage.getStreakDays();

    // 目标进度
    const progress = Math.min(100, Math.round((foodSummary.calories / settings.calorieGoal) * 100));
    document.getElementById('goalProgress').textContent = progress;
    document.getElementById('currentCalories').textContent = Math.round(foodSummary.calories);
    document.getElementById('goalCalories').textContent = settings.calorieGoal;

    // 更新进度环
    const progressCircle = document.getElementById('progressCircle');
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (progress / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;

    // 加载今日餐食列表
    loadTodayMeals(today);

    // 加载今日运动列表
    loadTodayWorkouts(today);

    // 加载今日学习列表
    loadTodayStudies(today);

    // 渲染宏量营养素饼图
    renderMacroChart(foodSummary);
}

function loadTodayMeals(date) {
    const foods = Storage.getFoodsByDate(date);
    const container = document.getElementById('todayMealsList');

    if (foods.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-utensils"></i>
                <p>今天还没有记录食物</p>
            </div>
        `;
        return;
    }

    const mealTypeLabels = {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        snack: '加餐'
    };

    const mealTypeIcons = {
        breakfast: 'fa-sun',
        lunch: 'fa-cloud-sun',
        dinner: 'fa-moon',
        snack: 'fa-cookie'
    };

    // 按餐次分组
    const grouped = foods.reduce((acc, food) => {
        if (!acc[food.mealType]) acc[food.mealType] = [];
        acc[food.mealType].push(food);
        return acc;
    }, {});

    let html = '';
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
        if (grouped[mealType]) {
            const totalCalories = grouped[mealType].reduce((sum, f) => sum + parseFloat(f.calories || 0), 0);
            const foodNames = grouped[mealType].map(f => f.name).join(', ');

            html += `
                <div class="meal-item">
                    <div class="meal-info">
                        <div class="meal-type-icon ${mealType}">
                            <i class="fas ${mealTypeIcons[mealType]}"></i>
                        </div>
                        <div class="meal-details">
                            <h4>${mealTypeLabels[mealType]}</h4>
                            <span>${foodNames.length > 30 ? foodNames.slice(0, 30) + '...' : foodNames}</span>
                        </div>
                    </div>
                    <span class="meal-calories">${Math.round(totalCalories)} kcal</span>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

function loadTodayWorkouts(date) {
    const workouts = Storage.getWorkoutsByDate(date);
    const container = document.getElementById('todayWorkoutList');

    if (workouts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-running"></i>
                <p>今天还没有运动记录</p>
            </div>
        `;
        return;
    }

    const workoutTypeLabels = {
        running: '跑步',
        cycling: '骑行',
        swimming: '游泳',
        strength: '力量训练',
        walking: '步行',
        hiit: 'HIIT',
        yoga: '瑜伽',
        other: '其他'
    };

    const workoutTypeIcons = {
        running: 'fa-running',
        cycling: 'fa-bicycle',
        swimming: 'fa-swimmer',
        strength: 'fa-dumbbell',
        walking: 'fa-walking',
        hiit: 'fa-fire-alt',
        yoga: 'fa-spa',
        other: 'fa-heartbeat'
    };

    let html = '';
    workouts.forEach(workout => {
        html += `
            <div class="workout-item">
                <div class="workout-info">
                    <div class="workout-type-icon">
                        <i class="fas ${workoutTypeIcons[workout.type] || 'fa-heartbeat'}"></i>
                    </div>
                    <div class="workout-details">
                        <h4>${workoutTypeLabels[workout.type] || workout.type}</h4>
                        <span>${workout.duration} 分钟${workout.distance ? ` · ${workout.distance} 公里` : ''}</span>
                    </div>
                </div>
                <span class="workout-calories">-${Math.round(workout.calories || 0)} kcal</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

function loadTodayStudies(date) {
    const studies = Storage.getStudiesByDate(date);
    const summary = Storage.getDailyStudySummary(date);
    const container = document.getElementById('todayStudyList');

    // 更新统计
    document.getElementById('todayStudyDuration').textContent = summary.duration;
    document.getElementById('todayStudyItems').textContent = summary.items;
    document.getElementById('todayStudyTasks').textContent = summary.completedTasks;

    if (studies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-graduation-cap"></i>
                <p>今天还没有学习记录</p>
            </div>
        `;
        return;
    }

    const categoryLabels = {
        reading: '阅读',
        coding: '编程',
        course: '课程',
        practice: '练习',
        other: '其他'
    };

    const categoryIcons = {
        reading: 'fa-book-reader',
        coding: 'fa-code',
        course: 'fa-chalkboard-teacher',
        practice: 'fa-pencil-alt',
        other: 'fa-folder'
    };

    let html = '';
    studies.forEach(study => {
        html += `
            <div class="study-item-mini">
                <div class="study-category-icon ${study.category}">
                    <i class="fas ${categoryIcons[study.category] || 'fa-folder'}"></i>
                </div>
                <div class="study-item-info">
                    <h4>${study.topic}</h4>
                    <span>${categoryLabels[study.category] || study.category}</span>
                </div>
                <span class="study-duration">${study.duration}分钟</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==================== 食物记录页面 ====================
function loadFoodRecords() {
    const foods = Storage.getFoodsByDateAndMeal(currentFoodDate, currentMealFilter);
    const summary = Storage.getDailySummary(currentFoodDate);

    // 更新汇总
    document.getElementById('foodTotalCalories').textContent = Math.round(summary.calories);
    document.getElementById('foodTotalCarbs').textContent = Math.round(summary.carbs);
    document.getElementById('foodTotalProtein').textContent = Math.round(summary.protein);
    document.getElementById('foodTotalFat').textContent = Math.round(summary.fat);

    // 渲染食物列表
    const container = document.getElementById('foodList');

    if (foods.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-utensils"></i>
                <p>暂无食物记录</p>
            </div>
        `;
        return;
    }

    const mealTypeLabels = {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        snack: '加餐'
    };

    const mealTypeIcons = {
        breakfast: 'fa-sun',
        lunch: 'fa-cloud-sun',
        dinner: 'fa-moon',
        snack: 'fa-cookie'
    };

    let html = '';
    foods.forEach(food => {
        html += `
            <div class="food-card">
                <div class="food-main">
                    <div class="meal-type-icon ${food.mealType}">
                        <i class="fas ${mealTypeIcons[food.mealType]}"></i>
                    </div>
                    <div class="food-content">
                        <h4>${food.name}</h4>
                        <div class="food-meta">
                            <span>${mealTypeLabels[food.mealType]}</span>
                            <span>${food.weight}g</span>
                            <span>${Math.round(food.calories)} kcal</span>
                        </div>
                    </div>
                </div>
                <div class="food-nutrients">
                    <span><i class="fas fa-bread-slice" style="color:var(--carbs-color)"></i> ${Math.round(food.carbs || 0)}g</span>
                    <span><i class="fas fa-drumstick-bite" style="color:var(--protein-color)"></i> ${Math.round(food.protein || 0)}g</span>
                    <span><i class="fas fa-cheese" style="color:var(--fat-color)"></i> ${Math.round(food.fat || 0)}g</span>
                </div>
                <div class="food-actions">
                    <button class="btn btn-icon" onclick="editFood('${food.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon" onclick="deleteFood('${food.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function changeDate(delta) {
    const date = new Date(currentFoodDate);
    date.setDate(date.getDate() + delta);
    currentFoodDate = date.toISOString().split('T')[0];
    document.getElementById('foodDatePicker').value = currentFoodDate;
    loadFoodRecords();
}

// ==================== 运动记录页面 ====================
function loadWorkoutRecords() {
    const workouts = Storage.getWorkoutsByDate(currentWorkoutDate);
    const summary = Storage.getDailyWorkoutSummary(currentWorkoutDate);

    // 更新汇总
    document.getElementById('workoutTotalCalories').textContent = Math.round(summary.calories);
    document.getElementById('workoutTotalDuration').textContent = summary.duration;
    document.getElementById('workoutTotalDistance').textContent = summary.distance.toFixed(2);

    // 渲染运动列表
    const container = document.getElementById('workoutList');

    if (workouts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-running"></i>
                <p>暂无运动记录</p>
            </div>
        `;
        return;
    }

    const workoutTypeLabels = {
        running: '跑步',
        cycling: '骑行',
        swimming: '游泳',
        strength: '力量训练',
        walking: '步行',
        hiit: 'HIIT',
        yoga: '瑜伽',
        other: '其他'
    };

    const workoutTypeIcons = {
        running: 'fa-running',
        cycling: 'fa-bicycle',
        swimming: 'fa-swimmer',
        strength: 'fa-dumbbell',
        walking: 'fa-walking',
        hiit: 'fa-fire-alt',
        yoga: 'fa-spa',
        other: 'fa-heartbeat'
    };

    let html = '';
    workouts.forEach(workout => {
        const startTime = workout.startTime ? new Date(workout.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--:--';

        html += `
            <div class="workout-card">
                <div class="workout-card-header">
                    <h4>
                        <i class="fas ${workoutTypeIcons[workout.type] || 'fa-heartbeat'}"></i>
                        ${workoutTypeLabels[workout.type] || workout.type}
                    </h4>
                    <div class="workout-time">
                        <span>${startTime}</span>
                        <button class="btn btn-icon" onclick="editWorkout('${workout.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon" onclick="deleteWorkout('${workout.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="workout-stats">
                    <div class="workout-stat">
                        <div class="workout-stat-value">${workout.duration || 0}</div>
                        <div class="workout-stat-label">分钟</div>
                    </div>
                    <div class="workout-stat">
                        <div class="workout-stat-value">${Math.round(workout.calories || 0)}</div>
                        <div class="workout-stat-label">千卡</div>
                    </div>
                    <div class="workout-stat">
                        <div class="workout-stat-value">${workout.distance || '--'}</div>
                        <div class="workout-stat-label">公里</div>
                    </div>
                    <div class="workout-stat">
                        <div class="workout-stat-value">${workout.avgHeartRate || '--'}</div>
                        <div class="workout-stat-label">平均心率</div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function changeWorkoutDate(delta) {
    const date = new Date(currentWorkoutDate);
    date.setDate(date.getDate() + delta);
    currentWorkoutDate = date.toISOString().split('T')[0];
    document.getElementById('workoutDatePicker').value = currentWorkoutDate;
    loadWorkoutRecords();
}

// ==================== 笔记页面 ====================
function loadNotes() {
    const notes = Storage.getAllNotes();
    renderNotes(notes);
}

function renderNotes(notes) {
    const container = document.getElementById('notesList');

    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>暂无笔记</p>
            </div>
        `;
        return;
    }

    // 按日期排序
    notes.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';
    notes.forEach(note => {
        const date = new Date(note.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
        html += `
            <div class="note-card" onclick="viewNote('${note.id}')">
                <div class="note-date">${date}</div>
                ${note.title ? `<div class="note-title">${note.title}</div>` : ''}
                <div class="note-preview">${note.content}</div>
                <div class="note-actions">
                    <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); editNote('${note.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); deleteNote('${note.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function searchNotes() {
    const keyword = document.getElementById('noteSearchInput').value.trim();
    if (keyword) {
        const notes = Storage.searchNotes(keyword);
        renderNotes(notes);
    } else {
        loadNotes();
    }
}

// ==================== 设置页面 ====================
function loadSettings() {
    const settings = Storage.getSettings();
    document.getElementById('settingsNickname').value = settings.nickname || '';
    document.getElementById('settingsGender').value = settings.gender || '';
    document.getElementById('settingsBirthDate').value = settings.birthDate || '';
    document.getElementById('settingsHeight').value = settings.height || '';
    document.getElementById('settingsCurrentWeight').value = settings.currentWeight || '';
    document.getElementById('settingsTargetWeight').value = settings.targetWeight || '';
    document.getElementById('settingsCalorieGoal').value = settings.calorieGoal || 2000;
    document.getElementById('settingsCarbsGoal').value = settings.carbsGoal || 250;
    document.getElementById('settingsProteinGoal').value = settings.proteinGoal || 100;
    document.getElementById('settingsFatGoal').value = settings.fatGoal || 65;

    // 更新显示名称
    document.getElementById('displayUsername').textContent = settings.nickname || '用户';

    // 计算并显示BMI
    updateBMIDisplay();
}

function updateBMIDisplay() {
    const height = parseFloat(document.getElementById('settingsHeight').value);
    const weight = parseFloat(document.getElementById('settingsCurrentWeight').value);

    if (height && weight && height > 0) {
        const heightM = height / 100;
        const bmi = (weight / (heightM * heightM)).toFixed(1);
        let bmiStatus = '';
        if (bmi < 18.5) bmiStatus = '偏瘦';
        else if (bmi < 24) bmiStatus = '正常';
        else if (bmi < 28) bmiStatus = '偏胖';
        else bmiStatus = '肥胖';
        document.getElementById('settingsBMI').value = `${bmi} (${bmiStatus})`;
    } else {
        document.getElementById('settingsBMI').value = '';
    }
}

function saveSettings() {
    const settings = {
        nickname: document.getElementById('settingsNickname').value || '用户',
        gender: document.getElementById('settingsGender').value,
        birthDate: document.getElementById('settingsBirthDate').value,
        height: parseFloat(document.getElementById('settingsHeight').value) || '',
        currentWeight: parseFloat(document.getElementById('settingsCurrentWeight').value) || '',
        targetWeight: parseFloat(document.getElementById('settingsTargetWeight').value) || '',
        calorieGoal: parseInt(document.getElementById('settingsCalorieGoal').value) || 2000,
        carbsGoal: parseInt(document.getElementById('settingsCarbsGoal').value) || 250,
        proteinGoal: parseInt(document.getElementById('settingsProteinGoal').value) || 100,
        fatGoal: parseInt(document.getElementById('settingsFatGoal').value) || 65
    };

    Storage.saveSettings(settings);
    document.getElementById('displayUsername').textContent = settings.nickname;
    showToast('设置已保存', 'success');
}

// ==================== 模态框 ====================
// 食物模态框
function openFoodModal(id = null) {
    const modal = document.getElementById('foodModal');
    const form = document.getElementById('foodForm');

    form.reset();
    document.getElementById('foodId').value = '';
    document.getElementById('foodModalTitle').textContent = '添加食物';

    if (id) {
        const foods = Storage.getAllFoods();
        const food = foods.find(f => f.id === id);
        if (food) {
            document.getElementById('foodId').value = food.id;
            document.getElementById('foodModalTitle').textContent = '编辑食物';
            document.getElementById('mealType').value = food.mealType;
            document.getElementById('foodName').value = food.name;
            document.getElementById('foodWeight').value = food.weight;
            document.getElementById('foodCalories').value = food.calories;
            document.getElementById('foodCarbs').value = food.carbs || '';
            document.getElementById('foodProtein').value = food.protein || '';
            document.getElementById('foodFat').value = food.fat || '';
            document.getElementById('foodNote').value = food.note || '';
        }
    }

    modal.classList.add('show');
}

function closeFoodModal() {
    document.getElementById('foodModal').classList.remove('show');
}

function saveFood() {
    const id = document.getElementById('foodId').value;
    const food = {
        date: currentFoodDate,
        mealType: document.getElementById('mealType').value,
        name: document.getElementById('foodName').value.trim(),
        weight: parseFloat(document.getElementById('foodWeight').value) || 0,
        calories: parseFloat(document.getElementById('foodCalories').value) || 0,
        carbs: parseFloat(document.getElementById('foodCarbs').value) || 0,
        protein: parseFloat(document.getElementById('foodProtein').value) || 0,
        fat: parseFloat(document.getElementById('foodFat').value) || 0,
        note: document.getElementById('foodNote').value.trim()
    };

    if (!food.name || !food.weight || !food.calories) {
        showToast('请填写必填项', 'error');
        return;
    }

    if (id) {
        Storage.updateFood(id, food);
        showToast('食物记录已更新', 'success');
    } else {
        Storage.addFood(food);
        showToast('食物记录已添加', 'success');
    }

    closeFoodModal();
    loadFoodRecords();
    if (currentPage === 'dashboard') {
        loadDashboard();
    }
}

function editFood(id) {
    openFoodModal(id);
}

function deleteFood(id) {
    if (confirm('确定要删除这条记录吗？')) {
        Storage.deleteFood(id);
        showToast('记录已删除', 'success');
        loadFoodRecords();
        if (currentPage === 'dashboard') {
            loadDashboard();
        }
    }
}

// 运动模态框
function openWorkoutModal(id = null) {
    const modal = document.getElementById('workoutModal');
    const form = document.getElementById('workoutForm');

    form.reset();
    document.getElementById('workoutId').value = '';
    document.getElementById('workoutModalTitle').textContent = '添加运动';

    // 设置默认时间为当前时间
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('workoutStartTime').value = now.toISOString().slice(0, 16);

    if (id) {
        const workouts = Storage.getAllWorkouts();
        const workout = workouts.find(w => w.id === id);
        if (workout) {
            document.getElementById('workoutId').value = workout.id;
            document.getElementById('workoutModalTitle').textContent = '编辑运动';
            document.getElementById('workoutType').value = workout.type;
            document.getElementById('workoutStartTime').value = workout.startTime ? workout.startTime.slice(0, 16) : '';
            document.getElementById('workoutDuration').value = workout.duration;
            document.getElementById('workoutCalories').value = workout.calories || '';
            document.getElementById('workoutDistance').value = workout.distance || '';
            document.getElementById('workoutAvgHR').value = workout.avgHeartRate || '';
            document.getElementById('workoutNote').value = workout.note || '';
        }
    }

    modal.classList.add('show');
}

function closeWorkoutModal() {
    document.getElementById('workoutModal').classList.remove('show');
}

function saveWorkout() {
    const id = document.getElementById('workoutId').value;
    const startTime = document.getElementById('workoutStartTime').value;
    const date = startTime ? startTime.split('T')[0] : currentWorkoutDate;

    const workout = {
        date: date,
        type: document.getElementById('workoutType').value,
        startTime: startTime,
        duration: parseInt(document.getElementById('workoutDuration').value) || 0,
        calories: parseFloat(document.getElementById('workoutCalories').value) || 0,
        distance: parseFloat(document.getElementById('workoutDistance').value) || 0,
        avgHeartRate: parseInt(document.getElementById('workoutAvgHR').value) || 0,
        note: document.getElementById('workoutNote').value.trim(),
        source: 'manual'
    };

    if (!workout.duration) {
        showToast('请填写运动时长', 'error');
        return;
    }

    if (id) {
        Storage.updateWorkout(id, workout);
        showToast('运动记录已更新', 'success');
    } else {
        Storage.addWorkout(workout);
        showToast('运动记录已添加', 'success');
    }

    closeWorkoutModal();
    loadWorkoutRecords();
    if (currentPage === 'dashboard') {
        loadDashboard();
    }
}

function editWorkout(id) {
    openWorkoutModal(id);
}

function deleteWorkout(id) {
    if (confirm('确定要删除这条记录吗？')) {
        Storage.deleteWorkout(id);
        showToast('记录已删除', 'success');
        loadWorkoutRecords();
        if (currentPage === 'dashboard') {
            loadDashboard();
        }
    }
}

// 笔记模态框
function openNoteModal(id = null) {
    const modal = document.getElementById('noteModal');
    const form = document.getElementById('noteForm');

    form.reset();
    document.getElementById('noteId').value = '';
    document.getElementById('noteModalTitle').textContent = '新建笔记';
    document.getElementById('noteDate').value = new Date().toISOString().split('T')[0];

    if (id) {
        const note = Storage.getNoteById(id);
        if (note) {
            document.getElementById('noteId').value = note.id;
            document.getElementById('noteModalTitle').textContent = '编辑笔记';
            document.getElementById('noteDate').value = note.date;
            document.getElementById('noteTitle').value = note.title || '';
            document.getElementById('noteContent').value = note.content;
        }
    }

    modal.classList.add('show');
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.remove('show');
}

function saveNote() {
    const id = document.getElementById('noteId').value;
    const note = {
        date: document.getElementById('noteDate').value,
        title: document.getElementById('noteTitle').value.trim(),
        content: document.getElementById('noteContent').value.trim()
    };

    if (!note.content) {
        showToast('请填写笔记内容', 'error');
        return;
    }

    if (id) {
        Storage.updateNote(id, note);
        showToast('笔记已更新', 'success');
    } else {
        Storage.addNote(note);
        showToast('笔记已添加', 'success');
    }

    closeNoteModal();
    loadNotes();
}

function editNote(id) {
    openNoteModal(id);
}

function viewNote(id) {
    openNoteModal(id);
}

function deleteNote(id) {
    if (confirm('确定要删除这篇笔记吗？')) {
        Storage.deleteNote(id);
        showToast('笔记已删除', 'success');
        loadNotes();
    }
}

// 上传模态框
function openUploadModal() {
    document.getElementById('uploadModal').classList.add('show');
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('show');
}

// ==================== 数据导入导出 ====================
function exportData() {
    const data = Storage.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据已导出', 'success');
}

function importDataFile() {
    document.getElementById('importDataInput').click();
}

function clearAllData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        if (confirm('再次确认：清空后所有食物、运动、笔记记录都将被删除。')) {
            Storage.clearAllData();
            showToast('数据已清空', 'success');
            loadDashboard();
        }
    }
}

// ==================== 事件初始化 ====================
function initFormEvents() {
    // 餐次Tab切换
    document.querySelectorAll('.meal-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.meal-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentMealFilter = this.dataset.meal;
            loadFoodRecords();
        });
    });

    // 分析周期切换
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPeriod = this.dataset.period;
            loadAnalytics();
        });
    });

    // 学习分类Tab切换
    document.querySelectorAll('.study-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.study-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentStudyFilter = this.dataset.category;
            loadStudyRecords();
        });
    });

    // 学习任务输入回车事件
    const studyTaskInput = document.getElementById('studyTaskInput');
    if (studyTaskInput) {
        studyTaskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addStudyTask();
            }
        });
    }

    // 食物名称自动补全
    const foodNameInput = document.getElementById('foodName');
    const suggestionsContainer = document.getElementById('foodSuggestions');

    foodNameInput.addEventListener('input', function() {
        const keyword = this.value.trim();
        if (keyword.length > 0) {
            const suggestions = Storage.searchFoodDatabase(keyword);
            if (suggestions.length > 0) {
                suggestionsContainer.innerHTML = suggestions.slice(0, 5).map(food => `
                    <div class="food-suggestion-item" data-food='${JSON.stringify(food)}'>
                        <strong>${food.name}</strong>
                        <small>${food.caloriesPer100g} kcal/100g</small>
                    </div>
                `).join('');
                suggestionsContainer.classList.add('show');
            } else {
                suggestionsContainer.classList.remove('show');
            }
        } else {
            suggestionsContainer.classList.remove('show');
        }
    });

    suggestionsContainer.addEventListener('click', function(e) {
        const item = e.target.closest('.food-suggestion-item');
        if (item) {
            const food = JSON.parse(item.dataset.food);
            document.getElementById('foodName').value = food.name;

            // 如果已输入重量，自动计算营养素
            const weight = parseFloat(document.getElementById('foodWeight').value) || 100;
            document.getElementById('foodWeight').value = weight;
            document.getElementById('foodCalories').value = Math.round(food.caloriesPer100g * weight / 100);
            document.getElementById('foodCarbs').value = Math.round(food.carbsPer100g * weight / 100 * 10) / 10;
            document.getElementById('foodProtein').value = Math.round(food.proteinPer100g * weight / 100 * 10) / 10;
            document.getElementById('foodFat').value = Math.round(food.fatPer100g * weight / 100 * 10) / 10;

            suggestionsContainer.classList.remove('show');
        }
    });

    // 点击外部关闭建议
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.form-group')) {
            suggestionsContainer.classList.remove('show');
        }
    });

    // 重量变化时自动计算（如果已选择食物库中的食物）
    document.getElementById('foodWeight').addEventListener('input', function() {
        const foodName = document.getElementById('foodName').value.trim();
        const database = Storage.getFoodDatabase();
        const food = database.find(f => f.name === foodName);

        if (food) {
            const weight = parseFloat(this.value) || 0;
            document.getElementById('foodCalories').value = Math.round(food.caloriesPer100g * weight / 100);
            document.getElementById('foodCarbs').value = Math.round(food.carbsPer100g * weight / 100 * 10) / 10;
            document.getElementById('foodProtein').value = Math.round(food.proteinPer100g * weight / 100 * 10) / 10;
            document.getElementById('foodFat').value = Math.round(food.fatPer100g * weight / 100 * 10) / 10;
        }
    });

    // BMI自动计算
    const heightInput = document.getElementById('settingsHeight');
    const weightInput = document.getElementById('settingsCurrentWeight');
    if (heightInput) {
        heightInput.addEventListener('input', updateBMIDisplay);
    }
    if (weightInput) {
        weightInput.addEventListener('input', updateBMIDisplay);
    }
}

function initOtherEvents() {
    // 上传区域
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
        uploadArea.style.background = 'rgba(46, 134, 171, 0.1)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleWorkoutFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleWorkoutFile(e.target.files[0]);
        }
    });

    // 导入数据文件
    document.getElementById('importDataInput').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    if (Storage.importData(data)) {
                        showToast('数据导入成功', 'success');
                        loadDashboard();
                        loadSettings();
                    } else {
                        showToast('数据导入失败', 'error');
                    }
                } catch (err) {
                    showToast('文件格式错误', 'error');
                }
            };
            reader.readAsText(file);
        }
        this.value = '';
    });
}

// 处理运动文件上传（简单解析，实际FIT/TCX/GPX解析需要专门的库）
function handleWorkoutFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    if (!['fit', 'tcx', 'gpx'].includes(extension)) {
        showToast('不支持的文件格式', 'error');
        return;
    }

    // 由于浏览器端解析FIT/TCX/GPX比较复杂，这里提供一个简化的演示
    // 实际生产环境需要使用专门的解析库或后端处理
    showToast('文件上传成功！注意：完整的FIT/TCX/GPX解析需要后端支持，当前为演示模式。', 'info');

    // 创建一个示例运动记录
    const workout = {
        date: currentWorkoutDate,
        type: 'running',
        startTime: new Date().toISOString(),
        duration: 30,
        calories: 300,
        distance: 5,
        avgHeartRate: 145,
        note: `从文件 ${file.name} 导入`,
        source: 'COROS'
    };

    Storage.addWorkout(workout);
    closeUploadModal();
    loadWorkoutRecords();
    showToast('运动记录已导入（演示数据）', 'success');
}

// ==================== 学习记录页面 ====================
function loadStudyRecords() {
    const studies = Storage.getStudiesByDateAndCategory(currentStudyDate, currentStudyFilter);
    const summary = Storage.getDailyStudySummary(currentStudyDate);

    // 更新汇总
    document.getElementById('studyTotalDuration').textContent = summary.duration;
    document.getElementById('studyTotalItems').textContent = summary.items;
    document.getElementById('studyCompletedTasks').textContent = summary.completedTasks;

    // 渲染学习记录列表
    const container = document.getElementById('studyList');

    if (studies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-graduation-cap"></i>
                <p>今天还没有学习记录</p>
            </div>
        `;
        return;
    }

    const categoryLabels = {
        reading: '阅读',
        coding: '编程',
        course: '课程',
        practice: '练习',
        other: '其他'
    };

    const categoryIcons = {
        reading: 'fa-book-reader',
        coding: 'fa-code',
        course: 'fa-chalkboard-teacher',
        practice: 'fa-pencil-alt',
        other: 'fa-folder'
    };

    let html = '';
    studies.forEach(study => {
        const tasksHtml = study.tasks && study.tasks.length > 0
            ? study.tasks.map(task => `
                <span class="study-task-item">
                    <i class="fas fa-check"></i>
                    ${task}
                </span>
            `).join('')
            : '';

        html += `
            <div class="study-card">
                <div class="study-card-header">
                    <div class="study-card-title">
                        <div class="study-category-icon ${study.category}">
                            <i class="fas ${categoryIcons[study.category] || 'fa-folder'}"></i>
                        </div>
                        <div class="study-title-info">
                            <h4>${study.topic}</h4>
                            <div class="study-meta">
                                <span><i class="fas fa-tag"></i> ${categoryLabels[study.category] || study.category}</span>
                                <span><i class="fas fa-clock"></i> ${study.duration} 分钟</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="study-content-section">
                    <h5><i class="fas fa-file-alt"></i> 学习内容</h5>
                    <div class="study-content-text">${study.content}</div>
                </div>

                ${study.reflection ? `
                <div class="study-content-section">
                    <h5><i class="fas fa-lightbulb"></i> 学习心得</h5>
                    <div class="study-content-text">${study.reflection}</div>
                </div>
                ` : ''}

                ${tasksHtml ? `
                <div class="study-content-section">
                    <h5><i class="fas fa-tasks"></i> 完成的任务</h5>
                    <div class="study-tasks">${tasksHtml}</div>
                </div>
                ` : ''}

                ${study.resources ? `
                <div class="study-content-section">
                    <h5><i class="fas fa-link"></i> 参考资源</h5>
                    <div class="study-resources">${study.resources}</div>
                </div>
                ` : ''}

                <div class="study-card-actions">
                    <button class="btn btn-icon" onclick="editStudy('${study.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon" onclick="deleteStudy('${study.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function changeStudyDate(delta) {
    const date = new Date(currentStudyDate);
    date.setDate(date.getDate() + delta);
    currentStudyDate = date.toISOString().split('T')[0];
    document.getElementById('studyDatePicker').value = currentStudyDate;
    loadStudyRecords();
}

// 学习记录模态框
function openStudyModal(id = null) {
    const modal = document.getElementById('studyModal');
    const form = document.getElementById('studyForm');

    form.reset();
    document.getElementById('studyId').value = '';
    document.getElementById('studyModalTitle').textContent = '添加学习记录';
    studyTasks = [];
    renderStudyTasks();

    if (id) {
        const study = Storage.getStudyById(id);
        if (study) {
            document.getElementById('studyId').value = study.id;
            document.getElementById('studyModalTitle').textContent = '编辑学习记录';
            document.getElementById('studyCategory').value = study.category;
            document.getElementById('studyDuration').value = study.duration;
            document.getElementById('studyTopic').value = study.topic;
            document.getElementById('studyContent').value = study.content;
            document.getElementById('studyReflection').value = study.reflection || '';
            document.getElementById('studyResources').value = study.resources || '';
            studyTasks = study.tasks || [];
            renderStudyTasks();
        }
    }

    modal.classList.add('show');
}

function closeStudyModal() {
    document.getElementById('studyModal').classList.remove('show');
    studyTasks = [];
}

function addStudyTask() {
    const input = document.getElementById('studyTaskInput');
    const task = input.value.trim();

    if (task) {
        studyTasks.push(task);
        renderStudyTasks();
        input.value = '';
    }
}

function removeStudyTask(index) {
    studyTasks.splice(index, 1);
    renderStudyTasks();
}

function renderStudyTasks() {
    const container = document.getElementById('studyTaskList');
    if (studyTasks.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = studyTasks.map((task, index) => `
        <span class="task-tag">
            ${task}
            <i class="fas fa-times remove-task" onclick="removeStudyTask(${index})"></i>
        </span>
    `).join('');
}

function saveStudy() {
    const id = document.getElementById('studyId').value;
    const study = {
        date: currentStudyDate,
        category: document.getElementById('studyCategory').value,
        duration: parseInt(document.getElementById('studyDuration').value) || 0,
        topic: document.getElementById('studyTopic').value.trim(),
        content: document.getElementById('studyContent').value.trim(),
        reflection: document.getElementById('studyReflection').value.trim(),
        resources: document.getElementById('studyResources').value.trim(),
        tasks: [...studyTasks]
    };

    if (!study.topic || !study.content || !study.duration) {
        showToast('请填写必填项', 'error');
        return;
    }

    if (id) {
        Storage.updateStudy(id, study);
        showToast('学习记录已更新', 'success');
    } else {
        Storage.addStudy(study);
        showToast('学习记录已添加', 'success');
    }

    closeStudyModal();
    loadStudyRecords();
}

function editStudy(id) {
    openStudyModal(id);
}

function deleteStudy(id) {
    if (confirm('确定要删除这条学习记录吗？')) {
        Storage.deleteStudy(id);
        showToast('记录已删除', 'success');
        loadStudyRecords();
    }
}

// ==================== PDF 导出功能 ====================
// 仪表盘导出今日完整报告
function exportDashboardPDF() {
    const today = new Date().toISOString().split('T')[0];
    const foods = Storage.getFoodsByDate(today);
    const workouts = Storage.getWorkoutsByDate(today);
    const studies = Storage.getStudiesByDate(today);
    const foodSummary = Storage.getDailySummary(today);
    const workoutSummary = Storage.getDailyWorkoutSummary(today);
    const studySummary = Storage.getDailyStudySummary(today);
    const settings = Storage.getSettings();

    const dateStr = new Date(today).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    const mealTypeLabels = {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        snack: '加餐'
    };

    const workoutTypeLabels = {
        running: '跑步',
        cycling: '骑行',
        swimming: '游泳',
        strength: '力量训练',
        walking: '步行',
        hiit: 'HIIT',
        yoga: '瑜伽',
        other: '其他'
    };

    const categoryLabels = {
        reading: '阅读',
        coding: '编程',
        course: '课程',
        practice: '练习',
        other: '其他'
    };

    // 生成食物列表HTML
    let foodsHtml = '';
    if (foods.length > 0) {
        foods.forEach(food => {
            foodsHtml += `
                <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 6px;">
                    <span><strong>${mealTypeLabels[food.mealType]}</strong> - ${food.name} (${food.weight}g)</span>
                    <span style="color: #2E86AB; font-weight: 600;">${Math.round(food.calories)} kcal</span>
                </div>
            `;
        });
    } else {
        foodsHtml = '<p style="color: #999; text-align: center; padding: 20px;">暂无记录</p>';
    }

    // 生成运动列表HTML
    let workoutsHtml = '';
    if (workouts.length > 0) {
        workouts.forEach(workout => {
            workoutsHtml += `
                <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 6px;">
                    <span><strong>${workoutTypeLabels[workout.type] || workout.type}</strong> - ${workout.duration}分钟${workout.distance ? ` · ${workout.distance}公里` : ''}</span>
                    <span style="color: #28a745; font-weight: 600;">-${Math.round(workout.calories || 0)} kcal</span>
                </div>
            `;
        });
    } else {
        workoutsHtml = '<p style="color: #999; text-align: center; padding: 20px;">暂无记录</p>';
    }

    // 生成学习列表HTML
    let studiesHtml = '';
    if (studies.length > 0) {
        studies.forEach(study => {
            const tasksCount = study.tasks ? study.tasks.length : 0;
            studiesHtml += `
                <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="background: #2E86AB; color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 12px;">${categoryLabels[study.category] || study.category}</span>
                        <span style="color: #2E86AB; font-weight: 600;">${study.duration}分钟</span>
                    </div>
                    <h4 style="font-size: 14px; margin-bottom: 6px;">${study.topic}</h4>
                    <p style="font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 6px;">${study.content.substring(0, 150)}${study.content.length > 150 ? '...' : ''}</p>
                    ${tasksCount > 0 ? `<p style="font-size: 12px; color: #48bb78;">✓ 完成 ${tasksCount} 个任务</p>` : ''}
                </div>
            `;
        });
    } else {
        studiesHtml = '<p style="color: #999; text-align: center; padding: 20px;">暂无记录</p>';
    }

    // 热量差
    const calorieBalance = Math.round(foodSummary.calories - workoutSummary.calories);
    const balanceColor = calorieBalance > 0 ? '#dc3545' : '#28a745';

    const reportTitle = settings.nickname && settings.nickname !== '用户'
        ? `${settings.nickname}的每日报告`
        : 'FitTracker 每日报告';

    const pdfContent = `
        <div class="pdf-export-container" id="pdfContent">
            <div class="pdf-header">
                <h1 style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <span style="color: #ff6b6b;">♥</span> ${reportTitle}
                </h1>
                <div class="pdf-date">${dateStr}</div>
            </div>

            <div class="pdf-section">
                <h2 style="color: #2E86AB; border-bottom: 2px solid #2E86AB; padding-bottom: 8px;">
                    📊 今日概览
                </h2>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0;">
                    <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #ff6b6b22, #ff6b6b11); border-radius: 10px;">
                        <div style="font-size: 28px; font-weight: 700; color: #ff6b6b;">${Math.round(foodSummary.calories)}</div>
                        <div style="font-size: 12px; color: #666;">摄入热量(kcal)</div>
                    </div>
                    <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #2E86AB22, #2E86AB11); border-radius: 10px;">
                        <div style="font-size: 28px; font-weight: 700; color: #2E86AB;">${Math.round(workoutSummary.calories)}</div>
                        <div style="font-size: 12px; color: #666;">运动消耗(kcal)</div>
                    </div>
                    <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, ${balanceColor}22, ${balanceColor}11); border-radius: 10px;">
                        <div style="font-size: 28px; font-weight: 700; color: ${balanceColor};">${calorieBalance}</div>
                        <div style="font-size: 12px; color: #666;">热量差(kcal)</div>
                    </div>
                    <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #667eea22, #667eea11); border-radius: 10px;">
                        <div style="font-size: 28px; font-weight: 700; color: #667eea;">${studySummary.duration}</div>
                        <div style="font-size: 12px; color: #666;">学习时长(分钟)</div>
                    </div>
                </div>
            </div>

            <div class="pdf-section">
                <h2 style="color: #ff6b6b; border-bottom: 2px solid #ff6b6b; padding-bottom: 8px;">
                    🍽️ 饮食记录
                </h2>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 12px 0;">
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: #2E86AB;">${Math.round(foodSummary.calories)}</div>
                        <div style="font-size: 11px; color: #999;">热量 kcal</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: #5470c6;">${Math.round(foodSummary.carbs)}</div>
                        <div style="font-size: 11px; color: #999;">碳水 g</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: #91cc75;">${Math.round(foodSummary.protein)}</div>
                        <div style="font-size: 11px; color: #999;">蛋白质 g</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: #fac858;">${Math.round(foodSummary.fat)}</div>
                        <div style="font-size: 11px; color: #999;">脂肪 g</div>
                    </div>
                </div>
                ${foodsHtml}
            </div>

            <div class="pdf-section">
                <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 8px;">
                    🏃 运动记录
                </h2>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 12px 0;">
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: #28a745;">${Math.round(workoutSummary.calories)}</div>
                        <div style="font-size: 11px; color: #999;">消耗 kcal</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: #28a745;">${workoutSummary.duration}</div>
                        <div style="font-size: 11px; color: #999;">时长 分钟</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: #28a745;">${workoutSummary.distance.toFixed(1)}</div>
                        <div style="font-size: 11px; color: #999;">距离 公里</div>
                    </div>
                </div>
                ${workoutsHtml}
            </div>

            <div class="pdf-section">
                <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 8px;">
                    📚 学习记录
                </h2>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 12px 0;">
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: #667eea;">${studySummary.duration}</div>
                        <div style="font-size: 11px; color: #999;">学习时长 分钟</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: #667eea;">${studySummary.items}</div>
                        <div style="font-size: 11px; color: #999;">学习项目</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: #48bb78;">${studySummary.completedTasks}</div>
                        <div style="font-size: 11px; color: #999;">完成任务</div>
                    </div>
                </div>
                ${studiesHtml}
            </div>

            <div class="pdf-footer">
                <p>由 FitTracker 生成 · ${new Date().toLocaleString('zh-CN')}</p>
            </div>
        </div>
    `;

    // 创建临时元素
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pdfContent;
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    document.body.appendChild(tempDiv);

    const element = tempDiv.querySelector('#pdfContent');
    element.style.position = 'relative';
    element.style.left = '0';
    element.style.width = '210mm';
    element.style.background = '#ffffff';
    element.style.padding = '15mm';
    element.style.fontFamily = '"Microsoft YaHei", "SimHei", sans-serif';

    const opt = {
        margin: 0,
        filename: `FitTracker每日报告_${today}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        }
    };

    showToast('正在生成 PDF...', 'info');

    html2pdf().set(opt).from(element).save().then(() => {
        document.body.removeChild(tempDiv);
        showToast('PDF 导出成功', 'success');
    }).catch(err => {
        document.body.removeChild(tempDiv);
        showToast('PDF 导出失败', 'error');
        console.error('PDF export error:', err);
    });
}

// 学习记录页面导出
function exportDailyPDF() {
    const date = currentStudyDate;
    const studies = Storage.getStudiesByDate(date);
    const foodSummary = Storage.getDailySummary(date);
    const workoutSummary = Storage.getDailyWorkoutSummary(date);
    const studySummary = Storage.getDailyStudySummary(date);
    const settings = Storage.getSettings();

    if (studies.length === 0) {
        showToast('当天没有学习记录可导出', 'error');
        return;
    }

    const categoryLabels = {
        reading: '阅读',
        coding: '编程',
        course: '课程',
        practice: '练习',
        other: '其他'
    };

    const dateStr = new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    const reportTitle = settings.nickname && settings.nickname !== '用户'
        ? `${settings.nickname}的学习记录`
        : '每日学习记录';

    // 创建PDF内容
    let studyItemsHtml = '';
    studies.forEach((study, index) => {
        const tasksHtml = study.tasks && study.tasks.length > 0
            ? `<div class="pdf-tasks-list">${study.tasks.map(t => `<span class="pdf-task"><i class="fas fa-check"></i> ${t}</span>`).join('')}</div>`
            : '';

        studyItemsHtml += `
            <div class="pdf-study-item">
                <span class="category">${categoryLabels[study.category] || study.category}</span>
                <h3>${index + 1}. ${study.topic}</h3>
                <p style="color: #666; font-size: 13px; margin-bottom: 8px;">
                    <i class="fas fa-clock"></i> ${study.duration} 分钟
                </p>
                <div class="content">${study.content}</div>
                ${study.reflection ? `<div class="reflection">${study.reflection}</div>` : ''}
                ${tasksHtml}
                ${study.resources ? `<p style="font-size: 12px; color: #888; margin-top: 8px;"><strong>参考资源：</strong>${study.resources}</p>` : ''}
            </div>
        `;
    });

    const pdfContent = `
        <div class="pdf-export-container" id="pdfContent">
            <div class="pdf-header">
                <h1><i class="fas fa-graduation-cap"></i> ${reportTitle}</h1>
                <div class="pdf-date">${dateStr}</div>
            </div>

            <div class="pdf-section">
                <h2><i class="fas fa-chart-pie"></i> 今日概览</h2>
                <div class="pdf-summary-grid">
                    <div class="pdf-summary-item">
                        <div class="value">${studySummary.duration}</div>
                        <div class="label">学习时长(分钟)</div>
                    </div>
                    <div class="pdf-summary-item">
                        <div class="value">${studySummary.items}</div>
                        <div class="label">学习项目</div>
                    </div>
                    <div class="pdf-summary-item">
                        <div class="value">${studySummary.completedTasks}</div>
                        <div class="label">完成任务</div>
                    </div>
                </div>
            </div>

            <div class="pdf-section">
                <h2><i class="fas fa-book"></i> 学习详情</h2>
                ${studyItemsHtml}
            </div>

            <div class="pdf-section">
                <h2><i class="fas fa-heartbeat"></i> 健康数据</h2>
                <div class="pdf-summary-grid">
                    <div class="pdf-summary-item">
                        <div class="value">${Math.round(foodSummary.calories)}</div>
                        <div class="label">摄入热量(kcal)</div>
                    </div>
                    <div class="pdf-summary-item">
                        <div class="value">${Math.round(workoutSummary.calories)}</div>
                        <div class="label">运动消耗(kcal)</div>
                    </div>
                    <div class="pdf-summary-item">
                        <div class="value">${workoutSummary.duration}</div>
                        <div class="label">运动时长(分钟)</div>
                    </div>
                </div>
            </div>

            <div class="pdf-footer">
                <p>由 FitTracker 生成 · ${new Date().toLocaleString('zh-CN')}</p>
            </div>
        </div>
    `;

    // 创建临时元素
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pdfContent;
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    document.body.appendChild(tempDiv);

    const element = tempDiv.querySelector('#pdfContent');
    element.style.position = 'relative';
    element.style.left = '0';
    element.style.width = '210mm';
    element.style.background = '#ffffff';
    element.style.padding = '20mm';
    element.style.fontFamily = '"Microsoft YaHei", "SimHei", sans-serif';

    // 使用 html2pdf 导出
    const opt = {
        margin: 0,
        filename: `学习记录_${date}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        }
    };

    showToast('正在生成 PDF...', 'info');

    html2pdf().set(opt).from(element).save().then(() => {
        document.body.removeChild(tempDiv);
        showToast('PDF 导出成功', 'success');
    }).catch(err => {
        document.body.removeChild(tempDiv);
        showToast('PDF 导出失败', 'error');
        console.error('PDF export error:', err);
    });
}

// ==================== Toast 提示 ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== 体重记录页面 ====================
function loadWeightPage() {
    loadWeightRecord();
    loadWeightStats();
    loadWeightHistory();
    renderWeightTrendChart();
}

function loadWeightRecord() {
    const record = Storage.getWeightByDate(currentWeightDate);

    if (record) {
        document.getElementById('morningWeight').value = record.morningWeight || '';
        document.getElementById('eveningWeight').value = record.eveningWeight || '';
    } else {
        document.getElementById('morningWeight').value = '';
        document.getElementById('eveningWeight').value = '';
    }
}

function saveWeightRecord() {
    const morningWeight = parseFloat(document.getElementById('morningWeight').value);
    const eveningWeight = parseFloat(document.getElementById('eveningWeight').value);

    if (!morningWeight && !eveningWeight) {
        showToast('请至少输入一个体重值', 'error');
        return;
    }

    const weightData = {
        date: currentWeightDate,
        morningWeight: morningWeight || null,
        eveningWeight: eveningWeight || null
    };

    Storage.saveWeight(weightData);
    showToast('体重记录已保存', 'success');

    // 更新设置中的当前体重（使用早间体重）
    if (morningWeight) {
        const settings = Storage.getSettings();
        settings.currentWeight = morningWeight;
        Storage.saveSettings(settings);
    }

    loadWeightStats();
    loadWeightHistory();
    renderWeightTrendChart();
}

function changeWeightDate(delta) {
    const date = new Date(currentWeightDate);
    date.setDate(date.getDate() + delta);
    currentWeightDate = date.toISOString().split('T')[0];
    document.getElementById('weightDatePicker').value = currentWeightDate;
    loadWeightRecord();
}

function loadWeightStats() {
    const settings = Storage.getSettings();
    const latestWeight = Storage.getLatestWeight();
    const weightChange = Storage.getWeightChange(7);

    // 当前体重
    const currentWeight = latestWeight ?
        (latestWeight.morningWeight || latestWeight.eveningWeight) :
        (settings.currentWeight || '--');
    document.getElementById('currentWeightDisplay').textContent =
        typeof currentWeight === 'number' ? currentWeight.toFixed(1) : currentWeight;

    // 目标体重
    const targetWeight = settings.targetWeight || '--';
    document.getElementById('targetWeightDisplay').textContent =
        typeof targetWeight === 'number' ? targetWeight.toFixed(1) : targetWeight;

    // 距离目标
    if (typeof currentWeight === 'number' && typeof targetWeight === 'number') {
        const gap = (currentWeight - targetWeight).toFixed(1);
        const gapElement = document.getElementById('weightGapDisplay');
        gapElement.textContent = gap > 0 ? `+${gap}` : gap;
        gapElement.className = 'weight-stat-value ' + (gap > 0 ? 'positive' : 'negative');
    } else {
        document.getElementById('weightGapDisplay').textContent = '--';
    }

    // 近7天变化
    if (weightChange) {
        const changeElement = document.getElementById('weeklyChangeDisplay');
        const change = parseFloat(weightChange.change);
        changeElement.textContent = change > 0 ? `+${change}` : change;
        changeElement.className = 'weight-stat-value ' + (change > 0 ? 'positive' : 'negative');
    } else {
        document.getElementById('weeklyChangeDisplay').textContent = '--';
    }
}

function loadWeightHistory() {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);

    const weights = Storage.getWeightsByDateRange(
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
    ).reverse(); // 最新的在前

    const container = document.getElementById('weightHistory');

    if (weights.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-weight"></i>
                <p>暂无体重记录</p>
            </div>
        `;
        return;
    }

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    let html = '';
    weights.forEach(record => {
        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
        const weekday = weekdays[date.getDay()];

        html += `
            <div class="weight-history-item">
                <div class="weight-history-date">
                    ${dateStr}
                    <small>${weekday}</small>
                </div>
                <div class="weight-history-values">
                    <div class="weight-history-value">
                        <label>早间</label>
                        <span>${record.morningWeight ? record.morningWeight.toFixed(1) : '--'}</span>
                    </div>
                    <div class="weight-history-value">
                        <label>晚间</label>
                        <span>${record.eveningWeight ? record.eveningWeight.toFixed(1) : '--'}</span>
                    </div>
                </div>
                <div class="weight-history-actions">
                    <button class="btn btn-icon btn-sm" onclick="editWeightRecord('${record.date}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon btn-sm" onclick="deleteWeightRecord('${record.date}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function editWeightRecord(date) {
    currentWeightDate = date;
    document.getElementById('weightDatePicker').value = date;
    loadWeightRecord();
    // 滚动到顶部
    document.querySelector('.content-wrapper').scrollTop = 0;
}

function deleteWeightRecord(date) {
    if (confirm('确定要删除这条体重记录吗？')) {
        Storage.deleteWeight(date);
        showToast('记录已删除', 'success');
        loadWeightStats();
        loadWeightHistory();
        renderWeightTrendChart();
    }
}

function renderWeightTrendChart() {
    const chartDom = document.getElementById('weightTrendChart');
    if (!chartDom) return;

    const chart = echarts.init(chartDom);

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);

    const weights = Storage.getWeightsByDateRange(
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
    );

    const settings = Storage.getSettings();

    // 准备数据
    const dates = [];
    const morningData = [];
    const eveningData = [];

    for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dates.push(`${date.getMonth() + 1}/${date.getDate()}`);

        const record = weights.find(w => w.date === dateStr);
        morningData.push(record && record.morningWeight ? record.morningWeight : null);
        eveningData.push(record && record.eveningWeight ? record.eveningWeight : null);
    }

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                let result = params[0].name + '<br/>';
                params.forEach(p => {
                    if (p.value !== null) {
                        result += `${p.marker} ${p.seriesName}: ${p.value} kg<br/>`;
                    }
                });
                return result;
            }
        },
        legend: {
            data: ['早间体重', '晚间体重'],
            top: 10
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: 50,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates,
            axisLabel: {
                interval: 4,
                fontSize: 11
            }
        },
        yAxis: {
            type: 'value',
            name: 'kg',
            scale: true,
            splitLine: {
                lineStyle: {
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: '早间体重',
                type: 'line',
                data: morningData,
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                connectNulls: true,
                lineStyle: {
                    color: '#2E86AB',
                    width: 2
                },
                itemStyle: {
                    color: '#2E86AB'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(46, 134, 171, 0.3)' },
                            { offset: 1, color: 'rgba(46, 134, 171, 0.05)' }
                        ]
                    }
                },
                markLine: settings.targetWeight ? {
                    silent: true,
                    data: [
                        {
                            yAxis: settings.targetWeight,
                            name: '目标体重',
                            lineStyle: {
                                color: '#48bb78',
                                type: 'dashed'
                            },
                            label: {
                                formatter: '目标: {c} kg',
                                position: 'end'
                            }
                        }
                    ]
                } : {}
            },
            {
                name: '晚间体重',
                type: 'line',
                data: eveningData,
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                connectNulls: true,
                lineStyle: {
                    color: '#A23B72',
                    width: 2
                },
                itemStyle: {
                    color: '#A23B72'
                }
            }
        ]
    };

    chart.setOption(option);

    // 响应式
    window.addEventListener('resize', () => {
        chart.resize();
    });
}
