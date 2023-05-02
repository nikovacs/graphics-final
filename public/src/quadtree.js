class quadTree {
    constructor(centerX, centerZ, halfDist, maxTriangles = 512, maxDepth = 8, depth = 0) {
        this.cX = centerX;
        // this.cY = centerY;
        this.cZ = centerZ;
        this.halfDist = halfDist;
        this.triangles = []; // [{x1, y1, z1}, {x2, y2, z2}, {x3, y3, z3}]
        this.children = []; // zero or eight quadTrees
        this.depth = depth;
        this.maxDepth = maxDepth;
        this.maxTriangles = maxTriangles;
    }

    /**
     * Adds a triangle to the quadTree data structure
     * @param {Object} tri [{x1, y1, z1}, {x2, y2, z2}, {x3, y3, z3}]
     */
    addTriangle(tri) {
        if ((this.triangles.length < this.maxTriangles && this.children.length === 0) || this.depth === this.maxDepth - 1) {
            this.triangles.push(tri);
            // this._sortTriangles()
            return;
        }
        if (this.triangles.length === this.maxTriangles) {
            this._subDivide();
        }
        for (let child of this.children) {
            if (child.shouldIncludeTriangle(tri)) {
                child.addTriangle(tri);
            }
        }
    }

    /**
     * The query function returns a list of triangles that are within the
     * bounding box of the point.
     * @param {Object} point {x, y, z}
     */
    query(point) {
        if (!this._shouldIncludePoint(point)) { return []; }
        let triangles = this.triangles;
        for (let child of this.children) {
            triangles = triangles.concat(child.query(point));
        }
        return triangles;


    }

    /**
     * Returns true if the quadTree would contain ANY point
     * of the triangle. False otherwise.
     * @param {Object} tri [{x1, y1, z1}, {x2, y2, z2}, {x3, y3, z3}]
     * @returns {boolean} true if the quadTree would contain the triangle, false otherwise
     */
    shouldIncludeTriangle(tri) {
        for (const point of tri) {
            if (this._shouldIncludePoint(point)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns true whether the quadTree would contain the point.
     * @param {Object} point 
     * @returns {boolean}
     */
    _shouldIncludePoint(point) {
        return (
            point.x >= this.cX - this.halfDist &&
            point.x <= this.cX + this.halfDist &&
            // point.y >= this.cY - this.halfDist &&
            // point.y <= this.cY + this.halfDist &&
            point.z >= this.cZ - this.halfDist &&
            point.z <= this.cZ + this.halfDist
        );
    }

    /**
     * Once the number of children exceeds 8, subdivide the quadTree into eight quadTrees.
     * Then put all existing triangle children into the new quadTrees.
     */
    _subDivide() {
        let halfDist = this.halfDist / 2;
        this.children = [
            new quadTree(this.cX - halfDist, this.cZ - halfDist, halfDist, this.maxTriangles, this.maxDepth, this.depth + 1),
            new quadTree(this.cX - halfDist, this.cZ + halfDist, halfDist, this.maxTriangles, this.maxDepth, this.depth + 1),
            // new quadTree(this.cX - halfDist, this.cZ - halfDist, halfDist, this.maxTriangles, this.maxDepth, this.depth + 1),
            // new quadTree(this.cX - halfDist, this.cZ + halfDist, halfDist, this.maxTriangles, this.maxDepth, this.depth + 1),
            new quadTree(this.cX + halfDist, this.cZ - halfDist, halfDist, this.maxTriangles, this.maxDepth, this.depth + 1),
            new quadTree(this.cX + halfDist, this.cZ + halfDist, halfDist, this.maxTriangles, this.maxDepth, this.depth + 1),
            // new quadTree(this.cX + halfDist, this.cZ - halfDist, halfDist, this.maxTriangles, this.maxDepth, this.depth + 1),
            // new quadTree(this.cX + halfDist, this.cZ + halfDist, halfDist, this.maxTriangles, this.maxDepth, this.depth + 1)
        ]

        for (let triangle of this.triangles) {
            for (let child of this.children) {
                if (child.shouldIncludeTriangle(triangle)) {
                    child.addTriangle(triangle);
                }
            }
        }
        this.triangles = [];
    }

    /**
     * This method sorts the list of triangles such that the ones with the lowest Y value are first
     */
    _sortTriangles() {
        this.triangles.sort((a, b) => {
            return a.y1 - b.y1;
        });
    }
}
