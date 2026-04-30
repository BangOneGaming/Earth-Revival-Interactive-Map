/**
 * Region Label Manager
 * Displays region/area names on the map based on zoom level
 * Labels are text-only (no popup), with black text and white stroke
 * 
 * @author Where Wind Meet Map
 * @version 1.1.0 - Added show/hide methods
 */

const RegionLabelManager = (function() {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  
const LABEL_CONFIG = {
  // Zoom level 3–4: Major regions (PALING BESAR)
  zoom_3_4: [
    { name: 'Qinghe',  lat: 130.2765, lng: 187.7205, size: 60 },
    { name: 'Kaifeng', lat: 159.1016220096778, lng: 167.6629340648651, size: 60 },
    { name: 'Hexi',  lat: 51.29972139261508, lng: 51.52788323668682, size: 60 },
    { name: 'Bujian Mountain',  lat: 102.05143525952718, lng: 196.66018867492676, size: 60 }
  ],

// Zoom level 5: Sub-regions (SEDANG)
zoom_5: [
  { "name": "Verdant Wilds",     "cn_name": "百草野", "lat": 130.92766841618575, "lng": 198.2494502067566,  "size": 26, "map_type": "Qinghe" },
  { "name": "Moonveil Mountain", "cn_name": "隐月山", "lat": 131.34873125328068, "lng": 182.43181371688843, "size": 26, "map_type": "Qinghe" },
  { "name": "Sundara Land",      "cn_name": "善妙洲", "lat": 120.95253073067192, "lng": 187.95543956756592, "size": 26, "map_type": "Qinghe" },

  { "name": "Kaifeng City",      "cn_name": "开封城", "lat": 148.45886927147313, "lng": 167.75539636611938, "size": 26, "map_type": "Kaifeng" },
  { "name": "Granary of Plenty", "cn_name": "太仓粟", "lat": 165.93423477511217, "lng": 175.93012166023254, "size": 26, "map_type": "Kaifeng" },
  { "name": "Jadewood Court",    "cn_name": "琼林苑", "lat": 161.8376638217751,  "lng": 161.29809069633484, "size": 26, "map_type": "Kaifeng" },
  { "name": "Roaring Sands",     "cn_name": "博浪沙", "lat": 141.4049587992937,  "lng": 155.73852682113647, "size": 26, "map_type": "Kaifeng" },

  { "name": "Jade Gate Pass", "cn_name": "玉门关", "lat": 34.19193026737213,  "lng": 27.556250003245143, "size": 26, "map_type": "Hexi" },
  { "name": "Liangzhou",      "cn_name": "凉州",   "lat": 46.23956782958546,  "lng": 51.31959538855816,  "size": 26, "map_type": "Hexi" },
  { "name": "Qinchuan",       "cn_name": "秦川",   "lat": 76.38501880776012,  "lng": 77.3876244232804,   "size": 26, "map_type": "Hexi" },

  { "name": "Suixiang", "cn_name": "绥乡", "lat": 102.03556094524335, "lng": 196.38766062491666, "size": 26, "map_type": "Bujian Mountain" },
  { "name": "Tianxing", "cn_name": "天陉", "lat": 91.8496558876488,   "lng": 197.92790860819716, "size": 26, "map_type": "Bujian Mountain" },
  { "name": "Fukasawa", "cn_name": "深泽", "lat": 110.99789399003295,  "lng": 197.58816012975927, "size": 26, "map_type": "Bujian Mountain" },

  { "name": "Hutuo", "lat": 34.207554, "lng": 18.271504, "size": 24, "map_type": "Bujian Mountain", "preset_map": "hutuo" }
],

// Zoom level 6: Subareas
zoom_6: [
  {
    "name": "Hallo Peak",
    "cn_name": "佛光顶",
    "lat": 119.781249,
    "lng": 188.906244,
    "size": 24,
    "sub_regions": "Sundara Land"
  },
  {
    "name": "Bodhi Sea",
    "cn_name": "菩提苦海",
    "lat": 122.624999,
    "lng": 196.124994,
    "size": 24,
    "sub_regions": "Sundara Land"
  },
  {
    "name": "Mercyheart Town",
    "cn_name": "慈心镇",
    "lat": 119.937499,
    "lng": 182.031244,
    "size": 24,
    "sub_regions": "Sundara Land"
  },
  {
    "name": "Finesteed",
    "cn_name": "伏马庄",
    "lat": 120.468749,
    "lng": 200.812494,
    "size": 24,
    "sub_regions": "Sundara Land"
  },
  {
    "name": "Flower Expanse",
    "cn_name": "花海",
    "lat": 123.156249,
    "lng": 183.624994,
    "size": 24,
    "sub_regions": "Sundara Land"
  },
  {
    "name": "Mercyhearth Monastery",
    "cn_name": "慈心山院",
    "lat": 114.624999,
    "lng": 183.499994,
    "size": 24,
    "sub_regions": "Sundara Land"
  },
  {
    "name": "Buddha Fort",
    "cn_name": "佛爷寨",
    "lat": 121.156249,
    "lng": 205.218744,
    "size": 24,
    "sub_regions": "Sundara Land"
  },
  {
    "name": "Thousand Buddha Village",
    "cn_name": "千佛村",
    "lat": 115.843749,
    "lng": 190.749994,
    "size": 24,
    "sub_regions": "Sundara Land"
  },
  {
    "name": "Millennium Crossing",
    "cn_name": "千年渡",
    "lat": 111.03426752733685,
    "lng": 198.67107928042327,
    "size": 24,
    "sub_regions": "Fukasawa"
  },
  {
    "name": "Qu'an",
    "cn_name": "曲岸",
    "lat": 108.4923941728395,
    "lng": 202.74151235273368,
    "size": 24,
    "sub_regions": "Fukasawa"
  },
  {
    "name": "Juezhangling",
    "cn_name": "绝嶂岭",
    "lat": 106.39265735449735,
    "lng": 196.48740286419752,
    "size": 24,
    "sub_regions": "Suixiang"
  },
  {
    "name": "Mexico City",
    "cn_name": "墨城",
    "lat": 99.1058958871252,
    "lng": 195.71300946737213,
    "size": 24,
    "sub_regions": "Suixiang"
  },
  {
    "name": "Clear water and clouds",
    "cn_name": "碧水云涛",
    "lat": 102.21518821869488,
    "lng": 201.46898768253968,
    "size": 24,
    "sub_regions": "Suixiang"
  },
  {
    "name": "Former site of Mocheng",
    "cn_name": "墨城旧址",
    "lat": 102.27812224338624,
    "lng": 188.38030823280423,
    "size": 24,
    "sub_regions": "Suixiang"
  },
  {
    "name": "Fuyao Peak",
    "cn_name": "扶摇峰",
    "lat": 88.9706032297178,
    "lng": 198.88379422949725,
    "size": 24,
    "sub_regions": "Tianxing"
  },
  {
    "name": "Huigu",
    "cn_name": "晦谷",
    "lat": 95.1078937940917,
    "lng": 189.995647665895,
    "size": 24,
    "sub_regions": "Tianxing"
  },
  {
    "name": "Woxingyan",
    "cn_name": "卧星岩",
    "lat": 90.68985615079364,
    "lng": 191.10805224867724,
    "size": 24,
    "sub_regions": "Tianxing"
  },
  {
    "name": "Liujinpo",
    "cn_name": "流金坡",
    "lat": 90.85729441975309,
    "lng": 204.98317625396822,
    "size": 24,
    "sub_regions": "Tianxing"
  },
  {
    "name": "General's Shrine",
    "cn_name": "将军祠",
    "lat": 126.906249,
    "lng": 199.624994,
    "size": 24,
    "sub_regions": "Verdant Wilds"
  },
  {
    "name": "Battlecrest Slope",
    "cn_name": "七伐坡",
    "lat": 131.687499,
    "lng": 197.781244,
    "size": 24,
    "sub_regions": "Verdant Wilds"
  },
  {
    "name": "Bamboo Abode",
    "cn_name": "竹林旧居",
    "lat": 129.906249,
    "lng": 204.687494,
    "size": 24,
    "sub_regions": "Verdant Wilds"
  },
  {
    "name": "Stonewash Strand",
    "cn_name": "浣石浦",
    "lat": 130.687499,
    "lng": 194.812494,
    "size": 24,
    "sub_regions": "Verdant Wilds"
  },
  {
    "name": "Heaven Pier's",
    "cn_name": "神仙渡",
    "lat": 130.687499,
    "lng": 189.374994,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Kilnfire Ridge",
    "cn_name": "烧瓷岭",
    "lat": 129.562499,
    "lng": 184.187494,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Blissful Retreat",
    "cn_name": "不羡仙",
    "lat": 126.874999,
    "lng": 183.312494,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Still Shores",
    "cn_name": "弱水岸",
    "lat": 128.437499,
    "lng": 181.468744,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Witherwilds",
    "cn_name": "荒蚀林",
    "lat": 132.281249,
    "lng": 179.062494,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Riverside Station",
    "cn_name": "临江驿",
    "lat": 132.85784215340152,
    "lng": 172.30704444473466,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Riverside Terrace",
    "cn_name": "",
    "lat": 135.85589036838834,
    "lng": 176.70106377453223,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Pallace of Annals",
    "cn_name": "春秋别馆",
    "lat": 139.312499,
    "lng": 189.031244,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Harvest Village",
    "cn_name": "丰禾村",
    "lat": 128.031249,
    "lng": 176.156244,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Crimson Cliff",
    "cn_name": "丹崖",
    "lat": 134.749999,
    "lng": 192.812494,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Gleaming Abbys",
    "cn_name": "荧渊",
    "lat": 133.187499,
    "lng": 175.374994,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Twinbeast Ridge",
    "lat": 138.343749,
    "lng": 181.531244,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Peace Bell Tower",
    "cn_name": "太平钟楼",
    "lat": 132.406249,
    "lng": 186.687494,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Jadebrook Mountain",
    "cn_name": "璧泉山",
    "lat": 125.031249,
    "lng": 190.093744,
    "size": 24,
    "sub_regions": "Sundara Land"
  },
  {
    "name": "Floral Expanse Beyond",
    "lat": 118.406249,
    "lng": 197.187494,
    "size": 24,
    "sub_regions": "Sundara Land"
  },
  {
    "name": "Encircling Lake",
    "lat": 142.156249,
    "lng": 183.093744,
    "size": 24,
    "sub_regions": "Moonveil Mountain"
  },
  {
    "name": "Mistveil Forest",
    "lat": 152.999999,
    "lng": 180.312494,
    "size": 24,
    "sub_regions": "Granary of Plenty"
  },
  {
    "name": "Wildmare Ranch",
    "cn_name": "不伏马场",
    "lat": 124.687499,
    "lng": 201.781244,
    "size": 24,
    "sub_regions": "Sundara Land"
  },
  {
    "name": "South Gate Avenue",
    "cn_name": "南门大街",
    "lat": 154.156249,
    "lng": 168.656244,
    "size": 24,
    "sub_regions": "Kaifeng City"
  },
  {
    "name": "Kifeng Prefecture",
    "cn_name": "开封府",
    "lat": 150.156249,
    "lng": 168.406244,
    "size": 24,
    "sub_regions": "Kaifeng City"
  },
  {
    "name": "Fairgrounds",
    "cn_name": "勾栏瓦肆",
    "lat": 152.874999,
    "lng": 172.499994,
    "size": 24,
    "sub_regions": "Kaifeng City"
  },
  {
    "name": "Velvet Shade",
    "cn_name": "醉花阴",
    "lat": 143.249999,
    "lng": 172.124994,
    "size": 24,
    "sub_regions": "Kaifeng City"
  },
  {
    "name": "Prosperity Haven",
    "cn_name": "寿昌坊",
    "lat": 142.906249,
    "lng": 164.218744,
    "size": 24,
    "sub_regions": "Kaifeng City"
  },
  {
    "name": "Imperial Artisan Court",
    "cn_name": "百工坊",
    "lat": 154.593749,
    "lng": 163.968744,
    "size": 24,
    "sub_regions": "Kaifeng City"
  },
  {
    "name": "Forsaken Quarter",
    "cn_name": "角门里",
    "lat": 155.718749,
    "lng": 172.718744,
    "size": 24,
    "sub_regions": "Kaifeng City"
  },
  {
    "name": "Unbound Cavern",
    "cn_name": "无忧洞",
    "lat": 155.968749,
    "lng": 174.874994,
    "size": 24,
    "sub_regions": "Kaifeng City"
  },
  {
    "name": "Furnace Area",
    "cn_name": "熔炉区",
    "lat": 148.843749,
    "lng": 164.249994,
    "size": 24,
    "sub_regions": "Kaifeng City"
  },
  {
    "name": "Kaifeng Suburbs-East",
    "cn_name": "开封东郊",
    "lat": 149.406249,
    "lng": 176.312494,
    "size": 24,
    "sub_regions": "Granary of Plenty"
  },
  {
    "name": "Stillhearth Grove",
    "cn_name": "清心圃",
    "lat": 143.437499,
    "lng": 176.906244,
    "size": 24,
    "sub_regions": "Granary of Plenty"
  },
  {
    "name": "Abandoned Mercy Hall",
    "cn_name": "六疾馆遗址",
    "lat": 146.999999,
    "lng": 181.812494,
    "size": 24,
    "sub_regions": "Granary of Plenty"
  },
  {
    "name": "Jinming Pool",
    "cn_name": "金明池",
    "lat": 156.156249,
    "lng": 157.812494,
    "size": 24,
    "sub_regions": "Jadewood Court"
  },
  {
    "name": "Wansheng Town",
    "cn_name": "万胜镇",
    "lat": 148.843749,
    "lng": 159.906244,
    "size": 24,
    "sub_regions": "Roaring Sands"
  },
  {
    "name": "Kaifeng Suburbs-West",
    "cn_name": "开封西郊",
    "lat": 143.749999,
    "lng": 160.093744,
    "size": 24,
    "sub_regions": "Roaring Sands"
  },
  {
    "name": "Starveil Grassland",
    "cn_name": "星隐野",
    "lat": 148.749999,
    "lng": 154.343744,
    "size": 24,
    "sub_regions": "Roaring Sands"
  },
  {
    "name": "Enternal Mountain",
    "cn_name": "浮戏山",
    "lat": 144.468749,
    "lng": 153.156244,
    "size": 24,
    "sub_regions": "Roaring Sands"
  },
  {
    "name": "Fishwood River",
    "cn_name": "鱼柏川",
    "lat": 137.656249,
    "lng": 156.374994,
    "size": 24,
    "sub_regions": "Roaring Sands"
  },
  {
    "name": "Kaifeng Suburbs-North",
    "cn_name": "开封北郊",
    "lat": 138.062499,
    "lng": 164.781244,
    "size": 24,
    "sub_regions": "Roaring Sands"
  },
  {
    "name": "Heavenfall",
    "cn_name": "天上来",
    "lat": 134.249999,
    "lng": 164.656244,
    "size": 24,
    "sub_regions": "Roaring Sands"
  },
  {
    "name": "Baima Crossing",
    "cn_name": "白马津",
    "lat": 137.218749,
    "lng": 171.749994,
    "size": 24,
    "sub_regions": "Roaring Sands"
  },
  {
    "name": "Plainfield",
    "cn_name": "平野原",
    "lat": 161.999999,
    "lng": 174.562494,
    "size": 24,
    "sub_regions": "Granary of Plenty"
  },
  {
    "name": "Kaifeng Suburbs-South",
    "cn_name": "开封南郊",
    "lat": 158.437499,
    "lng": 168.906244,
    "size": 24,
    "sub_regions": "Granary of Plenty"
  },
  {
    "name": "Sorrowfield Village",
    "cn_name": "达安村",
    "lat": 157.124999,
    "lng": 177.687494,
    "size": 24,
    "sub_regions": "Granary of Plenty"
  },
  {
    "name": "Ever-Normal Granary",
    "cn_name": "常平仓",
    "lat": 164.562499,
    "lng": 177.968744,
    "size": 24,
    "sub_regions": "Granary of Plenty"
  },
  {
    "name": "Gracetown",
    "cn_name": "承恩镇",
    "lat": 172.906249,
    "lng": 174.281244,
    "size": 24,
    "sub_regions": "Granary of Plenty"
  },
  {
    "name": "Masterwood Hamlet",
    "cn_name": "梓匠居",
    "lat": 160.718749,
    "lng": 164.562494,
    "size": 24,
    "sub_regions": "Jadewood Court"
  },
  {
    "name": "Buddha Statue Site",
    "cn_name": "造像处",
    "lat": 164.874999,
    "lng": 164.749994,
    "size": 24,
    "sub_regions": "Jadewood Court"
  },
  {
    "name": "Grand Canal",
    "cn_name": "鸿沟古渠",
    "lat": 163.999999,
    "lng": 170.156244,
    "size": 24,
    "sub_regions": "Jadewood Court"
  },
  {
    "name": "Dreamfall Cliff",
    "cn_name": "望淮南崖",
    "lat": 167.718749,
    "lng": 168.437494,
    "size": 24,
    "sub_regions": "Jadewood Court"
  },
  {
    "name": "Martial Temple",
    "cn_name": "武成王庙",
    "lat": 167.906249,
    "lng": 164.531244,
    "size": 24,
    "sub_regions": "Jadewood Court"
  },
  {
    "name": "Pipa Chasm",
    "cn_name": "琵琶沟",
    "lat": 167.593749,
    "lng": 159.406244,
    "size": 24,
    "sub_regions": "Jadewood Court"
  },
  {
    "name": "Petalfall Crossing",
    "cn_name": "飞花渡",
    "lat": 162.999999,
    "lng": 156.999994,
    "size": 24,
    "sub_regions": "Jadewood Court"
  },
  {
    "name": "South Imperial Garden",
    "cn_name": "御苑南",
    "lat": 163.624999,
    "lng": 161.374994,
    "size": 24,
    "sub_regions": "Jadewood Court"
  },
  {
    "name": "North Imperial Garrden",
    "cn_name": "御苑北",
    "lat": 159.812499,
    "lng": 159.656244,
    "size": 24,
    "sub_regions": "Jadewood Court"
  },
  {
    "name": "Desperation Ridge",
    "cn_name": "鹰愁岭",
    "lat": 173.937499,
    "lng": 184.031244,
    "size": 24,
    "sub_regions": "Granary of Plenty"
  },
  {
    "name": "Cleardew Terrace",
    "cn_name": "玉露台",
    "lat": 57.76500667372133,
    "lng": 42.161156303350964,
    "size": 24,
    "sub_regions": "Liangzhou"
  },
  {
    "name": "Xiao Pass Old Road",
    "cn_name": "萧关古道",
    "lat": 65.61156752028218,
    "lng": 63.33366030335096,
    "size": 24,
    "sub_regions": "Qinchuan"
  },
  {
    "name": "Rustling Meadow",
    "cn_name": "扶风甸",
    "lat": 71.34976610934744,
    "lng": 69.2235688042328,
    "size": 24,
    "sub_regions": "Qinchuan"
  },
  {
    "name": "Lion Barrow",
    "cn_name": "狮子坟",
    "lat": 76.35493310758376,
    "lng": 76.24801214814813,
    "size": 24,
    "sub_regions": "Qinchuan"
  },
  {
    "name": "Marsh Plain",
    "cn_name": "荡莽原",
    "lat": 70.07440647619048,
    "lng": 75.52361289594354,
    "size": 24,
    "sub_regions": "Qinchuan"
  },
  {
    "name": "Huayin North",
    "cn_name": "华阴北",
    "lat": 84.36208423280422,
    "lng": 79.3443318659612,
    "size": 24,
    "sub_regions": "Qinchuan"
  },
  {
    "name": "The Huayu Road",
    "cn_name": "华舆道",
    "lat": 76.99836894532628,
    "lng": 81.24693052557318,
    "size": 24,
    "sub_regions": "Qinchuan"
  },
  {
    "name": "Rivergaze Plateau",
    "cn_name": "望泾川",
    "lat": 72.05891238095238,
    "lng": 85.66714519929452,
    "size": 24,
    "sub_regions": "Qinchuan"
  },
  {
    "name": "Sunken City Lake",
    "cn_name": "陷城湖",
    "lat": 84.73135721906898,
    "lng": 94.34381977280691,
    "size": 24,
    "sub_regions": "Qinchuan"
  },
  {
    "name": "Lost Crossing",
    "cn_name": "迷津渡",
    "lat": 28.411461751689593,
    "lng": 27.00979439153439,
    "size": 24,
    "sub_regions": "Jade Gate Pass"
  },
  {
    "name": "Golden Sand River",
    "cn_name": "金沙川",
    "lat": 36.78444664691357,
    "lng": 22.11654574109347,
    "size": 24,
    "sub_regions": "Jade Gate Pass"
  },
  {
    "name": "Straying Steed Sands",
    "cn_name": "马迷途",
    "lat": 35.83257033791887,
    "lng": 33.10039456790123,
    "size": 24,
    "sub_regions": "Jade Gate Pass"
  },
  {
    "name": "Ayisu",
    "cn_name": "阿依苏",
    "lat": 47.32836784479717,
    "lng": 24.016079935097,
    "size": 24,
    "sub_regions": "Jade Gate Pass"
  },
  {
    "name": "Steed's Pass",
    "cn_name": "饮马隘",
    "lat": 42.42554528818342,
    "lng": 44.50366278659612,
    "size": 24,
    "sub_regions": "Liangzhou"
  },
  {
    "name": "Jade-Mirrored Spring",
    "cn_name": "玉池",
    "lat": 42.32891412804306,
    "lng": 53.13760431723976,
    "size": 24,
    "sub_regions": "Liangzhou"
  },
  {
    "name": "Jiuquan",
    "cn_name": "酒泉镇",
    "lat": 47.52018229276896,
    "lng": 52.08769365784831,
    "size": 24,
    "sub_regions": "Liangzhou"
  },
  {
    "name": "Mount Wuwei",
    "cn_name": "武威山",
    "lat": 42.46588059118165,
    "lng": 60.874973544973535,
    "size": 24,
    "sub_regions": "Liangzhou"
  },
  {
    "name": "Governor's Residence",
    "cn_name": "节度使府",
    "lat": 46.70663856084656,
    "lng": 60.05222222222222,
    "size": 24,
    "sub_regions": "Liangzhou"
  },
  {
    "name": "Yunqiu",
    "cn_name": "耘丘",
    "lat": 46.04665,
    "lng": 24.945735,
    "sub_regions": "Hutuo",
    "map_type": "Hutuo",
    "size": 24
  },
  {
    "name": "Luancheng",
    "cn_name": "栾城",
    "lat": 36.452067,
    "lng": 29.179591,
    "map_type": "Hutuo",
    "sub_regions": "Hutuo",
    "size": 24
  },
  {
    "name": "Hutuo South Bank",
    "cn_name": "滹沱南岸",
    "lat": 30.261353,
    "lng": 21.956183,
    "sub_regions": "Hutuo",
    "map_type": "Hutuo",
    "size": 24
  },
  {
    "name": "Fenglong Mountain",
    "cn_name": "封龙山",
    "lat": 35.891044,
    "lng": 10.763835,
    "sub_regions": "Hutuo",
    "map_type": "Hutuo",
    "size": 24
  }
]

  // Zoom level 7–8: No labels
};

  // ==========================================
  // PRIVATE VARIABLES
  // ==========================================
  
  let map = null;
let currentZoom = 0;
let isVisible = true;

let labelLayers = {
  zoom_3_4: null,
  zoom_5: null,
  zoom_6: null
};

let activeLayer = null;




// ==========================================
// PRIVATE METHODS
// ==========================================
const SEPARATE_MAP_PRESETS = ['hutuo', 'royal_palace', 'dreamspace'];

function buildLayerForZoom(zoomKey, labels) {
  const layerGroup = L.layerGroup();
  const currentMap =
    typeof getCurrentMapPreset === 'function'
      ? (getCurrentMapPreset() || 'main').toLowerCase()
      : 'main';

  labels.forEach(labelConfig => {
    const rawType = (labelConfig.map_type || '').trim().toLowerCase();
    const labelMap = rawType === '' ? 'main' : rawType;

    // ✅ TAMBAH: cek preset_map eksplisit (override map_type untuk filtering)
    const presetMap = (labelConfig.preset_map || '').trim().toLowerCase();
    const effectiveMap = presetMap !== '' ? presetMap : labelMap;

    const isSeparateLabel = SEPARATE_MAP_PRESETS.includes(effectiveMap);
    const isOnSeparateMap = SEPARATE_MAP_PRESETS.includes(currentMap);

    let shouldShow;
    if (isSeparateLabel) {
      shouldShow = effectiveMap === currentMap;
    } else if (isOnSeparateMap) {
      shouldShow = effectiveMap === currentMap;
    } else {
      shouldShow = true;
    }

    if (!shouldShow) return;

    const icon = createLabelIcon(
      labelConfig.name,
      labelConfig.size || 18
    );

    const marker = L.marker(
      [labelConfig.lat, labelConfig.lng],
      {
        icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 1000
      }
    );

    layerGroup.addLayer(marker);
  });

  labelLayers[zoomKey] = layerGroup;
}
  /**
   * Create label icon with text
   * @param {string} text - Label text
   * @returns {L.DivIcon}
   */
function createLabelIcon(text, fontSize) {
  return L.divIcon({
    html: `
      <div class="region-label">
        <span class="region-label-text" style="font-size:${fontSize}px">
          ${text}
        </span>
      </div>
    `,
    className: 'region-label-container',
    iconSize: [200, 40],
    iconAnchor: [100, 20]
  });
}

  /**
   * Get labels for current zoom level
   * @param {number} zoom - Current zoom level
   * @returns {Array}
   */
  function getLabelsForZoom(zoom) {
    if (zoom >= 3 && zoom <= 4) {
      return LABEL_CONFIG.zoom_3_4;
    } else if (zoom === 5) {
      return LABEL_CONFIG.zoom_5;
    } else if (zoom === 6) {
      return LABEL_CONFIG.zoom_6;
    } else if (zoom >= 7) {
      // Zoom 7 dan 8: tidak ada label
      return [];
    }
    return [];
  }



/**
 * Add labels to map
 * @param {Array} labels - Array of label configs
 */
function addLabels(labels) {

  if (!isVisible) return;

  const currentMap =
    typeof getCurrentMapPreset === 'function'
      ? (getCurrentMapPreset() || 'main').toLowerCase()
      : 'main';

  labels.forEach(labelConfig => {

    const rawType =
      (labelConfig.map_type || '').trim().toLowerCase();

    const labelMap =
      rawType === '' ? 'main' : rawType;

    // Ganti bagian shouldShow lama dengan ini:
    const isSeparateLabel = SEPARATE_MAP_PRESETS.includes(labelMap);
    const isOnSeparateMap = SEPARATE_MAP_PRESETS.includes(currentMap);

    let shouldShow;
    if (isSeparateLabel) {
      shouldShow = labelMap === currentMap;
    } else if (isOnSeparateMap) {
      shouldShow = labelMap === currentMap;
    } else {
      shouldShow = true;
    }

    if (!shouldShow) return;

    const icon = createLabelIcon(
      labelConfig.name,
      labelConfig.size || 18
    );

    const marker = L.marker(
      [labelConfig.lat, labelConfig.lng],
      {
        icon: icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 1000
      }
    ).addTo(map);

    activeLabels.push(marker);
  });
}

  /**
   * Update labels based on zoom level
   * @param {number} zoom - Current zoom level
   */
  function updateLabels(zoom) {

  const zoomFloor = Math.floor(zoom);

  if (zoomFloor === Math.floor(currentZoom)) return;

  currentZoom = zoomFloor;

  if (!isVisible || !map) return;

  let zoomKey = null;

  if (zoomFloor >= 3 && zoomFloor <= 4) {
    zoomKey = 'zoom_3_4';
  } else if (zoomFloor === 5) {
    zoomKey = 'zoom_5';
  } else if (zoomFloor === 6) {
    zoomKey = 'zoom_6';
  }

  // Remove old layer
  if (activeLayer) {
    map.removeLayer(activeLayer);
    activeLayer = null;
  }

  if (!zoomKey) return;

  // Build layer once if not cached
  if (!labelLayers[zoomKey]) {
    buildLayerForZoom(zoomKey, LABEL_CONFIG[zoomKey]);
  }

  activeLayer = labelLayers[zoomKey];
  map.addLayer(activeLayer);
}

  /**
   * Setup map event listeners
   */
  function setupEventListeners() {
    if (!map) return;

    // Update on zoom end
    map.on('zoomend', function() {
      const zoom = map.getZoom();
      updateLabels(zoom);
    });

    
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  /**
   * Initialize region label manager
   * @param {L.Map} leafletMap - Leaflet map instance
   */
  function init(leafletMap) {
  if (!leafletMap) return;

  map = leafletMap;
  currentZoom = -1;
  isVisible = true;

  updateLabels(map.getZoom());
  setupEventListeners();
}

  /**
   * Show labels (NEW!)
   * Re-displays labels if hidden
   */
  function show() {
  if (isVisible) return;

  isVisible = true;

  if (!map) return;

  updateLabels(map.getZoom());
}

  /**
   * Hide labels (NEW!)
   * Removes labels without destroying manager
   */
  function hide() {
  if (!isVisible) return;

  isVisible = false;

  if (activeLayer && map) {
    map.removeLayer(activeLayer);
  }
}

  /**
   * Add or update label configuration
   * @param {number} zoomLevel - Zoom level (3-4, 5, or 6)
   * @param {Array} labels - Array of label configs
   */
  function addLabelConfig(zoomLevel, labels) {
    if (zoomLevel >= 3 && zoomLevel <= 4) {
      LABEL_CONFIG.zoom_3_4 = labels;
    } else if (zoomLevel === 5) {
      LABEL_CONFIG.zoom_5 = labels;
    } else if (zoomLevel === 6) {
      LABEL_CONFIG.zoom_6 = labels;
    }

    // Refresh if currently at this zoom level
    if (map && isVisible) {
      updateLabels(map.getZoom());
    }

    
  }

  /**
   * Manually refresh labels
   */
  function refresh() {
    if (!map) return;
    if (!isVisible) {
      console.log('⏭️ Skipped refresh (hidden)');
      return;
    }
    updateLabels(map.getZoom());
  }

  /**
   * Destroy manager and remove all labels
   */
  function destroy() {
    
    if (map) {
      map.off('zoomend');
    }
    map = null;
    currentZoom = 0;
    isVisible = true;
    console.log('❌ RegionLabelManager destroyed');
  }

  /**
   * Check if labels are visible (NEW!)
   * @returns {boolean}
   */
  function isLabelsVisible() {
    return isVisible;
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

return {
    init,
    show,
    hide,
    addLabelConfig,
    refresh,
    destroy,
    isVisible: isLabelsVisible,
    _getLabelConfig: function(zoomKey) {
      return LABEL_CONFIG[zoomKey] || [];
    },
    _forceRefresh: function() {
      if (!map) return;
      currentZoom = -1;
      updateLabels(map.getZoom());
    },
    // ✅ TAMBAHKAN INI
    _clearLayerCache: function() {
      labelLayers = { zoom_3_4: null, zoom_5: null, zoom_6: null };
    }
  };

})();

// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.RegionLabelManager = RegionLabelManager;

console.log('✅ RegionLabelManager module loaded (v1.1.0 with show/hide)');