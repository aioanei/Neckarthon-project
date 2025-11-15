
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { LabNode, NodeType } from '../types';
import { Package } from 'lucide-react';

interface LabTreeProps {
  data: LabNode | null;
  onNodeClick: (nodeId: string) => void;
  selectedNodeId: string | null;
}

const LabTree: React.FC<LabTreeProps> = ({ data, onNodeClick, selectedNodeId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!wrapperRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });
    resizeObserver.observe(wrapperRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 40, right: 140, bottom: 40, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const root = d3.hierarchy<LabNode>(data);
    
    // Use a slightly tighter layout for large recursive trees
    const treeLayout = d3.tree<LabNode>()
      .size([innerHeight, innerWidth])
      .separation((a, b) => (a.parent === b.parent ? 1.3 : 1.8));

    treeLayout(root);

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal<d3.HierarchyLink<LabNode>, d3.HierarchyPointNode<LabNode>>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr("stroke", d => {
        if (d.target.data.type === NodeType.REQUIRED) return "#ef4444"; // Red-500
        if (d.target.data.type === NodeType.COMPATIBLE) return "#3b82f6"; // Blue-500
        return "#64748b";
      })
      .attr("stroke-dasharray", d => d.target.data.type === NodeType.COMPATIBLE ? "5,5" : "none")
      .attr("stroke-width", d => d.target.data.type === NodeType.REQUIRED ? 2.5 : 1.5)
      .attr("opacity", 0.5);

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", d => `node ${d.data.id === selectedNodeId ? "selected" : ""}`)
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        onNodeClick(d.data.id);
      });

    // Selection Glow
    node.append("circle")
        .attr("r", 22)
        .attr("fill", d => d.data.id === selectedNodeId ? "#fbbf24" : "transparent")
        .attr("opacity", 0.15)
        .attr("filter", "blur(5px)");

    // Main Node Circle
    node.append("circle")
      .attr("r", d => d.data.type === NodeType.ROOT ? 16 : 12)
      .attr("fill", d => {
        if (d.data.type === NodeType.ROOT) return "#ffffff";
        if (d.data.type === NodeType.REQUIRED) return "#7f1d1d"; // Dark Red
        if (d.data.type === NodeType.COMPATIBLE) return "#1e3a8a"; // Dark Blue
        return "#1e293b";
      })
      .attr("stroke", d => {
         if (d.data.type === NodeType.ROOT) return "#f1f5f9";
         if (d.data.type === NodeType.REQUIRED) return "#ef4444"; // Bright Red
         if (d.data.type === NodeType.COMPATIBLE) return "#60a5fa"; // Bright Blue
         return "#94a3b8";
      })
      .attr("stroke-width", d => d.data.type === NodeType.REQUIRED ? 2.5 : 2);

    // Required Checkmark Icon
    node.filter(d => d.data.type === NodeType.REQUIRED)
        .append("g")
        .attr("transform", "translate(-6, -6)") // Center the path
        .append("path")
        .attr("d", "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z") // Material Check Icon path scaled
        .attr("transform", "scale(0.5)") // Scale down
        .attr("fill", "#ffffff");

    // Compatible Question Mark
    node.filter(d => d.data.type === NodeType.COMPATIBLE)
        .append("text")
        .attr("dy", 4)
        .attr("text-anchor", "middle")
        .text("?")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "#93c5fd");

    // Inventory Icon Badge (Box)
    node.filter(d => !!d.data.inInventory)
        .append("g")
        .attr("transform", "translate(-16, -16)") // Position at top-left
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", "#22c55e") // Green-500
        .attr("rx", 2);

    // Generating Pulse
    node.filter(d => !!d.data.isGenerating)
      .append("circle")
      .attr("r", 25)
      .attr("fill", "none")
      .attr("stroke", "#a855f7") // Purple
      .attr("stroke-width", 2)
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr("r", 35)
      .attr("stroke-opacity", 0)
      .style("animation", "pulse 1s infinite");

    // Labels
    node.append("text")
      .attr("dy", d => d.children ? -25 : 5)
      .attr("dx", d => d.children ? 0 : 22)
      .style("text-anchor", d => d.children ? "middle" : "start")
      .text(d => d.data.name)
      .attr("fill", "#f1f5f9")
      .attr("font-size", "13px")
      .attr("font-family", "sans-serif")
      .attr("font-weight", d => d.data.type === NodeType.REQUIRED ? "600" : "400")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.9)")
      .style("opacity", 0)
      .transition()
      .duration(400)
      .style("opacity", 1);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    
    // Auto-center on first render or root change
    if(data && !data.isExpanded) { // Rough check if it's new data
        const initialScale = 0.8;
        const initialTranslateX = 100;
        const initialTranslateY = dimensions.height / 2;
        svg.call(zoom.transform, d3.zoomIdentity.translate(initialTranslateX, initialTranslateY).scale(initialScale));
    }

  }, [data, dimensions, onNodeClick, selectedNodeId]);

  if (!data) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-500 animate-pulse">
        Waiting for simulation data...
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="w-full h-full overflow-hidden relative bg-slate-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
      <svg ref={svgRef} width="100%" height="100%" className="cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default LabTree;
