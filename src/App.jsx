import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchEventData, fetchMarketHistory, fetchBitcoinPriceHistory } from './api/polymarket'

function App() {
  const [url, setUrl] = useState('https://polymarket.com/event/bitcoin-above-on-january-7?tid=1767822569297')
  const [eventData, setEventData] = useState(null)
  const [selectedOutcomes, setSelectedOutcomes] = useState({})
  const [chartData, setChartData] = useState([])
  const [bitcoinPriceRange, setBitcoinPriceRange] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSum, setShowSum] = useState(false)

  const extractEventSlug = (url) => {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      return pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2]
    } catch (e) {
      return null
    }
  }

  const loadEventData = async () => {
    setLoading(true)
    setError('')
    
    try {
      const slug = extractEventSlug(url)
      if (!slug) {
        throw new Error('Invalid URL format')
      }

      const data = await fetchEventData(slug)
      setEventData(data)
      
      // Initialize selected outcomes (all unchecked)
      const initialSelection = {}
      data.markets?.forEach(market => {
        market.outcomes?.forEach(outcome => {
          initialSelection[outcome.id] = false
        })
      })
      setSelectedOutcomes(initialSelection)
      
      // Automatically load Bitcoin price chart
      await loadBitcoinChart()
      
    } catch (err) {
      setError(err.message || 'Failed to load event data')
    } finally {
      setLoading(false)
    }
  }

  const loadBitcoinChart = async () => {
    try {
      console.log('Loading Bitcoin price chart...')
      
      // Calculate time range (7 days ago at 12 PM to now)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      sevenDaysAgo.setHours(12, 0, 0, 0)
      const startTs = Math.floor(sevenDaysAgo.getTime() / 1000)
      const currentTs = Math.floor(Date.now() / 1000)
      
      const bitcoinHistory = await fetchBitcoinPriceHistory(startTs, currentTs, 30)
      
      if (bitcoinHistory && bitcoinHistory.length > 0) {
        console.log('Bitcoin price history loaded:', bitcoinHistory.length, 'points')
        
        // Create chart data with only Bitcoin prices
        const chartPoints = bitcoinHistory.map(point => ({
          timestamp: point.timestamp,
          time: new Date(point.timestamp).toLocaleString(),
          'Bitcoin Price': point.price
        }))
        
        setChartData(chartPoints)
        
        // Calculate Bitcoin price range for the axis
        const prices = bitcoinHistory.map(h => h.price)
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        
        setBitcoinPriceRange({
          min: maxPrice - 20000, // $20,000 below highest price
          max: maxPrice          // Highest price
        })
      } else {
        console.log('No Bitcoin price data available')
        setChartData([])
      }
    } catch (error) {
      console.error('Failed to load Bitcoin chart:', error)
      setChartData([])
    }
  }

  const handleOutcomeToggle = (outcomeId) => {
    setSelectedOutcomes(prev => ({
      ...prev,
      [outcomeId]: !prev[outcomeId]
    }))
  }

  const loadChartData = async () => {
    if (!eventData) return

    const selectedIds = Object.keys(selectedOutcomes).filter(id => selectedOutcomes[id])
    console.log('Selected outcome IDs:', selectedIds)
    console.log('Selected outcomes object:', selectedOutcomes)
    
    // If no outcomes selected, keep the Bitcoin-only chart
    if (selectedIds.length === 0) {
      console.log('No outcomes selected, keeping Bitcoin-only chart')
      return
    }

    setLoading(true)
    try {
      const historyPromises = selectedIds.map(async (outcomeId) => {
        const outcome = eventData.markets
          ?.flatMap(m => m.outcomes || [])
          ?.find(o => o.id === outcomeId)
        
        if (outcome) {
          const history = await fetchMarketHistory(outcome.clobTokenId || outcome.id)
          return { outcomeId, outcome, history }
        }
        return null
      })

      const results = await Promise.all(historyPromises)
      const validResults = results.filter(r => r !== null && r.history !== null)
      
      console.log('Valid results with price history:', validResults.length)

      if (validResults.length === 0) {
        console.log('No valid results, setting empty chart data')
        setChartData([])
        return
      }

      // Fetch Bitcoin price history for the same time period
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      sevenDaysAgo.setHours(12, 0, 0, 0)
      const startTs = Math.floor(sevenDaysAgo.getTime() / 1000)
      const currentTs = Math.floor(Date.now() / 1000)
      
      const bitcoinHistory = await fetchBitcoinPriceHistory(startTs, currentTs, 30)
      console.log('Bitcoin price history:', bitcoinHistory?.length || 0, 'points')

      // Combine all timestamps and create chart data
      const allTimestamps = new Set()
      
      // Add Polymarket timestamps
      validResults.forEach(result => {
        result.history.forEach(point => {
          allTimestamps.add(point.timestamp)
        })
      })

      // Add Bitcoin timestamps if available
      if (bitcoinHistory) {
        bitcoinHistory.forEach(point => {
          allTimestamps.add(point.timestamp)
        })
        console.log('Added Bitcoin timestamps:', bitcoinHistory.length)
      } else {
        console.log('No Bitcoin history available')
      }

      const sortedTimestamps = Array.from(allTimestamps).sort()
      console.log('Total unique timestamps:', sortedTimestamps.length)
      
      const chartPoints = sortedTimestamps.map(timestamp => {
        const point = { timestamp, time: new Date(timestamp).toLocaleString() }
        
        // ALWAYS add Bitcoin price data first
        if (bitcoinHistory && bitcoinHistory.length > 0) {
          const bitcoinPoint = bitcoinHistory.find(h => Math.abs(h.timestamp - timestamp) <= 30 * 60 * 1000) // 30 min window
          if (bitcoinPoint) {
            point['Bitcoin Price'] = bitcoinPoint.price
          }
        }
        
        // Then add Polymarket data
        validResults.forEach(result => {
          const historyPoint = result.history.find(h => Math.abs(h.timestamp - timestamp) <= 30 * 60 * 1000) // 30 min window
          if (historyPoint) {
            const marketName = result.outcome.title
            point[marketName] = historyPoint.price * 100 // Convert to percentage
          }
        })
        // Calculate Sum of selected Yes/No values for this timestamp
        if (showSum) {
          let sumVal = 0
          let contributed = false
          validResults.forEach(result => {
            const key = result.outcome.title
            const val = point[key]
            if (typeof val === 'number') {
              sumVal += val
              contributed = true
            }
          })
          if (contributed) {
            point['Sum'] = sumVal
          }
        }
        
        return point
      })

      // Filter out points that have no data at all
      const validChartPoints = chartPoints.filter(point => {
        const keys = Object.keys(point).filter(k => k !== 'timestamp' && k !== 'time')
        return keys.length > 0
      })

      console.log('Chart points before filtering:', chartPoints.length)
      console.log('Valid chart points after filtering:', validChartPoints.length)
      console.log('Bitcoin data points in final chart:', validChartPoints.filter(p => p['Bitcoin Price']).length)
      
      // Calculate Bitcoin price range for custom axis
      let bitcoinPriceRange = null
      if (bitcoinHistory && bitcoinHistory.length > 0) {
        const prices = bitcoinHistory.map(h => h.price)
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        
        // Create a $20,000 range: from (maxPrice - 20000) to maxPrice
        bitcoinPriceRange = {
          min: maxPrice - 20000, // $20,000 below highest price
          max: maxPrice          // Highest price
        }
        
        console.log('Bitcoin price range:', {
          actualMin: minPrice,
          actualMax: maxPrice,
          axisMin: bitcoinPriceRange.min,
          axisMax: bitcoinPriceRange.max,
          range: '$20,000'
        })
      }

      // Use the chartPoints from above, no need to redeclare
      console.log('Chart points created:', validChartPoints.length)
      console.log('Valid results count:', validResults.length)
      console.log('Selected outcomes:', validResults.map(r => r.outcome.title))
      console.log('Bitcoin history available:', bitcoinHistory ? bitcoinHistory.length : 0, 'points')
      if (validChartPoints.length > 0) {
        console.log('Sample chart point:', validChartPoints[0])
        console.log('All data keys in first point:', Object.keys(validChartPoints[0]))
        console.log('Bitcoin Price in sample:', validChartPoints[0]['Bitcoin Price'])
      }
      setChartData(validChartPoints)
      setBitcoinPriceRange(bitcoinPriceRange)
    } catch (err) {
      setError('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChartData()
  }, [selectedOutcomes, eventData, showSum])

  const getSelectedOutcomes = () => {
    if (!eventData) return []
    
    return eventData.markets
      ?.flatMap(m => m.outcomes || [])
      ?.filter(outcome => selectedOutcomes[outcome.id]) || []
  }

  const formatPrice = (price) => {
    return `$${price.toLocaleString()}`
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Polymarket Bitcoin Charts</h1>
        <input
          type="text"
          className="url-input"
          placeholder="Enter Polymarket event URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button 
          className="load-button" 
          onClick={loadEventData}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load Event'}
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {eventData && (
        <div className="markets-section">
          <h2 className="markets-title">Select Markets to Display</h2>
          
          <div className="markets-grid">
            {eventData.markets?.map(market => {
              console.log('Rendering market:', market)
              console.log('Market outcomes:', market.outcomes)
              
              return (
                <div key={market.id} className="market-card">
                  <div className="market-price">
                    <span className={`price-arrow ${market.trend}`}>
                      ↑
                    </span>
                    {market.priceThreshold ? formatPrice(market.priceThreshold) : market.question}
                  </div>
                  
                  <div className="market-options">
                    {market.outcomes && market.outcomes.length > 0 ? (
                      market.outcomes.map(outcome => (
                        <div key={outcome.id} className="option-group">
                          <div
                            className={`option-checkbox ${outcome.type} ${selectedOutcomes[outcome.id] ? 'checked' : ''}`}
                            onClick={() => handleOutcomeToggle(outcome.id)}
                          />
                          <label 
                            className={`option-label ${outcome.type}`}
                            onClick={() => handleOutcomeToggle(outcome.id)}
                          >
                            {outcome.title}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#888', fontSize: '12px' }}>
                        No outcomes available
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="chart-section">
          <h3>Probability Chart</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ccc' }}>
              <input
                type="checkbox"
                checked={showSum}
                onChange={(e) => setShowSum(e.target.checked)}
              />
              Show Sum
            </label>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3d4a" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12, fill: '#888' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                yAxisId="probability"
                label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#888' } }}
                domain={[0, 200]}
                ticks={[0, 50, 100, 150, 200]}
                tick={{ fill: '#888' }}
              />
              <YAxis 
                yAxisId="price"
                orientation="right"
                label={{ value: 'Bitcoin Price ($)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#888' } }}
                domain={bitcoinPriceRange ? [bitcoinPriceRange.min, bitcoinPriceRange.max] : ['dataMin', 'dataMax']}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                tick={{ fill: '#888' }}
              />
              <Tooltip 
                labelFormatter={(value) => `Time: ${value}`}
                formatter={(value, name) => {
                  if (name === 'Bitcoin Price') {
                    return [`$${value?.toLocaleString()}`, name]
                  }
                  return [`${value?.toFixed(1)}%`, name]
                }}
                contentStyle={{ 
                  backgroundColor: '#252836', 
                  border: '1px solid #3a3d4a',
                  borderRadius: '4px',
                  color: '#ffffff'
                }}
              />
              <Legend />
              {getSelectedOutcomes().map((outcome, index) => {
                const marketName = outcome.title
                const color = outcome.type === 'yes' ? '#00d4aa' : '#ff6b6b'
                return (
                  <Line
                    key={outcome.id}
                    yAxisId="probability"
                    type="monotone"
                    dataKey={marketName}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                  />
                )
              })}
              {showSum && chartData.some(point => point['Sum'] !== undefined) && (
                <Line
                  yAxisId="probability"
                  type="monotone"
                  dataKey="Sum"
                  stroke="#9b59b6"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {/* Bitcoin Price Line - Only render if Bitcoin data exists in chart */}
              {chartData.some(point => point['Bitcoin Price'] !== undefined) && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="Bitcoin Price"
                  stroke="#f7931a"
                  strokeWidth={3}
                  dot={false}
                  connectNulls={true}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {loading && (
        <div className="loading">
          Loading...
        </div>
      )}
    </div>
  )
}

export default App