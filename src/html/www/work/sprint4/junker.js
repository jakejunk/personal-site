// Constants
var XAXIS = new THREE.Vector3(1,0,0);
var YAXIS = new THREE.Vector3(0,1,0);
var ZAXIS = new THREE.Vector3(0,0,1);

var moveableObjects = [];

var container;		// A div element that will hold the renderer
var renderer;		// The Three.js webGL renderer
var selectContainer;// Element that will hold all the controllable objects
var selectLabel;

var camera;			// A camera object that gives the viewpoint
var scene; 			// The scene graph
var light1, light2;	// extra lights

var mouseX = 0, mouseY = 0;			// The position of the mouse
var mousePrevX = 0, mousePrevY = 0; // previous mouse position
var mouseDown = 0;                  // mouse button currently pressed
var windowX = window.innerWidth;	// half the width of the window
var windowY = window.innerHeight;	// half the height of the window

// For key down/up events
var wdown = 0;
var adown = 0;
var sdown = 0;
var ddown = 0;

// Initialization and initial call to tick.
// Executed when the page is loaded.
window.onload = function()
{
	init();
	tick();
}

var shapeIndex = [0,0,0,0,0,0];
var shapeNames = ["sphere", "cube", "plane", "cone", "cylinder", "torus"];
function init() 
{
	// Create the container and add it to the page
	container = document.createElement("div");
	container.id = "main";
	container.tabIndex = 0;
	document.body.appendChild(container);
	
	// Create a reference to the selection dropdown for later
	selectContainer = document.getElementById("objselect");
	selectLabel = document.getElementById("select-button").nextSibling;
	
	// Create a camera that will be used to render the scene
	camera = new THREE.PerspectiveCamera(30, container.clientWidth/container.clientHeight, 1, 2000);
	camera.rotation.order = 'YXZ';
	
	// Create the scene 
	scene = new THREE.Scene();
	
	// Now parse the json, since we have the necessary objects allocated
	// Change to "demo1.json" for the other demo
	parseJsonFile("test.json");

	// While json is parsing, create the renderer and add it to the container (div element)
	// Also add event listeners so we can respond to events.
	renderer = new THREE.WebGLRenderer({antialias:false});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(container.clientWidth, container.clientHeight);
	container.appendChild(renderer.domElement);
	container.addEventListener("mousemove", onDocumentMouseMove, false);
	container.addEventListener("mousedown", onDocumentMouseDown, false);
	container.addEventListener("mouseup", onDocumentMouseUp, false);
	container.addEventListener("keydown", onKeyDown);
	container.addEventListener("keyup", onKeyUp);
	window.addEventListener("resize", onWindowResize, false);
	
	// Hook click events for the buttons that instantiate new objects
	var createButtons = document.getElementById("creator").childNodes;
	var length = createButtons.length;
	for (var i = 0, j = -1; i < length; ++i)
	{
		var button = createButtons[i];
		if (button.nodeType == 3) continue;
		button.setAttribute("data-value", ++j);
		button.onclick = function()
			{
				var num = Number(this.getAttribute("data-value"));
				var incr = ++shapeIndex[num]
				var name = shapeNames[num];
				var parent = document.getElementById("childOrNah").checked ? moveableObjects[activeIndex] : undefined;
				addMeshToScene(name, name+incr, [Math.random(), Math.random(), Math.random()], [1,1,1], [0,0,0], undefined, parent);
			}
	}

	// Some extra lights
	loadLights();
}

// Parses a json file containing a scene
function parseJsonFile(filename)
{
	var request = new XMLHttpRequest();
	request.open("GET", filename, true);
	request.overrideMimeType("application/json");
	request.send();
	
	// Necessary since call to send is asynchronous
	request.onload = function() 
		{
            var rootNode = JSON.parse(request.responseText);
            var children = rootNode["children"];
        	for(var i = 0; i < children.length; ++i)
			{
				var obj = children[i];
				var type = obj["type"];
				switch (type)
				{
					case "mesh":
						var m = obj["material"];
						addMeshToScene(obj["geometry"], obj["name"], m["diffuseColor"], m["specularColor"], obj["translate"], obj["children"], undefined);
						break;
					case "sprite":
						addSpriteToScene(obj["path"], obj["name"], obj["translate"], obj["children"], undefined);
						break;
					case "camera":
						handleCamera(obj);
						break;
					case "point light":
						var color = obj["color"];
						var plight = new THREE.PointLight(new THREE.Color(color[0], color[1], color[2]), obj["intensity"], obj["distance"], obj["decay"]);
						var pos = obj["position"];
						plight.position.set(pos[0], pos[1], pos[2]);
						scene.add(plight);
						break;
					case "directional light":
						var color = obj["color"];
						var dlight = new THREE.DirectionalLight(new THREE.Color(color[0], color[1], color[2]));
						var pos = obj["position"];
						dlight.position.set(pos[0], pos[1], pos[2]);
						scene.add(dlight);
						break;
					case "ambient light":
						var color = obj["color"];
						var alight = new THREE.AmbientLight(new THREE.Color(color[0], color[1], color[2]));
						scene.add(alight);
						break;
				}
				var src = obj["script"];
				if (src)
				{
					loadScript(src);
				}
			}
        }
}

var funcIndex = 0;
var scripts = [];

// Only meshes, sprites, and cameras can have scripts
function loadScript(s)
{
	var script = document.createElement("script");
	script.src = s["src"];
	
	scripts.push(index-1);
	scripts.push(s["name"]);

	document.head.appendChild(script);
}

function addSpriteToScene(path, name, translate, child, parent)
{
	var texMap = THREE.ImageUtils.loadTexture(path, {}, function()
		{
			texMap.magFilter = THREE.NearestFilter;
			texMap.minFilter = THREE.LinearMipMapLinearFilter;
			
			var material = new THREE.SpriteMaterial({map: texMap, fog: true});
			var sprite = new THREE.Sprite(material);
			
			sprite.position.x = translate[0];
			sprite.position.y = translate[1];
			sprite.position.z = translate[2];
			
			var max = texMap.image.width > texMap.image.height ? texMap.image.width : texMap.image.height;
			sprite.scale.x = texMap.image.width / max;
			sprite.scale.y = texMap.image.height / max;
			
			handleChildren(child, sprite, parent);
			addControllableObject(sprite, name, false, "#fff");
		});
}

// Create a mesh and add it to the scene
function addMeshToScene(geometryStr, name, dColor, sColor, translate, child, parent)
{
	var geometry;
	switch (geometryStr)
	{
		case "sphere":
			geometry = new THREE.SphereGeometry(1, 32, 32);
			break;
		case "cube":
			geometry = new THREE.BoxGeometry(1, 1, 1);
			break;
		case "plane":
			geometry = new THREE.PlaneGeometry(1, 1);
			break;
		case "cone":
			geometry = new THREE.CylinderGeometry(0, 1, 1, 32);
			break;
		case "cylinder":
			geometry = new THREE.CylinderGeometry(1, 1, 1, 32);
			break;
		case "torus":
			geometry = new THREE.TorusGeometry(1, 0.5, 32, 32);
			break;
		default:
			alert(name);
			return;
	}

	var diffuseColor = new THREE.Color(dColor[0], dColor[1], dColor[2]);
	var material = new THREE.MeshPhongMaterial(
		{
			color: diffuseColor, 
			specular: new THREE.Color(sColor[0], sColor[1], sColor[2]), 
			shading: THREE.SmoothShading
		});
	var shapeToAdd = new THREE.Mesh(geometry, material);
	
	shapeToAdd.position.x = translate[0];
	shapeToAdd.position.y = translate[1];
	shapeToAdd.position.z = translate[2];
	
	handleChildren(child, shapeToAdd, parent);
	addControllableObject(shapeToAdd, name, false, "#"+diffuseColor.getHexString());
}

function handleChildren(child, shapeToAdd, parent)
{
	if (child !== undefined)
	{
		for(var i = 0; i < child.length; ++i)
		{
			var obj = child[i];
			if (obj["type"] === "mesh")
			{
				var m = obj["material"];
				addMeshToScene(obj["geometry"], obj["name"], m["diffuseColor"], m["specularColor"], obj["translate"], obj["children"], shapeToAdd);
			}
			else if (obj["type"] === "sprite")
			{
				addSpriteToScene(obj["path"], obj["name"], obj["translate"], obj["children"], shapeToAdd);
			}
			
			var src = obj["script"];
			if (src)
			{
				loadScript(src);
			}
		}
	}
	if (parent !== undefined)
	{
		parent.add(shapeToAdd);
	}
	else
	{
		scene.add(shapeToAdd);
	}
}

// Configure camera properties based on a json node
function handleCamera(obj)
{
	var eye = obj["eye"];
	camera.position.x = eye[0];
	camera.position.y = eye[1];
	camera.position.z = eye[2];
	
	var vup = obj["vup"];
	camera.up.set(vup[0], vup[1], vup[2]);

	
	var center = obj["center"];
	camera.lookAt(new THREE.Vector3(center[0], center[1], center[2]));
	
	camera.fov = obj["fov"];
	camera.updateProjectionMatrix();
	
	scene.add(camera);
	addControllableObject(camera, "Camera", true, "#fff");
}

var index = 0;
var activeIndex = 0;
var cameraIndex = 0;
var firstObject = true;
function addControllableObject(obj, label, isCamera, colorHex)
{
	moveableObjects.push(obj);

	colorHex = "background: #2D2D2D; color:"+colorHex+";";
	var button = document.createElement("button");
	button.setAttribute("type", "button");
	button.setAttribute("data-value", index);
	button.setAttribute("style", colorHex);
	button.onclick = function()
		{
			changeFocus(Number(this.getAttribute("data-value")), this.innerHTML, this.getAttribute("style"));
		}
	
	var text = document.createTextNode(label);
	button.appendChild(text);
	selectContainer.appendChild(button);
	
	if (isCamera)
	{
		cameraIndex = index;
	}
	if (firstObject)
	{
		changeFocus(index, text.nodeValue, colorHex);
	}
	
	index = index + 1;
	firstObject = false;
}

// Changes the focus to a certain object so that it can receive events
function changeFocus(index, text, style)
{
	activeIndex = index
	if (index == cameraIndex)
	{
		rev = -1;
	}
	else
	{
		rev = 1;
	}
	selectLabel.innerHTML = text;
	selectLabel.setAttribute("style", style);
}

function loadLights()
{
	// Add a blueish ambient light to the scene
	var ambient = new THREE.AmbientLight(0x222244);
	scene.add(ambient);

	// Add a yellowish directional light to the scene
	light1 = new THREE.DirectionalLight(0xffeedd);
	light1.position.set(1, 1, 1);
	scene.add(light1);

	// Add a dim directional light
	light2 = new THREE.DirectionalLight(0x333333);
	light2.position.set(0, 0, 1);
	scene.add(light2);
}

// EVENT HANDLERS =============================================================

function onWindowResize() 
{
	var container = document.getElementById("main");
	windowX = container.clientWidth;
	windowY = container.clientHeight;

	camera.aspect = container.clientWidth / container.clientHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(container.clientWidth, container.clientHeight);
}

function onKeyDown(event)
{
	switch (event.which)
	{
		case 87:
			wdown = 1;
			break;
		case 65:
			adown = 1;
			break;
		case 83:
			sdown = 1;
			break;
		case 68:
			ddown = 1;
			break;
	}
}

function onKeyUp(event)
{
	switch (event.which)
	{
		case 87:
			wdown = 0;
			break;
		case 65:
			adown = 0;
			break;
		case 83:
			sdown = 0;
			break;
		case 68:
			ddown = 0;
			break;
	}
}

function onDocumentMouseUp( event ) 
{
	mouseDown = 0;
}	

function onDocumentMouseDown( event ) 
{
	mouseDown = event.which;
}	

function onDocumentMouseMove( event ) 
{
	//mousePrevX = mouseX;
	//mousePrevY = mouseY;
	mouseX = event.clientX;
	mouseY = event.clientY;
}

// ===========================================================================

// "Main loop"
function tick() 
{
	// requestAnimationFrame schedules a call to animate again
	requestAnimationFrame(tick); 
	update();
	render();
}

var rev = 1;	// Used to reverse direction of rotation when camera has focus
function update()
{
	var target = moveableObjects[activeIndex];
	target.translateX(adown * -0.1 + ddown * 0.1);
	target.translateZ(wdown * -0.1 + sdown * 0.1)

	if (mouseDown == 1)
	{
		target.rotation.y += rev*(mouseX-mousePrevX)*0.005;
		target.rotation.x += rev*(mouseY-mousePrevY)*0.005;
	}

	// Update previous position here because animateFrame out of sync
	// with onDocumentMouseMove
	mousePrevX = mouseX;
	mousePrevY = mouseY;
	
	runScripts();
}

function runScripts()
{
	for (var i = 0; i < scripts.length; ++i)
	{
		var target = moveableObjects[scripts[i]];
		var funcName = scripts[++i];
		var func = window[funcName];
		if (func !== undefined && typeof func === "function")
		{
			func(target);
		}
	}
}

function render() 
{
	renderer.render(scene, camera);
}
