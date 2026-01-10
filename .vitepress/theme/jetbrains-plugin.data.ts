const PLUGIN_ID = 28842

export default {
  async load() {
    try {
      const [pluginRes, ratingRes] = await Promise.all([
        fetch(`https://plugins.jetbrains.com/api/plugins/${PLUGIN_ID}`),
        fetch(`https://plugins.jetbrains.com/api/plugins/${PLUGIN_ID}/rating`)
      ])

      let downloads = null
      let rating = null

      if (pluginRes.ok) {
        const pluginData = await pluginRes.json()
        downloads = pluginData.downloads
      }

      if (ratingRes.ok) {
        const ratingData = await ratingRes.json()
        rating = ratingData.meanRating
      }

      return {
        pluginId: PLUGIN_ID,
        downloads,
        rating
      }
    } catch (e) {
      console.warn('Could not fetch JetBrains plugin stats:', e)
      return {
        pluginId: PLUGIN_ID,
        downloads: null,
        rating: null
      }
    }
  }
}
