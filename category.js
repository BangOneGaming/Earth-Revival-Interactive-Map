// data.js


const materialsByLocType = {
    2: {
        mainTitle: "Sundale Valley",
        rare: [
            { name: "Rare Wood", filter: "rarewood1", category: 23, icon: "icons/rarewood.png" }
        ],
        wood: [
            { name: "Cedar", filter: "wood", category: 16, icon: "resource_img/cedar.png" },
            { name: "Resin", filter: "resin", category: [21, 18, 16], icon: "resource_img/resin.png" } // Resin dengan category 21, 18, 16
        ],
        stone: [
            { name: "Iron Ore", filter: "stone", category: 15, icon: "resource_img/ironore.png" },
            { name: "Clay", filter: "clay", category: [22, 18, 15], icon: "resource_img/clay.png" } // Clay dengan category 22, 18, 15
        ],
        fiber: [
            { name: "Flax Fiber", filter: "fiber", category: 17, icon: "resource_img/flaxfiber.png" }
        ],
        scrap: [
            { name: "Lens", filter: "scrap", category: 7, icon: "resource_img/lens.png" },
            { name: "Screw", filter: "scrap2", category: 19, icon: "resource_img/screw.png" },
            { name: "Zipper", filter: "scrap3", category: 20, icon: "resource_img/zipper.png" }
        ],
        ingredients: [
            { name: "Bracken", filter: null, category: null, icon: "resource_img/bracken.png" },
            { name: "Mushroom", filter: null, category: null, icon: "resource_img/mushroom.png" },
            { name: "Neptunea", filter: null, category: null, icon: "resource_img/neptunea.png" },
            { name: "Bell Pepper", filter: null, category: null, icon: "resource_img/bellpepper.png" },
            { name: "Bamboo Mushroom", filter: null, category: null, icon: "resource_img/bamboomushroom.png" },
            { name: "Mutant Berry", filter: null, category: null, icon: "resource_img/mutantberry.png" }
        ],
        oldWorldTreasure: null
    },
    5: {
        mainTitle: "Howling Gobi",
        rare: [
            { name: "Rare Stone", filter: "rarestone", category: 24, icon: "icons/rarestone.png" }
        ],
        wood: [
            { name: "Poplar", filter: "wood", category: 16, icon: "resource_img/poplar.png" },
            { name: "Resin", filter: "resin", category: [21, 18, 16], icon: "resource_img/resin.png" } // Resin dengan category 21, 18, 16
        ],
        stone: [
            { name: "Pyrolusite Ore", filter: "stone", category: 15, icon: "resource_img/pyrolusite.png" },
            { name: "Clay", filter: "clay", category: [22, 18, 15], icon: "resource_img/clay.png" } // Clay dengan category 22, 18, 15
        ],
        fiber: [
            { name: "Sisal Fiber", filter: "fiber", category: 17, icon: "resource_img/sisalfiber.png" }
        ],
        scrap: [
            { name: "Rubber", filter: "scrap", category: 7, icon: "resource_img/rubber.png" },
            { name: "Machine Parts", filter: "scrap2", category: 19, icon: "resource_img/machineparts.png" },
            { name: "Spring", filter: "scrap3", category: 20, icon: "resource_img/spring.png" }
        ],
        ingredients: [
            { name: "Edible Cactus", filter: null, category: null, icon: "resource_img/ediblecactus.png" },
            { name: "Wildbuckthorn", filter: null, category: null, icon: "resource_img/wildbuckthorn.png" },
            { name: "Wild Pineapple", filter: null, category: null, icon: "resource_img/wildpineapple.png" },
            { name: "Succulent", filter: null, category: null, icon: "resource_img/succulent.png" },
            { name: "Antirad Berry", filter: null, category: null, icon: "resource_img/antiradberry.png" },
            { name: "Crooked Arracord", filter: null, category: null, icon: "resource_img/crookedarracord.png" }
        ],
        oldWorldTreasure: null
    },
    4: {
        mainTitle: "Edengate",
        rare: [
            { name: "Wastes", filter: "rarewastes", category: 25, icon: "icons/rarewastes.png" }
        ],
        wood: [
            { name: "Redwood", filter: "wood", category: 16, icon: "resource_img/redwood.png" },
            { name: "Resin", filter: "resin", category: [21, 18, 16], icon: "resource_img/resin.png" } // Resin dengan category 21, 18, 16
        ],
        stone: [
            { name: "Red Ochre Ore", filter: "stone", category: 15, icon: "resource_img/redochre.png" },
            { name: "Clay", filter: "clay", category: [22, 18, 15], icon: "resource_img/clay.png" } // Clay dengan category 22, 18, 15
        ],
        fiber: [
            { name: "Glowherb Fiber", filter: "fiber", category: 17, icon: "resource_img/glowherbfiber.png" }
        ],
        scrap: [
            { name: "Diode", filter: "scrap", category: 7, icon: "resource_img/diode.png" },
            { name: "Precision Part", filter: "scrap2", category: 19, icon: "resource_img/precisionpart.png" },
            { name: "Electronical Component", filter: "scrap3", category: 20, icon: "resource_img/electronicalcomponent.png" }
        ],
        ingredients: [
            { name: "Hydrated Lettuce", filter: null, category: null, icon: "resource_img/hydratedlettuce.png" },
            { name: "Tuna Surimi", filter: null, category: null, icon: "resource_img/tunasurimi.png" },
            { name: "Strawberry", filter: null, category: null, icon: "resource_img/strawberry.png" },
            { name: "Colourful Spore Mushroom", filter: null, category: null, icon: "resource_img/colourfulsporemushroom.png" }
        ],
        oldWorldTreasure: null
    },
3: {
    mainTitle: "Ragon Snowy Peak",
    wood: [
        { name: "Fir", filter: "wood", category: 16, icon: "resource_img/fir.png" },
        { name: "Amber", filter: ["resin", "resource", "wood"], category: [21, 18, 16], icon: "resource_img/amber.png" }
    ],
    stone: [
        { name: "Tungsten Ore", filter: "stone", category: 15, icon: "resource_img/tungsten.png" },
        { name: "Quartz", filter: ["clay", "resource", "stone"], category: [22, 18, 15], icon: "resource_img/quartz.png" }
    ],
    fiber: [
        { name: "Snow Hemp Fiber", filter: "fiber", category: 17, icon: "resource_img/snowhempfiber.png" }
    ],
    scrap: [
        { name: "Industrial Hinge", filter: "scrap", category: 7, icon: "resource_img/industrialhinge.png" },
        { name: "Magnet Coil", filter: "scrap2", category: 19, icon: "resource_img/magnetcoil.png" },
        { name: "Insulation Coating", filter: "scrap3", category: 20, icon: "resource_img/insulationcoating.png" }
    ],
    ingredients: [
        { name: "Blueberry", filter: null, category: null, icon: "resource_img/blueberry.png" },
        { name: "Artic Bamboo Shoot", filter: null, category: null, icon: "resource_img/articbambooshoot.png" },
        { name: "Reishi Mushroom", filter: null, category: null, icon: "resource_img/reishimushroom.png" }
    ],
    oldWorldTreasure: null
},
6: {
    mainTitle: "Kepler Harbour",
    rare: [
        { name: "Wood", filter: "rarewood2", category: 26, icon: "icons/rarewood.png" }
    ],
    wood: [
        { name: "Palm Wood", filter: "wood", category: 16, icon: "resource_img/palmwood.png" },
        { name: "Amber", filter: ["resin", "resource", "wood"], category: [21, 18, 16], icon: "resource_img/amber.png" }
    ],
    stone: [
        { name: "Pyrite Sulfur", filter: "stone", category: 15, icon: "resource_img/pyrite.png" },
        { name: "Quartz", filter: ["clay", "resource", "stone"], category: [22, 18, 15], icon: "resource_img/quartz.png" }
    ],
    fiber: [
        { name: "Agave Americana L Fiber", filter: "fiber", category: 17, icon: "resource_img/agave.png" }
    ],
    scrap: [
        { name: "Artificial Leather", filter: "scrap", category: 7, icon: "resource_img/artificialleather.png" },
        { name: "Power Component", filter: "scrap2", category: 19, icon: "resource_img/powercomponent.png" },
        { name: "Integrated Motor", filter: "scrap3", category: 20, icon: "resource_img/integratedmotor.png" }
    ],
    ingredients: [
        { name: "Lava Tomato", filter: null, category: null, icon: "resource_img/lavatomato.png" },
        { name: "Caocao Fruit", filter: null, category: null, icon: "resource_img/caocaofruit.png" },
        { name: "Cauliflower Fungus", filter: null, category: null, icon: "resource_img/cauliflowerfungus.png" },
        { name: "Magmashroom", filter: null, category: null, icon: "resource_img/magmashroom.png" }
    ],
    oldWorldTreasure: null
}
};




const categoryIcons = {
    "all": "icons/here.png",                // Ikon untuk "All"
    "treasure": "icons/icon_treasure.png",  // Ikon untuk "Treasure"
    "teleport": "icons/icon_teleport.png",  // Ikon untuk "Teleport"
    "fishing": "icons/icon_fishing.png",     // Ikon untuk "Fishing"
    "zone": "icons/icon_zone.png",           // Ikon untuk "Zone"
    "training": "icons/icon_train.png",      // Ikon untuk "Training"
    "scenery": "icons/icon_scenery.png",     // Ikon untuk "Scenery"
    "material": "icons/icon_stone.png", 
    "resource": "icons/icon_resource.png"
};

const categoryCounts = {
    "2": {  // Loc_type 2 (Sundale Valley)
        "treasure": { max: 0, current: 0, icon: categoryIcons.treasure },
        "resource": { max: 0, current: 0, icon: categoryIcons.resource },
        "training": { max: 0, current: 0, icon: categoryIcons.training },
        "zone": { max: 0, current: 0, icon: categoryIcons.zone },
        "fishing": { max: 0, current: 0, icon: categoryIcons.fishing },
        "scenery": { max: 0, current: 0, icon: categoryIcons.scenery }
    },
    "3": {  // Loc_type 3 (Ragon Snowy Peak)
        "treasure": { max: 0, current: 0, icon: categoryIcons.treasure },
        "resource": { max: 0, current: 0, icon: categoryIcons.resource },
        "training": { max: 0, current: 0, icon: categoryIcons.training },
        "zone": { max: 0, current: 0, icon: categoryIcons.zone },
        "fishing": { max: 0, current: 0, icon: categoryIcons.fishing },
        "scenery": { max: 0, current: 0, icon: categoryIcons.scenery }
    },
    "4": {  // Loc_type 4 (Edengate)
        "treasure": { max: 0, current: 0, icon: categoryIcons.treasure },
        "resource": { max: 0, current: 0, icon: categoryIcons.resource },
        "training": { max: 0, current: 0, icon: categoryIcons.training },
        "zone": { max: 0, current: 0, icon: categoryIcons.zone },
        "fishing": { max: 0, current: 0, icon: categoryIcons.fishing },
        "scenery": { max: 0, current: 0, icon: categoryIcons.scenery }
    },
    "5": {  // Loc_type 5 (Howling Gobi)
        "treasure": { max: 0, current: 0, icon: categoryIcons.treasure },
        "resource": { max: 0, current: 0, icon: categoryIcons.resource },
        "training": { max: 0, current: 0, icon: categoryIcons.training },
        "zone": { max: 0, current: 0, icon: categoryIcons.zone },
        "fishing": { max: 0, current: 0, icon: categoryIcons.fishing },
        "scenery": { max: 0, current: 0, icon: categoryIcons.scenery }
    },
    "6": {  // Loc_type 6 (Kepler Harbour)
        "treasure": { max: 0, current: 0, icon: categoryIcons.treasure },
        "resource": { max: 0, current: 0, icon: categoryIcons.resource },
        "training": { max: 0, current: 0, icon: categoryIcons.training },
        "zone": { max: 0, current: 0, icon: categoryIcons.zone },
        "fishing": { max: 0, current: 0, icon: categoryIcons.fishing },
        "scenery": { max: 0, current: 0, icon: categoryIcons.scenery }
    }
};

const fishingCategories = [9, 10, 11, 12, 13, 14]; // Combine fishing categories
// Variabel untuk menyimpan ukuran asli

// data.js

// Map category IDs to their names
const categoryNames = {
    "1": "Teleport",
    "2": "Treasure Hunt",
    "3": "Zone Commission",
    "7": "Limited Time Training",
    "8": "Scenery",
    "9": "Fishing 1",
    "10": "Fishing 2",
    "11": "Fishing 3",
    "12": "Fishing 4",
    "13": "Fishing 5",
    "14": "Fishing 6",
    "15": "Stone",
    "16": "Wood",
    "17": "Fiber",
    "18": "Resource Chest",
    "6": "Scrap",
    "19": "Scrap 2",
    "20": "Scrap 3",
    "21": "Resin",
    "22": "Clay",
    "23": "Rare Wood 1",
    "24": "Rare Stone",
    "25": "Rare Wastes",
    "26": "Rare Wood 2 Keplre Harbour",
    "27": "Old World Treasure",
    "28": "Ingredients"
};

// Map loc_type IDs to their names
const locTypeNames = {
    "2": "Sundale Valley",
    "5": "Howling Gobi",
    "4": "Edengate",
    "3": "Ragon Snowy Peak",
    "6": "Kepler Harbour"
};
