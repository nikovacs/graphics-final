// Various useful functions - feel free to add additional functions to this file (or other files)
/* exported calc_normals, createVao, loadTexture, loadCubemapTexture */


/**
 * Creates a VAO containing the attributes and indices provided.
 *
 * The attributes argument is an array of 3-element arrays with attribute
 * location, data for the attribute, and number of values per vertex. For
 * example:
 *     [
 *       [gl.program.aPosition, coords, 3],
 *       [gl.program.aNormal, normals, 3],
 *     ]
 * The data values can be regular arrays or typed arrays. 
 *
 * The indices argument is an array or typed array for the indices.
 */
function createVao(gl, attributes, indices) {
    // Create and bind VAO
    let vao = gl.createVertexArray(), buf;
    gl.bindVertexArray(vao);

    // Load the data into the GPU and associate with shader
    for (let [attribute, data, count] of attributes) {
        if (data.constructor !== Float32Array) {
            data = Float32Array.from(data);
        }
        buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.vertexAttribPointer(attribute, count, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribute);
    }

    // Load the index data into the GPU
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
    if (indices.constructor !== Uint16Array) {
        indices = Uint16Array.from(indices);
    }
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Cleanup
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // Return the VAO handle
    return vao;
}


/**
 * Load a texture onto the GPU. The image must be power-of-two sized image using RGBA with uint8
 * values. The image will be flipped vertically and will support mipmapping.
 */
function loadTexture(gl, img, idx) {
    if (typeof idx === "undefined") { idx = 0; }

    let texture = gl.createTexture(); // create a texture resource on the GPU
    gl.activeTexture(gl.TEXTURE0 + idx); // set the current texture that all following commands will apply to
    gl.bindTexture(gl.TEXTURE_2D, texture); // assign our texture resource as the current texture

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Load the image data into the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    // Setup options for downsampling and upsampling the image data
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Cleanup and return
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}


/**
 * Load a texture onto the GPU as a cube-map texture. The images must be power-of-two sized image
 * using RGBA with uint8 values.
 */
function loadCubemapTexture(gl, xp, xn, yp, yn, zp, zn, idx) {
    if (typeof idx === "undefined") { idx = 0; }

    let texture = gl.createTexture(); // create a texture resource on the GPU
    gl.activeTexture(gl['TEXTURE' + idx]); // set the current texture that all following commands will apply to
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture); // assign our texture resource as the current texture

    // Load the image data into the texture
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, xp);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, xn);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, yp);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, yn);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, zp);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, zn);

    // Setup options for downsampling and upsampling the image data
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Cleanup and return
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    return texture;
}


/**
 * Calculates the normals for the vertices given an array of vertices and array of indices to look
 * up into. The triangles are full triangles and not triangle strips.
 *
 * Arguments:
 *    coords - a Float32Array with 3 values per vertex
 *    indices - a regular or typed array
 *    is_tri_strip - defaults to true which means the indices represent a triangle strip
 * Returns:
 *    Float32Array of the normals with 3 values per vertex
 */
function calc_normals(coords, indices, is_tri_strip) {
    const vec3 = glMatrix.vec3;

    if (is_tri_strip !== true && is_tri_strip !== false) { is_tri_strip = true; }

    // Start with all vertex normals as <0,0,0>
    let normals = new Float32Array(coords.length);

    // Get temporary variables
    let [N_face, V, U] = [vec3.create(), vec3.create(), vec3.create()];

    // Calculate the face normals for each triangle then add them to the vertices
    let inc = is_tri_strip ? 1 : 3; // triangle strips only go up by 1 index per triangle
    for (let i = 0; i < indices.length - 2; i += inc) {
        // Get the indices of the triangle and then get pointers its coords and normals
        let j = indices[i] * 3, k = indices[i + 1] * 3, l = indices[i + 2] * 3;
        let A = coords.subarray(j, j + 3), B = coords.subarray(k, k + 3), C = coords.subarray(l, l + 3);
        let NA = normals.subarray(j, j + 3), NB = normals.subarray(k, k + 3), NC = normals.subarray(l, l + 3);

        // Compute normal for the A, B, C triangle and save to N_face (will need to use V and U as temporaries as well)
        vec3.cross(N_face, vec3.subtract(V, A, B), vec3.subtract(U, C, A));
        if (is_tri_strip && (i % 2) !== 0) { // every other triangle in a strip is actually reversed
            vec3.negate(N_face, N_face);
        }

        // Add N_face to the 3 normals of the triangle: NA, NB, and NC
        vec3.add(NA, N_face, NA); // NA += N_face
        vec3.add(NB, N_face, NB);
        vec3.add(NC, N_face, NC);
    }

    // Normalize the normals
    for (let i = 0; i < normals.length; i += 3) {
        let N = normals.subarray(i, i + 3);
        vec3.normalize(N, N);
    }

    // Return the computed normals
    return normals;
}

/**
 * Load a model from a file into a VAO and return the VAO.
 */
function loadModel(filename) {
    return fetch(filename)
        .then(r => r.json())
        .then(raw_model => {
            let coords = new Float32Array(raw_model.vertices);
            // console.log("coords len" + coords.length/3)
            let inds = new Uint16Array(raw_model.indices);
            let texCoords = new Float32Array(raw_model.texels);
            let normals = calc_normals(coords, inds, false);
            let vao = createVao(
                gl,
                [
                    [gl.program.aPosition, coords, 3],
                    [gl.program.aNormal, normals, 3],
                    [gl.program.aTexCoord, texCoords, 2] // TODO add this back in when read
                ],
                inds
            )

            return {
                vao: vao,
                texture: raw_model.texture,
                drawMode: gl.TRIANGLES,
                numElements: inds.length,
                coords: coords,
                normals: normals,
                texCoords: texCoords,
                indices: inds,
                filename: filename // testing
            }

        })
        // eslint-disable-next-line no-console
        .catch(console.error);
}


// Various useful functions
/* exported createVAO createVBO createIBO */
/* exported cube tetrahedron cylinder */


// Allow use of glMatrix values directly instead of needing the glMatrix prefix
const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;
const mat4 = glMatrix.mat4;
const quat = glMatrix.quat;
const _temps = [vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create()];
const _temps_mat4 = [mat4.create(), mat4.create(), mat4.create(), mat4.create(), mat4.create(), mat4.create(), mat4.create()];


/**
 * Load a model from a file into its own VAO and return the VAO and number of indices.
 * Note that having one VAO per model can be expensive if there are lots of models.
 *
 * @param {string} filename 
 * @returns {Promise<[WebGLVertexArrayObject, number]>}
 */
function loadModelAsVAO(filename) {
    return fetch(filename)
        .then(r => r.json())
        .then(raw_model => {
            let vao = createVAO(gl, gl.program, {
                "aPosition": raw_model.vertices,
                "aNormal": calcNormals(positions, raw_model.indices),
            }, raw_model.indices)

            // Return the VAO and number of indices
            return [vao, raw_model.indices.length];
        })
        .catch(console.error);
}


/**
 * Calculates the normals for the vertices given an array of vertices and array of indices to look
 * up into.
 *
 * Arguments:
 *    coords - a Float32Array with 3 values per vertex
 *    indices - a regular or typed array
 *    is_tri_strip - defaults to false which means the indices represent full triangles
 * Returns:
 *    Float32Array of the normals with 3 values per vertex
 * 
 * @param {Float32Array|number[]|number[][]} coords
 * @param {Uint16Array|number[]} indices 
 * @param {boolean} [is_tri_strip] 
 * @returns {Float32Array}
 */
function calcNormals(coords, indices, is_tri_strip) {
    if (is_tri_strip !== true && is_tri_strip !== false) { is_tri_strip = false; }
    coords = asFloat32Array(coords);

    // Start with all vertex normals as <0,0,0>
    let normals = new Float32Array(coords.length);

    // Get temporary variables
    let [N_face, V, U] = [vec3.create(), vec3.create(), vec3.create()];

    // Calculate the face normals for each triangle then add them to the vertices
    let inc = is_tri_strip ? 1 : 3; // triangle strips only go up by 1 index per triangle
    for (let i = 0; i < indices.length - 2; i += inc) {
        // Get the indices of the triangle and then get pointers its coords and normals
        let j = indices[i] * 3, k = indices[i + 1] * 3, l = indices[i + 2] * 3;
        let A = coords.subarray(j, j + 3), B = coords.subarray(k, k + 3), C = coords.subarray(l, l + 3);
        let NA = normals.subarray(j, j + 3), NB = normals.subarray(k, k + 3), NC = normals.subarray(l, l + 3);

        // Compute normal for the A, B, C triangle and save to N_face (will need to use V and U as temporaries as well)
        vec3.cross(N_face, vec3.subtract(V, B, A), vec3.subtract(U, C, A));
        if (is_tri_strip && (i % 2) !== 0) { // every other triangle in a strip is actually reversed
            vec3.negate(N_face, N_face);
        }

        // Add N_face to the 3 normals of the triangle: NA, NB, and NC
        vec3.add(NA, N_face, NA); // NA += N_face
        vec3.add(NB, N_face, NB);
        vec3.add(NC, N_face, NC);
    }

    // Normalize the normals
    for (let i = 0; i < normals.length; i += 3) {
        let N = normals.subarray(i, i + 3);
        vec3.normalize(N, N);
    }

    // Return the computed normals
    return normals;
}


/**
 * Create a VAO populated with VBOs associated with program attributes and
 * indices. The attributes are specified as an object where the keys are the
 * name of the attributes and the values are an array of the data for the
 * buffer and size of each attribute.
 * 
 * Example of use:
 *      let attributes = {
 *          "aPosition": [vertices, 3],
 *          "aNormal": [normals, 3],
 *      }
 *      createVAO(gl, gl.program, attributes, indices)
 * 
 * Returns the vertex array object allocated. All bindings are cleaned up.
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLProgram} program 
 * @param {Object} attributes 
 * @param {Uint16Array|number[]|number} indices 
 * @returns {WebGLVertexArrayObject}
 */
function createVAO(gl, program, attributes, indices) {
    // Create and bind the VAO
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Create the buffers
    for (const [attributeName, data_and_dim] of Object.entries(attributes)) {
        let [data, dim] = data_and_dim
        let attributeLoc = gl.getAttribLocation(program, attributeName)
        createVBO(gl, attributeLoc, data, dim);
    }
    createIBO(gl, indices);

    // Cleanup
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return vao;
}


/**
 * Creates a vertex attribute buffer for the given attrib location. If x is an
 * array, it is used as the initial values in the buffer. Otherwise it must be
 * an integer and specifies the size of the buffer in number of vectors. dim is
 * the size of each vector (i.e 3 for a vec3).
 * 
 * Example:
 * createVBO(gl, gl.program.aPosition, verts, 3)
 * 
 * Returns the buffer id. The buffer remains bound.
 *
 * @param {WebGL2RenderingContext} gl
 * @param {number} attribLoc
 * @param {Float32Array|number[]|number[][]|number} x
 * @param {number} dim
 * @returns {WebGLBuffer}
*/
function createVBO(gl, attribLoc, x, dim) {
    let data
    if (x instanceof Float32Array) {
        data = x
    } else if (Array.isArray(x)) {
        data = asFloat32Array(x);
    } else {
        data = x * dim * Float32Array.BYTES_PER_ELEMENT;
    }
    let bufferId = gl.createBuffer(); // create a new buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId); // bind to the new buffer
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); // load the flattened data into the buffer
    gl.vertexAttribPointer(attribLoc, dim, gl.FLOAT, false, 0, 0); // associate the buffer with the attributes making sure it knows its type
    gl.enableVertexAttribArray(attribLoc); // enable this set of data
    return bufferId;
}

/**
 * Creates an index buffer object. If x is an array, it is used as the initial
 * values in the buffer. Otherwise it must be an integer and specifies the size
 * of the buffer in number of indices.
 * 
 * Example:
 * createIBO(gl, indices)
 * 
 * Returns the buffer id. The buffer remains bound.
 *
 * @param {WebGL2RenderingContext} gl
 * @param {Uint16Array|number[]|number} x
 * @returns {WebGLBuffer}
 */
function createIBO(gl, x) {
    let data
    if (x instanceof Uint16Array) {
        data = x
    } else if (Array.isArray(x)) {
        data = Uint16Array.from(x);
    } else {
        data = x * Uint16Array.BYTES_PER_ELEMENT;
    }
    let bufferId = gl.createBuffer(); // create a new buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferId); // bind to the new buffer
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW); // load the data into the buffer
    return bufferId;
}


/**
 * Get an array as a Float32Array. The source can be one of Array of numbers,
 * nested Array of numbers, or a Float32Array already.
 * 
 * @param {Float32Array|number[]|number[][]} x
 * @returns {Float32Array}
 */
function asFloat32Array(x) {
    if (x instanceof Float32Array) { return x; }
    return Float32Array.from((Array.isArray(x[0])) ? x.flat() : x);
}


///////////// Shapes /////////////

/**
 * Adds a 1x1x1 cube centered at the origin to the given list of vertices,
 * normals, and indices. Should be drawn with TRIANGLES.
 * Note: even though this uses indices, vertices are duplicated to support
 * flat normals.
 * @param {number[]} vertices 
 * @param {number[]} normals 
 * @param {number[]} indices
 * @param {number|number[]} [size] size of each edge of the cube, default is [1,1,1]
 * @returns {[number, number]} the index offset and length for the cube
 */
function cube(vertices, normals, indices, size) {
    size = size || 1;
    if (!Array.isArray(size)) { size = [size, size, size]; }
    let x = size[0] / 2, y = size[1] / 2, z = size[2] / 2;
    let v_off = vertices.length / 3;
    let i_off = indices.length;
    vertices.push(
        x, y, z, -x, y, z, -x, -y, z, // ABC
        x, y, z, -x, -y, z, x, -y, z, // ACD
        x, y, z, x, -y, z, x, y, -z, // ADH
        x, -y, z, x, -y, -z, x, y, -z, // DEH
        -x, -y, -z, -x, y, -z, x, y, -z, // FGH
        x, -y, -z, -x, -y, -z, x, y, -z, // EFH
        -x, y, z, -x, y, -z, -x, -y, z, // BGC
        -x, -y, -z, -x, -y, z, -x, y, -z, // FCG
        -x, y, z, x, y, -z, -x, y, -z, // BHG
        -x, y, z, x, y, z, x, y, -z, // BAH
        -x, -y, z, x, -y, -z, x, -y, z, // CED
        -x, -y, z, -x, -y, -z, x, -y, -z, // CFE
    );
    normals.push(
        0, 0, 1, 0, 0, 1, 0, 0, 1,
        0, 0, 1, 0, 0, 1, 0, 0, 1,
        1, 0, 0, 1, 0, 0, 1, 0, 0,
        1, 0, 0, 1, 0, 0, 1, 0, 0,
        0, 0, -1, 0, 0, -1, 0, 0, -1,
        0, 0, -1, 0, 0, -1, 0, 0, -1,
        -1, 0, 0, -1, 0, 0, -1, 0, 0,
        -1, 0, 0, -1, 0, 0, -1, 0, 0,
        0, 1, 0, 0, 1, 0, 0, 1, 0,
        0, 1, 0, 0, 1, 0, 0, 1, 0,
        0, -1, 0, 0, -1, 0, 0, -1, 0,
        0, -1, 0, 0, -1, 0, 0, -1, 0,
    );
    for (let i = 0; i < 36; i++) { indices.push(v_off + i); }
    return [i_off, 36];
}

/**
 * Adds a unit tetrahedron centered at the origin to the given list of
 * vertices, normals, and indices. Should be drawn with TRIANGLES.
 * @param {number[]} vertices 
 * @param {number[]} normals 
 * @param {number[]} indices 
 * @returns {[number, number]} the index offset and length for the tetrahedron
 */
function tetrahedron(vertices, normals, indices) {
    let v_off = vertices.length / 3;
    let i_off = indices.length;
    let data = [
        0, 0, -1,
        0, Math.sqrt(8 / 9), 1 / 3,
        Math.sqrt(2 / 3), -Math.sqrt(2 / 9), 1 / 3,
        -Math.sqrt(2 / 3), -Math.sqrt(2 / 9), 1 / 3,
    ];
    vertices.push(...data);
    normals.push(...data);
    indices.push(
        v_off + 3, v_off + 1, v_off + 0,
        v_off + 2, v_off + 0, v_off + 1,
        v_off + 0, v_off + 3, v_off + 2,
        v_off + 1, v_off + 2, v_off + 3,
    );
    return [i_off, 12];
}


/**
 * Add the vertices for a circle centered at origin with a constant y-value of
 * y, a diameter of 1, and enough sides to be reasonable in most situations
 * (but can be specified with the final last argument). Should be drawn with
 * TRIANGLES.
 * @param {number[]} vertices 
 * @param {number[]} indices
 * @param {number} [diameter] diameter of the circle, defaults to 1
 * @param {number} [y] fixed y coordinate, defaults to 0
 * @param {number} [n] defaults to 64
 * @returns {[number, number]} the index offset and length for the circle
 */
function circle(vertices, indices, diameter, y, n) {
    diameter = diameter || 1.0;
    y = y || 0;
    n = n || 64;

    let v_off = vertices.length / 3;
    let i_off = indices.length;

    // Add all of the vertices
    let theta = 2 * Math.PI / n;
    let radius = diameter / 2;
    vertices.push(0, y, 0);
    for (let i = 0; i < n; ++i) {
        vertices.push(radius * Math.cos(i * theta), y, radius * Math.sin(i * theta));
    }

    // Add all of the indices
    for (let i = 1; i < n; ++i) {
        indices.push(v_off, v_off + i, v_off + i + 1);
    }
    indices.push(v_off, v_off + n, v_off + 1);

    return [i_off, n * 3];
}

/**
 * Add the vertices for a cylinder centered at origin.
 * Should be drawn with TRIANGLES.
 * @param {number[]} vertices 
 * @param {number[]} normals
 * @param {number[]} indices
 * @param {number} [height] height of the cylinder, defaults to 1
 * @param {number} [diameter] diameter of the cylinder, defaults to 1
 * @param {number} [n] sides to the cylinder, defaults to 64
 * @returns {[number, number]} the index offset and length for the cylinder
 */
function cylinder(vertices, normals, indices, height, diameter, n) {
    height = height || 1.0;
    diameter = diameter || 1.0;
    n = n || 64;

    let verts = [];
    let inds = [];

    // Top circle
    circle(verts, inds, diameter, -height / 2, n);

    // Bottom circle
    let [start, total] = circle(verts, inds, diameter, height / 2, n);

    // Bottom indices need reversing
    for (let i = start; i < start + total; i += 3) {
        const temp = inds[i];
        inds[i] = inds[i + 1];
        inds[i + 1] = temp;
    }

    // Connect the top and bottom
    // All vertices already exist, just need more indices
    // top (non-center) vertices are from 1 to n+1
    // bottom (non-center) vertices are from n+3 to 2n+2
    // triangles come in pairs:
    //   2, 1, n+2 and 2, n+2, n+3
    //   3, 2, n+3 and 3, n+3, n+4
    //   ...
    //   n, n-1, 2n and n, 2n, 2n+1
    //   1, 8, 2n+1 and 1, 2n+1, n+2
    for (let i = 1; i < n; i++) {
        inds.push(i + 1, i, n + i + 1);
        inds.push(i + 1, n + i + 1, n + i + 2);
    }
    inds.push(1, n, n + n + 1);
    inds.push(1, n + n + 1, n + 2);

    // Compute the normals
    norms = calcNormals(verts, inds);

    // Add the data to the master arrays
    let v_off = vertices.length / 3;
    let i_off = indices.length;
    vertices.push(...verts);
    normals.push(...norms);
    indices.push(...inds.map(x => x + v_off));
    return [i_off, inds.length];
}

/**
 * Finds the intersection between a line segment and a triangle. The line segment is given by a
 * point (p) and vector (vec). The triangle is given by three points (abc). If there is no
 * intersection, the line segment is parallel to the plane of the triangle, or the triangle is
 * degenerate then null is returned. Otherwise a vec4 is returned that contains the intersection.
 *
 * Each argument must be a vec3 (i.e. 3 element array).
 */
function line_seg_triangle_intersection(p, vec, a, b, c) {
    let [u, v] = [vec3.subtract(_temps[0], b, a), vec3.subtract(_temps[1], c, a)]; // triangle edge vectors
    let uu = vec3.dot(u, u), vv = vec3.dot(v, v), uv = vec3.dot(u, v);
    let tri_scale = uv * uv - uu * vv;
    if (tri_scale === 0) { return null; } // triangle is degenerate
    let n = vec3.cross(_temps[2], u, v); // normal vector of the triangle

    // Find the point where the line intersects the plane of the triangle
    let denom = vec3.dot(n, vec);
    if (denom === 0) { return null; } // line segment is parallel to the plane of the triangle
    let rI = vec3.dot(n, vec3.subtract(_temps[3], a, p)) / denom;
    if (rI < 0 || rI > 1) { return null; } // line segment does not intersect the plane of the triangle
    p = vec3.add(_temps[4], p, vec3.scale(_temps[5], vec, rI)); // the point where the line segment intersects the plane of the triangle

    // Check if the point of intersection lies within the triangle
    let w = vec3.subtract(_temps[6], p, a), wv = vec3.dot(w, v), wu = vec3.dot(w, u);
    let sI = (uv * wv - vv * wu) / tri_scale, tI = (uv * wu - uu * wv) / tri_scale;
    if (sI < 0 || tI < 0 || sI + tI > 1) { return null; } // intersection point is outside of the triangle

    // Return the intersection
    return p;
}
