/**
 * FitTracker 数据存储层
 * 使用 localStorage 进行数据持久化
 */

const Storage = {
    // 存储键名
    KEYS: {
        FOODS: 'fittracker_foods',
        WORKOUTS: 'fittracker_workouts',
        NOTES: 'fittracker_notes',
        STUDIES: 'fittracker_studies',
        SETTINGS: 'fittracker_settings',
        FOOD_DATABASE: 'fittracker_food_database'
    },

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // ==================== 通用方法 ====================
    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取数据失败:', e);
            return [];
        }
    },

    setData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    },

    // ==================== 食物记录 ====================
    // 获取所有食物记录
    getAllFoods() {
        return this.getData(this.KEYS.FOODS);
    },

    // 根据日期获取食物记录
    getFoodsByDate(date) {
        const foods = this.getAllFoods();
        return foods.filter(food => food.date === date);
    },

    // 根据日期和餐次获取食物记录
    getFoodsByDateAndMeal(date, mealType) {
        const foods = this.getFoodsByDate(date);
        if (mealType === 'all') return foods;
        return foods.filter(food => food.mealType === mealType);
    },

    // 添加食物记录
    addFood(food) {
        const foods = this.getAllFoods();
        const newFood = {
            id: this.generateId(),
            ...food,
            createdAt: new Date().toISOString()
        };
        foods.push(newFood);
        this.setData(this.KEYS.FOODS, foods);

        // 添加到食物库
        this.addToFoodDatabase(food);

        return newFood;
    },

    // 更新食物记录
    updateFood(id, updates) {
        const foods = this.getAllFoods();
        const index = foods.findIndex(food => food.id === id);
        if (index !== -1) {
            foods[index] = { ...foods[index], ...updates, updatedAt: new Date().toISOString() };
            this.setData(this.KEYS.FOODS, foods);
            return foods[index];
        }
        return null;
    },

    // 删除食物记录
    deleteFood(id) {
        const foods = this.getAllFoods();
        const filteredFoods = foods.filter(food => food.id !== id);
        this.setData(this.KEYS.FOODS, filteredFoods);
    },

    // 获取日期范围内的食物记录
    getFoodsByDateRange(startDate, endDate) {
        const foods = this.getAllFoods();
        return foods.filter(food => food.date >= startDate && food.date <= endDate);
    },

    // 计算某日营养汇总
    getDailySummary(date) {
        const foods = this.getFoodsByDate(date);
        return foods.reduce((sum, food) => ({
            calories: sum.calories + (parseFloat(food.calories) || 0),
            carbs: sum.carbs + (parseFloat(food.carbs) || 0),
            protein: sum.protein + (parseFloat(food.protein) || 0),
            fat: sum.fat + (parseFloat(food.fat) || 0)
        }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
    },

    // ==================== 运动记录 ====================
    // 获取所有运动记录
    getAllWorkouts() {
        return this.getData(this.KEYS.WORKOUTS);
    },

    // 根据日期获取运动记录
    getWorkoutsByDate(date) {
        const workouts = this.getAllWorkouts();
        return workouts.filter(workout => workout.date === date);
    },

    // 添加运动记录
    addWorkout(workout) {
        const workouts = this.getAllWorkouts();
        const newWorkout = {
            id: this.generateId(),
            ...workout,
            createdAt: new Date().toISOString()
        };
        workouts.push(newWorkout);
        this.setData(this.KEYS.WORKOUTS, workouts);
        return newWorkout;
    },

    // 更新运动记录
    updateWorkout(id, updates) {
        const workouts = this.getAllWorkouts();
        const index = workouts.findIndex(workout => workout.id === id);
        if (index !== -1) {
            workouts[index] = { ...workouts[index], ...updates, updatedAt: new Date().toISOString() };
            this.setData(this.KEYS.WORKOUTS, workouts);
            return workouts[index];
        }
        return null;
    },

    // 删除运动记录
    deleteWorkout(id) {
        const workouts = this.getAllWorkouts();
        const filteredWorkouts = workouts.filter(workout => workout.id !== id);
        this.setData(this.KEYS.WORKOUTS, filteredWorkouts);
    },

    // 获取日期范围内的运动记录
    getWorkoutsByDateRange(startDate, endDate) {
        const workouts = this.getAllWorkouts();
        return workouts.filter(workout => workout.date >= startDate && workout.date <= endDate);
    },

    // 计算某日运动汇总
    getDailyWorkoutSummary(date) {
        const workouts = this.getWorkoutsByDate(date);
        return workouts.reduce((sum, workout) => ({
            calories: sum.calories + (parseFloat(workout.calories) || 0),
            duration: sum.duration + (parseInt(workout.duration) || 0),
            distance: sum.distance + (parseFloat(workout.distance) || 0)
        }), { calories: 0, duration: 0, distance: 0 });
    },

    // ==================== 笔记 ====================
    // 获取所有笔记
    getAllNotes() {
        return this.getData(this.KEYS.NOTES);
    },

    // 根据ID获取笔记
    getNoteById(id) {
        const notes = this.getAllNotes();
        return notes.find(note => note.id === id);
    },

    // 添加笔记
    addNote(note) {
        const notes = this.getAllNotes();
        const newNote = {
            id: this.generateId(),
            ...note,
            createdAt: new Date().toISOString()
        };
        notes.push(newNote);
        this.setData(this.KEYS.NOTES, notes);
        return newNote;
    },

    // 更新笔记
    updateNote(id, updates) {
        const notes = this.getAllNotes();
        const index = notes.findIndex(note => note.id === id);
        if (index !== -1) {
            notes[index] = { ...notes[index], ...updates, updatedAt: new Date().toISOString() };
            this.setData(this.KEYS.NOTES, notes);
            return notes[index];
        }
        return null;
    },

    // 删除笔记
    deleteNote(id) {
        const notes = this.getAllNotes();
        const filteredNotes = notes.filter(note => note.id !== id);
        this.setData(this.KEYS.NOTES, filteredNotes);
    },

    // 搜索笔记
    searchNotes(keyword) {
        const notes = this.getAllNotes();
        const lowerKeyword = keyword.toLowerCase();
        return notes.filter(note =>
            (note.title && note.title.toLowerCase().includes(lowerKeyword)) ||
            (note.content && note.content.toLowerCase().includes(lowerKeyword))
        );
    },

    // ==================== 学习记录 ====================
    // 获取所有学习记录
    getAllStudies() {
        return this.getData(this.KEYS.STUDIES);
    },

    // 根据日期获取学习记录
    getStudiesByDate(date) {
        const studies = this.getAllStudies();
        return studies.filter(study => study.date === date);
    },

    // 根据日期和分类获取学习记录
    getStudiesByDateAndCategory(date, category) {
        const studies = this.getStudiesByDate(date);
        if (category === 'all') return studies;
        return studies.filter(study => study.category === category);
    },

    // 根据ID获取学习记录
    getStudyById(id) {
        const studies = this.getAllStudies();
        return studies.find(study => study.id === id);
    },

    // 添加学习记录
    addStudy(study) {
        const studies = this.getAllStudies();
        const newStudy = {
            id: this.generateId(),
            ...study,
            createdAt: new Date().toISOString()
        };
        studies.push(newStudy);
        this.setData(this.KEYS.STUDIES, studies);
        return newStudy;
    },

    // 更新学习记录
    updateStudy(id, updates) {
        const studies = this.getAllStudies();
        const index = studies.findIndex(study => study.id === id);
        if (index !== -1) {
            studies[index] = { ...studies[index], ...updates, updatedAt: new Date().toISOString() };
            this.setData(this.KEYS.STUDIES, studies);
            return studies[index];
        }
        return null;
    },

    // 删除学习记录
    deleteStudy(id) {
        const studies = this.getAllStudies();
        const filteredStudies = studies.filter(study => study.id !== id);
        this.setData(this.KEYS.STUDIES, filteredStudies);
    },

    // 计算某日学习汇总
    getDailyStudySummary(date) {
        const studies = this.getStudiesByDate(date);
        const completedTasks = studies.reduce((sum, study) => {
            return sum + (study.tasks ? study.tasks.length : 0);
        }, 0);

        return {
            duration: studies.reduce((sum, study) => sum + (parseInt(study.duration) || 0), 0),
            items: studies.length,
            completedTasks: completedTasks
        };
    },

    // 获取日期范围内的学习记录
    getStudiesByDateRange(startDate, endDate) {
        const studies = this.getAllStudies();
        return studies.filter(study => study.date >= startDate && study.date <= endDate);
    },

    // ==================== 设置 ====================
    // 获取设置
    getSettings() {
        const defaultSettings = {
            nickname: '用户',
            calorieGoal: 2000,
            carbsGoal: 250,
            proteinGoal: 100,
            fatGoal: 65
        };
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
        } catch (e) {
            return defaultSettings;
        }
    },

    // 保存设置
    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('保存设置失败:', e);
            return false;
        }
    },

    // ==================== 食物数据库 ====================
    // 获取食物库
    getFoodDatabase() {
        const defaultFoods = [
            { name: '鸡胸肉', caloriesPer100g: 165, carbsPer100g: 0, proteinPer100g: 31, fatPer100g: 3.6 },
            { name: '米饭', caloriesPer100g: 116, carbsPer100g: 25.6, proteinPer100g: 2.6, fatPer100g: 0.3 },
            { name: '鸡蛋', caloriesPer100g: 144, carbsPer100g: 0.7, proteinPer100g: 13.3, fatPer100g: 9.5 },
            { name: '牛肉', caloriesPer100g: 250, carbsPer100g: 0, proteinPer100g: 26, fatPer100g: 15 },
            { name: '三文鱼', caloriesPer100g: 208, carbsPer100g: 0, proteinPer100g: 20, fatPer100g: 13 },
            { name: '西兰花', caloriesPer100g: 34, carbsPer100g: 7, proteinPer100g: 2.8, fatPer100g: 0.4 },
            { name: '燕麦', caloriesPer100g: 389, carbsPer100g: 66, proteinPer100g: 17, fatPer100g: 7 },
            { name: '香蕉', caloriesPer100g: 89, carbsPer100g: 23, proteinPer100g: 1.1, fatPer100g: 0.3 },
            { name: '苹果', caloriesPer100g: 52, carbsPer100g: 14, proteinPer100g: 0.3, fatPer100g: 0.2 },
            { name: '牛奶', caloriesPer100g: 42, carbsPer100g: 5, proteinPer100g: 3.4, fatPer100g: 1 },
            { name: '酸奶', caloriesPer100g: 59, carbsPer100g: 3.6, proteinPer100g: 10, fatPer100g: 0.7 },
            { name: '豆腐', caloriesPer100g: 76, carbsPer100g: 1.9, proteinPer100g: 8, fatPer100g: 4.8 },
            { name: '虾', caloriesPer100g: 99, carbsPer100g: 0.2, proteinPer100g: 24, fatPer100g: 0.3 },
            { name: '猪肉', caloriesPer100g: 242, carbsPer100g: 0, proteinPer100g: 27, fatPer100g: 14 },
            { name: '面条', caloriesPer100g: 138, carbsPer100g: 25, proteinPer100g: 4.5, fatPer100g: 2 },
            { name: '面包', caloriesPer100g: 265, carbsPer100g: 49, proteinPer100g: 9, fatPer100g: 3.2 },
            { name: '红薯', caloriesPer100g: 86, carbsPer100g: 20, proteinPer100g: 1.6, fatPer100g: 0.1 },
            { name: '土豆', caloriesPer100g: 77, carbsPer100g: 17, proteinPer100g: 2, fatPer100g: 0.1 },
            { name: '黄瓜', caloriesPer100g: 16, carbsPer100g: 3.6, proteinPer100g: 0.7, fatPer100g: 0.1 },
            { name: '番茄', caloriesPer100g: 18, carbsPer100g: 3.9, proteinPer100g: 0.9, fatPer100g: 0.2 },
            { name: '生菜', caloriesPer100g: 15, carbsPer100g: 2.9, proteinPer100g: 1.4, fatPer100g: 0.2 },
            { name: '坚果', caloriesPer100g: 607, carbsPer100g: 21, proteinPer100g: 21, fatPer100g: 54 },
            { name: '花生', caloriesPer100g: 567, carbsPer100g: 16, proteinPer100g: 26, fatPer100g: 49 },
            { name: '蛋白粉', caloriesPer100g: 375, carbsPer100g: 7.5, proteinPer100g: 75, fatPer100g: 3.8 }
        ];

        const storedFoods = this.getData(this.KEYS.FOOD_DATABASE);
        if (storedFoods.length === 0) {
            this.setData(this.KEYS.FOOD_DATABASE, defaultFoods);
            return defaultFoods;
        }
        return storedFoods;
    },

    // 添加食物到数据库
    addToFoodDatabase(food) {
        const database = this.getFoodDatabase();
        const exists = database.find(f => f.name === food.name);
        if (!exists && food.weight && food.weight > 0) {
            const newFood = {
                name: food.name,
                caloriesPer100g: Math.round((food.calories / food.weight) * 100),
                carbsPer100g: Math.round((food.carbs / food.weight) * 100 * 10) / 10,
                proteinPer100g: Math.round((food.protein / food.weight) * 100 * 10) / 10,
                fatPer100g: Math.round((food.fat / food.weight) * 100 * 10) / 10
            };
            database.push(newFood);
            this.setData(this.KEYS.FOOD_DATABASE, database);
        }
    },

    // 搜索食物库
    searchFoodDatabase(keyword) {
        const database = this.getFoodDatabase();
        const lowerKeyword = keyword.toLowerCase();
        return database.filter(food => food.name.toLowerCase().includes(lowerKeyword));
    },

    // ==================== 统计数据 ====================
    // 获取连续记录天数
    getStreakDays() {
        const foods = this.getAllFoods();
        if (foods.length === 0) return 0;

        const dates = [...new Set(foods.map(f => f.date))].sort().reverse();
        const today = new Date().toISOString().split('T')[0];

        let streak = 0;
        let checkDate = new Date(today);

        for (let i = 0; i < 365; i++) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (dates.includes(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (i === 0) {
                // 今天没有记录，检查昨天
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    },

    // 获取周统计数据
    getWeeklyStats() {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 6);

        const startDate = weekAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];

        const foods = this.getFoodsByDateRange(startDate, endDate);
        const workouts = this.getWorkoutsByDateRange(startDate, endDate);

        const stats = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekAgo);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            const dayFoods = foods.filter(f => f.date === dateStr);
            const dayWorkouts = workouts.filter(w => w.date === dateStr);

            stats.push({
                date: dateStr,
                label: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
                caloriesIn: dayFoods.reduce((sum, f) => sum + (parseFloat(f.calories) || 0), 0),
                caloriesOut: dayWorkouts.reduce((sum, w) => sum + (parseFloat(w.calories) || 0), 0),
                carbs: dayFoods.reduce((sum, f) => sum + (parseFloat(f.carbs) || 0), 0),
                protein: dayFoods.reduce((sum, f) => sum + (parseFloat(f.protein) || 0), 0),
                fat: dayFoods.reduce((sum, f) => sum + (parseFloat(f.fat) || 0), 0)
            });
        }

        return stats;
    },

    // 获取月统计数据
    getMonthlyStats() {
        const today = new Date();
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 29);

        const startDate = monthAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];

        const foods = this.getFoodsByDateRange(startDate, endDate);
        const workouts = this.getWorkoutsByDateRange(startDate, endDate);

        const stats = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(monthAgo);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            const dayFoods = foods.filter(f => f.date === dateStr);
            const dayWorkouts = workouts.filter(w => w.date === dateStr);

            stats.push({
                date: dateStr,
                label: `${date.getMonth() + 1}/${date.getDate()}`,
                caloriesIn: dayFoods.reduce((sum, f) => sum + (parseFloat(f.calories) || 0), 0),
                caloriesOut: dayWorkouts.reduce((sum, w) => sum + (parseFloat(w.calories) || 0), 0),
                carbs: dayFoods.reduce((sum, f) => sum + (parseFloat(f.carbs) || 0), 0),
                protein: dayFoods.reduce((sum, f) => sum + (parseFloat(f.protein) || 0), 0),
                fat: dayFoods.reduce((sum, f) => sum + (parseFloat(f.fat) || 0), 0)
            });
        }

        return stats;
    },

    // 获取餐次分布数据
    getMealDistribution(date) {
        const foods = this.getFoodsByDate(date);
        const distribution = {
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            snack: 0
        };

        foods.forEach(food => {
            distribution[food.mealType] = (distribution[food.mealType] || 0) + (parseFloat(food.calories) || 0);
        });

        return distribution;
    },

    // ==================== 数据导入导出 ====================
    // 导出所有数据
    exportAllData() {
        return {
            foods: this.getAllFoods(),
            workouts: this.getAllWorkouts(),
            notes: this.getAllNotes(),
            studies: this.getAllStudies(),
            settings: this.getSettings(),
            foodDatabase: this.getFoodDatabase(),
            exportedAt: new Date().toISOString()
        };
    },

    // 导入数据
    importData(data) {
        try {
            if (data.foods) this.setData(this.KEYS.FOODS, data.foods);
            if (data.workouts) this.setData(this.KEYS.WORKOUTS, data.workouts);
            if (data.notes) this.setData(this.KEYS.NOTES, data.notes);
            if (data.studies) this.setData(this.KEYS.STUDIES, data.studies);
            if (data.settings) this.saveSettings(data.settings);
            if (data.foodDatabase) this.setData(this.KEYS.FOOD_DATABASE, data.foodDatabase);
            return true;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    },

    // 清空所有数据
    clearAllData() {
        localStorage.removeItem(this.KEYS.FOODS);
        localStorage.removeItem(this.KEYS.WORKOUTS);
        localStorage.removeItem(this.KEYS.NOTES);
        localStorage.removeItem(this.KEYS.STUDIES);
        localStorage.removeItem(this.KEYS.SETTINGS);
        localStorage.removeItem(this.KEYS.FOOD_DATABASE);
    }
};
