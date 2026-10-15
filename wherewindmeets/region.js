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
  
const LABEL_CONFIG = 

{
"zoom_3_4": [
  { "name": "Qinghe",          "lat": 123.4106, "lng": 177.8489, "size": 60 },
  { "name": "Kaifeng",         "lat": 150.7171, "lng": 158.8492, "size": 60 },
  { "name": "Hexi",            "lat": 48.5944,  "lng": 48.8382,  "size": 60 },
  { "name": "Bujian Mountain", "lat": 96.6724,  "lng": 186.3174, "size": 60 },
  { "name": "Jiangnan",        "lat": 103,      "lng": 222,      "size": 60 },
  { "name": "Qinzhou",         "lat": 230,      "lng": 212,      "size": 60 }
],
  "zoom_5": [
  {
    "name": "Verdant Wilds",
    "lat": 124.142283,
    "lng": 187.327112,
    "size": 26,
    "map_type": "Qinghe"
  },
  {
    "name": "Moonveil Mountain",
    "lat": 124.44685,
    "lng": 173.010194,
    "size": 26,
    "map_type": "Qinghe"
  },
  {
    "name": "Sundara Land",
    "lat": 114.311475,
    "lng": 178.041623,
    "size": 26,
    "map_type": "Qinghe"
  },
  {
    "name": "Kaifeng City",
    "lat": 140.352006,
    "lng": 158.891572,
    "size": 26,
    "map_type": "Kaifeng"
  },
  {
    "name": "Granary of Plenty",
    "lat": 156.971588,
    "lng": 166.817104,
    "size": 26,
    "map_type": "Kaifeng"
  },
  {
    "name": "Jadewood Court",
    "lat": 153.268156,
    "lng": 153.113641,
    "size": 26,
    "map_type": "Kaifeng"
  },
  {
    "name": "Roaring Sands",
    "lat": 133.753182,
    "lng": 147.23344,
    "size": 26,
    "map_type": "Kaifeng"
  },
    {
      "name": "Imperial Palace",
      "cn_name": "皇宫",
      "lat": 32,
      "lng": 29,
      "size": 24,
      "map_type": "Kaifeng",
      "preset_map": "royal_palace"
    },
  {
    "name": "Jade Gate Pass",
    "lat": 32.392355,
    "lng": 26.105921,
    "size": 26,
    "map_type": "Hexi"
  },
  {
    "name": "Liangzhou",
    "lat": 43.805906,
    "lng": 48.618564,
    "size": 26,
    "map_type": "Hexi"
  },
  {
    "name": "Qinchuan",
    "lat": 72.364755,
    "lng": 73.314592,
    "size": 26,
    "map_type": "Hexi"
  },
  {
    "name": "Fukasawa",
    "lat": 104.327407,
    "lng": 184.900665,
    "size": 26,
    "map_type": "Bujian Mountain"
  },
  {
    "name": "Suixiang",
    "lat": 96.216492,
    "lng": 184.706669,
    "size": 26,
    "map_type": "Bujian Mountain"
  },
  {
    "name": "Tianxing",
    "lat": 86.50624,
    "lng": 185.497412,
    "size": 26,
    "map_type": "Bujian Mountain"
  },
    {
      "name": "Hutuo",
      "lat": 34.207554,
      "lng": 18.271504,
      "size": 24,
      "map_type": "Bujian Mountain",
      "preset_map": "hutuo"
    },
 {
    "name": "Pengshan",
    "lat": 102.723763,
    "lng": 234.693798,
    "size": 24,
    "map_type": "Jiangnan"
  },
  {
    "name": "Dongyue",
    "lat": 105.145239,
    "lng": 209.758883,
    "size": 24,
    "map_type": "Jiangnan"
  },
  {
    "name": "Hangzhou",
    "lat": 229.878999,
    "lng": 215.565317,
    "size": 24,
    "map_type": "Qinzhou"
  }
],
  "zoom_6": [
    {
      "name": "Hallo Peak",
      "cn_name": "佛光顶",
      "lat": 113.358579,
      "lng": 178.330294,
      "size": 24,
      "sub_regions": "Sundara Land"
    },
    {
      "name": "Bodhi Sea",
      "cn_name": "菩提苦海",
      "lat": 116.065815,
      "lng": 184.922985,
      "size": 24,
      "sub_regions": "Sundara Land"
    },
    {
      "name": "Mercyheart Town",
      "cn_name": "慈心镇",
      "lat": 113.503521,
      "lng": 171.816845,
      "size": 24,
      "sub_regions": "Sundara Land"
    },
    {
      "name": "Finesteed",
      "cn_name": "伏马庄",
      "lat": 114.001687,
      "lng": 189.610089,
      "size": 24,
      "sub_regions": "Sundara Land"
    },
    {
      "name": "Flower Expanse",
      "cn_name": "花海",
      "lat": 116.551519,
      "lng": 173.600579,
      "size": 24,
      "sub_regions": "Sundara Land"
    },
    {
      "name": "Mercyhearth Monastery",
      "cn_name": "慈心山院",
      "lat": 108.45938,
      "lng": 172.953543,
      "size": 24,
      "sub_regions": "Sundara Land"
    },
    {
      "name": "Buddha Fort",
      "cn_name": "佛爷寨",
      "lat": 114.664561,
      "lng": 193.806499,
      "size": 24,
      "sub_regions": "Sundara Land"
    },
    {
      "name": "Thousand Buddha Village",
      "cn_name": "千佛村",
      "lat": 109.62936,
      "lng": 180.082516,
      "size": 24,
      "sub_regions": "Sundara Land"
    },
    {
      "name": "Millennium Crossing",
      "cn_name": "千年渡",
      "lat": 105.190359,
      "lng": 188.214707,
      "size": 24,
      "sub_regions": "Fukasawa"
    },
    {
      "name": "Qu'an",
      "cn_name": "曲岸",
      "lat": 102.782268,
      "lng": 192.070906,
      "size": 24,
      "sub_regions": "Fukasawa"
    },
    {
      "name": "Juezhangling",
      "cn_name": "绝嶂岭",
      "lat": 100.793044,
      "lng": 186.145961,
      "size": 24,
      "sub_regions": "Suixiang"
    },
    {
      "name": "Mexico City",
      "cn_name": "墨城",
      "lat": 93.889796,
      "lng": 185.412325,
      "size": 24,
      "sub_regions": "Suixiang"
    },
    {
      "name": "Clear water and clouds",
      "cn_name": "碧水云涛",
      "lat": 96.835441,
      "lng": 190.865357,
      "size": 24,
      "sub_regions": "Suixiang"
    },
    {
      "name": "Former site of Mocheng",
      "cn_name": "墨城旧址",
      "lat": 96.895063,
      "lng": 178.465555,
      "size": 24,
      "sub_regions": "Suixiang"
    },
    {
      "name": "Fuyao Peak",
      "cn_name": "扶摇峰",
      "lat": 84.28794,
      "lng": 188.416226,
      "size": 24,
      "sub_regions": "Tianxing"
    },
    {
      "name": "Huigu",
      "cn_name": "晦谷",
      "lat": 90.102215,
      "lng": 179.995877,
      "size": 24,
      "sub_regions": "Tianxing"
    },
    {
      "name": "Woxingyan",
      "cn_name": "卧星岩",
      "lat": 85.916706,
      "lng": 181.049734,
      "size": 24,
      "sub_regions": "Tianxing"
    },
    {
      "name": "Liujinpo",
      "cn_name": "流金坡",
      "lat": 86.075332,
      "lng": 194.194588,
      "size": 24,
      "sub_regions": "Tianxing"
    },
    {
      "name": "General's Shrine",
      "cn_name": "将军祠",
      "lat": 120.112306,
      "lng": 188.485381,
      "size": 24,
      "sub_regions": "Verdant Wilds"
    },
    {
      "name": "Battlecrest Slope",
      "cn_name": "七伐坡",
      "lat": 124.627692,
      "lng": 186.756577,
      "size": 24,
      "sub_regions": "Verdant Wilds"
    },
    {
      "name": "Bamboo Abode",
      "cn_name": "竹林旧居",
      "lat": 122.93627,
      "lng": 193.017981,
      "size": 24,
      "sub_regions": "Verdant Wilds"
    },
    {
      "name": "Stonewash Strand",
      "cn_name": "浣石浦",
      "lat": 123.692601,
      "lng": 183.951944,
      "size": 24,
      "sub_regions": "Verdant Wilds"
    },
    {
      "name": "Heaven Pier's",
      "cn_name": "神仙渡",
      "lat": 123.684237,
      "lng": 178.793768,
      "size": 24,
      "sub_regions": "Moonveil Mountain"
    },
    {
      "name": "Kilnfire Ridge",
      "cn_name": "烧瓷岭",
      "lat": 122.62253,
      "lng": 173.874925,
      "size": 24,
      "sub_regions": "Moonveil Mountain"
    },
    {
      "name": "Blissful Retreat",
      "cn_name": "不羡仙",
      "lat": 120.075478,
      "lng": 173.056012,
      "size": 24,
      "sub_regions": "Moonveil Mountain"
    },
    {
      "name": "Still Shores",
      "cn_name": "弱水岸",
      "lat": 121.573677,
      "lng": 171.28699,
      "size": 24,
      "sub_regions": "Moonveil Mountain"
    },
    {
      "name": "Witherwilds",
      "cn_name": "荒蚀林",
      "lat": 125.186642,
      "lng": 169.027339,
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
      "lat": 131.857437,
      "lng": 178.200861,
      "size": 24,
      "sub_regions": "Moonveil Mountain"
    },
    {
      "name": "Harvest Village",
      "cn_name": "丰禾村",
      "lat": 121.18612,
      "lng": 166.270639,
      "size": 24,
      "sub_regions": "Moonveil Mountain"
    },
    {
      "name": "Crimson Cliff",
      "cn_name": "丹崖",
      "lat": 127.533195,
      "lng": 182.295313,
      "size": 24,
      "sub_regions": "Moonveil Mountain"
    },
    {
      "name": "Gleaming Abbys",
      "cn_name": "荧渊",
      "lat": 126.065878,
      "lng": 165.797958,
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
      "lat": 125.317809,
      "lng": 175.964829,
      "size": 24,
      "sub_regions": "Moonveil Mountain"
    },
    {
      "name": "Jadebrook Mountain",
      "cn_name": "璧泉山",
      "lat": 118.325479,
      "lng": 179.458556,
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
      "lat": 118.019159,
      "lng": 190.262061,
      "size": 24,
      "sub_regions": "Sundara Land"
    },
    {
      "name": "South Gate Avenue",
      "cn_name": "南门大街",
      "lat": 145.936683,
      "lng": 158.895614,
      "size": 24,
      "sub_regions": "Kaifeng City"
    },
    {
      "name": "Kifeng Prefecture",
      "cn_name": "开封府",
      "lat": 142.130001,
      "lng": 158.912702,
      "size": 24,
      "sub_regions": "Kaifeng City"
    },
    {
      "name": "Fairgrounds",
      "cn_name": "勾栏瓦肆",
      "lat": 144.703191,
      "lng": 162.546332,
      "size": 24,
      "sub_regions": "Kaifeng City"
    },
    {
      "name": "Velvet Shade",
      "cn_name": "醉花阴",
      "lat": 135.58786,
      "lng": 162.454179,
      "size": 24,
      "sub_regions": "Kaifeng City"
    },
    {
      "name": "Prosperity Haven",
      "cn_name": "寿昌坊",
      "lat": 135.266739,
      "lng": 154.94893,
      "size": 24,
      "sub_regions": "Kaifeng City"
    },
    {
      "name": "Imperial Artisan Court",
      "cn_name": "百工坊",
      "lat": 146.336295,
      "lng": 154.708092,
      "size": 24,
      "sub_regions": "Kaifeng City"
    },
    {
      "name": "Forsaken Quarter",
      "cn_name": "角门里",
      "lat": 147.413196,
      "lng": 163.006064,
      "size": 24,
      "sub_regions": "Kaifeng City"
    },
    {
      "name": "Unbound Cavern",
      "cn_name": "无忧洞",
      "lat": 147.630225,
      "lng": 165.048154,
      "size": 24,
      "sub_regions": "Kaifeng City"
    },
    {
      "name": "Furnace Area",
      "cn_name": "熔炉区",
      "lat": 140.880481,
      "lng": 154.978841,
      "size": 24,
      "sub_regions": "Kaifeng City"
    },
    {
      "name": "Kaifeng Suburbs-East",
      "cn_name": "开封东郊",
      "lat": 141.431593,
      "lng": 166.140081,
      "size": 24,
      "sub_regions": "Granary of Plenty"
    },
    {
      "name": "Stillhearth Grove",
      "cn_name": "清心圃",
      "lat": 135.767704,
      "lng": 166.976227,
      "size": 24,
      "sub_regions": "Granary of Plenty"
    },
    {
      "name": "Abandoned Mercy Hall",
      "cn_name": "六疾馆遗址",
      "lat": 139.143009,
      "lng": 171.097977,
      "size": 24,
      "sub_regions": "Granary of Plenty"
    },
    {
      "name": "Jinming Pool",
      "cn_name": "金明池",
      "lat": 147.825023,
      "lng": 148.887464,
      "size": 24,
      "sub_regions": "Jadewood Court"
    },
    {
      "name": "Wansheng Town",
      "cn_name": "万胜镇",
      "lat": 140.877064,
      "lng": 150.882357,
      "size": 24,
      "sub_regions": "Roaring Sands"
    },
    {
      "name": "Kaifeng Suburbs-West",
      "cn_name": "开封西郊",
      "lat": 136.058847,
      "lng": 150.79215,
      "size": 24,
      "sub_regions": "Roaring Sands"
    },
    {
      "name": "Starveil Grassland",
      "cn_name": "星隐野",
      "lat": 140.801695,
      "lng": 145.592947,
      "size": 24,
      "sub_regions": "Roaring Sands"
    },
    {
      "name": "Enternal Mountain",
      "cn_name": "浮戏山",
      "lat": 136.7405,
      "lng": 144.472863,
      "size": 24,
      "sub_regions": "Roaring Sands"
    },
    {
      "name": "Fishwood River",
      "cn_name": "鱼柏川",
      "lat": 130.306499,
      "lng": 147.527272,
      "size": 24,
      "sub_regions": "Roaring Sands"
    },
    {
      "name": "Kaifeng Suburbs-North",
      "cn_name": "开封北郊",
      "lat": 130.662956,
      "lng": 155.216666,
      "size": 24,
      "sub_regions": "Roaring Sands"
    },
    {
      "name": "Heavenfall",
      "cn_name": "天上来",
      "lat": 127.077479,
      "lng": 155.366959,
      "size": 24,
      "sub_regions": "Roaring Sands"
    },
    {
      "name": "Baima Crossing",
      "cn_name": "白马津",
      "lat": 129.870559,
      "lng": 162.087186,
      "size": 24,
      "sub_regions": "Roaring Sands"
    },
    {
      "name": "Plainfield",
      "cn_name": "平野原",
      "lat": 153.345839,
      "lng": 164.76208,
      "size": 24,
      "sub_regions": "Granary of Plenty"
    },
    {
      "name": "Kaifeng Suburbs-South",
      "cn_name": "开封南郊",
      "lat": 149.989477,
      "lng": 159.141296,
      "size": 24,
      "sub_regions": "Granary of Plenty"
    },
    {
      "name": "Sorrowfield Village",
      "cn_name": "达安村",
      "lat": 148.726519,
      "lng": 167.70641,
      "size": 24,
      "sub_regions": "Granary of Plenty"
    },
    {
      "name": "Ever-Normal Granary",
      "cn_name": "常平仓",
      "lat": 155.768985,
      "lng": 167.972565,
      "size": 24,
      "sub_regions": "Granary of Plenty"
    },
    {
      "name": "Gracetown",
      "cn_name": "承恩镇",
      "lat": 163.701517,
      "lng": 164.483491,
      "size": 24,
      "sub_regions": "Granary of Plenty"
    },
    {
      "name": "Masterwood Hamlet",
      "cn_name": "梓匠居",
      "lat": 152.146958,
      "lng": 155.287088,
      "size": 24,
      "sub_regions": "Jadewood Court"
    },
    {
      "name": "Buddha Statue Site",
      "cn_name": "造像处",
      "lat": 156.076255,
      "lng": 155.466356,
      "size": 24,
      "sub_regions": "Jadewood Court"
    },
    {
      "name": "Grand Canal",
      "cn_name": "鸿沟古渠",
      "lat": 155.239673,
      "lng": 160.323833,
      "size": 24,
      "sub_regions": "Jadewood Court"
    },
    {
      "name": "Dreamfall Cliff",
      "cn_name": "望淮南崖",
      "lat": 158.759076,
      "lng": 158.669478,
      "size": 24,
      "sub_regions": "Jadewood Court"
    },
    {
      "name": "Martial Temple",
      "cn_name": "武成王庙",
      "lat": 158.937569,
      "lng": 154.970328,
      "size": 24,
      "sub_regions": "Jadewood Court"
    },
    {
      "name": "Pipa Chasm",
      "cn_name": "琵琶沟",
      "lat": 158.642012,
      "lng": 150.380529,
      "size": 24,
      "sub_regions": "Jadewood Court"
    },
    {
      "name": "Petalfall Crossing",
      "cn_name": "飞花渡",
      "lat": 154.309892,
      "lng": 148.124711,
      "size": 24,
      "sub_regions": "Jadewood Court"
    },
    {
      "name": "South Imperial Garden",
      "cn_name": "御苑南",
      "lat": 154.905686,
      "lng": 152.270949,
      "size": 24,
      "sub_regions": "Jadewood Court"
    },
    {
      "name": "North Imperial Garrden",
      "cn_name": "御苑北",
      "lat": 151.268841,
      "lng": 150.623591,
      "size": 24,
      "sub_regions": "Jadewood Court"
    },
    {
      "name": "Desperation Ridge",
      "cn_name": "鹰愁岭",
      "lat": 164.656593,
      "lng": 173.714287,
      "size": 24,
      "sub_regions": "Granary of Plenty"
    },
    {
      "name": "Cleardew Terrace",
      "cn_name": "玉露台",
      "lat": 54.724743,
      "lng": 39.942148,
      "size": 24,
      "sub_regions": "Liangzhou"
    },
    {
      "name": "Xiao Pass Old Road",
      "cn_name": "萧关古道",
      "lat": 62.158327,
      "lng": 60.00031,
      "size": 24,
      "sub_regions": "Qinchuan"
    },
    {
      "name": "Rustling Meadow",
      "cn_name": "扶风甸",
      "lat": 67.594515,
      "lng": 65.580223,
      "size": 24,
      "sub_regions": "Qinchuan"
    },
    {
      "name": "Lion Barrow",
      "cn_name": "狮子坟",
      "lat": 72.336252,
      "lng": 72.234959,
      "size": 24,
      "sub_regions": "Qinchuan"
    },
    {
      "name": "Marsh Plain",
      "cn_name": "荡莽原",
      "lat": 66.38628,
      "lng": 71.548686,
      "size": 24,
      "sub_regions": "Qinchuan"
    },
    {
      "name": "Huayin North",
      "cn_name": "华阴北",
      "lat": 79.921975,
      "lng": 75.168314,
      "size": 24,
      "sub_regions": "Qinchuan"
    },
    {
      "name": "The Huayu Road",
      "cn_name": "华舆道",
      "lat": 72.945823,
      "lng": 76.970776,
      "size": 24,
      "sub_regions": "Qinchuan"
    },
    {
      "name": "Rivergaze Plateau",
      "cn_name": "望泾川",
      "lat": 68.266338,
      "lng": 81.158348,
      "size": 24,
      "sub_regions": "Qinchuan"
    },
    {
      "name": "Sunken City Lake",
      "cn_name": "陷城湖",
      "lat": 79.726473,
      "lng": 88.206444,
      "size": 24,
      "sub_regions": "Qinchuan"
    },
    {
      "name": "Lost Crossing",
      "cn_name": "迷津渡",
      "lat": 26.916122,
      "lng": 25.588226,
      "size": 24,
      "sub_regions": "Jade Gate Pass"
    },
    {
      "name": "Golden Sand River",
      "cn_name": "金沙川",
      "lat": 34.848423,
      "lng": 20.952517,
      "size": 24,
      "sub_regions": "Jade Gate Pass"
    },
    {
      "name": "Straying Steed Sands",
      "cn_name": "马迷途",
      "lat": 33.946646,
      "lng": 31.358269,
      "size": 24,
      "sub_regions": "Jade Gate Pass"
    },
    {
      "name": "Ayisu",
      "cn_name": "阿依苏",
      "lat": 44.837401,
      "lng": 22.752076,
      "size": 24,
      "sub_regions": "Jade Gate Pass"
    },
    {
      "name": "Steed's Pass",
      "cn_name": "饮马隘",
      "lat": 40.192622,
      "lng": 42.161365,
      "size": 24,
      "sub_regions": "Liangzhou"
    },
    {
      "name": "Jade-Mirrored Spring",
      "cn_name": "玉池",
      "lat": 39.883866,
      "lng": 50.234208,
      "size": 24,
      "sub_regions": "Liangzhou"
    },
    {
      "name": "Jiuquan",
      "cn_name": "酒泉镇",
      "lat": 45.01912,
      "lng": 49.346236,
      "size": 24,
      "sub_regions": "Liangzhou"
    },
    {
      "name": "Mount Wuwei",
      "cn_name": "武威山",
      "lat": 40.230834,
      "lng": 57.671028,
      "size": 24,
      "sub_regions": "Liangzhou"
    },
    {
      "name": "Governor's Residence",
      "cn_name": "节度使府",
      "lat": 44.248394,
      "lng": 56.891579,
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
    },
    {
      "name": "Immortal Realm",
      "lat": 35.50802380752311,
      "lng": 18.088193560980223,
      "size": 24,
      "sub_regions": "Dreamspace",
      "map_type": "dreamspace"
    },
    {
      "name": "Neizhusi",
      "cn_name": "内诸司",
      "lat": 30.956121,
      "lng": 32.92964,
      "sub_regions": "Imperial Palace",
      "map_type": "royal_palace",
      "size": 24
    },
    {
      "name": "Rear Palace",
      "cn_name": "后寝",
      "lat": 28.159974,
      "lng": 26.475294,
      "sub_regions": "Imperial Palace",
      "map_type": "royal_palace",
      "size": 24
    },
    {
      "name": "Front Court",
      "cn_name": "前朝",
      "lat": 38.026086,
      "lng": 29.161797,
      "sub_regions": "Imperial Palace",
      "map_type": "royal_palace",
      "size": 24
    }
  ],
  "zoom_7": [
    {
      "name": "introspection",
      "cn_name": "内省",
      "city": "introspection",
      "lat": 29.524964,
      "lng": 31.881333,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Neizhusi"
    },
    {
      "name": "martial arts arena",
      "cn_name": "演武场",
      "city": "martial arts arena",
      "lat": 32.179839,
      "lng": 30.186191,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Rear Palace"
    },
    {
      "name": "Takeshi",
      "cn_name": "武德司",
      "city": "Takeshi",
      "lat": 32.606046,
      "lng": 33.115885,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Neizhusi"
    },
    {
      "name": "Forbidden treasuries",
      "cn_name": "禁中诸库",
      "city": "Forbidden treasuries",
      "lat": 25.020818,
      "lng": 33.134815,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Neizhusi"
    },
    {
      "name": "Funing Hall",
      "cn_name": "福宁殿",
      "city": "Funing Hall",
      "lat": 30.64178,
      "lng": 26.465991,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Rear Palace"
    },
    {
      "name": "Kunning Hall",
      "cn_name": "坤宁殿",
      "city": "Kunning Hall",
      "lat": 27.506522,
      "lng": 26.475063,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Rear Palace"
    },
    {
      "name": "Qingshou Hall",
      "cn_name": "庆寿殿",
      "city": "Qingshou Hall",
      "lat": 29.980934,
      "lng": 28.501112,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Rear Palace"
    },
    {
      "name": "Shengpinglou",
      "cn_name": "升平楼",
      "city": "Shengpinglou",
      "lat": 32.60989,
      "lng": 24.607779,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Rear Palace"
    },
    {
      "name": "Back garden",
      "cn_name": "后苑",
      "city": "Back garden",
      "lat": 24.20261,
      "lng": 26.564473,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Rear Palace"
    },
    {
      "name": "Bao Ci Palace",
      "cn_name": "宝慈宫",
      "city": "Bao Ci Palace",
      "lat": 29.98293,
      "lng": 24.572767,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Rear Palace"
    },
    {
      "name": "Chongyuan Hall",
      "cn_name": "崇元殿",
      "city": "Chongyuan Hall",
      "lat": 38.300436,
      "lng": 29.162777,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Front Court"
    },
    {
      "name": "Civilization Hall",
      "cn_name": "文明殿",
      "city": "Civilization Hall",
      "lat": 36.413394,
      "lng": 26.474155,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Front Court"
    },
    {
      "name": "Chongde Hall",
      "cn_name": "崇德殿",
      "city": "Chongde Hall",
      "lat": 32.582814,
      "lng": 28.653668,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Rear Palace"
    },
    {
      "name": "Changchun Hall",
      "cn_name": "长春殿",
      "city": "Changchun Hall",
      "lat": 32.584934,
      "lng": 26.497946,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Rear Palace"
    },
    {
      "name": "official office",
      "cn_name": "官署",
      "city": "official office",
      "lat": 36.41477,
      "lng": 24.738002,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Front Court"
    },
    {
      "name": "Neiku Building 3",
      "cn_name": "内库三馆",
      "city": "Neiku Building 3",
      "lat": 38.110894,
      "lng": 32.528041,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Front Court"
    },
    {
      "name": "sealed pile warehouse",
      "cn_name": "封桩库",
      "city": "sealed pile warehouse",
      "lat": 35.298408,
      "lng": 32.313562,
      "preset_map": "royal_palace",
      "size": 24,
      "sub_regions": "Front Court"
    },

    {
      "name": "Hidden Mist Forest",
      "cn_name": "隐雾林",
      "lat": 144.84344,
      "lng": 169.924003,
      "size": 24
    },
    {
      "name": "Golden Echo Ridge",
      "cn_name": "金声岭",
      "lat": 101.77971,
      "lng": 239.607521,
      "size": 24
    },
    {
      "name": "Tianyi Tower",
      "cn_name": "天一楼",
      "lat": 102.71003,
      "lng": 236.583731,
      "size": 24
    },
    {
      "name": "Study and Cultivation Hall",
      "cn_name": "藏修斋",
      "lat": 101.351824,
      "lng": 235.198197,
      "size": 24
    },
    {
      "name": "Resting Retreat",
      "cn_name": "息游居",
      "lat": 104.670733,
      "lng": 235.666719,
      "size": 24
    },
    {
      "name": "Yangzhi Terrace",
      "cn_name": "仰止坪",
      "lat": 102.729963,
      "lng": 232.833529,
      "size": 24
    },
    {
      "name": "Peach Hollow",
      "cn_name": "桃子窝",
      "lat": 102.451382,
      "lng": 222.188629,
      "size": 24
    },
    {
      "name": "Mount Dai",
      "cn_name": "岱岳",
      "lat": 109.167965,
      "lng": 205.040498,
      "size": 24
    },
    {
      "name": "Licheng Terrace",
      "cn_name": "历城台",
      "lat": 102.880978,
      "lng": 205.003968,
      "size": 24
    },
    {
      "name": "River Estuary",
      "cn_name": "入海口",
      "lat": 95.762088,
      "lng": 211.416455,
      "size": 24
    },
    {
      "name": "Lean Riverbank",
      "cn_name": "乐安浦",
      "lat": 99.809002,
      "lng": 212.143314,
      "size": 24
    },
    {
      "name": "Green Scallion Lane",
      "cn_name": "青葱里",
      "lat": 104.153594,
      "lng": 213.155565,
      "size": 24
    },
    {
      "name": "Zao Wu Temple",
      "cn_name": "早悟寺",
      "lat": 110.96578,
      "lng": 213.819353,
      "size": 24
    },
    {
      "name": "Coastal Path",
      "cn_name": "沿海径",
      "lat": 106.893275,
      "lng": 222.504778,
      "size": 24
    },
    {
      "name": "Yongquan Town",
      "cn_name": "涌泉镇",
      "lat": 107.291709,
      "lng": 217.705194,
      "size": 24
    },
    {
      "name": "Gushan",
      "cn_name": "孤山",
      "lat": 223.121392,
      "lng": 206.731615,
      "size": 24
    },
    {
      "name": "Cloud-Climbing Gate",
      "cn_name": "登云阙",
      "lat": 224.44818,
      "lng": 214.534337,
      "size": 24
    },
    {
      "name": "Chen Residence",
      "cn_name": "陈宅",
      "lat": 231.219049,
      "lng": 213.491355,
      "size": 24
    },
    {
      "name": "West Lake",
      "cn_name": "西湖",
      "lat": 226.58765,
      "lng": 208.59464,
      "size": 24
    },
    {
      "name": "Baijia Market",
      "cn_name": "百家集",
      "lat": 225.375247,
      "lng": 216.576098,
      "size": 24
    },
    {
      "name": "Phoenix Mountain",
      "cn_name": "凤凰山",
      "lat": 236.213716,
      "lng": 213.784131,
      "size": 24
    },
    {
      "name": "Western Prefecture Office",
      "cn_name": "西府官廨",
      "lat": 236.21369,
      "lng": 221.416366,
      "size": 24
    },
    {
      "name": "Spring Breeze Lane",
      "cn_name": "春风里",
      "lat": 227.683571,
      "lng": 218.543113,
      "size": 24
    },
    {
      "name": "Mangtan Crossing",
      "cn_name": "莽滩口",
      "lat": 224.240482,
      "lng": 223.78823,
      "size": 24
    },
    {
      "name": "Sea Traders' Alley",
      "cn_name": "海客巷",
      "lat": 230.168036,
      "lng": 223.01645,
      "size": 24
    },
    {
      "name": "Zhejiang Ferry",
      "cn_name": "浙江渡",
      "lat": 239.866021,
      "lng": 225.134704,
      "size": 24
    },
    {
      "name": "Qiantang Government Office",
      "cn_name": "钱塘官衙",
      "lat": 218.827074,
      "lng": 216.257186,
      "size": 24
    },
    {
      "name": "Zhenyuan Escort Agency",
      "cn_name": "镇远镖局",
      "lat": 221.364364,
      "lng": 216.967468,
      "size": 24
    },
    {
      "name": "Qianjiang Market District",
      "cn_name": "钱江市井",
      "lat": 222.605662,
      "lng": 221.573174,
      "size": 24
    },
    {
      "name": "South Mountain",
      "cn_name": "南山",
      "lat": 239.585953,
      "lng": 208.095552,
      "size": 24
    },
    {
      "name": "Flower Harbor",
      "cn_name": "花港",
      "lat": 237.011773,
      "lng": 204.892286,
      "size": 24
    },
    {
      "name": "Quyuan",
      "cn_name": "曲院",
      "lat": 229.107643,
      "lng": 202.104675,
      "size": 24
    },
    {
      "name": "Lingyin New Temple",
      "cn_name": "灵隐新寺",
      "lat": 226.612411,
      "lng": 193.341055,
      "size": 24
    },
    {
      "name": "Yunjia Cove",
      "cn_name": "云家岙",
      "lat": 235.171287,
      "lng": 194.000389,
      "size": 24
    },
    {
      "name": "Qiancui Village",
      "cn_name": "千翠村",
      "lat": 246.969087,
      "lng": 208.639909,
      "size": 24
    },
    {
      "name": "Yunqi Bamboo Path",
      "cn_name": "云栖竹径",
      "lat": 246.491741,
      "lng": 198.759293,
      "size": 24
    },
    {
      "name": "Yingtian Pagoda",
      "cn_name": "应天塔",
      "lat": 215.448053,
      "lng": 210.291854,
      "size": 24
    },
    {
      "name": "Pinglan Academy",
      "cn_name": "平澜书院",
      "lat": 216.973058,
      "lng": 206.477555,
      "size": 24
    },
    {
      "name": "Ten-Li Sea of Mulberry Trees",
      "cn_name": "十里桑海",
      "lat": 221.582008,
      "lng": 228.104826,
      "size": 24
    },
    {
      "name": "Qiantang Inlet",
      "cn_name": "钱塘浦",
      "lat": 233.445508,
      "lng": 227.883227,
      "size": 24
    }
  ]
}

  // ==========================================
  // PRIVATE VARIABLES
  // ==========================================
  
  let map = null;
let currentZoom = 0;
let isVisible = true;

let labelLayers = {
  zoom_3_4: null,
  zoom_5: null,
  zoom_6: null,
  zoom_7: null
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
// ✅ Fix
function getLabelsForZoom(zoom) {
  if (zoom >= 3 && zoom <= 4) {
    return LABEL_CONFIG.zoom_3_4;
  } else if (zoom === 5) {
    return LABEL_CONFIG.zoom_5;
  } else if (zoom === 6) {
    return LABEL_CONFIG.zoom_6;
  } else if (zoom >= 7) {
    return LABEL_CONFIG.zoom_7 || [];  // ← fix
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

function updateLabels(zoom, force = false) {
  if (!map) return;

  const zoomFloor = Math.floor(zoom);
  const zoomKey =
    zoomFloor >= 3 && zoomFloor <= 4 ? 'zoom_3_4' :
    zoomFloor === 5 ? 'zoom_5' :
    zoomFloor === 6 ? 'zoom_6' :
    zoomFloor >= 7 ? 'zoom_7' : null;

  if (
    !force &&
    zoomFloor === currentZoom &&
    activeLayer &&
    map.hasLayer(activeLayer)
  ) return;

  currentZoom = zoomFloor;

  if (activeLayer) {
    map.removeLayer(activeLayer);
    activeLayer = null;
  }

  if (!isVisible || !zoomKey) return;

  if (!labelLayers[zoomKey]) {
    buildLayerForZoom(zoomKey, LABEL_CONFIG[zoomKey] || []);
  }

  activeLayer = labelLayers[zoomKey];

  if (activeLayer) map.addLayer(activeLayer);
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

function show() {
  isVisible = true;
  if (map) updateLabels(map.getZoom(), true);
}

function hide() {
  isVisible = false;

  if (map && activeLayer) {
    map.removeLayer(activeLayer);
  }

  activeLayer = null;
}

function addLabelConfig(zoomLevel, labels) {
  let zoomKey = null;

  if (zoomLevel >= 3 && zoomLevel <= 4) {
    zoomKey = 'zoom_3_4';
  } else if (zoomLevel === 5) {
    zoomKey = 'zoom_5';
  } else if (zoomLevel === 6) {
    zoomKey = 'zoom_6';
  } else if (zoomLevel >= 7) {
    zoomKey = 'zoom_7';
  }

  if (!zoomKey || !Array.isArray(labels)) return;

  LABEL_CONFIG[zoomKey] = labels;
  labelLayers[zoomKey] = null;

  if (map && isVisible) {
    updateLabels(map.getZoom(), true);
  }
}

function refresh() {
  if (map) updateLabels(map.getZoom(), true);
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
  labelLayers = { zoom_3_4: null, zoom_5: null, zoom_6: null, zoom_7: null };
}
  };

  // ✅ Export LABEL_CONFIG dari DALAM IIFE (karena LABEL_CONFIG private di sini)
  window.LABEL_CONFIG = LABEL_CONFIG;

})();

// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.RegionLabelManager = RegionLabelManager;
console.log('✅ RegionLabelManager module loaded (v1.1.0 with show/hide)');