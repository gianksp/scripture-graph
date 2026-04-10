import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { useApp } from '../../store/AppContext'
import { useBible } from '../../data/useBible'
import { parseVerseId, verseIdToLabel, isOT, COLORS } from '../../data/bookMap'

export default function ForceGraph({ onNodeClick }) {
  const svgRef   = useRef(null)
  const simRef   = useRef(null)
  const { state } = useApp()
  const { getVerseByLabel } = useBible()
  const { activeVerse, connections, centerText } = state

  useEffect(() => {
    if (!activeVerse || !svgRef.current) return

    const el     = svgRef.current
    const width  = el.clientWidth
    const height = el.clientHeight

    // Clear
    d3.select(el).selectAll('*').remove()
    if (simRef.current) simRef.current.stop()

    const svg = d3.select(el)
    const g   = svg.append('g')

    svg.call(
      d3.zoom().scaleExtent([0.2, 4])
        .on('zoom', e => g.attr('transform', e.transform))
    )

    const centerNode = {
      id: activeVerse, label: verseIdToLabel(activeVerse),
      center: true, text: centerText
    }

    const nodes = [
      centerNode,
      ...connections.map(c => ({
        id: c.to, label: verseIdToLabel(c.to),
        votes: c.votes, center: false,
        text: getVerseByLabel(verseIdToLabel(c.to)) || ''
      }))
    ]

    const links = connections.map(c => ({
      source: activeVerse, target: c.to, votes: c.votes
    }))

    const maxVotes = d3.max(links, d => d.votes) || 1
    const rScale   = d3.scaleLinear().domain([0, maxVotes]).range([5, 14])

    // Links
    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', d => {
        const { book } = parseVerseId(d.target)
        return isOT(book) ? COLORS.OT_OT : COLORS.NT_NT
      })
      .attr('stroke-width', d => Math.max(0.5, (d.votes / maxVotes) * 2.5))
      .attr('stroke-opacity', 0.25)

    // Nodes
    const node = g.append('g').selectAll('g').data(nodes).join('g')
      .style('cursor', d => d.center ? 'default' : 'pointer')
      .call(
        d3.drag()
          .on('start', (e, d) => { if (!e.active) simRef.current.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end',   (e, d) => { if (!e.active) simRef.current.alphaTarget(0); d.fx = null; d.fy = null })
      )
      .on('click', (e, d) => { if (!d.center) onNodeClick(d.id) })

    node.append('circle')
      .attr('r', d => d.center ? 18 : rScale(d.votes || 1))
      .attr('fill', d => {
        if (d.center) return COLORS.CENTER
        const { book } = parseVerseId(d.id)
        return isOT(book) ? COLORS.OT_OT : COLORS.NT_NT
      })
      .attr('fill-opacity', d => d.center ? 1 : 0.7)
      .attr('stroke', d => d.center ? '#e0b84f' : 'transparent')
      .attr('stroke-width', 2)

    node.append('text')
      .text(d => d.label)
      .attr('dy', d => d.center ? -24 : -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', d => d.center ? 11 : 9)
      .attr('font-family', 'IBM Plex Mono')
      .attr('fill', d => {
        if (d.center) return COLORS.CENTER
        const { book } = parseVerseId(d.id)
        return isOT(book) ? COLORS.OT_OT : COLORS.NT_NT
      })
      .attr('fill-opacity', d => d.center ? 1 : 0.8)

    // Tooltip
    const tooltip = d3.select('body').select('#graph-tooltip')

    node
      .on('mouseover', (e, d) => {
        const text = d.text ? d.text : 'Click to explore'
        tooltip
          .style('opacity', 1)
          .html(`<div class="font-mono text-gold text-xs mb-1">${d.label.toUpperCase()}</div><div class="text-dim">${text}</div>`)
      })
      .on('mousemove', e => {
        tooltip
          .style('left', Math.min(e.clientX + 16, window.innerWidth - 300) + 'px')
          .style('top', (e.clientY - 10) + 'px')
      })
      .on('mouseout', () => tooltip.style('opacity', 0))

    simRef.current = d3.forceSimulation(nodes)
      .force('link',      d3.forceLink(links).id(d => d.id).distance(120).strength(0.4))
      .force('charge',    d3.forceManyBody().strength(-200))
      .force('center',    d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
        node.attr('transform', d => `translate(${d.x},${d.y})`)
      })

    return () => { if (simRef.current) simRef.current.stop() }
  }, [activeVerse, connections])

  return (
    <div className="relative flex-1 overflow-hidden"
      style={{
        background: '#0a0a0a',
        backgroundImage: 'radial-gradient(circle at 1px 1px,#1a1a1a 1px,transparent 0)',
        backgroundSize: '32px 32px'
      }}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}