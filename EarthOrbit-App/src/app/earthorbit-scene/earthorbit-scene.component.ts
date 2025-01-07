import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Clock,
  TextureLoader,
  Texture,
  BufferGeometry,
  BufferAttribute,
  AmbientLight,
  MeshStandardMaterial,
  SphereGeometry,
  SpotLight,
  SpotLightHelper,
  Object3D,
  MathUtils,
  InstancedMesh,
  Matrix4,
  Raycaster,
  MOUSE,
  Vector2,
  DirectionalLight,
  DirectionalLightHelper,
  AnimationMixer,
  PointLight,
  PointLightHelper,
} from 'three';

@Component({
  selector: 'app-earthorbit-scene',
  templateUrl: './earthorbit-scene.component.html',
  styleUrls: ['./earthorbit-scene.component.scss'],
})


export class EarthOrbitComponent implements OnInit, AfterViewInit {

  @ViewChild('earthOrbitjs')
  canvas!: ElementRef<HTMLCanvasElement>;
  scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;
  cube!: Mesh<BoxGeometry, MeshStandardMaterial>;
  clock: Clock = new Clock;
  map!: Mesh<BufferGeometry, MeshStandardMaterial>;
  sphere!: Mesh<SphereGeometry, MeshStandardMaterial>;
  spotLight!: SpotLight;
  spotLightHelper!: SpotLightHelper;
  directionalLight!: DirectionalLight;
  directionalLightHelper!: DirectionalLightHelper;
  controls!: OrbitControls;
  earthPivot!: Object3D;
  moonPivot!: Object3D;
  sunPivot!: Object3D;
  earthSphere!: Mesh<SphereGeometry, MeshStandardMaterial>;
  moonSphere!: Mesh<SphereGeometry, MeshStandardMaterial>;
  mixer!: AnimationMixer;
  spaceshipPivot!: Object3D;
  gatewayPivot!: Object3D;

  constructor() { }
  ngOnInit() { }

  ngAfterViewInit(): void {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    this.renderer = new WebGLRenderer({ canvas: this.canvas.nativeElement });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.shadowMap.enabled = true;

    this.renderer.domElement.addEventListener('click', this.onSphereClick.bind(this));


    const textureLoader = new TextureLoader();
    const gltfLoader = new GLTFLoader();

    /*gltfLoader.loadAsync('assets/models/Satellite_Disk.glb'),
      gltfLoader.loadAsync('assets/models/Communication_Mast.glb'),
    ]).then(([bioZone, satelliteDisk, communicationMast]) => {
      const bio_zone = bioZone.scene;
      bio_zone.position.set(140, 4, -410);
      bio_zone.rotation.y = MathUtils.degToRad(95);
      bio_zone.scale.set(3, 3, 3);
      bio_zone.receiveShadow = true;
      bio_zone.castShadow = true;
      this.scene.add(bio_zone);
    
      const satellite_disk = satelliteDisk.scene;
      satellite_disk.position.set(-20, 6, -400);
      satellite_disk.rotation.y = MathUtils.degToRad(95);
      satellite_disk.scale.set(3, 3, 3);
      satellite_disk.receiveShadow = true;
      satellite_disk.castShadow = true;
      this.scene.add(satellite_disk);

      const communication_mast = communicationMast.scene;
      communication_mast.position.set(-20, 6, -400);
      communication_mast.scale.set(3, 3, 3);
      communication_mast.receiveShadow = true;
      communication_mast.castShadow = true;
      this.scene.add(communication_mast);
    });*/


    // Background Texture -----------------------------------------------------
    const backgroundTexture = textureLoader.load('assets/maps/8k_stars.jpg');
    this.scene.background = backgroundTexture;

    // Earth Sphere -----------------------------------------------------------
    const earthRadius = 500;
    const earthGeometry = new SphereGeometry(earthRadius, 64, 64);

    const earthTexture = textureLoader.load('assets/maps/8k_earth_daymap.jpg');

    const earthMaterial = new MeshStandardMaterial({
      map: earthTexture,
      transparent: true,
    });

    this.earthSphere = new Mesh(earthGeometry, earthMaterial);
    this.earthSphere.position.set(0, 0, 0);
    this.earthSphere.receiveShadow = true;
    this.earthSphere.castShadow = true;
    this.scene.add(this.earthSphere);

    this.earthPivot = new Object3D();
    this.earthPivot.position.set(0,0,0);
    this.earthPivot.add(this.earthSphere);
    this.scene.add(this.earthPivot);

    const normalTexture = textureLoader.load('assets/maps/normal.jpg');
    (earthMaterial as MeshStandardMaterial).normalMap = normalTexture;
    (earthMaterial as MeshStandardMaterial).normalScale.set(2, 2);
    earthMaterial.needsUpdate = true;

    // Moon Shere -------------------------------------------------------------
    const moonScale = earthRadius / 6.371 * 1.737;
    const moonGeometry = new SphereGeometry(moonScale, 32, 32);

    const moonTexture = textureLoader.load('assets/maps/8k_moon.jpg');
    const moonHeightmap = textureLoader.load('assets/maps/moon_heightmap_2.jpg');

    const moonMaterial = new MeshStandardMaterial({
      map: moonTexture,
      displacementMap: moonHeightmap,
      displacementScale: 5,
      transparent: true,
    });

    this.moonSphere = new Mesh(moonGeometry, moonMaterial);
    this.moonSphere.receiveShadow = true;
    this.moonSphere.castShadow = true;

    this.moonPivot = new Object3D();
    this.moonPivot.position.set(0, 0, 0);
    this.moonSphere.position.set(1000, 0, 0);
    this.moonPivot.add(this.moonSphere);
    this.scene.add(this.moonPivot);

    // AmbientLight -----------------------------------------------------------
    const ambientLight = new AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);

    // Sunlight (Directional Light) -------------------------------------------
    const sunScale = earthRadius / 6.371 * 696.34;
    const directionalLight = new DirectionalLight(0xffeebb, 2);
    directionalLight.position.set(sunScale * 3, 0, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 3000;

    this.scene.add(directionalLight);

    this.directionalLightHelper = new DirectionalLightHelper(directionalLight, sunScale / 10);
    this.scene.add(this.directionalLightHelper);

    this.sunPivot = new Object3D();
    this.sunPivot.position.set(0, 0, 0);
    this.scene.add(this.sunPivot);
    this.sunPivot.add(directionalLight);

    // Spaceship---------------------------------------------------------------
    this.spaceshipPivot = new Object3D;
    gltfLoader.load('assets/models/SpaceShip.glb', (gltf) => {
      let spaceship = gltf.scene;
      spaceship.receiveShadow = true;
      spaceship.castShadow = true;
      spaceship.position.set(600, 0, 0);
      spaceship.scale.set(1,1,1);
      spaceship.rotation.x = MathUtils.degToRad(-95);

      // Engine Light
      //const engineLight = new PointLight(0xff4500, 2, 1500000); // Orange light
      //engineLight.castShadow = false;
      //engineLight.position.set(48, -68, 0); // Position at the rear of the ship
      //spaceship.add(engineLight); // Attach light to the ship

      this.mixer = new AnimationMixer(spaceship);
      const ship_play = gltf.animations[0];
      this.mixer.clipAction(ship_play).play();

      this.spaceshipPivot.add(spaceship);
      this.scene.add(this.spaceshipPivot);

      //const lightHelper = new PointLightHelper(engineLight, 5);
      //this.scene.add(lightHelper);
    })

    // Moon -------------------------------------------------------------------
    // Gateway Core
    this.gatewayPivot = new Object3D;
    gltfLoader.load('assets/models/gateway_core.glb', (gltf) => {
      let gateway_core = gltf.scene;
      gateway_core.receiveShadow = true;
      gateway_core.castShadow = true;
      gateway_core.position.set(200, 0, 0);
      gateway_core.scale.set(1, 1, 1);
      this.gatewayPivot.add(gateway_core);
      this.moonSphere.add(this.gatewayPivot);
    })

    // Perseverance Rover
    gltfLoader.load('assets/models/perseverance.glb', (gltf) => {
      const rover = gltf.scene;
      rover.scale.set(2, 2, 2);
      rover.receiveShadow = true;
      rover.castShadow = true;
      rover.position.set(100, 97, 0);
      rover.rotation.z = MathUtils.degToRad(319);
      this.moonSphere.add(rover);
    })

    // Europe------------------------------------------------------------------
    // Eiffel Tower Model
    gltfLoader.load('assets/models/eiffel_tower.glb', (gltf) => {
      const eiffel_tower = gltf.scene;
      eiffel_tower.scale.set(2, 2, 2);
      eiffel_tower.receiveShadow = true;
      eiffel_tower.castShadow = true;
      eiffel_tower.position.set(328, 377, -9.3);
      eiffel_tower.rotation.z = MathUtils.degToRad(319);
      this.earthSphere.add(eiffel_tower);
    })

    // Leaning Tower of Pisa
    gltfLoader.load('assets/models/leaning_tower_of_pisa.glb', (gltf) => {
      const leaning_tower = gltf.scene;
      leaning_tower.scale.set(2, 2, 2);
      leaning_tower.receiveShadow = true;
      leaning_tower.castShadow = true;
      leaning_tower.position.set(356, 360, -75);
      leaning_tower.rotation.z = MathUtils.degToRad(315);
      this.earthSphere.add(leaning_tower);
    })

    // Big Ben
    gltfLoader.load('assets/models/big_ben.glb', (gltf) => {
      const big_ben = gltf.scene;
      big_ben.scale.set(0.003, 0.003, 0.003);
      big_ben.receiveShadow = true;
      big_ben.castShadow = true;
      big_ben.position.set(320, 400, -15);
      big_ben.rotation.z = MathUtils.degToRad(315);
      this.earthSphere.add(big_ben);
    })

    // Cologne Cathedral
    gltfLoader.load('assets/models/cologne_cathedral.glb', (gltf) => {
      const cologne_cathedral = gltf.scene;
      cologne_cathedral.scale.set(25, 25, 25);
      cologne_cathedral.receiveShadow = true;
      cologne_cathedral.castShadow = true;
      cologne_cathedral.position.set(314, 386, -39);
      cologne_cathedral.rotation.y = MathUtils.degToRad(10);
      cologne_cathedral.rotation.z = MathUtils.degToRad(319);
      this.earthSphere.add(cologne_cathedral);
    })

    // North- and Central America ----------------------------------------------------------
    // Statue of Liberty
    gltfLoader.load('assets/models/statue_of_liberty.glb', (gltf) => {
      const statue_of_liberty = gltf.scene;
      statue_of_liberty.scale.set(1, 1, 1);
      statue_of_liberty.receiveShadow = true;
      statue_of_liberty.castShadow = true;
      statue_of_liberty.position.set(96, 280, 357);
      statue_of_liberty.rotation.x = MathUtils.degToRad(10);
      statue_of_liberty.rotation.y = MathUtils.degToRad(280);
      statue_of_liberty.rotation.z = MathUtils.degToRad(315);
      this.earthSphere.add(statue_of_liberty);
    })

    // Golden Gate Bridge NOCH FIXEN
    gltfLoader.load('assets/models/golden_gate_bridge.glb', (gltf) => {
      const golden_gate_bridge = gltf.scene;
      golden_gate_bridge.scale.set(0.2, 0.2, 0.2);
      golden_gate_bridge.receiveShadow = true;
      golden_gate_bridge.castShadow = true;
      golden_gate_bridge.position.set(-212, 324, 316);
      golden_gate_bridge.rotation.x = MathUtils.degToRad(45);
      this.earthSphere.add(golden_gate_bridge);
    })

    // Mayan Pyramids
    gltfLoader.load('assets/models/mayan_pyramid.glb', (gltf) => {
      const mayan_pyramid = gltf.scene;
      mayan_pyramid.scale.set(1, 1, 1);
      mayan_pyramid.receiveShadow = true;
      mayan_pyramid.castShadow = true;
      mayan_pyramid.position.set(12, 180, 466);
      mayan_pyramid.rotation.x = MathUtils.degToRad(69);
      this.earthSphere.add(mayan_pyramid);
    })

    // South America ----------------------------------------------------------
    // Christ the Redeemer
    gltfLoader.load('assets/models/christ_the_redeemer.glb', (gltf) => {
      const christ_the_redeemer = gltf.scene;
      christ_the_redeemer.scale.set(10, 10, 10);
      christ_the_redeemer.receiveShadow = true;
      christ_the_redeemer.castShadow = true;
      christ_the_redeemer.position.set(336, -193, 315);
      christ_the_redeemer.rotation.x = MathUtils.degToRad(120);
      christ_the_redeemer.rotation.z = MathUtils.degToRad(-50);
      this.earthSphere.add(christ_the_redeemer);
    })


    // Pyramid of Giza
    gltfLoader.load('assets/models/pyramid_of_giza.glb', (gltf) => {
      const pyramid_of_giza = gltf.scene;
      pyramid_of_giza.scale.set(10, 10, 10);
      pyramid_of_giza.receiveShadow = true;
      pyramid_of_giza.castShadow = true;
      pyramid_of_giza.position.set(395, 230, -230);
      pyramid_of_giza.rotation.z = MathUtils.degToRad(60);
      pyramid_of_giza.rotation.y = MathUtils.degToRad(210);
      this.earthSphere.add(pyramid_of_giza);
    })

    // Asia -------------------------------------------------------------------
    // Taji Mahal NOCH FIXEN!!!
    gltfLoader.load('assets/models/taj_mahal.glb', (gltf) => {
      const taj_mahal = gltf.scene;
      taj_mahal.scale.set(0.1, 0.1, 0.1);
      taj_mahal.receiveShadow = true;
      taj_mahal.castShadow = true;
      taj_mahal.position.set(94.5, 223, -439);
      //taj_mahal.rotation.x = MathUtils.degToRad(120);
      //taj_mahal.rotation.x = MathUtils.degToRad(-10);
      taj_mahal.rotation.y = MathUtils.degToRad(90);
      taj_mahal.rotation.z = MathUtils.degToRad(-60);
      this.earthSphere.add(taj_mahal);
    })

    // Mount Fuji
    gltfLoader.load('assets/models/mount_fuji.glb', (gltf) => {
      const mount_fuji = gltf.scene;
      mount_fuji.scale.set(10, 10, 10);
      mount_fuji.receiveShadow = true;
      mount_fuji.castShadow = true;
      mount_fuji.position.set(-305, 290, -268);
      //taj_mahal.rotation.x = MathUtils.degToRad(120);
      //taj_mahal.rotation.x = MathUtils.degToRad(-10);
      //mount_fuji.rotation.x = MathUtils.degToRad(10);
      //mount_fuji.rotation.z = MathUtils.degToRad(95);
      //mount_fuj.rotation.z = MathUtils.degToRad(-60);
      mount_fuji.rotation.z = MathUtils.degToRad(20);
      mount_fuji.rotation.y = MathUtils.degToRad(140);
      mount_fuji.rotation.x = MathUtils.degToRad(-30);
      this.earthSphere.add(mount_fuji);
    })


    // Camera -----------------------------------------------------------------
    this.camera.position.set(0, 400, -650);
    this.camera.rotation.set(-2, 0, 0);

    // OrbitControls ----------------------------------------------------------
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;

    this.renderer.setAnimationLoop(() => this.animate());

    // Loads texture from image
    //const loader = new TextureLoader();
    //loader.load('assets/maps/h7.jpg', (texture: Texture) => this.onTextureLoaded(texture));
  }


  onSphereClick(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
  
    const mouse = new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
  
    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
  
    const intersects = raycaster.intersectObject(this.earthSphere);
  
    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point;
      console.log('Intersection point (Cartesian):', intersectionPoint);
  
      const radius = this.earthSphere.geometry.parameters.radius;
      const spherical = {
        longitude: Math.atan2(intersectionPoint.z, intersectionPoint.x),
        latitude: Math.asin(intersectionPoint.y / radius),
      };
  
      console.log('Spherical coordinates:', {
        longitude: MathUtils.radToDeg(spherical.longitude),
        latitude: MathUtils.radToDeg(spherical.latitude),
      });
    }
  }




  private onTextureLoaded(texture: Texture) {
    console.log('Texture loaded');
    const canvas = document.createElement('canvas');
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.drawImage(texture.image, 0, 0);

    const data = context.getImageData(0, 0, canvas.width, canvas.height);

    this.generateTerrain(data);
  }

  animate() {
    const elapsed = this.clock.getElapsedTime();

    // Earth Rotation
    this.earthPivot.rotation.y = MathUtils.degToRad((elapsed * (360 / 10)) % 360);

    // Moon Rotation
    this.moonPivot.rotation.y = MathUtils.degToRad((elapsed * (360 / 30)) % 360);

    // Sun Rotation
    this.sunPivot.rotation.y = MathUtils.degToRad((elapsed * (360 / 60)) % 360);

    //Spaceship Flight
    this.spaceshipPivot.rotation.y += 0.002;

    //Luna Orbiter Flight
    this.gatewayPivot.rotation.y += 0.001;

    if (this.mixer) {
      this.mixer.update(elapsed);
    }


    this.renderer.render(this.scene, this.camera);

  }

  private generateTerrain(imageData: ImageData) {
    console.log(`imageData -> width: ${imageData.width} height: ${imageData.height}`);

    const colorInfos = [[0.38, 0.68, 0.3], [0.8, 0.8, 0.3], [0.99, 0.99, 0.99]];
    const vertices = [];
    const colors = [];
    const uvs = [];

    for (let z = 0; z < imageData.height; z++) {
      for (let x = 0; x < imageData.width; x++) {
        const index = x * 4 + z * imageData.width * 4;
        const y = imageData.data[index] / 255;

        vertices.push(x - imageData.width / 2, y * 300, z - imageData.height / 2);


        if (y <= 0.5) {
          colors.push(...colorInfos[0], 1);
        } else if (y > 0.5 && y <= 0.8) {
          colors.push(...colorInfos[1], 1);
        } else {
          colors.push(...colorInfos[2], 1);
        }
        uvs.push(x / (imageData.width - 1), z / (imageData.height - 1));
      }
    }

    const indices = [];
    for (let j = 0; j < imageData.height - 1; j++) {
      const offset = j * imageData.width;
      for (let i = offset; i < offset + imageData.width - 1; i++) {
        indices.push(i, i + imageData.width, i + 1, i + 1, i + imageData.width, i + 1 + imageData.width);
      }
    }

    const geometry = new BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 4));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));

    geometry.computeVertexNormals();

    const texture = new TextureLoader().load('assets/maps/2k_mars.jpg');
    const material = new MeshStandardMaterial({ map: texture, wireframe: false });
    this.map = new Mesh(geometry, material);
    this.map.receiveShadow = true;

    this.scene.add(this.map);
  }

}
