function execute() {
  const size = {
      svg: {
        width: (screen.width || 900),
        height: (screen.height || 700)
      },
      node: {
        width: 200,
        height: 50
      }
    };

    const gMargin={
      left: 0,
      top: 0
    };

    const svg = d3.select(".network-graph-container")
      .append("svg")
      .attr("width", size.svg.width)
      .attr("height", size.svg.height)
      .append("g")
      .attr("transform","translate("+gMargin.left+","+gMargin.top+")");

    const force = d3.layout.force()
        .gravity(0)
        .charge(-250)
        .linkDistance(500)
        .size([size.svg.width, size.svg.height]);

    const linkStatusColor = {
      WARNING: "#FFB266",
      GOOD: "#4C9900",
      ERROR: "#FF0000"
    };

    function determineLinkIdsAccordingToOrderOfOccurrenceInNodes(graph, linkDirection) {
      return graph.nodes
        .filter(node => node.id === linkDirection)
        .map(node => graph.nodes.indexOf(node))[0]
    }

    function linkColor(linkInfo) {
      return linkStatusColor[linkInfo.health];
    }

    function nodeRectColor(nodeInfo) {
      return nodeInfo.connected === "true" ? "#CC0066" : "#000000" ;
    }

    d3.json("graph.json", function(json) {
      const normalizedlinks = json.links.map(link => {
          return {
              'source': determineLinkIdsAccordingToOrderOfOccurrenceInNodes(json, link.source),
              'target': determineLinkIdsAccordingToOrderOfOccurrenceInNodes(json, link.target),
              'weight': 4,
              'health': link.health
          }
      })

      force
          .nodes(json.nodes)
          .links(normalizedlinks)
          .start();

      const link = svg.selectAll(".link")
          .data(normalizedlinks)
          .enter()
            .append("line")
            .attr("class", "link")
            .style("stroke", linkColor)
            .style("stroke-width", function(d) { return d.weight; });

      const node = svg.selectAll(".node")
          .data(json.nodes)
          .enter()
            .append("g")
            .attr("class", "node")
            .attr("cursor", "pointer")
            .call(force.drag);

      node.append("rect")
          .attr("width", size.node.width)
          .attr("height", size.node.height)
          .attr("rx", 5)
          .attr("ry", 5)
          .attr("fill-opacity", "0.6")
          .style("fill", nodeRectColor);

      node.append("image")
          .attr("xlink:href", function(d) {return 'images/'+d.image})
          .attr("x", 10)
          .attr("y", 10)
          .attr("width", 30)
          .attr("height", 30);

      node.append("text")
          .attr("dx", 50)
          .attr("dy", "2.5em")
          .style("font-size", "12")
          .style("font-family", "sans-serif")
          .style("fill", "white")
          .text(function(d) { return d.name });

      force.on("tick", function(event) {
        //START: To bound the nodes within the svg area (prevent them from flying away)
        const boundLimit=10;
        const leftBoundLimit=boundLimit, rightBoundLimit=size.svg.width-size.node.width-boundLimit;
        const topBoundLimit=boundLimit, bottomBoundLimit=size.svg.height-size.node.height-boundLimit;

        node.attr("dx", function(d) {
          //left and right bound check
          if (d.x < leftBoundLimit) {
            d.x = leftBoundLimit
          } else if (d.x > rightBoundLimit) {
            d.x = rightBoundLimit
          }
        }).attr("dy", function(d) {
          //top and bottom bound check
          if (d.y < topBoundLimit) {
            d.y = topBoundLimit
          } else if (d.y > bottomBoundLimit) {
            d.y = bottomBoundLimit
          }
        })
        //END

        //START: Adjust link to attach to mid horiontal , vertical and easily accessible left or right or top or bottom of a node (whichever shorter)
        if (event.alpha < 0.01) {
          //optimization+customization FIXME: Any other better way (avoid using jquery)
          //gradually when the animation cools down sufficiently (value of 0.01 , increase the opacity to approved value), after stopping all the animations
          force.stop() //optimzation
          $('.link').css("opacity",0.65) //customization
        } else {
          //initially start with a low link opacity. (otherwise there would be so much link attachment movement visible)
          $('.link').css("opacity",0.1)
          link.attrs(function(d) {
            const point=shortestLinePoint(d)
            return { 'x1': point.source.x, 'y1': point.source.y, 'x2': point.target.x, 'y2': point.target.y };
          });
        }
        //END

        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      });

      function shortestLinePoint(d) {
        const points = {
          "source": {
            'verticalLeft'    : { 'x': d.source.x,                     'y': d.source.y + size.node.height/2 },
            'horizonatTop'    : { 'x': d.source.x + size.node.width/2, 'y': d.source.y },
            'verticalRight'   : { 'x': d.source.x + size.node.width,   'y': d.source.y + size.node.height/2 },
            'horizonatBottom' : { 'x': d.source.x + size.node.width/2, 'y': d.source.y + size.node.height },

            'cornerLeftUp'    : { 'x': d.source.x,                     'y': d.source.y },
            'cornerRightUp'   : { 'x': d.source.x + size.node.width,   'y': d.source.y },
            'cornerLeftDown'  : { 'x': d.source.x,                     'y': d.source.y + size.node.height },
            'cornerRightDown' : { 'x': d.source.x + size.node.width,   'y': d.source.y + size.node.height }
          },
          "target": {
            'verticalLeft'    : { 'x': d.target.x,                     'y': d.target.y + size.node.height/2 },
            'horizonatTop'    : { 'x': d.target.x + size.node.width/2, 'y': d.target.y },
            'verticalRight'   : { 'x': d.target.x + size.node.width,   'y': d.target.y + size.node.height/2 },
            'horizonatBottom' : { 'x': d.target.x + size.node.width/2, 'y': d.target.y + size.node.height },

            'cornerLeftUp'    : { 'x': d.target.x,                     'y': d.target.y },
            'cornerRightUp'   : { 'x': d.target.x + size.node.width,   'y': d.target.y },
            'cornerLeftDown'  : { 'x': d.target.x,                     'y': d.target.y + size.node.height },
            'cornerRightDown' : { 'x': d.target.x + size.node.width,   'y': d.target.y + size.node.height }
          }
        }
        const sourcePoints = Object.values(points.source)
        const targetPoints = Object.values(points.target)
        
        return _.minBy(
          _.flatMap(sourcePoints, source => {
            return _.flatMap(targetPoints, target => {
              const distance = Math.sqrt((target.x - source.x)**2 + (target.y - source.y)**2)
              return { source, target, distance }
            })
          }), point => point.distance)
      }
    });
}