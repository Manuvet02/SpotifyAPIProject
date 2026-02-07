// CalendarByTracks.jsx
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * Props:
 *  - data: array of objects like { day: "2017-06-15", tracks_listened: "11", total_time: "302500" }
 *
 * Behavior:
 *  - Renders one calendar grid per year found in the data
 *  - Color intensity = tracks_listened (per day)
 *  - Tooltip shows day, tracks_listened and total_time (formatted)
 */
const CalendarByTracks = ({
  data,
  width = 960,
  cellSize = 14,
  margin = { top: 30, right: 20, bottom: 20, left: 40 },
}) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) {
      d3.select(ref.current).selectAll("*").remove();
      return;
    }

    // --- parse and normalize input ---
    const parse = d3.utcParse("%Y-%m-%d");
    const normalized = data
      .map((d) => {
        const dt = parse(d.day);
        if (!dt) return null;
        return {
          date: dt,
          dayString: d.day,
          tracks: +d.tracks_listened || 0,
          total_time: +d.total_time || 0,
        };
      })
      .filter(Boolean);

    // group by year (UTC)
    const dataByYear = d3.group(normalized, (d) => d.date.getUTCFullYear());
    const years = Array.from(dataByYear.keys()).sort((a, b) => a - b);

    // compute global color domain (based on tracks listened)
    const maxTracks = d3.max(normalized, (d) => d.tracks) || 1;
    const color = d3
      .scaleSequential()
      .interpolator(d3.interpolateYlOrRd)
      .domain([0, maxTracks]);

    // layout constants
    const yearWidth = width - margin.left - 20; // available width for weeks
    const weeksPerYear = Math.ceil(yearWidth / cellSize); // cap
    const heightPerYear = cellSize * 8 + 30; // 7 days + spacing + top label
    const totalSvgHeight = margin.top + years.length * heightPerYear + 10;

    // prepare svg
    const svg = d3
      .select(ref.current)
      .attr("viewBox", `-50 0 ${width} ${totalSvgHeight}`)
      .style("font-family", "sans-serif")
      .style("background", "#ffffff");

    svg.selectAll("*").remove();

    // tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "calendar-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("padding", "6px 8px")
      .style("background", "rgba(0,0,0,0.85)")
      .style("color", "#fff")
      .style("font-size", "12px")
      .style("border-radius", "4px")
      .style("visibility", "hidden");

    // helper formatters
    const formatMonth = d3.utcFormat("%b");
    const formatDate = d3.utcFormat("%Y-%m-%d");
    const formatTime = (ms) => {
      // convert milliseconds -> HH:MM:SS (approx)
      const s = Math.floor(ms / 1000);
      const hh = Math.floor(s / 3600);
      const mm = Math.floor((s % 3600) / 60);
      const ss = s % 60;
      return `${hh}h ${mm}m ${ss}s`;
    };

    // draw each year
    const gYear = svg
      .selectAll("g.year")
      .data(years)
      .join("g")
      .attr("class", "year")
      .attr(
        "transform",
        (y, i) => `translate(${margin.left}, ${margin.top + i * heightPerYear})`
      );

    gYear.each(function (year) {
      const g = d3.select(this);
      const yearData = dataByYear.get(year) || [];
      const countByDate = new Map(yearData.map((d) => [+d.date, d]));

      // year label
      g.append("text")
        .attr("x", -36)
        .attr("y", 10)
        .text(year)
        .style("fill", "#000000ff")
        .style("font-size", "14px")
        .style("font-weight", "600");

      // compute days for that year (UTC)
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year + 1, 0, 1));
      const days = d3.utcDays(start, end);

      // weekly index function (count of weeks since start of year)
      const weekIndex = (d) => d3.utcWeek.count(d3.utcYear(d), d);

      // squares
      g.selectAll("rect.day")
        .data(days)
        .join("rect")
        .attr("class", "day")
        .attr("width", cellSize - 1) // small gap
        .attr("height", cellSize - 1)
        .attr("x", (d) => weekIndex(d) * cellSize)
        .attr("y", (d) => d.getUTCDay() * cellSize + 12)
        .attr("fill", (d) => {
          const rec = countByDate.get(+d);
          return rec ? color(rec.tracks) : "#2a2a2a";
        })
        .attr("stroke", "#111")
        .on("mousemove", (event, d) => {
          const rec = countByDate.get(+d);
          tooltip
            .style("visibility", "visible")
            .style("top", event.pageY + 12 + "px")
            .style("left", event.pageX + 12 + "px")
            .html(
              `<strong>${formatDate(d)}</strong><br/>
               Plays: ${rec ? rec.tracks : 0}<br/>
               Time: ${rec ? formatTime(rec.total_time) : "0s"}`
            );
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

      // month labels (place at first week where month begins)
      const months = d3.utcMonths(start, end);
      g.selectAll("text.month")
        .data(months)
        .join("text")
        .attr("class", "month")
        .attr("x", (d) => weekIndex(d) * cellSize + 2)
        .attr("y", 8)
        .text(formatMonth)
        .style("fill", "#000000ff")
        .style("font-size", "11px");

      // day of week labels (S M T ...)
      const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
      g.selectAll("text.dow")
        .data(daysOfWeek)
        .join("text")
        .attr("class", "dow")
        .attr("x", -24)
        .attr("y", (d, i) => i * cellSize + 12 + 12) // +12 offset
        .text((d) => d)
        .style("fill", "#000000ff")
        .style("font-size", "10px");
    });

    // cleanup on unmount
    return () => {
      tooltip.remove();
    };
  }, [data, width, cellSize, margin]);

  return (
    <svg
      ref={ref}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  );
};

export default CalendarByTracks;
