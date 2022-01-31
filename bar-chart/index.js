// select the svg container first
const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", 600)
  .attr("height", 600);

// create margins & dimensions
const margin = { top: 20, right: 20, bottom: 100, left: 100 };
const graphWidth = 600 - margin.left - margin.right;
const graphHeight = 600 - margin.top - margin.bottom;

const graph = svg
  .append("g")
  .attr("width", graphWidth)
  .attr("height", graphHeight)
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

const x = d3
  .scaleBand()
  .range([0, graphWidth])
  .paddingInner(0.2)
  .paddingOuter(0.2);
const y = d3.scaleLinear().range([graphHeight, 0]);

// create axes groups
const xAxisGroup = graph
  .append("g")
  .attr("transform", `translate(0, ${graphHeight})`);
const yAxisGroup = graph.append("g");

// create & call axis
const xAxis = d3.axisBottom(x);
const yAxis = d3
  .axisLeft(y)
  .ticks(3)
  .tickFormat((d) => `${d} orders`);

const t = d3.transition().duration();

const update = (data) => {
  // update scale domains
  x.domain(data.map((d) => d.name));
  y.domain([0, d3.max(data, (d) => d.orders)]);

  // join data to rects
  const rects = graph.selectAll("rect").data(data);

  // remove exit selection
  rects.exit().remove();

  // update current shapes in DOM
  rects
    .attr("width", x.bandwidth)
    .attr("height", (d) => graphHeight - y(d.orders))
    .attr("fill", "orange");

  // update the enter selection to the DOM
  rects
    .enter()
    .append("rect")
    .attr("width", x.bandwidth)
    .attr("fill", "orange")
    .attr("x", (d) => x(d.name))
    .attr("height", 0)
    .attr("y", (d) => graphHeight)
    .merge(rects) // 이 아래 코드는 위아래 selection 모두 적용
    .transition(t)
    .attrTween("width", widthTween)
    .attr("height", (d) => graphHeight - y(d.orders))
    .attr("y", (d) => y(d.orders));

  // call axes
  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);

  xAxisGroup
    .selectAll("text")
    .attr("fill", "orange")
    .attr("transform", "rotate(-40)")
    .attr("text-anchor", "end");
};

let data = [];

db.collection("dishes").onSnapshot((res) => {
  res.docChanges().forEach((change) => {
    const doc = { ...change.doc.data(), id: change.doc.id };

    switch (change.type) {
      case "added":
        data.push(doc);
        break;

      case "modified":
        const index = data.findIndex((item) => item.id === doc.id);
        data[index] = doc;
        break;

      case "removed":
        data = data.filter((item) => item.id !== doc.id);
        break;
      default:
        return;
    }
  });

  update(data);
});

const widthTween = (d) => {
  const i = d3.interpolate(0, x.bandwidth());
  return function (t) {
    return i(t);
  };
};
