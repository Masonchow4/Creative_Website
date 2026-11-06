const viewer = document.querySelector('#showroom-viewer');

if (viewer) {
  const canvas = viewer.querySelector('.showroom-canvas');
  const status = viewer.querySelector('.showroom-loading');
  let renderer;
  let controls;
  let camera;
  let frameId;

  const showFallback = (message) => {
    viewer.dataset.state = 'fallback';
    status.textContent = message;
  };

  const hasWebGL = () => {
    try {
      const probe = document.createElement('canvas');
      return Boolean(window.WebGLRenderingContext &&
        (probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl')));
    } catch {
      return false;
    }
  };

  async function startShowroom() {
    if (!hasWebGL()) {
      showFallback('INTERACTIVE 3D IS UNAVAILABLE · STATIC PREVIEW SHOWN');
      return;
    }

    try {
      const [THREE, { OrbitControls }, { GLTFLoader }] = await Promise.all([
        import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js'),
        import('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js'),
        import('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js')
      ]);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#eeedf1');
      camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
      renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8ca0, 2.15));
      const key = new THREE.DirectionalLight(0xffffff, 2.3);
      key.position.set(-4, 8, 7);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xc8d8ff, 1.15);
      fill.position.set(5, 5, -4);
      scene.add(fill);

      status.textContent = 'LOADING CONFIRMED SHOWROOM…';
      const gltf = await new GLTFLoader().loadAsync('assets/swyft-showroom.glb');
      const model = gltf.scene;
      scene.add(model);

      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.sub(center);

      const maxDimension = Math.max(size.x, size.y, size.z);
      const radius = Math.max(size.length() * 0.52, 0.1);
      const viewDirection = new THREE.Vector3(1.18, 0.76, 1.5).normalize();
      const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5));
      camera.position.copy(viewDirection.multiplyScalar(distance));
      camera.lookAt(0, 0, 0);
      camera.near = Math.max(distance / 100, 0.01);
      camera.far = distance * 20;
      camera.updateProjectionMatrix();

      controls = new OrbitControls(camera, canvas);
      controls.target.set(0, 0, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      controls.enablePan = false;
      controls.minDistance = distance * 0.58;
      controls.maxDistance = distance * 1.65;
      controls.rotateSpeed = 0.65;
      controls.zoomSpeed = 0.7;
      controls.update();
      controls.saveState();

      const resize = () => {
        const { width, height } = viewer.getBoundingClientRect();
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(viewer);
      resize();

      const render = () => {
        frameId = window.requestAnimationFrame(render);
        controls.update();
        renderer.render(scene, camera);
      };
      render();
      viewer.dataset.state = 'interactive';
      status.textContent = 'INTERACTIVE SHOWROOM READY';

      viewer.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
        if (button.dataset.zoom === 'in') controls.dollyIn(1.18);
        else controls.dollyOut(1.18);
        controls.update();
      }));
      viewer.querySelector('[data-reset]').addEventListener('click', () => controls.reset());
      viewer.querySelectorAll('[data-rotate]').forEach(button => button.addEventListener('click', () => {
        controls.rotateLeft(button.dataset.rotate === 'left' ? Math.PI / 8 : -Math.PI / 8);
        controls.update();
      }));
    } catch (error) {
      console.error('Swyft showroom could not start:', error);
      showFallback('SHOWROOM PREVIEW · 3D COULD NOT LOAD');
      if (frameId) window.cancelAnimationFrame(frameId);
      if (controls) controls.dispose();
      if (renderer) renderer.dispose();
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        startShowroom();
      }
    }, { rootMargin: '120px' });
    observer.observe(viewer);
  } else {
    startShowroom();
  }
}
