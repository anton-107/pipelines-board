(function () {
  function stringToPercentage(str) {
    if (str === 'left') {
      return 0;
    }
    if (str === 'right') {
      return 100;
    }
    if (str === 'top') {
      return 0;
    }
    if (str === 'bottom') {
      return 100;
    }
    if (str === 'middle') {
      return 50;
    }

    return parseFloat(str);
  }

  var PipelinesBoard = function (parentEl, options) {
    options = options || {};
    var markersFillColor = options.markersFillColor || '#000';

    this.parentEl = document.getElementById(parentEl);
    if (!this.parentEl) {
      throw Error("Please specify existing parent element in new PipelinesBoard(...)")
    }

    // create svg element:
    this.svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svgEl.setAttribute('class', 'pipelines-board__svg-overlay');
    this.svgEl.setAttribute('width', '100%');
    this.svgEl.setAttribute('height', '100%');
    this.svgEl.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

    // add markers:
    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    var arrowRightMarker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    arrowRightMarker.setAttribute("id", "arrowRight");
    arrowRightMarker.setAttribute("markerWidth", "10");
    arrowRightMarker.setAttribute("markerHeight", "10");
    arrowRightMarker.setAttribute("refX", "0");
    arrowRightMarker.setAttribute("refY", "3");
    arrowRightMarker.setAttribute("orient", "auto");
    arrowRightMarker.setAttribute("markerUnits", "strokeWidth");
    arrowRightMarker.innerHTML = '<path d="M0,0 L0,6 L10,3 z" fill="' + markersFillColor + '" />';
    defs.append(arrowRightMarker);

    var arrowLeftMarker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    arrowLeftMarker.setAttribute("id", "arrowLeft");
    arrowLeftMarker.setAttribute("markerWidth", "10");
    arrowLeftMarker.setAttribute("markerHeight", "10");
    arrowLeftMarker.setAttribute("refX", "10");
    arrowLeftMarker.setAttribute("refY", "3");
    arrowLeftMarker.setAttribute("orient", "auto");
    arrowLeftMarker.setAttribute("markerUnits", "strokeWidth");
    arrowLeftMarker.innerHTML = '<path d="M9,0 L9,6 L0,3 z" fill="' + markersFillColor + '" />';
    defs.append(arrowLeftMarker);

    var circleMarker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    circleMarker.setAttribute("id", "circle");
    circleMarker.setAttribute("markerWidth", "6");
    circleMarker.setAttribute("markerHeight", "6");
    circleMarker.setAttribute("refX", "3");
    circleMarker.setAttribute("refY", "3");
    circleMarker.setAttribute("orient", "auto");
    circleMarker.setAttribute("markerUnits", "strokeWidth");
    circleMarker.innerHTML = '<circle cx="3" cy="3" r="3" fill="' + markersFillColor + '" />';
    defs.append(circleMarker);

    this.svgEl.append(defs);
    this.parentEl.append(this.svgEl);
  };

  PipelinesBoard.prototype.clean = function () {
    var children = Array.from(this.svgEl.children);
    for (var i = 0, l = children.length; i < l; i++) {
      var node = children[i];
      if (node.tagName !== 'defs') {
        node.remove();
      }
    }
  };

  PipelinesBoard.prototype.arrowLine = function (options) {
    return new ArrowLine(this.svgEl, options);
  };

  var ArrowLine = function (svgCanvas, options) {
    this.svgCanvas = svgCanvas;
    var canvasRectangle = new Rectangle(this.svgCanvas);
    this.canvasTopLeftCorner = new Point(canvasRectangle.getX(), canvasRectangle.getY());

    this.options = Object.assign({}, {
      startOn: "right middle",
      endOn: "left middle",
      lineColor: "black",
      lineTension: 1,
      markerStartColor: "black",
      markerEndColor: "black",
      markerStart: null,
      markerEnd: null
    }, options);

    var startPointParts = this.options.startOn.split(" ");
    if (startPointParts.length !== 2) {
      throw Error("please specify startOn option for new ArrowLine as in: 'right middle'");
    }
    this.lineStartPoint = new RelativePointPercentage(stringToPercentage(startPointParts[0]), stringToPercentage(startPointParts[1]));

    var endPointParts = this.options.endOn.split(" ");
    if (endPointParts.length !== 2) {
      throw Error("please specify endOn option for new ArrowLine as in: 'right middle'");
    }
    this.lineEndPoint = new RelativePointPercentage(stringToPercentage(endPointParts[0]), stringToPercentage(endPointParts[1]));
  };

  ArrowLine.prototype.from = function (elId) {
    var el = document.getElementById(elId);
    if (!el) {
      throw Error("Please specify an existing element's id in arrow.from(...)");
    }

    this.fromRectangle = new Rectangle(el);
    return this;
  };

  ArrowLine.prototype.to = function (elId) {
    var el = document.getElementById(elId);
    if (!el) {
      throw Error("Please specify an existing element's id in arrow.to(...)");
    }

    this.toRectangle = new Rectangle(el);

    this.fromPoint = this.lineStartPoint.abs(this.fromRectangle).minus(this.canvasTopLeftCorner);
    this.toPoint = this.lineEndPoint.abs(this.toRectangle).minus(this.canvasTopLeftCorner);

    this.line = new Line(this.fromPoint, this.toPoint, {
      color: this.options.lineColor,
      tension: this.options.lineTension,
      markerStart: this.options.markerStart,
      markerEnd: this.options.markerEnd,
    });
    this.line.draw().append(this.svgCanvas);

    return this;
  };

  var Line = function (fromPoint, toPoint, options) {
    options = options || {};

    this.fromPoint = fromPoint;
    this.toPoint = toPoint;
    this.color = options.color || 'black';
    this.tension = options.tension || 1;

    this.markerStart = options.markerStart;
    this.markerEnd = options.markerEnd;

    if (this.markerStart === 'arrowLeft') {
      this.fromPoint.x += 10;
    }

    if (this.markerEnd === 'arrowRight') {
      this.toPoint.x -= 10;
    }
  };

  Line.prototype.draw = function () {
    var shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var delta = (this.toPoint.x - this.fromPoint.x) * this.tension;

    var hx1 = this.fromPoint.x + delta;
    var hy1 = this.fromPoint.y;
    var hx2 = this.toPoint.x - delta;
    var hy2 = this.toPoint.y;

    var path = "M " + this.fromPoint.x + " " + this.fromPoint.y +
      " C " + hx1 + " " + hy1
      + " " + hx2 + " " + hy2
      + " " + this.toPoint.x + " " + this.toPoint.y;

    shape.setAttributeNS(null, "d", path);
    shape.setAttributeNS(null, "fill", "none");
    shape.setAttributeNS(null, "stroke", this.color);

    if (this.markerStart) {
      shape.setAttributeNS(null, "marker-start", 'url(#' + this.markerStart + ')');
    }

    if (this.markerEnd) {
      shape.setAttributeNS(null, "marker-end", 'url(#' + this.markerEnd + ')');
    }

    return new Shape(shape);
  };

  var Shape = function (svgEl) {
    this.svgEl = svgEl;
  };

  Shape.prototype.append = function (svgCanvas) {
    svgCanvas.appendChild(this.svgEl);
  };

  var Point = function (x, y) {
    this.x = x;
    this.y = y;
  };

  Point.prototype.minus = function (point) {
    return new Point(
      this.x - point.x,
      this.y - point.y
    )
  };

  var Rectangle = function (el) {
    this.boundingRectangle = el.getBoundingClientRect();
  };

  Rectangle.prototype.getX = function () {
    return this.boundingRectangle.left;
  };

  Rectangle.prototype.getWidth = function () {
    return this.boundingRectangle.width;
  };

  Rectangle.prototype.getY = function () {
    return this.boundingRectangle.top;
  };

  Rectangle.prototype.getHeight = function () {
    return this.boundingRectangle.height;
  };

  var RelativePointPercentage = function (percentageLeft, percentageTop) {
    if (typeof percentageLeft !== 'number') {
      throw Error('RelativePointPercentage.percentageLeft must be a number');
    }
    if (typeof percentageTop !== 'number') {
      throw Error('RelativePointPercentage.percentageTop must be a number');
    }

    this.percentageLeft = percentageLeft;
    this.percentageTop = percentageTop;
  };

  RelativePointPercentage.prototype.abs = function (rectangle) {
    return new Point(
      rectangle.getX() + rectangle.getWidth() * this.percentageLeft * 0.01,
      rectangle.getY() + rectangle.getHeight() * this.percentageTop * 0.01,
    )
  };

  window.PipelinesBoard = PipelinesBoard;
})();
