/**
 * FitTracker 图表功能
 * 使用 ECharts 进行数据可视化
 */

// 图表实例
let macroChart = null;
let caloriesTrendChart = null;
let calorieBalanceChart = null;
let mealDistributionChart = null;
let workoutTrendChart = null;

// 图表颜色配置
const chartColors = {
    primary: '#2E86AB',
    secondary: '#A23B72',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    carbs: '#5470c6',
    protein: '#91cc75',
    fat: '#fac858',
    caloriesIn: '#ff6b6b',
    caloriesOut: '#2E86AB'
};

// ==================== 仪表盘图表 ====================

// 渲染宏量营养素饼图
function renderMacroChart(summary) {
    const container = document.getElementById('macroChart');

    if (!macroChart) {
        macroChart = echarts.init(container);
    }

    const total = summary.carbs + summary.protein + summary.fat;

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}g ({d}%)'
        },
        series: [{
            type: 'pie',
            radius: ['45%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            label: {
                show: false
            },
            emphasis: {
                label: {
                    show: false
                }
            },
            labelLine: {
                show: false
            },
            data: [
                { value: Math.round(summary.carbs), name: '碳水', itemStyle: { color: chartColors.carbs } },
                { value: Math.round(summary.protein), name: '蛋白质', itemStyle: { color: chartColors.protein } },
                { value: Math.round(summary.fat), name: '脂肪', itemStyle: { color: chartColors.fat } }
            ]
        }]
    };

    if (total === 0) {
        option.series[0].data = [
            { value: 1, name: '暂无数据', itemStyle: { color: '#e8e8e8' } }
        ];
    }

    macroChart.setOption(option);
}

// ==================== 数据分析页面图表 ====================

function loadAnalytics() {
    const stats = currentPeriod === 'week' ? Storage.getWeeklyStats() : Storage.getMonthlyStats();

    renderCaloriesTrendChart(stats);
    renderCalorieBalanceChart(stats);
    renderMealDistributionChart();
    renderWorkoutTrendChart(stats);
}

// 热量趋势图
function renderCaloriesTrendChart(stats) {
    const container = document.getElementById('caloriesTrendChart');

    if (!caloriesTrendChart) {
        caloriesTrendChart = echarts.init(container);
    }

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            data: ['摄入热量', '消耗热量'],
            bottom: 0
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: stats.map(s => s.label),
            axisLine: {
                lineStyle: { color: '#e8e8e8' }
            },
            axisLabel: {
                color: '#666'
            }
        },
        yAxis: {
            type: 'value',
            name: 'kcal',
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            splitLine: {
                lineStyle: { color: '#f0f0f0' }
            },
            axisLabel: {
                color: '#666'
            }
        },
        series: [
            {
                name: '摄入热量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: { width: 3 },
                itemStyle: { color: chartColors.caloriesIn },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
                        { offset: 1, color: 'rgba(255, 107, 107, 0.05)' }
                    ])
                },
                data: stats.map(s => Math.round(s.caloriesIn))
            },
            {
                name: '消耗热量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: { width: 3 },
                itemStyle: { color: chartColors.caloriesOut },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(46, 134, 171, 0.3)' },
                        { offset: 1, color: 'rgba(46, 134, 171, 0.05)' }
                    ])
                },
                data: stats.map(s => Math.round(s.caloriesOut))
            }
        ]
    };

    caloriesTrendChart.setOption(option);
}

// 热量收支平衡图
function renderCalorieBalanceChart(stats) {
    const container = document.getElementById('calorieBalanceChart');

    if (!calorieBalanceChart) {
        calorieBalanceChart = echarts.init(container);
    }

    const balanceData = stats.map(s => Math.round(s.caloriesIn - s.caloriesOut));

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                const value = params[0].value;
                const status = value > 0 ? '热量盈余' : value < 0 ? '热量赤字' : '热量平衡';
                return `${params[0].name}<br/>${status}: ${Math.abs(value)} kcal`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: stats.map(s => s.label),
            axisLine: {
                lineStyle: { color: '#e8e8e8' }
            },
            axisLabel: {
                color: '#666'
            }
        },
        yAxis: {
            type: 'value',
            name: 'kcal',
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            splitLine: {
                lineStyle: { color: '#f0f0f0' }
            },
            axisLabel: {
                color: '#666'
            }
        },
        series: [{
            type: 'bar',
            data: balanceData.map(value => ({
                value: value,
                itemStyle: {
                    color: value > 0 ? chartColors.caloriesIn : chartColors.success
                }
            })),
            barWidth: '60%',
            label: {
                show: true,
                position: 'top',
                formatter: '{c}',
                fontSize: 10,
                color: '#666'
            }
        }]
    };

    calorieBalanceChart.setOption(option);
}

// 餐次分布图
function renderMealDistributionChart() {
    const container = document.getElementById('mealDistributionChart');

    if (!mealDistributionChart) {
        mealDistributionChart = echarts.init(container);
    }

    // 获取过去7天的餐次分布平均值
    const today = new Date();
    let distribution = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    let daysWithData = 0;

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayDist = Storage.getMealDistribution(dateStr);

        const dayTotal = dayDist.breakfast + dayDist.lunch + dayDist.dinner + dayDist.snack;
        if (dayTotal > 0) {
            distribution.breakfast += dayDist.breakfast;
            distribution.lunch += dayDist.lunch;
            distribution.dinner += dayDist.dinner;
            distribution.snack += dayDist.snack;
            daysWithData++;
        }
    }

    if (daysWithData > 0) {
        distribution.breakfast = Math.round(distribution.breakfast / daysWithData);
        distribution.lunch = Math.round(distribution.lunch / daysWithData);
        distribution.dinner = Math.round(distribution.dinner / daysWithData);
        distribution.snack = Math.round(distribution.snack / daysWithData);
    }

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: '{b}: {c} kcal'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['早餐', '午餐', '晚餐', '加餐'],
            axisLine: {
                lineStyle: { color: '#e8e8e8' }
            },
            axisLabel: {
                color: '#666'
            }
        },
        yAxis: {
            type: 'value',
            name: 'kcal',
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            splitLine: {
                lineStyle: { color: '#f0f0f0' }
            },
            axisLabel: {
                color: '#666'
            }
        },
        series: [{
            type: 'bar',
            data: [
                { value: distribution.breakfast, itemStyle: { color: '#ffc107' } },
                { value: distribution.lunch, itemStyle: { color: '#28a745' } },
                { value: distribution.dinner, itemStyle: { color: '#17a2b8' } },
                { value: distribution.snack, itemStyle: { color: '#dc3545' } }
            ],
            barWidth: '50%',
            label: {
                show: true,
                position: 'top',
                formatter: '{c}',
                fontSize: 11,
                color: '#666'
            }
        }]
    };

    mealDistributionChart.setOption(option);
}

// 运动消耗趋势图
function renderWorkoutTrendChart(stats) {
    const container = document.getElementById('workoutTrendChart');

    if (!workoutTrendChart) {
        workoutTrendChart = echarts.init(container);
    }

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>消耗: {c} kcal'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: stats.map(s => s.label),
            axisLine: {
                lineStyle: { color: '#e8e8e8' }
            },
            axisLabel: {
                color: '#666'
            }
        },
        yAxis: {
            type: 'value',
            name: 'kcal',
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            splitLine: {
                lineStyle: { color: '#f0f0f0' }
            },
            axisLabel: {
                color: '#666'
            }
        },
        series: [{
            type: 'bar',
            data: stats.map(s => Math.round(s.caloriesOut)),
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: chartColors.primary },
                    { offset: 1, color: 'rgba(46, 134, 171, 0.3)' }
                ]),
                borderRadius: [4, 4, 0, 0]
            },
            barWidth: '60%'
        }]
    };

    workoutTrendChart.setOption(option);
}

// ==================== 响应式处理 ====================
window.addEventListener('resize', function() {
    if (macroChart) macroChart.resize();
    if (caloriesTrendChart) caloriesTrendChart.resize();
    if (calorieBalanceChart) calorieBalanceChart.resize();
    if (mealDistributionChart) mealDistributionChart.resize();
    if (workoutTrendChart) workoutTrendChart.resize();
});
