import * as THREE from "three"

export class LODPlane extends THREE.BufferGeometry {
    constructor(C: number, W: number) {
        super()

        const M = 32
        const w0 = W / 2 / M / (1 << (C - 1))

        let geometry = new THREE.BufferGeometry();
        let indices: Array<any> = [];
        let vertices: Array<any> = [];
        let w = w0;
        let offset = 0;
        let line = M * 2 + 1;
        let e = M;
        let b = M;
        vertices.length = C * (2 * M + 1) * (2 * M + 1) * 2;
        let ipos = 0;
        for (let k = 0; k != C; ++k) {
            for (let i = -M; i <= M; ++i) {
                for (let j = -M; j <= M; ++j) {
                    vertices[ipos++] = j * w; vertices[ipos++] = 0; vertices[ipos++] = i * w;
                }
            }
            for (let i = 1; i != line - 2; ++i) {
                for (let j = 1; j != line - 2; ++j) {
                    if (i < e || i >= b || j < e || j >= b) {
                        let lt = offset + i * line + j;
                        indices.push(lt, lt + line + 1, lt + 1,
                            lt, lt + line, lt + line + 1);
                    }
                }
            }
            for (let j = 2; j < line - 2; j += 2) {
                let lt = offset + 0 * line + j;
                indices.push(lt, lt + line - 1, lt + line,
                    lt, lt + line, lt + line + 1,
                    lt, lt + 1 + line, lt + 2);
            }
            for (let j = 2; j < line - 2; j += 2) {
                let lt = offset + (line - 1) * line + j;
                indices.push(lt, lt - line, lt - line - 1,
                    lt, lt - line + 1, lt - line,
                    lt, lt + 2, lt + 1 - line);
            }
            for (let i = 2; i < line - 2; i += 2) {
                let lt = offset + i * line + 0;
                indices.push(lt, lt + 1, lt + 1 - line,
                    lt, lt + 1 + line, lt + 1,
                    lt, lt + 2 * line, lt + 1 + line);
            }
            for (let i = 2; i < line - 2; i += 2) {
                let lt = offset + i * line + (line - 1);
                indices.push(lt, lt - 1 - line, lt - 1,
                    lt, lt - 1, lt - 1 + line,
                    lt, lt - 1 + line, lt + 2 * line);
            }

            let lt = offset;
            indices.push(lt, lt + 1 + line, lt + 2,
                lt, lt + 2 * line, lt + 1 + line);
            lt = offset + (line - 1);
            indices.push(lt, lt - 1 + line, lt + 2 * line);
            lt = offset + line * (line - 1);
            indices.push(lt, lt + 2, lt + 1 - line);

            w *= 2;
            offset += (M * 2 + 1) * (M * 2 + 1);
            e = M / 2;
            b = 3 * M / 2;
        }
        geometry.setIndex(indices)
        const normals = new Array(vertices.length)
            .fill(0)
            .map((_, i) => i % 3 == 1 ? 1 : 0)
        const mx = M * w / 2;
        const uvs = vertices
            .filter((_, i) => i % 3 != 1)
            .map((e, i) => (e / mx * (i & 1 ? -1 : 1) + 1) * .5)

        geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
        geometry.addAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
        geometry.rotateX(Math.PI / 2)
        return geometry;

    }
}