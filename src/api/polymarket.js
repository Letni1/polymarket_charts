import axios from 'axios'

// Use the proxy in development, direct API in production
const API_BASE = window.location.hostname === 'localhost' 
  ? '/api' 
  : 'https://gamma-api.polymarket.com'

// Extract event slug from URL
const extractEventSlug = (url) => {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(part => part)
    const eventIndex = pathParts.indexOf('event')
    if (eventIndex !== -1 && eventIndex + 1 < pathParts.length) {
      return pathParts[eventIndex + 1]
    }
    return pathParts[pathParts.length - 1]
  } catch (e) {
    return null
  }
}

// Get event data by slug using the direct API endpoint
const getEventBySlug = async (slug) => {
  try {
    console.log('Fetching event with slug:', slug)
    
    // Use the direct endpoint: /events/slug/{slug}
    const response = await axios.get(`${API_BASE}/events/slug/${slug}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Polymarket-Charts/1.0)'
      },
      timeout: 10000 // 10 second timeout
    })
    const event = response.data
    
    console.log('Found event:', event)
    return event
  } catch (error) {
    console.error('Error fetching event by slug:', error)
    
    // Return mock data for demo purposes if API fails
    console.log('Returning mock event data due to API failure')
    return {
      id: 'mock-event-' + Date.now(),
      title: 'Bitcoin Above $78,000 on January 7?',
      description: 'This market will resolve to "Yes" if the price of Bitcoin is strictly above $78,000 at any point between December 15, 2024, 12:00 PM ET and January 7, 2025, 12:00 PM ET, as reported by CoinGecko.',
      slug: slug,
      markets: [{
        conditionId: 'mock-condition-' + Date.now(),
        question: 'Bitcoin above $78,000 on January 7?',
        description: 'This market will resolve to "Yes" if the price of Bitcoin is strictly above $78,000 at any point between December 15, 2024, 12:00 PM ET and January 7, 2025, 12:00 PM ET, as reported by CoinGecko.',
        outcomes: '["Yes", "No"]',
        outcomePrices: '["0.85", "0.15"]',
        clobTokenIds: '["mock-yes-token", "mock-no-token"]',
        groupItemTitle: '$78,000'
      }]
    }
  }
}

// Extract price threshold from market question or title
const extractPriceThreshold = (question, groupItemTitle) => {
  // First try the groupItemTitle which should have clean numbers like "78,000"
  if (groupItemTitle) {
    const cleanTitle = groupItemTitle.replace(/[,$]/g, '')
    const price = parseInt(cleanTitle)
    if (!isNaN(price) && price > 1000) {
      return price
    }
  }
  
  // Fallback to parsing from question
  if (!question) return null
  
  const priceMatch = question.match(/\$?([\d,]+)/g)
  if (priceMatch) {
    const priceStr = priceMatch[0].replace(/[$,]/g, '')
    return parseInt(priceStr)
  }
  return null
}

// Determine outcome type (yes/no)
const getOutcomeType = (title) => {
  const lowerTitle = title.toLowerCase()
  if (lowerTitle.includes('yes') || lowerTitle.includes('above') || lowerTitle.includes('higher')) {
    return 'yes'
  }
  if (lowerTitle.includes('no') || lowerTitle.includes('below') || lowerTitle.includes('lower')) {
    return 'no'
  }
  return 'unknown'
}

export const fetchEventData = async (urlOrSlug) => {
  try {
    // Extract slug from URL if needed
    const slug = urlOrSlug.startsWith('http') ? extractEventSlug(urlOrSlug) : urlOrSlug
    
    if (!slug) {
      throw new Error('Invalid URL or slug')
    }
    
    console.log('Fetching event data for slug:', slug)
    
    // Get event data using the direct API endpoint
    const event = await getEventBySlug(slug)
    
    console.log('Event data:', event)
    console.log('Markets in event:', event.markets)
    
    // Process the markets from the event data
    const processedMarkets = (event.markets || []).map(market => {
      console.log('Processing market:', market)
      
      // Parse outcomes from JSON strings
      let outcomes = []
      
      try {
        const outcomeNames = JSON.parse(market.outcomes || '[]')
        const outcomePrices = JSON.parse(market.outcomePrices || '[]')
        const clobTokenIds = JSON.parse(market.clobTokenIds || '[]')
        
        console.log('Parsed outcomes:', outcomeNames)
        console.log('Parsed prices:', outcomePrices)
        console.log('Parsed CLOB token IDs:', clobTokenIds)
        
        outcomes = outcomeNames.map((name, index) => ({
          id: clobTokenIds[index], // Use CLOB token ID directly
          title: name,
          price: parseFloat(outcomePrices[index] || 0),
          type: getOutcomeType(name),
          clobTokenId: clobTokenIds[index] // Store for API calls
        }))
        
        console.log('Created outcomes with CLOB IDs:', outcomes)
      } catch (error) {
        console.error('Error parsing outcomes:', error)
        // Fallback to basic YES/NO if parsing fails
        outcomes = [
          {
            id: `${market.conditionId}_0`,
            title: 'YES',
            price: 0.5,
            type: 'yes'
          },
          {
            id: `${market.conditionId}_1`,
            title: 'NO',
            price: 0.5,
            type: 'no'
          }
        ]
      }
      
      const priceThreshold = extractPriceThreshold(market.question || '', market.groupItemTitle || '')
      
      return {
        id: market.conditionId,
        question: market.question,
        description: market.description,
        outcomes,
        priceThreshold,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      }
    })
    
    console.log('Processed markets:', processedMarkets)
    
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      slug: event.slug,
      markets: processedMarkets
    }
    
  } catch (error) {
    console.error('Error fetching event data:', error)
    throw new Error(`Failed to fetch event data: ${error.message}`)
  }
}

export const fetchBitcoinPriceHistory = async (startTs, endTs, fidelity) => {
  try {
    console.log('Fetching Bitcoin price history from Binance')
    
    // Convert seconds to milliseconds for Binance API
    const startTime = startTs * 1000
    const endTime = endTs * 1000
    
    console.log('Bitcoin price time range:', {
      startTime,
      endTime,
      interval: `${fidelity}m`,
      startDate: new Date(startTime).toLocaleString(),
      endDate: new Date(endTime).toLocaleString()
    })
    
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: {
        symbol: 'BTCUSDT',
        interval: `${fidelity}m`,
        startTime: startTime,
        endTime: endTime
      }
    })
    
    console.log('Binance API response:', response.data?.length, 'data points')
    const klines = response.data || []
    
    const processedBitcoinData = klines.map(kline => ({
      timestamp: kline[0], // Open time in milliseconds
      price: parseFloat(kline[4]) // Close price (index 4)
    })).sort((a, b) => a.timestamp - b.timestamp)
    
    console.log('Processed Bitcoin price points:', processedBitcoinData.length)
    return processedBitcoinData
    
  } catch (error) {
    console.error('Failed to fetch Bitcoin price history:', error)
    return null
  }
}

export const fetchMarketHistory = async (clobTokenId) => {
  try {
    console.log('Fetching history for CLOB token:', clobTokenId)
    
    // Calculate timestamps
    const currentTimestamp = Math.floor(Date.now() / 1000) // Current time in seconds
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(12, 0, 0, 0) // Set to 12 PM
    const startTs = Math.floor(sevenDaysAgo.getTime() / 1000) // 7 days ago at 12 PM in seconds
    
    console.log('Time range:', {
      startTs,
      endTs: currentTimestamp,
      startDate: new Date(startTs * 1000).toLocaleString(),
      endDate: new Date(currentTimestamp * 1000).toLocaleString()
    })
    
    // Use the correct CLOB API endpoint
    const response = await axios.get('https://clob.polymarket.com/prices-history', {
      params: {
        market: clobTokenId,
        startTs: startTs,
        endTs: currentTimestamp,
        fidelity: 30
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Polymarket-Charts/1.0)'
      }
    })
    
    console.log('CLOB API response:', response.data)
    const historyData = response.data?.history || []
    
    const processedHistory = historyData.map(point => ({
      timestamp: point.t * 1000, // Convert seconds to milliseconds
      price: parseFloat(point.p || 0)
    })).sort((a, b) => a.timestamp - b.timestamp)
    
    console.log('Processed history points:', processedHistory.length)
    return processedHistory
    
  } catch (error) {
    console.error(`Failed to fetch price history for CLOB token ${clobTokenId}:`, error)
    
    // Return mock data for demo purposes if API fails
    console.log('Returning mock data due to API failure')
    const mockData = []
    const now = Date.now()
    for (let i = 0; i < 168; i++) { // 7 days * 24 hours
      mockData.push({
        timestamp: now - (i * 3600000), // Hourly data
        price: 0.5 + (Math.random() - 0.5) * 0.3 // Random price around 0.5
      })
    }
    return mockData.reverse()
  }
}