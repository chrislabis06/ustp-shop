'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform int uSteps;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  float noise3D(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);

    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);

    return mix(nxy0, nxy1, f.z);
  }

  float fbm(vec3 p) {
    float val = 0.0;
    float amp = 0.52;
    for (int i = 0; i < 4; i++) {
      val += amp * noise3D(p);
      p = p * 2.04 + vec3(1.7, 9.2, 4.3);
      amp *= 0.48;
    }
    return val;
  }

  // Sculpted 3D cumulus volume in world space [y in 1.1..2.9]
  float cloudDensity(vec3 p, float time, float detail) {
    vec3 wind = vec3(time * 0.20, 0.0, time * 0.05);
    vec3 q = p * vec3(0.24, 0.58, 0.24) + wind;

    float h = clamp((p.y - 1.12) / 1.75, 0.0, 1.0);
    float heightProfile = smoothstep(0.0, 0.24, h) * (1.0 - smoothstep(0.56, 1.0, h));

    float baseShape = fbm(q);
    float puffs = noise3D(q * 2.3 + vec3(3.1, -time * 0.025, 1.8));
    float macro = noise3D(q * 0.40 - vec3(time * 0.02, 0.0, 0.0));

    float d = baseShape * 0.72 + puffs * 0.28 + (macro - 0.5) * 0.24;
    d *= heightProfile;

    float threshold = 0.34;
    float density = smoothstep(threshold, threshold + 0.21, d);

    if (detail > 0.5 && density > 0.01) {
      float fine = noise3D(q * 4.5 + vec3(0.0, time * 0.02, 0.0));
      density = clamp(density - (1.0 - fine) * 0.15 * density, 0.0, 1.0);
    }

    return density;
  }

  // Smooth architectural sky mask aligned with /xtra.webp roofline:
  // Keeps 3D clouds cleanly above the left tower & right dome while drifting into the central valley.
  float skyHorizonMask(vec2 uv) {
    float leftOpen = exp(-pow((uv.x - 0.04) / 0.10, 2.0)) * 0.07;
    float valley = exp(-pow((uv.x - 0.39) / 0.10, 2.0)) * 0.15;
    float horizonBottom = 0.39 + leftOpen + valley;
    float screenTopDown = 1.0 - uv.y;
    return 1.0 - smoothstep(horizonBottom - 0.13, horizonBottom + 0.02, screenTopDown);
  }

  void main() {
    float skyMask = skyHorizonMask(vUv);
    if (skyMask <= 0.002) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 ndc = vUv * 2.0 - 1.0;

    // Subtle shades-of-blue daylight/dusk light breathing harmonized with the USTP photo
    float lightCycle = 0.5 + 0.5 * sin(uTime * 0.42 - 0.6);

    vec3 ro = vec3(0.0, 0.15, 0.0);
    vec3 rd = normalize(vec3(ndc.x * aspect * 0.85, ndc.y * 0.52 + 0.28, -1.35));

    if (rd.y <= 0.02) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float tMin = max((1.12 - ro.y) / rd.y, 0.8);
    float tMax = min((2.88 - ro.y) / rd.y, 34.0);

    float stepsF = float(uSteps);
    float stepSize = (tMax - tMin) / stepsF;

    float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    float t = tMin + jitter * stepSize * 0.75;

    // Match upper-left-front sun direction of /xtra.webp architecture
    vec3 sunDir = normalize(vec3(-0.58, 0.70, 0.40));
    float cosTheta = dot(rd, sunDir);
    float hg = 0.10 / pow(1.22 - 0.84 * cosTheta, 1.5);

    // Palette directly anchored to graded /xtra.webp sky, cobalt glass, & crisp ivory facade
    vec3 litCrest = mix(vec3(0.88, 0.92, 0.98), vec3(0.96, 0.98, 1.00), lightCycle);
    vec3 midBody = mix(vec3(0.42, 0.54, 0.74), vec3(0.50, 0.63, 0.83), lightCycle);
    vec3 shadowBelly = mix(vec3(0.14, 0.27, 0.51), vec3(0.19, 0.34, 0.59), lightCycle);
    vec3 skyBounce = mix(vec3(0.20, 0.36, 0.64), vec3(0.26, 0.44, 0.72), lightCycle);

    vec3 accumColor = vec3(0.0);
    float transmittance = 1.0;

    for (int i = 0; i < 32; i++) {
      if (i >= uSteps || transmittance < 0.03) break;

      vec3 pos = ro + rd * t;
      float distFade = 1.0 - smoothstep(13.0, 32.0, t);
      float dens = cloudDensity(pos, uTime, 1.0) * distFade;

      if (dens > 0.004) {
        float s1 = cloudDensity(pos + sunDir * 0.42, uTime, 0.0);
        float s2 = cloudDensity(pos + sunDir * 0.95, uTime, 0.0);
        float shadow = exp(-(s1 * 1.45 + s2 * 1.15));

        float puffHeight = clamp((pos.y - 1.15) / 1.55, 0.0, 1.0);
        float lightEnergy = clamp(shadow * (0.56 + 0.44 * puffHeight) + hg * 0.35, 0.0, 1.0);

        vec3 sampleCol = mix(shadowBelly, midBody, smoothstep(0.08, 0.54, lightEnergy));
        sampleCol = mix(sampleCol, litCrest, smoothstep(0.50, 0.95, lightEnergy));

        // Subtle aerial integration into the actual cobalt-slate sky tone of /xtra.webp
        float aerial = smoothstep(8.0, 30.0, t);
        sampleCol = mix(sampleCol, skyBounce * 1.25, aerial * 0.48);

        float optical = dens * min(stepSize, 0.42) * 2.05;
        float alphaStep = 1.0 - exp(-optical);
        accumColor += transmittance * sampleCol * alphaStep;
        transmittance *= (1.0 - alphaStep);
      }

      t += stepSize;
    }

    float cloudAlpha = clamp(1.0 - transmittance, 0.0, 1.0);
    if (cloudAlpha <= 0.002) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Un-premultiply raymarched color so transparent edges blend smoothly with zero dark halos
    vec3 cloudColor = accumColor / max(cloudAlpha, 0.0001);
    gl_FragColor = vec4(cloudColor, clamp(cloudAlpha * skyMask * 0.94, 0.0, 0.94));
  }
`

function detectSoftwareGl(): boolean {
  const probe = document.createElement('canvas')
  try {
    const gl = probe.getContext('webgl2') || probe.getContext('webgl')
    if (!gl) return true
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const rendererStr = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      : String(gl.getParameter(gl.RENDERER) || '')
    const isSoftware = /SwiftShader|llvmpipe|Software|ANGLE.*Microsoft Basic Render/i.test(rendererStr)
    const loseCtx = gl.getExtension('WEBGL_lose_context')
    if (loseCtx) loseCtx.loseContext()
    return isSoftware
  } catch {
    return true
  }
}

export default function HeroClouds3D() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const isSoftwareGl = detectSoftwareGl()
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      return
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2))

    const width = Math.max(container.clientWidth, 1)
    const height = Math.max(container.clientHeight, 1)
    renderer.setSize(width, height, false)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const uniforms = {
      uTime: { value: 12.0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uSteps: { value: isSoftwareGl ? 14 : 26 },
    }

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })

    const quad = new THREE.Mesh(geometry, material)
    quad.frustumCulled = false
    scene.add(quad)

    if (!isSoftwareGl) {
      renderer.compile(scene, camera)
    }

    const updateSize = () => {
      const nextW = Math.max(container.clientWidth, 1)
      const nextH = Math.max(container.clientHeight, 1)
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(nextW, nextH, false)
      uniforms.uResolution.value.set(nextW, nextH)
      if (prefersReducedMotion) {
        renderer.render(scene, camera)
      }
    }

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    if (prefersReducedMotion) {
      renderer.render(scene, camera)
      return () => {
        resizeObserver.disconnect()
        scene.remove(quad)
        geometry.dispose()
        material.dispose()
        renderer.dispose()
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement)
        }
      }
    }

    let disposed = false
    let rafId = 0
    let timerId = 0
    const clock = new THREE.Clock()

    const afterDraw = (fn: () => void) => {
      rafId = window.requestAnimationFrame(() => {
        timerId = window.setTimeout(fn, 0)
      })
    }

    const tick = () => {
      if (disposed) return
      const dt = Math.min(clock.getDelta(), 0.1)
      uniforms.uTime.value += dt
      renderer.render(scene, camera)

      if (isSoftwareGl) {
        afterDraw(tick)
      } else {
        rafId = window.requestAnimationFrame(tick)
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick)
    } else {
      rafId = window.requestAnimationFrame(tick)
    }

    return () => {
      disposed = true
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(timerId)
      resizeObserver.disconnect()
      scene.remove(quad)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={mountRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20" />
}
