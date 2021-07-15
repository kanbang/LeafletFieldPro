/*
 * @Descripttion: 
 * @version: 0.x
 * @Author: zhai
 * @Date: 2021-07-13 15:47:38
 * @LastEditors: zhai
 * @LastEditTime: 2021-07-15 18:44:56
 */



  /*
   * @namespace Util
   *
   * Various utility functions, used by Leaflet internally.
   */

  // @function extend(dest: Object, src?: Object): Object
  // Merges the properties of the `src` object (or multiple objects) into `dest` object and returns the latter. Has an `L.extend` shortcut.
  function extend(dest) {
    var i, j, len, src;

    for (j = 1, len = arguments.length; j < len; j++) {
        src = arguments[j];
        for (i in src) {
            dest[i] = src[i];
        }
    }
    return dest;
}

// @function create(proto: Object, properties?: Object): Object
// Compatibility polyfill for [Object.create](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
var create = Object.create || (function () {
    function F() {}
    return function (proto) {
        F.prototype = proto;
        return new F();
    };
})();

// @function bind(fn: Function, …): Function
// Returns a new function bound to the arguments passed, like [Function.prototype.bind](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
// Has a `L.bind()` shortcut.
function bind(fn, obj) {
    var slice = Array.prototype.slice;

    if (fn.bind) {
        return fn.bind.apply(fn, slice.call(arguments, 1));
    }

    var args = slice.call(arguments, 2);

    return function () {
        return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
    };
}


// @function isArray(obj): Boolean
// Compatibility polyfill for [Array.isArray](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)
var isArray = Array.isArray || function (obj) {
    return (Object.prototype.toString.call(obj) === '[object Array]');
};



// @class Class
// @aka L.Class

// @section
// @uninheritable

// Thanks to John Resig and Dean Edwards for inspiration!

function Class() {}

Class.extend = function (props) {

    // @function extend(props: Object): Function
    // [Extends the current class](#class-inheritance) given the properties to be included.
    // Returns a Javascript function that is a class constructor (to be called with `new`).
    var NewClass = function () {

        // call the constructor
        if (this.initialize) {
            this.initialize.apply(this, arguments);
        }

        // call all constructor hooks
        this.callInitHooks();
    };

    var parentProto = NewClass.__super__ = this.prototype;

    var proto = create(parentProto);
    proto.constructor = NewClass;

    NewClass.prototype = proto;

    // inherit parent's statics
    for (var i in this) {
        if (Object.prototype.hasOwnProperty.call(this, i) && i !== 'prototype' && i !== '__super__') {
            NewClass[i] = this[i];
        }
    }

    // mix static properties into the class
    if (props.statics) {
        extend(NewClass, props.statics);
        delete props.statics;
    }

    // mix includes into the prototype
    if (props.includes) {
        checkDeprecatedMixinEvents(props.includes);
        extend.apply(null, [proto].concat(props.includes));
        delete props.includes;
    }

    // merge options
    if (proto.options) {
        props.options = extend(create(proto.options), props.options);
    }

    // mix given properties into the prototype
    extend(proto, props);

    proto._initHooks = [];

    // add method for calling all hooks
    proto.callInitHooks = function () {

        if (this._initHooksCalled) {
            return;
        }

        if (parentProto.callInitHooks) {
            parentProto.callInitHooks.call(this);
        }

        this._initHooksCalled = true;

        for (var i = 0, len = proto._initHooks.length; i < len; i++) {
            proto._initHooks[i].call(this);
        }
    };

    return NewClass;
};


// @function include(properties: Object): this
// [Includes a mixin](#class-includes) into the current class.
Class.include = function (props) {
    extend(this.prototype, props);
    return this;
};

// @function mergeOptions(options: Object): this
// [Merges `options`](#class-options) into the defaults of the class.
Class.mergeOptions = function (options) {
    extend(this.prototype.options, options);
    return this;
};

// @function addInitHook(fn: Function): this
// Adds a [constructor hook](#class-constructor-hooks) to the class.
Class.addInitHook = function (fn) { // (Function) || (String, args...)
    var args = Array.prototype.slice.call(arguments, 1);

    var init = typeof fn === 'function' ? fn : function () {
        this[fn].apply(this, args);
    };

    this.prototype._initHooks = this.prototype._initHooks || [];
    this.prototype._initHooks.push(init);
    return this;
};

function checkDeprecatedMixinEvents(includes) {
    if (typeof L === 'undefined' || !L || !L.Mixin) {
        return;
    }

    includes = isArray(includes) ? includes : [includes];

    for (var i = 0; i < includes.length; i++) {
        if (includes[i] === L.Mixin.Events) {
            console.warn('Deprecated include of L.Mixin.Events: ' +
                'this property will be removed in future releases, ' +
                'please inherit from L.Evented instead.', new Error().stack);
        }
    }
}


/*
 * @class Point
 * @aka L.Point
 *
 * Represents a point with `x` and `y` coordinates in pixels.
 *
 * @example
 *
 * ```js
 * var point = L.point(200, 300);
 * ```
 *
 * All Leaflet methods and options that accept `Point` objects also accept them in a simple Array form (unless noted otherwise), so these lines are equivalent:
 *
 * ```js
 * map.panBy([200, 300]);
 * map.panBy(L.point(200, 300));
 * ```
 *
 * Note that `Point` does not inherit from Leaflet's `Class` object,
 * which means new classes can't inherit from it, and new methods
 * can't be added to it with the `include` function.
 */

function Point(x, y, round) {
    // @property x: Number; The `x` coordinate of the point
    this.x = (round ? Math.round(x) : x);
    // @property y: Number; The `y` coordinate of the point
    this.y = (round ? Math.round(y) : y);
}

var trunc = Math.trunc || function (v) {
    return v > 0 ? Math.floor(v) : Math.ceil(v);
};

Point.prototype = {

    // @method clone(): Point
    // Returns a copy of the current point.
    clone: function () {
        return new Point(this.x, this.y);
    },

    // @method add(otherPoint: Point): Point
    // Returns the result of addition of the current and the given points.
    add: function (point) {
        // non-destructive, returns a new point
        return this.clone()._add(toPoint(point));
    },

    _add: function (point) {
        // destructive, used directly for performance in situations where it's safe to modify existing point
        this.x += point.x;
        this.y += point.y;
        return this;
    },

    // @method subtract(otherPoint: Point): Point
    // Returns the result of subtraction of the given point from the current.
    subtract: function (point) {
        return this.clone()._subtract(toPoint(point));
    },

    _subtract: function (point) {
        this.x -= point.x;
        this.y -= point.y;
        return this;
    },

    // @method divideBy(num: Number): Point
    // Returns the result of division of the current point by the given number.
    divideBy: function (num) {
        return this.clone()._divideBy(num);
    },

    _divideBy: function (num) {
        this.x /= num;
        this.y /= num;
        return this;
    },

    // @method multiplyBy(num: Number): Point
    // Returns the result of multiplication of the current point by the given number.
    multiplyBy: function (num) {
        return this.clone()._multiplyBy(num);
    },

    _multiplyBy: function (num) {
        this.x *= num;
        this.y *= num;
        return this;
    },

    // @method scaleBy(scale: Point): Point
    // Multiply each coordinate of the current point by each coordinate of
    // `scale`. In linear algebra terms, multiply the point by the
    // [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
    // defined by `scale`.
    scaleBy: function (point) {
        return new Point(this.x * point.x, this.y * point.y);
    },

    // @method unscaleBy(scale: Point): Point
    // Inverse of `scaleBy`. Divide each coordinate of the current point by
    // each coordinate of `scale`.
    unscaleBy: function (point) {
        return new Point(this.x / point.x, this.y / point.y);
    },

    // @method round(): Point
    // Returns a copy of the current point with rounded coordinates.
    round: function () {
        return this.clone()._round();
    },

    _round: function () {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    },

    // @method floor(): Point
    // Returns a copy of the current point with floored coordinates (rounded down).
    floor: function () {
        return this.clone()._floor();
    },

    _floor: function () {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    },

    // @method ceil(): Point
    // Returns a copy of the current point with ceiled coordinates (rounded up).
    ceil: function () {
        return this.clone()._ceil();
    },

    _ceil: function () {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    },

    // @method trunc(): Point
    // Returns a copy of the current point with truncated coordinates (rounded towards zero).
    trunc: function () {
        return this.clone()._trunc();
    },

    _trunc: function () {
        this.x = trunc(this.x);
        this.y = trunc(this.y);
        return this;
    },

    // @method distanceTo(otherPoint: Point): Number
    // Returns the cartesian distance between the current and the given points.
    distanceTo: function (point) {
        point = toPoint(point);

        var x = point.x - this.x,
            y = point.y - this.y;

        return Math.sqrt(x * x + y * y);
    },

    // @method equals(otherPoint: Point): Boolean
    // Returns `true` if the given point has the same coordinates.
    equals: function (point) {
        point = toPoint(point);

        return point.x === this.x &&
            point.y === this.y;
    },

    // @method contains(otherPoint: Point): Boolean
    // Returns `true` if both coordinates of the given point are less than the corresponding current point coordinates (in absolute values).
    contains: function (point) {
        point = toPoint(point);

        return Math.abs(point.x) <= Math.abs(this.x) &&
            Math.abs(point.y) <= Math.abs(this.y);
    },

    // @method toString(): String
    // Returns a string representation of the point for debugging purposes.
    toString: function () {
        return 'Point(' +
            formatNum(this.x) + ', ' +
            formatNum(this.y) + ')';
    }
};


// @factory L.point(x: Number, y: Number, round?: Boolean)
// Creates a Point object with the given `x` and `y` coordinates. If optional `round` is set to true, rounds the `x` and `y` values.

// @alternative
// @factory L.point(coords: Number[])
// Expects an array of the form `[x, y]` instead.

// @alternative
// @factory L.point(coords: Object)
// Expects a plain object of the form `{x: Number, y: Number}` instead.
function toPoint(x, y, round) {
    if (x instanceof Point) {
        return x;
    }
    if (isArray(x)) {
        return new Point(x[0], x[1]);
    }
    if (x === undefined || x === null) {
        return x;
    }
    if (typeof x === 'object' && 'x' in x && 'y' in x) {
        return new Point(x.x, x.y);
    }
    return new Point(x, y, round);
}

function toLatLng(a, b, c) {
    if (a instanceof LatLng) {
        return a;
    }
    if (isArray(a) && typeof a[0] !== 'object') {
        if (a.length === 3) {
            return new LatLng(a[0], a[1], a[2]);
        }
        if (a.length === 2) {
            return new LatLng(a[0], a[1]);
        }
        return null;
    }
    if (a === undefined || a === null) {
        return a;
    }
    if (typeof a === 'object' && 'lat' in a) {
        return new LatLng(a.lat, 'lng' in a ? a.lng : a.lon, a.alt);
    }
    if (b === undefined) {
        return null;
    }
    return new LatLng(a, b, c);
}


/*
 * @class Bounds
 * @aka L.Bounds
 *
 * Represents a rectangular area in pixel coordinates.
 *
 * @example
 *
 * ```js
 * var p1 = L.point(10, 10),
 * p2 = L.point(40, 60),
 * bounds = L.bounds(p1, p2);
 * ```
 *
 * All Leaflet methods that accept `Bounds` objects also accept them in a simple Array form (unless noted otherwise), so the bounds example above can be passed like this:
 *
 * ```js
 * otherBounds.intersects([[10, 10], [40, 60]]);
 * ```
 *
 * Note that `Bounds` does not inherit from Leaflet's `Class` object,
 * which means new classes can't inherit from it, and new methods
 * can't be added to it with the `include` function.
 */

function Bounds(a, b) {
    if (!a) {
        return;
    }

    var points = b ? [a, b] : a;

    for (var i = 0, len = points.length; i < len; i++) {
        this.extend(points[i]);
    }
}

Bounds.prototype = {
    // @method extend(point: Point): this
    // Extends the bounds to contain the given point.
    extend: function (point) { // (Point)
        point = toPoint(point);

        // @property min: Point
        // The top left corner of the rectangle.
        // @property max: Point
        // The bottom right corner of the rectangle.
        if (!this.min && !this.max) {
            this.min = point.clone();
            this.max = point.clone();
        } else {
            this.min.x = Math.min(point.x, this.min.x);
            this.max.x = Math.max(point.x, this.max.x);
            this.min.y = Math.min(point.y, this.min.y);
            this.max.y = Math.max(point.y, this.max.y);
        }
        return this;
    },

    // @method getCenter(round?: Boolean): Point
    // Returns the center point of the bounds.
    getCenter: function (round) {
        return new Point(
            (this.min.x + this.max.x) / 2,
            (this.min.y + this.max.y) / 2, round);
    },

    // @method getBottomLeft(): Point
    // Returns the bottom-left point of the bounds.
    getBottomLeft: function () {
        return new Point(this.min.x, this.max.y);
    },

    // @method getTopRight(): Point
    // Returns the top-right point of the bounds.
    getTopRight: function () { // -> Point
        return new Point(this.max.x, this.min.y);
    },

    // @method getTopLeft(): Point
    // Returns the top-left point of the bounds (i.e. [`this.min`](#bounds-min)).
    getTopLeft: function () {
        return this.min; // left, top
    },

    // @method getBottomRight(): Point
    // Returns the bottom-right point of the bounds (i.e. [`this.max`](#bounds-max)).
    getBottomRight: function () {
        return this.max; // right, bottom
    },

    // @method getSize(): Point
    // Returns the size of the given bounds
    getSize: function () {
        return this.max.subtract(this.min);
    },

    // @method contains(otherBounds: Bounds): Boolean
    // Returns `true` if the rectangle contains the given one.
    // @alternative
    // @method contains(point: Point): Boolean
    // Returns `true` if the rectangle contains the given point.
    contains: function (obj) {
        var min, max;

        if (typeof obj[0] === 'number' || obj instanceof Point) {
            obj = toPoint(obj);
        } else {
            obj = toBounds(obj);
        }

        if (obj instanceof Bounds) {
            min = obj.min;
            max = obj.max;
        } else {
            min = max = obj;
        }

        return (min.x >= this.min.x) &&
            (max.x <= this.max.x) &&
            (min.y >= this.min.y) &&
            (max.y <= this.max.y);
    },

    // @method intersects(otherBounds: Bounds): Boolean
    // Returns `true` if the rectangle intersects the given bounds. Two bounds
    // intersect if they have at least one point in common.
    intersects: function (bounds) { // (Bounds) -> Boolean
        bounds = toBounds(bounds);

        var min = this.min,
            max = this.max,
            min2 = bounds.min,
            max2 = bounds.max,
            xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
            yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

        return xIntersects && yIntersects;
    },

    // @method overlaps(otherBounds: Bounds): Boolean
    // Returns `true` if the rectangle overlaps the given bounds. Two bounds
    // overlap if their intersection is an area.
    overlaps: function (bounds) { // (Bounds) -> Boolean
        bounds = toBounds(bounds);

        var min = this.min,
            max = this.max,
            min2 = bounds.min,
            max2 = bounds.max,
            xOverlaps = (max2.x > min.x) && (min2.x < max.x),
            yOverlaps = (max2.y > min.y) && (min2.y < max.y);

        return xOverlaps && yOverlaps;
    },

    isValid: function () {
        return !!(this.min && this.max);
    }
};


// @factory L.bounds(corner1: Point, corner2: Point)
// Creates a Bounds object from two corners coordinate pairs.
// @alternative
// @factory L.bounds(points: Point[])
// Creates a Bounds object from the given array of points.
function toBounds(a, b) {
    if (!a || a instanceof Bounds) {
        return a;
    }
    return new Bounds(a, b);
}



// @function getPosition(el: HTMLElement): Point
// Returns the coordinates of an element previously positioned with setPosition.
function getPosition(el) {
    // this method is only used for elements previously positioned using setPosition,
    // so it's safe to cache the position for performance

    return el._leaflet_pos || new Point(0, 0);
}


/*
 * @namespace Projection
 * @section
 * Leaflet comes with a set of already defined Projections out of the box:
 *
 * @projection L.Projection.LonLat
 *
 * Equirectangular, or Plate Carree projection — the most simple projection,
 * mostly used by GIS enthusiasts. Directly maps `x` as longitude, and `y` as
 * latitude. Also suitable for flat worlds, e.g. game maps. Used by the
 * `EPSG:4326` and `Simple` CRS.
 */

var LonLat = {
    project: function (latlng) {
        return new Point(latlng.lng, latlng.lat);
    },

    unproject: function (point) {
        return new LatLng(point.y, point.x);
    },

    bounds: new Bounds([-180, -90], [180, 90])
};



/*
 * @namespace Projection
 * @projection L.Projection.Mercator
 *
 * Elliptical Mercator projection — more complex than Spherical Mercator. Assumes that Earth is an ellipsoid. Used by the EPSG:3395 CRS.
 */

var Mercator = {
    R: 6378137,
    R_MINOR: 6356752.314245179,

    bounds: new Bounds([-20037508.34279, -15496570.73972], [20037508.34279, 18764656.23138]),

    project: function (latlng) {
        var d = Math.PI / 180,
            r = this.R,
            y = latlng.lat * d,
            tmp = this.R_MINOR / r,
            e = Math.sqrt(1 - tmp * tmp),
            con = e * Math.sin(y);

        var ts = Math.tan(Math.PI / 4 - y / 2) / Math.pow((1 - con) / (1 + con), e / 2);
        y = -r * Math.log(Math.max(ts, 1E-10));

        return new Point(latlng.lng * d * r, y);
    },

    unproject: function (point) {
        var d = 180 / Math.PI,
            r = this.R,
            tmp = this.R_MINOR / r,
            e = Math.sqrt(1 - tmp * tmp),
            ts = Math.exp(-point.y / r),
            phi = Math.PI / 2 - 2 * Math.atan(ts);

        for (var i = 0, dphi = 0.1, con; i < 15 && Math.abs(dphi) > 1e-7; i++) {
            con = e * Math.sin(phi);
            con = Math.pow((1 - con) / (1 + con), e / 2);
            dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi;
            phi += dphi;
        }

        return new LatLng(phi * d, point.x * d / r);
    }
};



/*
 * @namespace CRS
 * @crs L.CRS.Base
 * Object that defines coordinate reference systems for projecting
 * geographical points into pixel (screen) coordinates and back (and to
 * coordinates in other units for [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services). See
 * [spatial reference system](http://en.wikipedia.org/wiki/Coordinate_reference_system).
 *
 * Leaflet defines the most usual CRSs by default. If you want to use a
 * CRS not defined by default, take a look at the
 * [Proj4Leaflet](https://github.com/kartena/Proj4Leaflet) plugin.
 *
 * Note that the CRS instances do not inherit from Leaflet's `Class` object,
 * and can't be instantiated. Also, new classes can't inherit from them,
 * and methods can't be added to them with the `include` function.
 */

var CRS = {
    // @method latLngToPoint(latlng: LatLng, zoom: Number): Point
    // Projects geographical coordinates into pixel coordinates for a given zoom.
    latLngToPoint: function (latlng, zoom) {
        var projectedPoint = this.projection.project(latlng),
            scale = this.scale(zoom);

        return this.transformation._transform(projectedPoint, scale);
    },

    // @method pointToLatLng(point: Point, zoom: Number): LatLng
    // The inverse of `latLngToPoint`. Projects pixel coordinates on a given
    // zoom into geographical coordinates.
    pointToLatLng: function (point, zoom) {
        var scale = this.scale(zoom),
            untransformedPoint = this.transformation.untransform(point, scale);

        return this.projection.unproject(untransformedPoint);
    },

    // @method project(latlng: LatLng): Point
    // Projects geographical coordinates into coordinates in units accepted for
    // this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
    project: function (latlng) {
        return this.projection.project(latlng);
    },

    // @method unproject(point: Point): LatLng
    // Given a projected coordinate returns the corresponding LatLng.
    // The inverse of `project`.
    unproject: function (point) {
        return this.projection.unproject(point);
    },

    // @method scale(zoom: Number): Number
    // Returns the scale used when transforming projected coordinates into
    // pixel coordinates for a particular zoom. For example, it returns
    // `256 * 2^zoom` for Mercator-based CRS.
    scale: function (zoom) {
        return 256 * Math.pow(2, zoom);
    },

    // @method zoom(scale: Number): Number
    // Inverse of `scale()`, returns the zoom level corresponding to a scale
    // factor of `scale`.
    zoom: function (scale) {
        return Math.log(scale / 256) / Math.LN2;
    },

    // @method getProjectedBounds(zoom: Number): Bounds
    // Returns the projection's bounds scaled and transformed for the provided `zoom`.
    getProjectedBounds: function (zoom) {
        if (this.infinite) {
            return null;
        }

        var b = this.projection.bounds,
            s = this.scale(zoom),
            min = this.transformation.transform(b.min, s),
            max = this.transformation.transform(b.max, s);

        return new Bounds(min, max);
    },

    // @method distance(latlng1: LatLng, latlng2: LatLng): Number
    // Returns the distance between two geographical coordinates.

    // @property code: String
    // Standard code name of the CRS passed into WMS services (e.g. `'EPSG:3857'`)
    //
    // @property wrapLng: Number[]
    // An array of two numbers defining whether the longitude (horizontal) coordinate
    // axis wraps around a given range and how. Defaults to `[-180, 180]` in most
    // geographical CRSs. If `undefined`, the longitude axis does not wrap around.
    //
    // @property wrapLat: Number[]
    // Like `wrapLng`, but for the latitude (vertical) axis.

    // wrapLng: [min, max],
    // wrapLat: [min, max],

    // @property infinite: Boolean
    // If true, the coordinate space will be unbounded (infinite in both axes)
    infinite: false,

    // @method wrapLatLng(latlng: LatLng): LatLng
    // Returns a `LatLng` where lat and lng has been wrapped according to the
    // CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
    wrapLatLng: function (latlng) {
        var lng = this.wrapLng ? wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng,
            lat = this.wrapLat ? wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat,
            alt = latlng.alt;

        return new LatLng(lat, lng, alt);
    },

    // @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
    // Returns a `LatLngBounds` with the same size as the given one, ensuring
    // that its center is within the CRS's bounds.
    // Only accepts actual `L.LatLngBounds` instances, not arrays.
    wrapLatLngBounds: function (bounds) {
        var center = bounds.getCenter(),
            newCenter = this.wrapLatLng(center),
            latShift = center.lat - newCenter.lat,
            lngShift = center.lng - newCenter.lng;

        if (latShift === 0 && lngShift === 0) {
            return bounds;
        }

        var sw = bounds.getSouthWest(),
            ne = bounds.getNorthEast(),
            newSw = new LatLng(sw.lat - latShift, sw.lng - lngShift),
            newNe = new LatLng(ne.lat - latShift, ne.lng - lngShift);

        return new LatLngBounds(newSw, newNe);
    }
};

/*
 * @namespace CRS
 * @crs L.CRS.Earth
 *
 * Serves as the base for CRS that are global such that they cover the earth.
 * Can only be used as the base for other CRS and cannot be used directly,
 * since it does not have a `code`, `projection` or `transformation`. `distance()` returns
 * meters.
 */

var Earth = extend({}, CRS, {
    wrapLng: [-180, 180],

    // Mean Earth Radius, as recommended for use by
    // the International Union of Geodesy and Geophysics,
    // see http://rosettacode.org/wiki/Haversine_formula
    R: 6371000,

    // distance between two geographical points using spherical law of cosines approximation
    distance: function (latlng1, latlng2) {
        var rad = Math.PI / 180,
            lat1 = latlng1.lat * rad,
            lat2 = latlng2.lat * rad,
            sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2),
            sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2),
            a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return this.R * c;
    }
});

/*
 * @namespace Projection
 * @projection L.Projection.SphericalMercator
 *
 * Spherical Mercator projection — the most common projection for online maps,
 * used by almost all free and commercial tile providers. Assumes that Earth is
 * a sphere. Used by the `EPSG:3857` CRS.
 */

var earthRadius = 6378137;

var SphericalMercator = {

    R: earthRadius,
    MAX_LATITUDE: 85.0511287798,

    project: function (latlng) {
        var d = Math.PI / 180,
            max = this.MAX_LATITUDE,
            lat = Math.max(Math.min(max, latlng.lat), -max),
            sin = Math.sin(lat * d);

        return new Point(
            this.R * latlng.lng * d,
            this.R * Math.log((1 + sin) / (1 - sin)) / 2);
    },

    unproject: function (point) {
        var d = 180 / Math.PI;

        return new LatLng(
            (2 * Math.atan(Math.exp(point.y / this.R)) - (Math.PI / 2)) * d,
            point.x * d / this.R);
    },

    bounds: (function () {
        var d = earthRadius * Math.PI;
        return new Bounds([-d, -d], [d, d]);
    })()
};

/*
 * @class Transformation
 * @aka L.Transformation
 *
 * Represents an affine transformation: a set of coefficients `a`, `b`, `c`, `d`
 * for transforming a point of a form `(x, y)` into `(a*x + b, c*y + d)` and doing
 * the reverse. Used by Leaflet in its projections code.
 *
 * @example
 *
 * ```js
 * var transformation = L.transformation(2, 5, -1, 10),
 * 	p = L.point(1, 2),
 * 	p2 = transformation.transform(p), //  L.point(7, 8)
 * 	p3 = transformation.untransform(p2); //  L.point(1, 2)
 * ```
 */


// factory new L.Transformation(a: Number, b: Number, c: Number, d: Number)
// Creates a `Transformation` object with the given coefficients.
function Transformation(a, b, c, d) {
    if (isArray(a)) {
        // use array properties
        this._a = a[0];
        this._b = a[1];
        this._c = a[2];
        this._d = a[3];
        return;
    }
    this._a = a;
    this._b = b;
    this._c = c;
    this._d = d;
}

Transformation.prototype = {
    // @method transform(point: Point, scale?: Number): Point
    // Returns a transformed point, optionally multiplied by the given scale.
    // Only accepts actual `L.Point` instances, not arrays.
    transform: function (point, scale) { // (Point, Number) -> Point
        return this._transform(point.clone(), scale);
    },

    // destructive transform (faster)
    _transform: function (point, scale) {
        scale = scale || 1;
        point.x = scale * (this._a * point.x + this._b);
        point.y = scale * (this._c * point.y + this._d);
        return point;
    },

    // @method untransform(point: Point, scale?: Number): Point
    // Returns the reverse transformation of the given point, optionally divided
    // by the given scale. Only accepts actual `L.Point` instances, not arrays.
    untransform: function (point, scale) {
        scale = scale || 1;
        return new Point(
            (point.x / scale - this._b) / this._a,
            (point.y / scale - this._d) / this._c);
    }
};

// factory L.transformation(a: Number, b: Number, c: Number, d: Number)

// @factory L.transformation(a: Number, b: Number, c: Number, d: Number)
// Instantiates a Transformation object with the given coefficients.

// @alternative
// @factory L.transformation(coefficients: Array): Transformation
// Expects an coefficients array of the form
// `[a: Number, b: Number, c: Number, d: Number]`.

function toTransformation(a, b, c, d) {
    return new Transformation(a, b, c, d);
}

/*
 * @namespace CRS
 * @crs L.CRS.EPSG3857
 *
 * The most common CRS for online maps, used by almost all free and commercial
 * tile providers. Uses Spherical Mercator projection. Set in by default in
 * Map's `crs` option.
 */

var EPSG3857 = extend({}, Earth, {
    code: 'EPSG:3857',
    projection: SphericalMercator,

    transformation: (function () {
        var scale = 0.5 / (Math.PI * SphericalMercator.R);
        return toTransformation(scale, 0.5, -scale, 0.5);
    }())
});

var EPSG900913 = extend({}, EPSG3857, {
    code: 'EPSG:900913'
});




/*
 * @namespace CRS
 * @crs L.CRS.EPSG3395
 *
 * Rarely used by some commercial tile providers. Uses Elliptical Mercator projection.
 */
var EPSG3395 = extend({}, Earth, {
    code: 'EPSG:3395',
    projection: Mercator,

    transformation: (function () {
        var scale = 0.5 / (Math.PI * Mercator.R);
        return toTransformation(scale, 0.5, -scale, 0.5);
    }())
});

/*
 * @namespace CRS
 * @crs L.CRS.EPSG4326
 *
 * A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
 *
 * Leaflet 1.0.x complies with the [TMS coordinate scheme for EPSG:4326](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification#global-geodetic),
 * which is a breaking change from 0.7.x behaviour.  If you are using a `TileLayer`
 * with this CRS, ensure that there are two 256x256 pixel tiles covering the
 * whole earth at zoom level zero, and that the tile coordinate origin is (-180,+90),
 * or (-180,-90) for `TileLayer`s with [the `tms` option](#tilelayer-tms) set.
 */

var EPSG4326 = extend({}, Earth, {
    code: 'EPSG:4326',
    projection: LonLat,
    transformation: toTransformation(1 / 180, 1, -1 / 180, 0.5)
});

/*
 * @namespace CRS
 * @crs L.CRS.Simple
 *
 * A simple CRS that maps longitude and latitude into `x` and `y` directly.
 * May be used for maps of flat surfaces (e.g. game maps). Note that the `y`
 * axis should still be inverted (going from bottom to top). `distance()` returns
 * simple euclidean distance.
 */

var Simple = extend({}, CRS, {
    projection: LonLat,
    transformation: toTransformation(1, 0, -1, 0),

    scale: function (zoom) {
        return Math.pow(2, zoom);
    },

    zoom: function (scale) {
        return Math.log(scale) / Math.LN2;
    },

    distance: function (latlng1, latlng2) {
        var dx = latlng2.lng - latlng1.lng,
            dy = latlng2.lat - latlng1.lat;

        return Math.sqrt(dx * dx + dy * dy);
    },

    infinite: true
});

CRS.Earth = Earth;
CRS.EPSG3395 = EPSG3395;
CRS.EPSG3857 = EPSG3857;
CRS.EPSG900913 = EPSG900913;
CRS.EPSG4326 = EPSG4326;
CRS.Simple = Simple;




////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

/* @class LatLng
 * @aka L.LatLng
 *
 * Represents a geographical point with a certain latitude and longitude.
 *
 * @example
 *
 * ```
 * var latlng = L.latLng(50.5, 30.5);
 * ```
 *
 * All Leaflet methods that accept LatLng objects also accept them in a simple Array form and simple object form (unless noted otherwise), so these lines are equivalent:
 *
 * ```
 * map.panTo([50, 30]);
 * map.panTo({lon: 30, lat: 50});
 * map.panTo({lat: 50, lng: 30});
 * map.panTo(L.latLng(50, 30));
 * ```
 *
 * Note that `LatLng` does not inherit from Leaflet's `Class` object,
 * which means new classes can't inherit from it, and new methods
 * can't be added to it with the `include` function.
 */

function LatLng(lat, lng, alt) {
    if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
    }

    // @property lat: Number
    // Latitude in degrees
    this.lat = +lat;

    // @property lng: Number
    // Longitude in degrees
    this.lng = +lng;

    // @property alt: Number
    // Altitude in meters (optional)
    if (alt !== undefined) {
        this.alt = +alt;
    }
}

LatLng.prototype = {
    // @method equals(otherLatLng: LatLng, maxMargin?: Number): Boolean
    // Returns `true` if the given `LatLng` point is at the same position (within a small margin of error). The margin of error can be overridden by setting `maxMargin` to a small number.
    equals: function (obj, maxMargin) {
        if (!obj) {
            return false;
        }

        obj = toLatLng(obj);

        var margin = Math.max(
            Math.abs(this.lat - obj.lat),
            Math.abs(this.lng - obj.lng));

        return margin <= (maxMargin === undefined ? 1.0E-9 : maxMargin);
    },

    // @method toString(): String
    // Returns a string representation of the point (for debugging purposes).
    toString: function (precision) {
        return 'LatLng(' +
            formatNum(this.lat, precision) + ', ' +
            formatNum(this.lng, precision) + ')';
    },

    // @method distanceTo(otherLatLng: LatLng): Number
    // Returns the distance (in meters) to the given `LatLng` calculated using the [Spherical Law of Cosines](https://en.wikipedia.org/wiki/Spherical_law_of_cosines).
    distanceTo: function (other) {
        return Earth.distance(this, toLatLng(other));
    },

    // @method wrap(): LatLng
    // Returns a new `LatLng` object with the longitude wrapped so it's always between -180 and +180 degrees.
    wrap: function () {
        return Earth.wrapLatLng(this);
    },

    // @method toBounds(sizeInMeters: Number): LatLngBounds
    // Returns a new `LatLngBounds` object in which each boundary is `sizeInMeters/2` meters apart from the `LatLng`.
    toBounds: function (sizeInMeters) {
        var latAccuracy = 180 * sizeInMeters / 40075017,
            lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);

        return toLatLngBounds(
            [this.lat - latAccuracy, this.lng - lngAccuracy],
            [this.lat + latAccuracy, this.lng + lngAccuracy]);
    },

    clone: function () {
        return new LatLng(this.lat, this.lng, this.alt);
    }
};



////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

/*
 * @class Evented
 * @aka L.Evented
 * @inherits Class
 *
 * A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
 *
 * @example
 *
 * ```js
 * map.on('click', function(e) {
 * 	alert(e.latlng);
 * } );
 * ```
 *
 * Leaflet deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
 *
 * ```js
 * function onClick(e) { ... }
 *
 * map.on('click', onClick);
 * map.off('click', onClick);
 * ```
 */

var Events = {
    /* @method on(type: String, fn: Function, context?: Object): this
     * Adds a listener function (`fn`) to a particular event type of the object. You can optionally specify the context of the listener (object the this keyword will point to). You can also pass several space-separated types (e.g. `'click dblclick'`).
     *
     * @alternative
     * @method on(eventMap: Object): this
     * Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
     */
    on: function (types, fn, context) {

        // types can be a map of types/handlers
        if (typeof types === 'object') {
            for (var type in types) {
                // we don't process space-separated events here for performance;
                // it's a hot path since Layer uses the on(obj) syntax
                this._on(type, types[type], fn);
            }

        } else {
            // types can be a string of space-separated words
            types = splitWords(types);

            for (var i = 0, len = types.length; i < len; i++) {
                this._on(types[i], fn, context);
            }
        }

        return this;
    },

    /* @method off(type: String, fn?: Function, context?: Object): this
     * Removes a previously added listener function. If no function is specified, it will remove all the listeners of that particular event from the object. Note that if you passed a custom context to `on`, you must pass the same context to `off` in order to remove the listener.
     *
     * @alternative
     * @method off(eventMap: Object): this
     * Removes a set of type/listener pairs.
     *
     * @alternative
     * @method off: this
     * Removes all listeners to all events on the object. This includes implicitly attached events.
     */
    off: function (types, fn, context) {

        if (!types) {
            // clear all listeners if called without arguments
            delete this._events;

        } else if (typeof types === 'object') {
            for (var type in types) {
                this._off(type, types[type], fn);
            }

        } else {
            types = splitWords(types);

            for (var i = 0, len = types.length; i < len; i++) {
                this._off(types[i], fn, context);
            }
        }

        return this;
    },

    // attach listener (without syntactic sugar now)
    _on: function (type, fn, context) {
        this._events = this._events || {};

        /* get/init listeners for type */
        var typeListeners = this._events[type];
        if (!typeListeners) {
            typeListeners = [];
            this._events[type] = typeListeners;
        }

        if (context === this) {
            // Less memory footprint.
            context = undefined;
        }
        var newListener = {
                fn: fn,
                ctx: context
            },
            listeners = typeListeners;

        // check if fn already there
        for (var i = 0, len = listeners.length; i < len; i++) {
            if (listeners[i].fn === fn && listeners[i].ctx === context) {
                return;
            }
        }

        listeners.push(newListener);
    },

    _off: function (type, fn, context) {
        var listeners,
            i,
            len;

        if (!this._events) {
            return;
        }

        listeners = this._events[type];

        if (!listeners) {
            return;
        }

        if (!fn) {
            // Set all removed listeners to noop so they are not called if remove happens in fire
            for (i = 0, len = listeners.length; i < len; i++) {
                listeners[i].fn = falseFn;
            }
            // clear all listeners for a type if function isn't specified
            delete this._events[type];
            return;
        }

        if (context === this) {
            context = undefined;
        }

        if (listeners) {

            // find fn and remove it
            for (i = 0, len = listeners.length; i < len; i++) {
                var l = listeners[i];
                if (l.ctx !== context) {
                    continue;
                }
                if (l.fn === fn) {

                    // set the removed listener to noop so that's not called if remove happens in fire
                    l.fn = falseFn;

                    if (this._firingCount) {
                        /* copy array in case events are being fired */
                        this._events[type] = listeners = listeners.slice();
                    }
                    listeners.splice(i, 1);

                    return;
                }
            }
        }
    },

    // @method fire(type: String, data?: Object, propagate?: Boolean): this
    // Fires an event of the specified type. You can optionally provide a data
    // object — the first argument of the listener function will contain its
    // properties. The event can optionally be propagated to event parents.
    fire: function (type, data, propagate) {
        if (!this.listens(type, propagate)) {
            return this;
        }

        var event = extend({}, data, {
            type: type,
            target: this,
            sourceTarget: data && data.sourceTarget || this
        });

        if (this._events) {
            var listeners = this._events[type];

            if (listeners) {
                this._firingCount = (this._firingCount + 1) || 1;
                for (var i = 0, len = listeners.length; i < len; i++) {
                    var l = listeners[i];
                    l.fn.call(l.ctx || this, event);
                }

                this._firingCount--;
            }
        }

        if (propagate) {
            // propagate the event to parents (set with addEventParent)
            this._propagateEvent(event);
        }

        return this;
    },

    // @method listens(type: String): Boolean
    // Returns `true` if a particular event type has any listeners attached to it.
    listens: function (type, propagate) {
        var listeners = this._events && this._events[type];
        if (listeners && listeners.length) {
            return true;
        }

        if (propagate) {
            // also check parents for listeners if event propagates
            for (var id in this._eventParents) {
                if (this._eventParents[id].listens(type, propagate)) {
                    return true;
                }
            }
        }
        return false;
    },

    // @method once(…): this
    // Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
    once: function (types, fn, context) {

        if (typeof types === 'object') {
            for (var type in types) {
                this.once(type, types[type], fn);
            }
            return this;
        }

        var handler = bind(function () {
            this
                .off(types, fn, context)
                .off(types, handler, context);
        }, this);

        // add a listener that's executed once and removed after that
        return this
            .on(types, fn, context)
            .on(types, handler, context);
    },

    // @method addEventParent(obj: Evented): this
    // Adds an event parent - an `Evented` that will receive propagated events
    addEventParent: function (obj) {
        this._eventParents = this._eventParents || {};
        this._eventParents[stamp(obj)] = obj;
        return this;
    },

    // @method removeEventParent(obj: Evented): this
    // Removes an event parent, so it will stop receiving propagated events
    removeEventParent: function (obj) {
        if (this._eventParents) {
            delete this._eventParents[stamp(obj)];
        }
        return this;
    },

    _propagateEvent: function (e) {
        for (var id in this._eventParents) {
            this._eventParents[id].fire(e.type, extend({
                layer: e.target,
                propagatedFrom: e.target
            }, e), true);
        }
    }
};

// aliases; we should ditch those eventually

// @method addEventListener(…): this
// Alias to [`on(…)`](#evented-on)
Events.addEventListener = Events.on;

// @method removeEventListener(…): this
// Alias to [`off(…)`](#evented-off)

// @method clearAllEventListeners(…): this
// Alias to [`off()`](#evented-off)
Events.removeEventListener = Events.clearAllEventListeners = Events.off;

// @method addOneTimeEventListener(…): this
// Alias to [`once(…)`](#evented-once)
Events.addOneTimeEventListener = Events.once;

// @method fireEvent(…): this
// Alias to [`fire(…)`](#evented-fire)
Events.fireEvent = Events.fire;

// @method hasEventListeners(…): Boolean
// Alias to [`listens(…)`](#evented-listens)
Events.hasEventListeners = Events.listens;

var Evented = Class.extend(Events);


/*
 * @class Map
 * @aka L.Map
 * @inherits Evented
 *
 * The central class of the API — it is used to create a map on a page and manipulate it.
 *
 * @example
 *
 * ```js
 * // initialize the map on the "map" div with a given center and zoom
 * var map = L.map('map', {
 * 	center: [51.505, -0.09],
 * 	zoom: 13
 * });
 * ```
 *
 */

var Map = Evented.extend({
    options: {
        // @section Map State Options
        // @option crs: CRS = L.CRS.EPSG3857
        // The [Coordinate Reference System](#crs) to use. Don't change this if you're not
        // sure what it means.
        crs: EPSG3857,

        // @option center: LatLng = undefined
        // Initial geographic center of the map
        center: undefined,

        // @option zoom: Number = undefined
        // Initial map zoom level
        zoom: undefined,

        // @option minZoom: Number = *
        // Minimum zoom level of the map.
        // If not specified and at least one `GridLayer` or `TileLayer` is in the map,
        // the lowest of their `minZoom` options will be used instead.
        minZoom: undefined,

        // @option maxZoom: Number = *
        // Maximum zoom level of the map.
        // If not specified and at least one `GridLayer` or `TileLayer` is in the map,
        // the highest of their `maxZoom` options will be used instead.
        maxZoom: undefined,

        // @option layers: Layer[] = []
        // Array of layers that will be added to the map initially
        layers: [],

        // @option maxBounds: LatLngBounds = null
        // When this option is set, the map restricts the view to the given
        // geographical bounds, bouncing the user back if the user tries to pan
        // outside the view. To set the restriction dynamically, use
        // [`setMaxBounds`](#map-setmaxbounds) method.
        maxBounds: undefined,

        // @option renderer: Renderer = *
        // The default method for drawing vector layers on the map. `L.SVG`
        // or `L.Canvas` by default depending on browser support.
        renderer: undefined,


        // @section Animation Options
        // @option zoomAnimation: Boolean = true
        // Whether the map zoom animation is enabled. By default it's enabled
        // in all browsers that support CSS3 Transitions except Android.
        zoomAnimation: true,

        // @option zoomAnimationThreshold: Number = 4
        // Won't animate zoom if the zoom difference exceeds this value.
        zoomAnimationThreshold: 4,

        // @option fadeAnimation: Boolean = true
        // Whether the tile fade animation is enabled. By default it's enabled
        // in all browsers that support CSS3 Transitions except Android.
        fadeAnimation: true,

        // @option markerZoomAnimation: Boolean = true
        // Whether markers animate their zoom with the zoom animation, if disabled
        // they will disappear for the length of the animation. By default it's
        // enabled in all browsers that support CSS3 Transitions except Android.
        markerZoomAnimation: true,

        // @option transform3DLimit: Number = 2^23
        // Defines the maximum size of a CSS translation transform. The default
        // value should not be changed unless a web browser positions layers in
        // the wrong place after doing a large `panBy`.
        transform3DLimit: 8388608, // Precision limit of a 32-bit float

        // @section Interaction Options
        // @option zoomSnap: Number = 1
        // Forces the map's zoom level to always be a multiple of this, particularly
        // right after a [`fitBounds()`](#map-fitbounds) or a pinch-zoom.
        // By default, the zoom level snaps to the nearest integer; lower values
        // (e.g. `0.5` or `0.1`) allow for greater granularity. A value of `0`
        // means the zoom level will not be snapped after `fitBounds` or a pinch-zoom.
        zoomSnap: 1,

        // @option zoomDelta: Number = 1
        // Controls how much the map's zoom level will change after a
        // [`zoomIn()`](#map-zoomin), [`zoomOut()`](#map-zoomout), pressing `+`
        // or `-` on the keyboard, or using the [zoom controls](#control-zoom).
        // Values smaller than `1` (e.g. `0.5`) allow for greater granularity.
        zoomDelta: 1,

        // @option trackResize: Boolean = true
        // Whether the map automatically handles browser window resize to update itself.
        trackResize: true
    },
    _zoom: 1,
    _mapPane: null,
    // @method project(latlng: LatLng, zoom: Number): Point
    // Projects a geographical coordinate `LatLng` according to the projection
    // of the map's CRS, then scales it according to `zoom` and the CRS's
    // `Transformation`. The result is pixel coordinate relative to
    // the CRS origin.
    project: function (latlng, zoom) {
        zoom = zoom === undefined ? this._zoom : zoom;
        return this.options.crs.latLngToPoint(toLatLng(latlng), zoom);
    },

    // @method unproject(point: Point, zoom: Number): LatLng
    // Inverse of [`project`](#map-project).
    unproject: function (point, zoom) {
        zoom = zoom === undefined ? this._zoom : zoom;
        return this.options.crs.pointToLatLng(toPoint(point), zoom);
    },

    // @method layerPointToLatLng(point: Point): LatLng
    // Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
    // returns the corresponding geographical coordinate (for the current zoom level).
    layerPointToLatLng: function (point) {
        var projectedPoint = toPoint(point).add(this.getPixelOrigin());
        return this.unproject(projectedPoint);
    },

    // @method latLngToLayerPoint(latlng: LatLng): Point
    // Given a geographical coordinate, returns the corresponding pixel coordinate
    // relative to the [origin pixel](#map-getpixelorigin).
    latLngToLayerPoint: function (latlng) {
        var projectedPoint = this.project(toLatLng(latlng))._round();
        return projectedPoint._subtract(this.getPixelOrigin());
    },

    // @method wrapLatLng(latlng: LatLng): LatLng
    // Returns a `LatLng` where `lat` and `lng` has been wrapped according to the
    // map's CRS's `wrapLat` and `wrapLng` properties, if they are outside the
    // CRS's bounds.
    // By default this means longitude is wrapped around the dateline so its
    // value is between -180 and +180 degrees.
    wrapLatLng: function (latlng) {
        return this.options.crs.wrapLatLng(toLatLng(latlng));
    },

    // @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
    // Returns a `LatLngBounds` with the same size as the given one, ensuring that
    // its center is within the CRS's bounds.
    // By default this means the center longitude is wrapped around the dateline so its
    // value is between -180 and +180 degrees, and the majority of the bounds
    // overlaps the CRS's bounds.
    wrapLatLngBounds: function (latlng) {
        return this.options.crs.wrapLatLngBounds(toLatLngBounds(latlng));
    },

    // @method distance(latlng1: LatLng, latlng2: LatLng): Number
    // Returns the distance between two geographical coordinates according to
    // the map's CRS. By default this measures distance in meters.
    distance: function (latlng1, latlng2) {
        return this.options.crs.distance(toLatLng(latlng1), toLatLng(latlng2));
    },

    // @method containerPointToLayerPoint(point: Point): Point
    // Given a pixel coordinate relative to the map container, returns the corresponding
    // pixel coordinate relative to the [origin pixel](#map-getpixelorigin).
    containerPointToLayerPoint: function (point) { // (Point)
        return toPoint(point).subtract(this._getMapPanePos());
    },

    // @method layerPointToContainerPoint(point: Point): Point
    // Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
    // returns the corresponding pixel coordinate relative to the map container.
    layerPointToContainerPoint: function (point) { // (Point)
        return toPoint(point).add(this._getMapPanePos());
    },

    // @method containerPointToLatLng(point: Point): LatLng
    // Given a pixel coordinate relative to the map container, returns
    // the corresponding geographical coordinate (for the current zoom level).
    containerPointToLatLng: function (point) {
        var layerPoint = this.containerPointToLayerPoint(toPoint(point));
        return this.layerPointToLatLng(layerPoint);
    },

    // @method latLngToContainerPoint(latlng: LatLng): Point
    // Given a geographical coordinate, returns the corresponding pixel coordinate
    // relative to the map container.
    latLngToContainerPoint: function (latlng) {
        return this.layerPointToContainerPoint(this.latLngToLayerPoint(toLatLng(latlng)));
    },

    // private methods for getting map state

    _getMapPanePos: function () {
        return getPosition(this._mapPane) || new Point(0, 0);
    },
});

export default Map;