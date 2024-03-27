var GSMap={
	css:[],
	js:["lib/ol-6.9.0.min.js","js/kp/awt/lib/awt.js","js/kp/awt/lib/Editor.js","js/kp/awt/AWToolbox.js","js/kp/awt/AWBasic.js","js/kp/awt/AWEdit.js","js/kp/awt/AWSnap.js"],
	css:["lib/ol-6.9.0.min.css","js/kp/awt/css/awx.css","js/kp/awt/css/awb.css","js/kp/awt/css/awe.css","js/kp/awt/css/aws.css"],
	loadLibrary:function() {
		if(!window.ol){
			var self=this;
			var css=document.createElement("link");
			css.rel="stylesheet";
			css.href=this.css[0];
			document.head.appendChild(css);
			css.onload=function(){
				for(var i=1;i<self.css.length;i++){
					var css=document.createElement("link");
					css.rel="stylesheet";
					css.href=self.css[i];
					document.head.appendChild(css);
				}
			}
			var js=document.createElement("script");
			js.src=this.js[0];
			document.head.appendChild(js);
			js.onload=function(){
				for(var i=1;i<self.js.length;i++){
					var js=document.createElement("script");
					js.src=self.js[i];
					document.head.appendChild(js);
				}
			}
		}
	},
	resize:function(){
		if(this.map)this.map.updateSize();
	},
	queryMetadata:function(url,typeNames, onok){
		var xhr=new XMLHttpRequest();
		xhr.onreadystatechange=function(){
			if(this.readyState==XMLHttpRequest.DONE){
				if(this.status==0||(this.status>=200&&this.status<400))
					onok(JSON.parse(this.response));
				else
					kp.awt.showError(this.response);
			}
		};
		xhr.onerror=kp.awt.showError;
		xhr.open("GET",url+"/wfs?request=DescribeFeatureType&outputFormat=application/json&typeNames="+typeNames,true);
		xhr.send();
	},
	createMap:function(conf){
		this.config=conf;
		if(!this.config.view.projection)this.config.view.projection="EPSG:4326";
		var basemap = new ol.layer.Tile({
			source: this.config.basemap?this.config.basemap:kp.awt.BASEMAPS.osm
		});
		basemap.name= "Basemap";
		this.layers=[basemap];
		var dynamicLayer=null;
		for(var i=0;i<this.config.layers.length;i++){
			var lyr=this.config.layers[i];
			var subLayers=[],subLyr=null,activeSublayer=null;
			var tag={LAYERS:[],VISIBLES:[],IDENTIFYS:[],SELECTS:[],ADDTOCS:[]};
			for(var j=0;j<lyr.subLayers.length;j++){
				subLyr=lyr.subLayers[j];
				tag.LAYERS.push(subLyr.layername);
				tag.VISIBLES.push(subLyr.isvisible);
				tag.IDENTIFYS.push(subLyr.isidentify);
				tag.SELECTS.push(subLyr.isselect);
				tag.ADDTOCS.push(subLyr.isaddtoc);
				if(subLyr.isvisible)subLayers.push(subLyr.layername);
				if(subLyr.isidentify)activeSublayer=subLyr.layername;
			}
			var layer=new ol.layer.Tile({
				source: new ol.source.TileWMS({
					params: {LAYERS:subLayers},
					url: lyr.urledit+"wms"
				})
			});
			if(lyr.isidentify)dynamicLayer=layer;
			
			layer.id=lyr.mapid;
			layer.name=lyr.mapname;
			layer.activeSublayer=activeSublayer?activeSublayer:subLyr.layername;
			layer.tag=tag;
			layer.setVisible(lyr.isvisible);
			this.layers.push(layer);
		}
		
		this.map = new ol.Map({
			view: new ol.View(this.config.view),
			target: this.config.divMap,
			layers: this.layers
		});
		
		//this.map3d = new olcs.OLCesium({
		//	map: this.map,
		//});
		//this.map3d.getCesiumScene().terrainProvider=new Cesium.CesiumTerrainProvider({url: '//cesiumjs.org/stk-terrain/tilesets/world/tiles'});

		window.addEventListener("resize",this.resize);
		
		var overlaySelect = new ol.layer.Vector({
			map: this.map,
			source: new ol.source.Vector({
				format: new ol.format.GeoJSON()
			}),
			style: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 4,
					fill: new ol.style.Fill({ color: "yellow" })
				}),
				stroke: new ol.style.Stroke({ color: "yellow", width: 2 })
			})
		});

		var box = new ol.interaction.DragBox();
		box.setActive(false);
		this.map.addInteraction(box);
		
		var awx = new kp.awt.AWToolbox({
			map: this.map,
			//map3d: this.map3d,
			box:box,
			layers: this.layers,
			dynamicLayer: dynamicLayer?dynamicLayer:this.layers[1],
			selectLayer: overlaySelect
		}, this.config.divTool);
		this.awBasic=awx.loadAWWidget(kp.awt.AWBasic,true);
		awx.loadAWWidget(kp.awt.AWEdit,true);
		awx.loadAWWidget(kp.awt.AWSnap);
		awx.displayToolbox();
		/*var self=this;
		this.queryMetadata(this.url,lyrNames,function(res){
			self.metadata={};
			for(var i=0;i<res.featureTypes.length;i++){
				var featType=res.featureTypes[i];
				var prop={};
				for(var j=0;j<featType.properties.length;j++)
					prop[featType.properties[j].name]=featType.properties[j];
				self.metadata[featType.typeName]=prop;
			}
		})*/
	},
	getLayerConfig:function(id){
		var key=isNaN(id)?"layername":"tableid";
		for(var i=0;i<this.config.layers.length;i++){
			var layer=this.config.layers[i];
			for(var j=0;j<layer.subLayers.length;j++)
				if(layer.subLayers[j][key]==id)return layer.subLayers[j];
		}
	},
	getLayer(id){
		for(var i=0;i<this.layers.length;i++)
			if(this.layers[i][id]==id)return this.layers[i];
	},
	applyFilter:function(layerIndex, subLayerIndex, where){
		var source=this.layers[layerIndex].getSource();
		var filter="",params=source.getParams();;
		for(var i=0;i<params.LAYERS.length;i++){
			var wh=(i==subLayerIndex)?where[0]+where[1]+where[2]:"1=1";
			filter+=filter?";"+wh:wh;
		}
		params.CQL_FILTER=filter;
		source.updateParams(params);
	},
	zoomToExtent:function(ext){
		this.awBasic.zoomToExtent(ext);
	},
	zoomToFeature:function(layerIndex,subLayerName,where){
		this.awBasic.selectFeatueByAttribute(this.layers[layerIndex],subLayerName,where);
	}
}