if (!kp) var kp = {};
if (!kp.awt) kp.awt = {};

//AWBasic - Công cụ bản đồ cơ bản
kp.awt.AWBasic = (function () {
    var that;

    function AWBasic(conf, id) {
        this.iconClass = "awbasic-png";
        this.title = "AWBasic Tools";
        that = this;
        this._conf = conf;
        this.layer = conf.dynamicLayer.getSource();
        this.selectLayer = conf.selectLayer.getSource();
        this.view = conf.map.getView();
        this.fullExtent = this.view.calculateExtent();
        this.stackExtents = [];
        this.stackIndex = -1;
        this.xhr = new XMLHttpRequest();
        this.xhr.onload = this.xhr_onLoad;
        this.measure = {};

        this.layers = conf.map.getLayers().getArray();
        var layerItems = [];
        for (var i = this.layers.length - 1; i >= 0; i--){
			var lyr=this.layers[i];
			layerItems.push({ text: lyr.name, id: "itmSwipe_" + i, checked: lyr == conf.dynamicLayer, tag:i });
		}
		
        var basemapItems = [];
        for (var key in kp.awt.BASEMAPS) {
            if (kp.awt.BASEMAPS.hasOwnProperty(key))
                basemapItems.push({ text: key, id: "itmBasemap" + key, tooltip: "<img src='img/" + key + ".jpg'></img>" });
        }

        var printItems = [];
        for (var i = 0; i < kp.awt.PRINT_TEMPLATES.length; i++) {
            var tpl = kp.awt.PRINT_TEMPLATES[i];
            printItems[i] = { text: tpl.name, id: "itmPrint" + tpl.name, tag: tpl.url }
        }
		
		this.dlgAWBasicControl=kp.awt.createDialog("dlgAWBasicControl","Layer control",300,500);
		id.parentNode.appendChild(this.dlgAWBasicControl);
		
        this.awb = $(id).w2toolbar({
            name: "tbrBasic",
            items: [
				{ type: "button", id: "cmdHelp", icon: "help-png", tooltip: "Help" },
				{ type: "break" },
                { type: "radio", id: "toolPan", icon: "pan-png", tooltip: "Pan" },
                { type: "radio", id: "toolZoomIn", icon: "zoomin-png", tooltip: "Zoom In" },
                { type: "radio", id: "toolZoomOut", icon: "zoomout-png", tooltip: "Zoom Out" },
                { type: "radio", id: "toolIdentify", icon: "identify-png", tooltip: "Identify" },
                { type: "break" },
                { type: "radio", id: "toolSelect", icon: "select-png", tooltip: "Select" },
                { type: "button", id: "cmdUnselect", icon: "unselect-png", tooltip: "Clear Select" },
				{ type: "button", id: "cmdAttribute", icon: "attribute-png", tooltip: "Attribute" },
				{ type: "break" },
                { type: "button", id: "cmdFullExtent", icon: "fullextent-png", tooltip: "Full Extent" },
                { type: "html", id:"htmlScale", html: "Scale 1/<input id='txtScale' type='number' style='width:100px'/>" },
                { type: "button", id: "cmdBackExtent", icon: "back-png", tooltip: "Back Extent" },
                { type: "button", id: "cmdNextExtent", icon: "next-png", tooltip: "Next Extent" },
                { type: "break" },
                { type: "menu-radio", id: "cmdBasemap", icon: "basemap-png", tooltip: "Basemap", items: basemapItems },
				{ type: "check", id: "chkTransparent", icon: "transparent-png", tooltip: "Transparent" },
                { type: "check", id: "chkSwipe", icon: "swipe-png", tooltip: "Swipe" },
                { type: "menu-radio", id: "mnuSwipe", items: layerItems },
                { type: "break" },
                { type: "radio", id: "toolMeasure", icon: "measure-png", tooltip: "Measure" },
                { type: "menu", id: "cmdPrint", icon: "print-png", tooltip: "Print", items: printItems },
                { type: "break" },
                { type: "button", id: "cmdLayerControl", icon: "layercontrol-png", tooltip: "Layer control" },
				{ type: "spacer" },
				{ type: "radio", id: "tool3D", icon: "map3d-png", tooltip: "Map 3D" }
            ],
            onClick: this.item_onClick
        }); //end ui

        this.measureLayer = new ol.source.Vector();
        kp.awt.measureLayer = this.measureLayer;
        var overlay = new ol.layer.Vector({
            map: conf.map,
            source: this.measureLayer,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 4,
                    fill: new ol.style.Fill({ color: "orange" })
                }),
                fill: new ol.style.Fill({ color: [255, 127, 0, 0.25] }),
                stroke: new ol.style.Stroke({ color: "orange", width: 2, lineDash: [8, 8] })
            })
        });

        conf.box.on('boxend', this.box_onBoxEnd);
        conf.map.on('singleclick', this.map_onSingleClick);
        conf.map.on('moveend', this.map_onMoveZoomEnd);
        conf.map.on('zoomend', this.map_onMoveZoomEnd);

        this.txtScale = document.getElementById("txtScale");
        this.txtScale.onchange = this.txtScale_onChange;

        this.view.on('change:resolution', this.view_onChangeResolution);
        this.view_onChangeResolution();


        //this.select = new ol.interaction.Select();
        //conf.map.addInteraction(this.select);
    }
	AWBasic.prototype.setDynamicLayer = function (dynamicLayer) {
		that._conf.dynamicLayer=dynamicLayer;
		that.layer=dynamicLayer.getSource();
	}
    AWBasic.prototype.map_onMoveZoomEnd = function () {
        var cen = that.view.getCenter();
        var res = that.view.getResolution();
        if (that.stackIndex == -1 || cen != that.stackExtents[that.stackIndex].center || res != that.stackExtents[that.stackIndex].resolution) {
            that.stackExtents.push({ center: cen, resolution: res });
            that.stackIndex++;
        }
    }

    AWBasic.prototype.backExtent = function () {
        if (this.stackIndex > 0) this.stackIndex--;
        var back = this.stackExtents[this.stackIndex];
        this.view.setCenter(back.center);
        this.view.setResolution(back.resolution);
    }

    AWBasic.prototype.nextExtent = function () {
        if (this.stackIndex < this.stackExtents.length - 1) this.stackIndex++;
        var back = this.stackExtents[this.stackIndex];
        this.view.setCenter(back.center);
        this.view.setResolution(back.resolution);
    }

    AWBasic.prototype.txtScale_onChange = function () {
        var unit = that.view.getProjection().getUnits();
        that.view.setResolution(that.txtScale.value / (ol.proj.Units.METERS_PER_UNIT[unit] * 39.37 * 96));
    }

    AWBasic.prototype.view_onChangeResolution = function () {
        var unit = that.view.getProjection().getUnits();
        that.txtScale.value = Math.round(that.view.getResolution() * ol.proj.Units.METERS_PER_UNIT[unit] * 39.37 * 96);
    }

    AWBasic.prototype.zoomToExtent = function (ext, zoomOut) {
        var size = this._conf.map.getSize();
        var res = this.view.getResolution();
        var k = ext[2] - ext[0] > ext[3] - ext[1] ? 1.2 * (ext[2] - ext[0]) / size[0] : 1.2 * (ext[3] - ext[1]) / size[1];
        var cen = [(ext[2] + ext[0]) / 2, (ext[3] + ext[1]) / 2];
        this.view.setCenter(cen);
        var conRes = zoomOut ? res * res / k : k;
        this.view.setResolution(conRes);
    }

	AWBasic.prototype.selectFeatueByAttribute = function (layer,subLayers,wheres){
		var lyrUrl = layer.getSource().getUrls()[0].replace("/wms", "/wfs");
		var lyrPrj = that.view.getProjection().getCode();
		that.xhr.open('POST', lyrUrl + "?outputFormat=application/json&request=GetFeature&typename=" + subLayers + "&srsname=" + lyrPrj + "&cql_filter="+wheres+"&maxFeatures="+kp.awt.MAX_QUERY_FEATURE, true);
		that.xhr.setRequestHeader('content-type', 'text/xml;charset=utf-8');
		that.xhr.send();
		that._conf._curTool="toolSelectAttr";
	}
	
	AWBasic.prototype.urlExportImage = function (lyrNames,wheres,size,ext){
		if(!ext)ext=that.view.calculateExtent();
		if(!size)size = this._conf.map.getSize();
		var lyrUrl = that.layer.getUrls()[0];
		var lyrPrj = that.view.getProjection().getCode();
		return {
			url:lyrUrl + "?version=1.3.0&request=GetMap&layers=" + lyrNames + "&srs=" + lyrPrj + "&cql_filter="+wheres+"&width="+size[0]+"&height="+size[1]+"&format=image%2Fpng"+"&bbox=" + ext[1] + "," + ext[0] + "," + ext[3] + "," + ext[2]+",urn:ogc:def:crs:"+ lyrPrj,
			size:size
		}
	}
	
    AWBasic.prototype.xhr_onLoad = function () {
        if (that.xhr.status == 200) {//success
			var feats = that.selectLayer.getFormat().readFeatures(that.xhr.response);
            switch (that._conf._curTool) {
				case "toolSelectAttr":
					if(feats.length>0)that.zoomToExtent(feats[0].getGeometry().getExtent());
				case "toolSelect":
                    that.selectLayer.clear();
					var intersects=[];
					for(var i=0;i<feats.length;i++)if(feats[i].getGeometry().intersectsExtent(that.box))
						intersects.push(feats[i]);
                    if(intersects.length>0)that.selectLayer.addFeatures(intersects);
					feats=intersects;
                    break;
                case "toolIdentify":
                    that.selectLayer.clear();
                    if (feats.length > 0) {
                        that.selectLayer.addFeatures(feats);
                        var prop = feats[0].getProperties();
                        var ids = feats[0].getId().split(".");
                        var html = "<div style='height:300px;overflow-y:scroll'><table><caption style='color:yellow'><b>" + ids[0] + "</b><span style='float:left;cursor:pointer' onclick='$().w2tag()'>⛌</span></caption>";
                        html += "<tr><td>ID</td><td>" + ids[1] + "</td></tr>";
                        for (var key in prop) {
                            if (key != feats[0].getGeometryName() && prop.hasOwnProperty(key)) {
                                html += "<tr><td>" + key + "</td><td>" + prop[key] + "</td></tr>";
                            }
                        }
						var divMap=that._conf.map.getTarget();
						var box=divMap.getBoundingClientRect();
                        $(divMap).w2tag(html + "</table></div>", { left: that.event.originalEvent.clientX - box.left, top: that.event.originalEvent.clientY - box.top });
                    }
                    break;
            }
			that.onFeatureSelect({tool:that._conf._curTool,features:feats});
        } else {
            kp.awt.showError(that.xhr.response)
        }

    }

    AWBasic.prototype.map_onSingleClick = function (evt) {
        that.event = evt;
        var xy = evt.coordinate;
        var lyrPrj = that.view.getProjection().getCode();
		
        switch (that._conf._curTool) {
			case "toolSelect":
				
            case "toolIdentify":
                var url = that.layer.getFeatureInfoUrl(xy, that.view.getResolution(), lyrPrj, {INFO_FORMAT: 'application/json',QUERY_LAYERS:that._conf.dynamicLayer.activeSublayer});
                that.xhr.open('POST', url, true);
                that.xhr.send();
                break;
            case "toolMeasure":
                var point = new ol.geom.Point(xy);
                var msg = kp.awt.calculateGeometryMsg(point);
                var features = that.measureLayer.getFeatures();
                if (features.length > 0) {
                    if (features.length == 1) {
                        that.measure.ruler = new ol.geom.LineString([that.measure.xy, xy]);
                        that.measureLayer.addFeature(new ol.Feature(that.measure.ruler));
                    } else {
                        that.measure.ruler.appendCoordinate(xy);
                    }
                    msg += "<br/>" + kp.awt.calculateGeometryMsg(that.measure.ruler, that.view.getProjection().getUnits());
                }
                that.measureLayer.addFeature(new ol.Feature(point));
                that.measure.xy = xy;
                $(document.body).w2tag(msg + "<span style='color:yellow;float:right;cursor:pointer' onclick='kp.awt.measureLayer.clear();$().w2tag()'>x</span>", { left: evt.originalEvent.clientX - 20, top: evt.originalEvent.clientY });
                break;
        }
    }

    AWBasic.prototype.box_onBoxEnd = function () {
        var ext = this.getGeometry().getExtent();
		that.box=ext;
		switch (that._conf._curTool) {
			case "toolSelect":
				var lyrUrl = that.layer.getUrls()[0].replace("/wms", "/wfs");
				var lyrPrj = that.view.getProjection().getCode();
				that.xhr.open('POST', lyrUrl + "?outputFormat=application/json&request=GetFeature&typename=" + that._conf.dynamicLayer.activeSublayer + "&srsname=" + lyrPrj + "&bbox=" + ext[1] + "," + ext[0] + "," + ext[3] + "," + ext[2]+",urn:ogc:def:crs:"+ lyrPrj+"&maxFeatures"+kp.awt.MAX_QUERY_FEATURE, true);
				that.xhr.setRequestHeader('content-type', 'text/xml;charset=utf-8');
				that.xhr.send();
				break;
			case "toolZoomIn":
				that.zoomToExtent(ext);
				break;
			case "toolZoomOut":
				that.zoomToExtent(ext, true);
				break;
		}
    }


    AWBasic.prototype.tool_onClick = function (tool, actived) {
        if (actived) {
            if (that._conf._curTool && that._conf._curTool != tool) {
                that.tool_onClick(that._conf._curTool, false);
            }
            that._conf._curTool = tool;
        }

        switch (tool) {
            case "toolZoomIn":
            case "toolZoomOut":
            case "toolSelect":
                that._conf.box.setActive(actived);
                break;
            case "toolMeasure":
                $().w2tag();
                that.measure.ruler = null;
                that.measureLayer.clear();
                break;
			case "tool3D":
				that._conf.map3d.setEnabled(actived);
				break;
        }
    }

    AWBasic.prototype.item_onClick = function (evt) {
        if (evt.subItem) {
            switch (evt.item.id) {
                case "cmdBasemap":
                    var lyr = that._conf.map.getLayers().getArray()[0];
                    if (lyr instanceof ol.layer.Tile)
                        lyr.setSource(kp.awt.BASEMAPS[evt.subItem.text]);
                    break;
                case "cmdPrint":
                    var win = window.open(evt.subItem.tag);
                    win.onload = function () {
                        var div = win.document.getElementById("divMap");
                        var canvas = that._conf.map.getViewport().childNodes[0];
                        var newCanvas = document.createElement("canvas");
                        newCanvas.width = div.clientWidth;
                        newCanvas.height = div.clientHeight;
                        newCanvas.getContext('2d').drawImage(canvas, 0, 0);
                        div.appendChild(newCanvas);
                    }
                    break;
            }
        } else {
            if (evt.item.id.startsWith("tool")) {
                that.tool_onClick(evt.item.id, true);
            } else {
                switch (evt.item.id) {
					case "cmdAttribute":
						var features=that.selectLayer.getFeatures();
						if(features.length>0){
							var lookup={},lyr=null,lyrName=null,menuItems=[];
							for(var i=0;i<features.length;i++){
								var feature=features[i];
								var attr=feature.getProperties();
								attr.tag=feature;
								var ids=feature.getId().split(".");
								lyrName=ids[0];
								lyr=lookup[lyrName];
								if(!lyr){
									lyr={columns:[],records:[]};
									for(var key in attr)if(attr.hasOwnProperty(key)&&key!="geometry")lyr.columns.push({field:key,text:key,size:"100px"});
									lookup[lyrName]=lyr;
									menuItems.push({ id: lyrName, text: lyrName});
								}
								attr.recid=ids[1];
								lyr.records.push(attr);
							}
							var id="divAttribute";
							w2popup.open({
								title:"<i>Attribute</i> - "+lyrName,
								width: 600,
								height: 450,
								body: '<div id="'+id+'" style="width:100%;height:100%"></div>',
								onOpen:function(evt){
									evt.onComplete=function(){
										var div=document.getElementById(id);
										if(w2ui[id]){
											w2ui[id].columns=lyr.columns;
											w2ui[id].records=lyr.records;
											w2ui[id].refresh();
										}else $(div).w2grid({
											name:id,
											columns:lyr.columns,
											records:lyr.records,
											show: { 
												toolbar: true,
												footer: true
											},
											toolbar: {
												items: [
													{ type: 'spacer' },
													{ type: 'menu-radio', id: 'mnuAttrLayer',
														text: function (item) {
															return "<b>Layer:</b> "+item.selected;
														},
														selected: lyrName,
														items: menuItems
													}
												],
												tag: lookup,
												onClick:function(evt){
													if(evt.subItem){
														var key=evt.subItem.id;
														var grid=w2ui["divAttribute"];
														grid.columns=this.tag[key].columns;
														grid.records=this.tag[key].records;
														grid.refresh();
													}
												}
											},
											onSelect:function(evt){
												var attr=this.get(evt.recid);
												that.zoomToExtent(attr.geometry.getExtent());
												that.selectLayer.clear();
												that.selectLayer.addFeature(attr.tag);
											}
										});
										
										w2ui[id].render(div);
									}
								}
							});
						}
						break;
					case "cmdLayerControl":
						var nodes=[];
						for(var i=that.layers.length-1;i>=0;i--){
							var lyr=that.layers[i];
							var subNodes=[];
							nodes.push({id:lyr.name,text:"&nbsp;<input id='chkV_"+lyr.name+"' type='checkbox' "+(lyr.getVisible()?"checked":"")+" onclick='kp.awt.AWBasic.prototype.chkLayerControl_onClick(this,\""+i+"\")'/> "+lyr.name,nodes:subNodes,expanded:true});
							if(lyr.tag){
								for(var j=lyr.tag.LAYERS.length-1;j>=0;j--){
									var nodeid=lyr.tag.LAYERS[j];
									subNodes.push({id:nodeid,text:"<input id='chkV_"+nodeid+"' type='checkbox' "+(lyr.tag.VISIBLES[j]?"checked":"")+" onclick='kp.awt.AWBasic.prototype.chkLayerControl_onClick(this,\""+i+"\",\""+j+"\")'/> <i>"+nodeid+"</i>"+
									"<input id='chkA_"+nodeid+"' type='radio' name='radA_ActivedLayer' style='float:right' "+(nodeid==that._conf.dynamicLayer.activeSublayer?"checked":"")+" onclick='kp.awt.AWBasic.prototype.chkLayerControl_onClick(this,\""+i+"\",\""+j+"\")'/> "});
								}
							}
						}
		
						that.dlgAWBasicControl.style.display="";
						var id="dlgAWBasicControlContent";
						var div=document.getElementById(id);
						if(w2ui[id]){
							w2ui[id].nodes=nodes;
							w2ui[id].refresh();
						}else $(div).w2sidebar({
							name:id,
							nodes: nodes
						});
						break;
                    case "cmdHelp": window.open("help/help.html"); break;
                    case "cmdUnselect": that.selectLayer.clear(); break;
                    case "cmdFullExtent": that.zoomToExtent(that.fullExtent); break;
                    case "cmdBackExtent": that.backExtent(); break;
                    case "cmdNextExtent": that.nextExtent(); break;
                    case "chkTransparent": that._conf.dynamicLayer.setOpacity(evt.item.checked ? 1 : 0.5); break;
					case "chkSwipe":
						var menus=w2ui.tbrBasic.get("mnuSwipe").items;
						var layer=null
						for(var i=0;i<menus.length;i++)
							if(menus[i].checked)layer=that.layers[menus[i].tag];
						if(layer){
							if(evt.item.checked){
								that._conf.map.removeEventListener('pointermove');
								layer.removeEventListener('prerender');
								layer.removeEventListener('postrender');
								that._conf.map.render();
							}else{
								that._conf.map.addEventListener('pointermove', function (evt) {
									that.event=evt;
									this.render();
								});
								layer.addEventListener('prerender', function (evt) {
									if(that.event){
										var ctx = evt.context;
										var pixel = Math.round(that.event.pixel[0]*(ctx.canvas.width/that._conf.map.getSize()[0]));

										ctx.save();
										ctx.beginPath();
										ctx.rect(0,0,pixel,ctx.canvas.height);
										ctx.clip();
									}
								});
								layer.addEventListener('postrender', function (evt) {
									var ctx = evt.context;
									ctx.restore();
								});
							}
						}
					break;
                }
            }
        }
    }

	AWBasic.prototype.chkLayerControl_onClick=function(chk,layerIndex,subLayerIndex){
		var code=chk.id.substr(0,4);
		var layer=that.layers[layerIndex];
		var tag=layer.tag;
		switch(code){
			case "chkV"://visible
				if(subLayerIndex===undefined){
					layer.setVisible(chk.checked);
				}else{
					tag.VISIBLES[subLayerIndex]=chk.checked;
					var subLayers=[];
					for(var i=0;i<tag.LAYERS.length;i++){
						if(tag.VISIBLES[i])subLayers.push(tag.LAYERS[i]);
					}
					
					var source=layer.getSource();
					var params=source.getParams();
					params.LAYERS=subLayers;
					source.updateParams(params);
				}
				break;
			case "chkA"://active
				layer.activeSublayer=tag.LAYERS[subLayerIndex];
				that.setDynamicLayer(layer);
				break;
		}
	}

	AWBasic.prototype.onFeatureSelect = function (evt) {/*event*/}
	
	
    //end of contructor
    return AWBasic;
} ());