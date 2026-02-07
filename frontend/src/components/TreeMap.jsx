import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const Treemap = ({
  data,
  width = window.innerWidth - 20,
  height = window.innerHeight * 10,
}) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    d3.select(ref.current).selectAll("*").remove();

    // ✅ 1️⃣ Group by artist → album → track
    const nestedData = Array.from(
      d3.group(data, (d) => d.albumartist),
      ([artist, albums]) => ({
        name: artist,
        children: Array.from(
          d3.group(albums, (d) => d.albumname),
          ([album, tracks]) => ({
            name: album,
            children: tracks.map((t) => ({
              name: t.trackname,
              value: parseInt(t.total_tracks, 10), // use total plays for area
              ratio: parseFloat(t.ratio_within_album),
            })),
          })
        ),
      })
    );

    // ✅ 2️⃣ Build the hierarchy and sort by total plays
    const root = d3
      .hierarchy({ name: "root", children: nestedData })
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value); // sort largest plays first

    // ✅ 3️⃣ Treemap layout
    d3
      .treemap()
      .size([width, height])
      .paddingInner(1)
      .paddingOuter(5)
      .paddingTop(24)(root);
    const svg = d3
      .select(ref.current)
      .attr("viewBox", [0, 0, width, height])
      .style("font-family", "Montserrat, sans-serif")
      .style("background", "#000000ff");

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // ✅ 4️⃣ Flatten tracks to include artist and album info
    const trackNodes = root.leaves().map((d) => {
      const [track, album, artist] = d.ancestors();
      return {
        ...d,
        artistName: artist?.data?.name,
        albumName: album?.data?.name,
      };
    });

    // === 🎨 Add artist (depth 1) and album (depth 2) labels ===
    const labelGroups = svg
      .selectAll("g.label")
      .data(root.descendants().filter((d) => d.depth === 1 || d.depth === 2)) // artist & album nodes
      .join("g")
      .attr("class", "label");

    labelGroups
      .append("text")
      .attr("x", (d) => d.x0 + 4)
      .attr("y", (d) => d.y0 + 16)
      .text((d) => d.data.name + ` (${d.value.toLocaleString()})`)
      .style("font-size", (d) => (d.depth === 1 ? "16px" : "12px"))
      .style("font-weight", (d) => (d.depth === 1 ? "bold" : "500"))
      .style("fill", (d) => (d.depth === 1 ? "#fff" : "#ccc"))
      .style("pointer-events", "none");

    const groups = svg
      .selectAll("g.track")
      .data(trackNodes)
      .join("g")
      .attr("class", "track")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    // ✅ 5️⃣ Draw rectangles
    groups
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => color(d.artistName))
      .attr("stroke", "#ffffffff");

    // ✅ 6️⃣ Track labels
    groups
      .append("text")
      .attr("x", 4)
      .attr("y", 14)
      .text((d) => d.data.name)
      .style("font-size", "10px")
      .style("fill", "white")
      .style("pointer-events", "none");

    // ✅ 7️⃣ Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.8)")
      .style("color", "white")
      .style("padding", "4px 8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("visibility", "hidden");

    groups
      .on("mousemove", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .style("top", event.pageY + 10 + "px")
          .style("left", event.pageX + 10 + "px")
          .html(
            `<strong>${d.data.name}</strong><br>
             Album: ${d.albumName}<br>
             Artist: ${d.artistName}<br>
             Plays: ${d.value.toLocaleString()}<br>
             Ratio in Album: ${d.data.ratio.toFixed(2)}%`
          );
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));

    return () => tooltip.remove();
  }, [data, width, height]);

  return <svg height={height} width={width} ref={ref}></svg>;
};

export default Treemap;
