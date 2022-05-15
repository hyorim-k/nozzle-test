import * as THREE from '../build/three.module.js';
import { GUI } from '../examples/jsm/libs/lil-gui.module.min.js';
import Stats from '../examples/jsm/libs/stats.module.js'
import {OrbitControls} from '../examples/jsm/controls/OrbitControls.js';
import { DecalGeometry } from '../examples/jsm/geometries/DecalGeometry.js';


class App {
    
    constructor() {         //App 클래스 생성자
        const divContainer = document.querySelector("#webgl-container");  
        this._divContainer = divContainer;  

        const renderer = new THREE.WebGLRenderer({ antialias: true});   
        renderer.setPixelRatio(window.devicePixelRatio);  //픽셀 비율 설정 
        divContainer.appendChild(renderer.domElement);   //domElement를 자식으로 추가
        this._renderer = renderer;  //필드화

        const scene = new THREE.Scene();  //씬 객체 생성
        this._scene = scene;  //필드화

        const stats = Stats();

        this._setupCamera();  //카메라객체
        this._setupLight();    //광원 설정
        this._setupModel();  //3차원모델 셋업
        this._setupControls();
        this._setupGUI();

        window.onresize = this.resize.bind(this);  //창 크기 변경될 때 위한 resize 이벤트에 resize메서드 지정. bind 이유: this가 가리키는 것을 이벤트가 아닌 App 클래스로 하기 위함. 
        this.resize();      //렌더러나 카메라의 속성을 창 크기에 맞게 설정

        requestAnimationFrame(this.render.bind(this));  //requestAnimationFrame이 렌더 메서드를 적당한 시점에 호출
    }


    _setupGUI() {

        const sprayPivot = this._scene.getObjectByName("sprayPivot");
        const spray = sprayPivot.children[0];

        const params = {
            angle: 0,
            clear: function(){
                spray.material = spray.material.clone();
                spray.material.visible = false;
            }
        };
            
        const gui = new GUI();
        const sprayFolder = gui.addFolder("Spray");

        sprayFolder.add(params, 'angle', 0, 30, 0.1).onChange(regenerateGeometry);
        sprayFolder.add(params, 'clear');
        sprayFolder.open();

        function regenerateGeometry() {
            spray.material.visible = true;
            let newGeometry = new THREE.ConeBufferGeometry(params.angle, 3, 64, 10, true);
            spray.geometry.dispose();
            spray.geometry = newGeometry;
            
        }

        const cameraFolder = gui.addFolder("Camera");
        cameraFolder.add(this._camera.position, "z", 0, 10, 1);

        this._params = params;
        this._gui = gui;
    }

    _setupControls() {
        new OrbitControls(this._camera, this._divContainer);
    }

    _setupCamera() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;
        const camera  = new THREE.PerspectiveCamera(  //카메라객체 생성
            75,
            width / height,
            0.1,
            100
        );
        camera.position.z = 7;
        this._camera = camera;  //카메라 객체의 필드화
        this._scene.add(camera);
    }

    _setupLight () {
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        this._scene.add(ambientLight);

        const color = 0xffffff;  //광원의 색상
        const intensity = 4;   //광원의 세기
        const light = new THREE.DirectionalLight(color, intensity);  //광원 생성
        light.position.set(0, 5, 10);  //광원 위치 설정
        //this._scene.add(light);  //광원을 씬 객체에 추가
        this._camera.add(light);
    }

    _setupModel () {
        const axesHelper = new THREE.AxesHelper(5);
        this._scene.add(axesHelper);
        
        //1. ---Box---
        //1.1 texture
        const textureLoader = new THREE.TextureLoader();
        const map = textureLoader.load("images/metal/Metal_Grill_021_basecolor.jpg");
        const mapAO = textureLoader.load("images/metal/Metal_Grill_021_ambientOcclusion.jpg");
        const mapHeight = textureLoader.load("images/metal/Metal_Grill_021_height.png");
        const mapNormal = textureLoader.load("images/metal/Metal_Grill_021_normal.jpg");
        const mapRoughness = textureLoader.load("images/metal/Metal_Grill_021_roughness.jpg");
        const mapMetallic = textureLoader.load("images/metal/Metal_Grill_021_metallic.jpg");
        const mapAlpha = textureLoader.load("images/metal/Metal_Grill_021_opacity.jpg");
        const mapMetal = textureLoader.load("images/metal/Metal_scratched_008_basecolor.jpg");
        const mapAOMetal = textureLoader.load("images/metal/Metal_scratched_008_ambientOcclusion.jpg");
        const mapHeightMetal = textureLoader.load("images/metal/Metal_scratched_008_height.png");
        const mapNormalMetal = textureLoader.load("images/metal/Metal_scratched_008_normal.jpg");
        const mapRoughnessMetal = textureLoader.load("images/metal/Metal_scratched_008_roughness.jpg");
        const mapMetallicMetal = textureLoader.load("images/metal/Metal_scratched_008_metallic.jpg");

        //1.2 material
        const sideMaterial =  new THREE.MeshStandardMaterial({
            map: mapMetal,
            normalMap: mapNormalMetal,
            displacementMap: mapHeightMetal,  //변위
            displacementScale: 0.1,
            displacementBias: -0.037,

            aoMap: mapAOMetal,  //음영
            aoMapIntensity: 3,

            roughnessMap: mapRoughnessMetal,
            roughness: 0.2,

            metalnessMap: mapMetallicMetal,
            metalness: 0.9,

        });
        const nozzleMaterial = new THREE.MeshStandardMaterial({
            map: map,
            normalMap: mapNormal,
            displacementMap: mapHeight,  //변위
            displacementScale: 0.1,
            displacementBias: -0.033,

            aoMap: mapAO,  //음영
            aoMapIntensity: 3,

            roughnessMap: mapRoughness,
            roughness: 0.4,

            metalnessMap: mapMetallic,
            metalness: 0.8,

            alphaMap: mapAlpha,  //투명도
            transparent: false,
            side: THREE.DoubleSide,
        });

        const boxMaterials = [sideMaterial, sideMaterial, sideMaterial,sideMaterial,  nozzleMaterial,  sideMaterial];

        //1.3 geometry
        const boxGeometry = new THREE.BoxBufferGeometry(1, 1, 1, 256, 256, 256);   //정육면체 형상 객체 생성
        //1.4 mesh
        const box = new THREE.Mesh(boxGeometry, boxMaterials);
        this._scene.add(box);

        //2. ---Torus---
        const torusGeometry = new THREE.TorusGeometry(0.08, 0.03, 32, 32);
        const torusMaterial = new THREE.MeshStandardMaterial({
            color: "#9b59b6",
            roughness: 0.5,
            metalness: 0.9,
        });
        for(let i = 0; i < 5; i++) {
            const torusPivot = new THREE.Object3D(); 
            torusPivot.name = "torusPivot";
            const torus = new THREE.Mesh(torusGeometry, torusMaterial);
            torus.rotation.x = THREE.Math.degToRad(90);
            torusPivot.rotation.y = THREE.Math.degToRad(72 * i);    
            torus.position.set(0.3, -0.5, -0.05);
            torusPivot.add(torus);  //Object3D 객체에 torus geometry 추가
            this._scene.add(torusPivot);
        }

        //3. --Spary--
        const sprayGeometry = new THREE.ConeBufferGeometry(0.5, 3, 64, 10, true);
        const sprayMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            fog: true,
            transparent: true,
            opacity: 0.6,
            depthTest: true,
            depthWrite: true,
            side: THREE.DoubleSide,
            visible: true,
        });

        

        for(let i = 0; i < 5; i++) {
            const sprayPivot = new THREE.Object3D();
            const spray = new THREE.Mesh(sprayGeometry, sprayMaterial);
            sprayPivot.rotation.y = THREE.Math.degToRad(72 * i);
            spray.position.set(0.3, -2, -0.05);
            sprayPivot.add(spray);
            sprayPivot.name = "sprayPivot";
            this._scene.add(sprayPivot);
        }


        //5. ground
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: "#2c3e50",
            roughness: 0.5,
            metalness: 0.5,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.set(0, -3.5, 0);
        ground.rotation.x = THREE.Math.degToRad(-90);   //x축 기준 -90도로 회전(한 번)
        this._scene.add(ground);

        this._box = box;
        this._ground = ground;
    }

    resize() {//창 크기가 변경될 때의 메서드
        const width = this._divContainer.clientWidth;   //div 컨테이너(webgl-container) 의 속성값 가져와서
        const height = this._divContainer.clientHeight;

        this._camera.aspect = width / height;   //카메라의 속성값 설정
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);  //렌더러의 크기 설정
    }

    render(time) { //렌더 메서드. time: 렌더링이 처음 시작된 이후 경과된 시간(ms)
        this._renderer.render(this._scene, this._camera);   //렌더러가 씬을 카메라의 시점으로 렌더링하라
        this.update(time);  //밑에서 메서드 정의
        requestAnimationFrame(this.render.bind(this));  //계속 렌더 메서드가 반복 호출되도록
    }

    update(time) {
        time *= 0.001;   //ms -> s 단위로 변경

    }    
    
}

window.onload = function() {
    new App();
}

