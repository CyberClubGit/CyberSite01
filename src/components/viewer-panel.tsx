
'use client';

import React, { useMemo } from 'react';
import { Skeleton } from './ui/skeleton';

interface ViewerPanelProps {
  modelUrl: string | null;
  className?: string;
}

const createViewerHtml = (modelUrl: string) => {
  // We are injecting a full, self-contained HTML document into the iframe.
  // This is a robust way to isolate the Three.js environment.
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>3D Viewer</title>
        <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: transparent; }
            canvas { display: block; }
            #loader {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ccc;
                font-family: monospace;
            }
        </style>
        <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.164.1/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.164.1/examples/jsm/"
            }
        }
        </script>
    </head>
    <body>
        <div id="loader">Loading model...</div>

        <script type="module">
            import * as THREE from 'three';
            import { STLLoader } from 'three/addons/loaders/STLLoader.js';
            import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
            import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
            import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
            import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
            import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

            const scene = new THREE.Scene();
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(renderer.domElement);

            const loaderElement = document.getElementById('loader');

            // --- Camera ---
            const aspect = window.innerWidth / window.innerHeight;
            const frustumSize = 150;
            const camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 1000);
            camera.position.set(100, 100, 100);
            camera.lookAt(scene.position);

            // --- Lighting ---
            scene.add(new THREE.AmbientLight(0xffffff, 1.5));
            const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
            dirLight.position.set(50, 50, 50);
            scene.add(dirLight);

            // --- Controls ---
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // --- Post-Processing ---
            const composer = new EffectComposer(renderer);
            composer.addPass(new RenderPass(scene, camera));

            // Chromatic Aberration Shader
            const ChromaticAberrationShader = {
                uniforms: {
                    'tDiffuse': { value: null },
                    'uOffset': { value: new THREE.Vector2(0.001, 0.001) }
                },
                vertexShader: \`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                \`,
                fragmentShader: \`
                    uniform sampler2D tDiffuse;
                    uniform vec2 uOffset;
                    varying vec2 vUv;
                    void main() {
                        float r = texture2D(tDiffuse, vUv + uOffset).r;
                        float g = texture2D(tDiffuse, vUv).g;
                        float b = texture2D(tDiffuse, vUv - uOffset).b;
                        gl_FragColor = vec4(r, g, b, 1.0);
                    }
                \`
            };
            const chromaticPass = new ShaderPass(ChromaticAberrationShader);
            composer.addPass(chromaticPass);

            // Film Grain Pass
            const filmPass = new FilmPass(0.15, 0.025, 648, false);
            composer.addPass(filmPass);


            // --- Load Model ---
            const loader = new STLLoader();
            
            async function loadModelData(url) {
                const GOOGLE_DRIVE_REGEX = /https?:\\/\\/drive\\.google\\.com\\/(file\\/d\\/|open\\?id=)([\\w-]+)/;
                const match = url.match(GOOGLE_DRIVE_REGEX);
                let fetchUrl = url;

                if (match && match[2]) {
                    fetchUrl = \`https://drive.google.com/uc?export=download&id=\${match[2]}\`;
                }

                const corsProxies = [
                    'https://corsproxy.io/?',
                    'https://api.allorigins.win/raw?url='
                ];

                // Attempt 1: Direct fetch
                try {
                    const response = await fetch(fetchUrl);
                    if (!response.ok) throw new Error('Direct fetch failed');
                    return await response.arrayBuffer();
                } catch (e) {
                    console.warn('Direct fetch failed:', e.message);
                }
                
                // Attempt 2 & 3: Proxies
                for (const proxy of corsProxies) {
                    try {
                        const proxiedUrl = proxy + encodeURIComponent(fetchUrl);
                        const response = await fetch(proxiedUrl);
                        if (!response.ok) throw new Error('Proxy fetch failed for ' + proxy);
                        return await response.arrayBuffer();
                    } catch(e) {
                        console.warn('Proxy fetch failed:', e.message);
                    }
                }
                throw new Error('All fetch attempts failed.');
            }

            loadModelData("${modelUrl}").then(data => {
                const geometry = loader.parse(data);

                // Normalize geometry
                geometry.center();

                const modelGroup = new THREE.Group();
                
                // Solid face material
                const faceMaterial = new THREE.MeshStandardMaterial({
                    color: 0xcccccc,
                    metalness: 0.6,
                    roughness: 0.4,
                });
                const faceMesh = new THREE.Mesh(geometry, faceMaterial);
                modelGroup.add(faceMesh);

                // Wireframe material
                const wireframeMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    wireframe: true,
                    opacity: 0.1,
                    transparent: true,
                });
                const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
                modelGroup.add(wireframeMesh);
                
                // Normalize scale
                const box = new THREE.Box3().setFromObject(modelGroup);
                const size = box.getSize(new THREE.Vector3());
                const scale = 100 / Math.max(size.x, size.y, size.z);
                modelGroup.scale.set(scale, scale, scale);

                // Standard rotation for STL
                modelGroup.rotation.x = -Math.PI / 2;

                scene.add(modelGroup);
                loaderElement.style.display = 'none';

            }).catch(error => {
                console.error('Error loading model:', error);
                loaderElement.textContent = 'Error: Could not load model.';
            });
            

            // --- Animation Loop ---
            function animate() {
                requestAnimationFrame(animate);
                controls.update();
                composer.render();
            }
            animate();

            // --- Resize Listener ---
            window.addEventListener('resize', () => {
                const aspect = window.innerWidth / window.innerHeight;
                camera.left = frustumSize * aspect / -2;
                camera.right = frustumSize * aspect / 2;
                camera.top = frustumSize / 2;
                camera.bottom = frustumSize / -2;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                composer.setSize(window.innerWidth, window.innerHeight);
            }, false);

        </script>
    </body>
    </html>
  `;
};

export const ViewerPanel: React.FC<ViewerPanelProps> = ({ modelUrl, className }) => {
  const viewerHtml = useMemo(() => {
    if (!modelUrl) return '';
    return createViewerHtml(modelUrl);
  }, [modelUrl]);

  if (!modelUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg border border-dashed">
        <p className="text-muted-foreground">No 3D model available</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative ${className || ''}`}>
      <iframe
        key={modelUrl} // Force re-render on URL change to clear memory
        srcDoc={viewerHtml}
        className="w-full h-full border-0 rounded-lg"
        sandbox="allow-scripts allow-same-origin"
        title="3D Model Viewer"
      />
      <Skeleton className="absolute inset-0 w-full h-full -z-10" />
    </div>
  );
};
