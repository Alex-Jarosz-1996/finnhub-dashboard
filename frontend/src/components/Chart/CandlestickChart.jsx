import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts'

export default function CandlestickChart({ data }) {
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    if (!containerRef.current || !data?.length) return

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: 'var(--text-secondary, #9ca3af)',
      },
      grid: {
        vertLines: { color: 'rgba(128,128,128,0.15)' },
        horzLines: { color: 'rgba(128,128,128,0.15)' },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    candleSeries.setData(
      data.map((d) => ({ time: d.date, open: d.open, high: d.high, low: d.low, close: d.close }))
    )

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    })

    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })

    volumeSeries.setData(
      data.map((d) => ({
        time: d.date,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
      }))
    )

    chart.timeScale().fitContent()

    const onCrosshair = (param) => {
      if (!param.time || !param.point) {
        setTooltip(null)
        return
      }
      const candle = param.seriesData.get(candleSeries)
      const vol = param.seriesData.get(volumeSeries)
      if (!candle) { setTooltip(null); return }

      const cw = containerRef.current?.clientWidth ?? 0
      const tw = 140
      const x = param.point.x + 15 + tw > cw ? param.point.x - tw - 15 : param.point.x + 15

      setTooltip({
        x,
        y: Math.max(0, param.point.y - 60),
        time: String(param.time),
        price: candle.close,
        volume: vol?.value,
      })
    }

    chart.subscribeCrosshairMove(onCrosshair)

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshair)
      chart.remove()
      setTooltip(null)
    }
  }, [data])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`a[href*="tradingview"] { display: none !important; }`}</style>
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            padding: '8px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            lineHeight: '1.6',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: '130px',
            color: '#0f172a',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
          }}
        >
          <div style={{ marginBottom: '2px', color: '#475569' }}>{tooltip.time}</div>
          <div>Price: <b>${tooltip.price.toFixed(2)}</b></div>
          {tooltip.volume != null && (
            <div>Volume: <b>{tooltip.volume.toLocaleString()}</b></div>
          )}
        </div>
      )}
    </div>
  )
}
