// English locale. Mirror the keys in ja.js; missing keys fall back to Japanese.
export const en = {
  // ---- title / hint ----
  'ui.title': 'Tsuminiwa',
  'ui.hint': 'Left click: place / Right click: break / Wheel: zoom',

  // ---- top bar tooltips ----
  'tip.rotateLeft': 'Rotate view left 60°',
  'tip.rotateRight': 'Rotate view right 60°',
  'tip.auto': 'Auto-develop mode (the world grows on its own)',
  'tip.shot': 'Take a screenshot',
  'tip.settings': 'Open settings',
  'tip.quit': 'Quit the app',
  'tip.weather': 'Weather: {label}',
  'tip.season': '{name}, day {day}',
  'tip.place': 'Place {name}',
  'tip.erase': 'Break a block (or right-click)',
  'tip.spawnVillager': 'Add a person',
  'tip.spawnSheep': 'Add a sheep',
  'tip.spawnChicken': 'Add a chicken',

  // ---- settings panel ----
  'settings.header': 'Settings',
  'settings.language': 'Language',
  'settings.gridSize': 'Grid size',
  'settings.maxHeight': 'Max height',
  'settings.charScale': 'Character size',
  'settings.charSpeed': 'Character speed',
  'settings.autoSpeed': 'Auto-develop speed',
  'settings.dayLength': 'Day length',
  'settings.weatherInterval': 'Weather interval',
  'settings.weather': 'Weather changes',
  'settings.dayNight': 'Day/night cycle',
  'settings.decay': 'Passage of time (burn out, wither)',
  'settings.sound': 'Ambient sound',
  'settings.volume': 'Volume',
  'settings.sky': 'Sky effects (rainbow, shooting stars)',
  'settings.shadows': 'Cast shadow',
  'settings.pinned': 'Always on top',
  'settings.powerSave': 'Power save (when inactive)',
  'settings.autoLaunch': 'Launch at login',
  'settings.spawn': 'Add friends',
  'settings.roster': 'Villagers',
  'settings.reset': 'Rebuild the world',
  'settings.resetNote': 'Changing grid size or max height rebuilds the world',

  // ---- screenshot preview ----
  'shot.save': '💾 Save',
  'shot.share': '𝕏 Share',
  'shot.close': 'Close',
  'shot.saved': '📷 Saved to Pictures/Tsuminiwa',
  'shot.saveFail': '📷 Could not save…',
  'shot.shared': '🖼 Image copied! Paste it into your X post with ⌘V',
  'shot.shareFail': 'Could not share…',

  // ---- units ----
  'unit.times': '×{v}',
  'unit.minutes': '{v} min',
  'unit.seconds': '{v}s',
  'unit.percent': '{v}%',
  'unit.grid': '{v}×{v}',
  'unit.day': 'D{v}',

  // ---- blocks ----
  'block.grass': 'Grass',
  'block.dirt': 'Dirt',
  'block.stone': 'Stone',
  'block.sand': 'Sand',
  'block.wood': 'Wood',
  'block.leaves': 'Leaves',
  'block.brick': 'Brick',
  'block.snow': 'Snow',
  'block.water': 'Water',
  'block.campfire': 'Campfire',
  'block.ash': 'Ash',
  'block.farm': 'Farm',

  // ---- seasons / weather ----
  'season.spring': 'Spring',
  'season.summer': 'Summer',
  'season.autumn': 'Autumn',
  'season.winter': 'Winter',
  'weather.sunny': 'Sunny',
  'weather.cloudy': 'Cloudy',
  'weather.rain': 'Rain',
  'weather.snow': 'Snow',

  // ---- traits / jobs ----
  'trait.relaxed': 'easygoing',
  'trait.hasty': 'hasty',
  'trait.lively': 'lively',
  'trait.mypace': 'my-pace',
  'trait.timid': 'timid',
  'job.lumberjack': 'lumberjack',
  'job.farmer': 'farmer',
  'job.fisher': 'fisher',
  'job.villager': 'villager',

  // ---- roster ----
  'roster.empty': 'No one here yet',
  'roster.line': '{emoji} {name} ({tags})',
  'roster.sep': ', ',
  'tag.baby': 'baby',
  'tag.black': 'black',

  // ---- season / weather events ----
  'event.weatherChanged': '{emoji} It turned {label}',
  'event.seasonChanged': '{emoji} {name} has arrived',

  // ---- visitors ----
  'event.visitorTraveler': '🚶 A traveler arrived',
  'event.visitorDeer': '🦌 A deer came to visit',
  'event.visitorCat': '🐈 A cat wandered in',
  'event.farewellTraveler': '🚶 The traveler moved on',
  'event.farewellDeer': '🦌 The deer returned to the forest',
  'event.farewellCat': '🐈 The cat wandered off',
  'event.settle': '🏡 A traveler settled in the village as "{name}"',

  // ---- generations / festival ----
  'event.hatch': '🐣 The chick "{name}" hatched',
  'event.lambBlack': '🐑 A rare black lamb, "{name}", was born!',
  'event.lamb': '🐑 A lamb "{name}" was born',
  'event.festivalAnimals': '🎉 A festival by the campfire — even the animals join in!',
  'event.festival': '🎉 A festival has begun around the campfire!',

  // ---- jobs ----
  'event.jobChop': '🪓 {name} felled a tree and planted a sapling',
  'event.jobTill': '🧑‍🌾 {name} tilled a field',
  'event.jobHarvest': '🌾 {name} harvested the wheat',
  'event.jobGoldFish': '✨ {name} reeled in a golden fish!!',
  'event.jobFish': '🐟 {name} caught a fish',

  // ---- decay / autopilot ----
  'event.agingCampfire': '🔥 The campfire burned out',
  'event.agingTree': '🍂 An old tree withered',
  'event.agingHut': '🏚️ An old house crumbled',
  'event.autopilotHut': '🏠 A little house was built',

  // ---- rare (spoilers — keep out of docs) ----
  'event.rareAurora': '🌌 The night sky is shimmering…',
  'event.rareWhale': '🐋 A sky whale drifts slowly by…',
  'event.rareMeteor': '🌠 A meteor shower!',
  'event.rareGoldFish': '✨ A golden fish leapt!',

  // ---- character name pools (romanized) ----
  names: {
    villager: ['Sora', 'Umi', 'Hana', 'Yuzu', 'Koharu', 'Momo', 'Rin', 'Taro', 'Aoi', 'Tsumugi', 'Sakura', 'Futa'],
    sheep: ['Moko', 'Fuwa', 'Mee', 'Powa', 'Yuki', 'Mashu', 'Wata'],
    chicken: ['Piyo', 'Kokko', 'Tosaka', 'Mame', 'Koko', 'Chabo'],
    deer: ['Momiji', 'Shikanosuke', 'Bambi'],
    cat: ['Tama', 'Kuro', 'Mike', 'Tora'],
    traveler: ['Traveler'],
  },

  'name.suffix': '{name} II',
};
