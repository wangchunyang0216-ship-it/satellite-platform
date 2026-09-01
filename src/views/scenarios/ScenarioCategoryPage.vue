<template>
  <div class="scenario-category-page">
    <section class="scenario-hero">
      <div class="scenario-icon-wrap">
        <svg-icon :icon-class="scenario.icon" class-name="scenario-icon" />
      </div>
      <div>
        <span class="eyebrow">APPLICATION SCENARIO</span>
        <h1>{{ category.label }}</h1>
        <p>{{ scenario.label }}方向的遥感数据服务入口，聚合适用卫星、传感器能力和任务办理建议。</p>
      </div>
    </section>

    <section class="content-grid">
      <article class="info-card">
        <h2>场景能力</h2>
        <p>{{ category.desc }}</p>
        <div class="tag-row">
          <span v-for="tag in category.tags" :key="tag">{{ tag }}</span>
        </div>
      </article>

      <article class="info-card">
        <h2>适用卫星</h2>
        <div class="satellite-list">
          <button
            v-for="sat in relatedSatellites"
            :key="sat.id"
            type="button"
            @click="openSatellite(sat.id)"
          >
            <strong>{{ sat.name }}</strong>
            <span>{{ sat.sensorType }} / {{ sat.resolution }}</span>
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { satellites } from '@/data/satelliteCatalog'

const route = useRoute()
const router = useRouter()

const scenarioMap = {
  emergency: {
    label: '应急救灾',
    icon: 'mubiaojiance',
    satellites: ['gf6', 'gf7', 'sentinel2'],
    categories: {
      flood: { label: '洪涝监测', desc: '快速识别受淹范围、水体扩张和重点设施风险，支撑灾情研判与处置调度。', tags: ['SAR 雷达', '低云量', '7天回溯'] },
      earthquake: { label: '地震评估', desc: '面向震后建筑损毁、道路中断和滑坡隐患进行多源影像比对。', tags: ['高分辨率', '变化检测', '灾后评估'] },
      fire: { label: '火灾监测', desc: '跟踪火点、过火面积和林地恢复情况，辅助火情复盘和生态修复。', tags: ['热异常', '多光谱', '林地恢复'] },
    },
  },
  agriculture: {
    label: '智慧农业',
    icon: 'zhihuinongye',
    satellites: ['sentinel2', 'landsat9', 'gf6'],
    categories: {
      crop: { label: '作物监测', desc: '通过植被指数和时序影像跟踪长势、苗情和田块差异。', tags: ['NDVI', 'EVI', '时序分析'] },
      yield: { label: '产量预估', desc: '结合长势指数、历史影像和区域样本，对产量趋势做辅助估算。', tags: ['多光谱', '样本建模', '趋势预测'] },
      pest: { label: '病虫害预警', desc: '识别异常斑块和植被胁迫区域，提前定位巡检重点。', tags: ['高光谱', '异常识别', '预警联动'] },
      soil: { label: '土壤墒情', desc: '利用多时相遥感指标辅助判断土壤湿度和灌溉需求。', tags: ['水分指数', '农田分区', '墒情评估'] },
    },
  },
  meteorology: {
    label: '气象监测',
    icon: 'yunjiance',
    satellites: ['fy4a', 'fy3e'],
    categories: {
      typhoon: { label: '台风监测', desc: '持续跟踪台风云系、路径影响范围和强降雨区域。', tags: ['风云卫星', '云图监测', '连续观测'] },
      rainstorm: { label: '暴雨洪涝', desc: '叠加降水和水体变化，研判暴雨后城市内涝与流域风险。', tags: ['降水云系', '水体变化', '风险研判'] },
      sandstorm: { label: '沙尘暴监测', desc: '监测沙尘扩散范围、强度变化和下游影响区域。', tags: ['气溶胶', '大范围覆盖', '扩散追踪'] },
      haze: { label: '雾霾监测', desc: '结合光学与大气产品观察污染输送和能见度影响。', tags: ['大气校正', '污染输送', '区域联防'] },
    },
  },
  urban: {
    label: '城市规划',
    icon: 'chengshiguihua',
    satellites: ['gf6', 'gf7'],
    categories: {
      landuse: { label: '土地利用', desc: '识别建设用地、绿地、水体等地类变化，为规划评估提供底图。', tags: ['地物识别', '用地变化', '规划底图'] },
      illegal: { label: '违建监测', desc: '通过高分影像比对新增建筑和异常占地，辅助执法巡查。', tags: ['高分辨率', '变化检测', '疑点核查'] },
      traffic: { label: '交通规划', desc: '提取道路网络、枢纽周边建设变化和通行环境信息。', tags: ['道路提取', '三维测绘', '设施评估'] },
      heatisland: { label: '热岛效应', desc: '结合热红外和地表覆盖数据评估城市热环境。', tags: ['热红外', '地表温度', '绿地评估'] },
    },
  },
  ocean: {
    label: '海洋监测',
    icon: 'shuiziyuanguanli',
    satellites: ['sentinel2', 'landsat9'],
    categories: {
      redtide: { label: '赤潮监测', desc: '识别海水颜色和光谱异常，辅助赤潮范围与趋势判断。', tags: ['水色遥感', '光谱异常', '近海监测'] },
      oilspill: { label: '溢油监测', desc: '利用 SAR 与光学影像发现海面油膜疑似区域。', tags: ['SAR 雷达', '油膜识别', '应急处置'] },
      seaice: { label: '海冰监测', desc: '监测海冰范围、边界变化和航道风险。', tags: ['冰情识别', '范围提取', '航道保障'] },
      vessel: { label: '船舶识别', desc: '检测近海船舶目标、泊位活动和港区作业态势。', tags: ['目标检测', '港口监测', '船舶统计'] },
    },
  },
  ecology: {
    label: '生态环保',
    icon: 'senlin',
    satellites: ['sentinel2', 'landsat9', 'gf6'],
    categories: {
      forest: { label: '森林覆盖', desc: '跟踪森林覆盖变化、采伐迹地和恢复进度。', tags: ['森林指数', '覆盖变化', '生态修复'] },
      wetland: { label: '湿地监测', desc: '识别湿地范围、水文变化和生态敏感区变化。', tags: ['湿地边界', '水文变化', '生态评估'] },
      desert: { label: '荒漠化', desc: '评估裸地扩张、植被退化和治理成效。', tags: ['荒漠指数', '退化监测', '治理评估'] },
      carbon: { label: '碳汇估算', desc: '结合植被覆盖和长势指标，为区域碳汇核算提供参考。', tags: ['植被覆盖', '碳储量', '长期监测'] },
    },
  },
} as const

const scenario = computed(() => {
  const key = String(route.params.sceneKey || 'agriculture')
  return scenarioMap[key as keyof typeof scenarioMap] || scenarioMap.agriculture
})

const category = computed(() => {
  const key = String(route.params.categoryKey || '')
  return scenario.value.categories[key as keyof typeof scenario.value.categories] || Object.values(scenario.value.categories)[0]
})

const relatedSatellites = computed(() => satellites.filter(item => scenario.value.satellites.includes(item.id)))

function openSatellite(id: string) {
  router.push({ path: `/console/data/satellite/${id}`, query: { scene: category.value.label } })
}
</script>

<style scoped>
.scenario-category-page {
  min-height: 100%;
  padding: 24px 28px 60px;
  background: #f5f7fa;
  color: #172033;
}

.scenario-hero {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 30px 34px;
  border-radius: 18px;
  background: linear-gradient(155deg, #0b1a30 0%, #132742 38%, #0d2b45 100%);
  color: #fff;
  box-shadow: 0 16px 34px rgba(17, 36, 63, .18);
}

.scenario-icon-wrap {
  width: 70px;
  height: 70px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: rgba(255, 255, 255, .12);
  border: 1px solid rgba(255, 255, 255, .18);
  flex-shrink: 0;
}

.scenario-icon {
  width: 38px;
  height: 38px;
  color: #7db7ff;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 2px;
  color: #62a7ff;
  font-weight: 700;
}

h1 {
  margin: 8px 0 8px;
  font-size: 34px;
  line-height: 1.2;
}

p {
  margin: 0;
  line-height: 1.8;
  color: #d8e6f7;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 20px;
}

.info-card {
  min-height: 220px;
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e4eaf3;
  box-shadow: 0 10px 24px rgba(22, 43, 72, .06);
}

.info-card h2 {
  margin: 0 0 12px;
  font-size: 20px;
}

.info-card p {
  color: #5f6b7f;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.tag-row span {
  padding: 6px 10px;
  border-radius: 8px;
  background: #edf4ff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
}

.satellite-list {
  display: grid;
  gap: 10px;
}

.satellite-list button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 13px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #172033;
  cursor: pointer;
}

.satellite-list button:hover {
  border-color: #93b7f0;
  background: #eef5ff;
}

.satellite-list span {
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
