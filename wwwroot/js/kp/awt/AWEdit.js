if (!kp) var kp = {};
if (!kp.awt) kp.awt = {};

//AWEdit - Công cụ hiệu chỉnh
kp.awt.AWEdit = (function () {
    var that;

    function AWEdit(conf, id) {
        that = this;
        this._conf = conf;
        this.iconClass = "awedit-png";
        this.title = "AWEdit Tools";
        this.layer = conf.dynamicLayer.getSource();
        /*this.subLayers = [];
        var subLayers = this.layer.getParams().LAYERS;
        for (var i = 0; i < subLayers.length; i++)
            this.subLayers[i] = { text: subLayers[i], checked: true };*/
		var geometryTypes=[{text:"Point",id:"itmPenPoint"},{text:"LineString",id:"itmPenPolyline"},{text:"Polygon",id:"itmPenPolygon",checked:true}];
		
        $(id).w2toolbar({
            name: "tbrEdit",
            items: [
                { type: "menu", text: "Edit", items: [
                    { text: "Start editing", id: "itmEditBegin" },
                    { text: "Stop editing", id: "itmEditEnd" },
                    { text: "--" },
                    { text: "Save edits", id: "itmEditSave", icon: "save-png" },
                    { text: "--" },
                    { text: "Start editing (session)", id: "itmEditBeginSession" },
                    { text: "<checkbox/> Show deleted features", id: "itmEditShowDelete"}]
                },
                { type: "radio", id: "toolEditSelect", icon: "editselect-png", tooltip: "Select" },
                { type: "menu-radio", items: [
                    { text: "Top Layer", id: "itmEditSelectTop" },
                    { text: "Visible Layers", id: "itmEditSelectVisible", checked: true },
                    { text: "All layers", id: "itmEditSelectAll"}]
                },
                { type: "button", id: "cmdEditExtract", icon: "addto-png", tooltip: "Add to Edit" },
                { type: "break" },
                { type: "button", id: "cmdLayerControl", icon: "layercontrol-png", tooltip: "Control layers" },
                { type: "button", id: "cmdEditAttribute", icon: "attribute-png", tooltip: "Attribute" },
                { type: "button", id: "cmdEditProperty", icon: "property-png", tooltip: "Property" },
                { type: "break" },
                { type: "radio", id: "toolEditPen", icon: "pen-png", tooltip: "Pen" },
                { type: "menu-radio", id: "mnuEditPen", items:geometryTypes },
                { type: "radio", id: "toolEditAutoPolygon", icon: "autopolygon-png", tooltip: "Auto Complete Polygon" },
                { type: "break" },
                { type: "button", id: "cmdEditActiveMRS", icon: "move-png", tooltip: "Move/Rotate/Scale" },
                { type: "button", id: "cmdEditActiveVertices", icon: "editvertex-png", tooltip: "Edit Vertices" },
                { type: "button", id: "cmdEditDuplicate", icon: "duplicate-png", tooltip: "Duplicate" },
                { type: "button", id: "cmdEditDelete", icon: "delete-png", tooltip: "Delete" },
                { type: "break" },
                { type: "button", id: "cmdEditBuffer", icon: "buffer-png", tooltip: "Buffer" },
                { type: "button", id: "cmdEditMerge", icon: "merge-png", tooltip: "Merge" },
                { type: "radio", id: "toolEditSplit", icon: "split-png", tooltip: "Split" },
                { type: "radio", id: "toolEditReshape", icon: "reshape-png", tooltip: "Reshape" },
                { type: "break" },
                { type: "button", id: "cmdEditUndo", icon: "undo-png", tooltip: "Undo Edit" },
                { type: "button", id: "cmdEditRedo", icon: "redo-png", tooltip: "Redo Edit" }
            ],
            onClick: this.item_onClick
        });

        conf.draws = {};
		
		for(var i=0;i<geometryTypes.length;i++){
			var type=geometryTypes[i].text;
			var draw = new ol.interaction.Draw({
				source: that.graphicLayer,
				type: type
			});
			draw.setActive(false);
			draw.on("draw-end", that.draw_onDrawEnd);
			conf.map.addInteraction(draw);
			conf.draws[type]=draw;
			if(geometryTypes[i].checked)this.draw=draw;
		}

        this._editor = new kp.awt.Editor(conf);

        this.select = new ol.interaction.Select({ layers: [this._editor.editLayer], hitTolerance: kp.awt.TOLERANCE });
        this.select.setActive(false);
        conf.map.addInteraction(this.select);
        this.selset = this.select.getFeatures();
        this.modifyStyle = new ol.style.Style({
            geometry: function (feature) {
                var geom = feature.getGeometry();
                var xy = geom.getCoordinates();
                var geometries = [geom];
                switch (geom.getType()) {
                    case "MultiPolygon":
                        geometries.push(new ol.geom.MultiPoint(xy[0][0]));
                        break;
                    case "MultiLineString":
                        geometries.push(new ol.geom.MultiPoint(xy[0]));
                        break;
                    case "LineString":
                    case "Polygon":
                        geometries.push(new ol.geom.MultiPoint(xy));
                        break;
                }
                return new ol.geom.GeometryCollection(geometries);
            },
            image: new ol.style.Circle({
                radius: 4,
                fill: new ol.style.Fill({ color: "green" })
            }),
            fill: new ol.style.Fill({ color: [255, 127, 0, 0.25] }),
            stroke: new ol.style.Stroke({ color: "lime", width: 2 })
        });
        this.translateStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 4,
                fill: new ol.style.Fill({ color: "green" })
            }),
            fill: new ol.style.Fill({ color: [255, 127, 0, 0.25] }),
            stroke: new ol.style.Stroke({ color: "lime", width: 2 })
        });
        this.modifyFeatures = new ol.Collection();
        this.modify = new ol.interaction.Modify({ features: this.modifyFeatures });
        this.modify.setActive(false);
        conf.map.addInteraction(this.modify);

        this.translate = new ol.interaction.Translate({ features: this.modifyFeatures })
        this.translate.setActive(false);
        conf.map.addInteraction(this.translate);

        conf.map.on('singleclick', this.map_onSingleClick);
        conf.map.on('dblclick', this.map_onDoubleClick);
        conf.box.on('boxend', this.box_onBoxEnd);
    }

    AWEdit.prototype.map_onSingleClick = function (evt) {
        var p1 = evt.map.getCoordinateFromPixel([evt.pixel[0] - kp.awt.TOLERANCE, evt.pixel[1] + kp.awt.TOLERANCE]);
        var p2 = evt.map.getCoordinateFromPixel([evt.pixel[0] + kp.awt.TOLERANCE, evt.pixel[1] - kp.awt.TOLERANCE]);
        var ext = [p1[0], p1[1], p2[0], p2[1]];
        switch (that._conf._curTool) {
            case "toolEditSelect":
                that.translate.setActive(false);
                that.modify.setActive(false);

                if (that.modifyFeatures.getLength() > 0) {
                    var feature = that.modifyFeatures.getArray()[0];
                    if (feature.getGeometry().intersectsExtent(ext)) {
                        feature.setStyle(that.modifyStyle);
                        that.modify.setActive(true);
                        return;
                    }
                }

                var features = that.modifyFeatures.getArray();
                for (var i = 0; i < features.length; i++)
                    features[i].setStyle(null);
                that.modifyFeatures.clear();
                if (that.selset.getLength() > 0) {
                    var feature = that.selset.getArray()[0];
                    if (feature.getGeometry().intersectsExtent(ext)) {
                        feature.setStyle(that.translateStyle);
                        that.modifyFeatures.push(feature);
                        that.translate.setActive(true);
                    }
                }
                break;
        }
    }

    AWEdit.prototype.map_onDoubleClick = function (evt) {
        var p1 = evt.map.getCoordinateFromPixel([evt.pixel[0] - kp.awt.TOLERANCE, evt.pixel[1] + kp.awt.TOLERANCE]);
        var p2 = evt.map.getCoordinateFromPixel([evt.pixel[0] + kp.awt.TOLERANCE, evt.pixel[1] - kp.awt.TOLERANCE]);
        var ext = [p1[0], p1[1], p2[0], p2[1]];
        switch (that._conf._curTool) {
            case "toolEditSelect":
                that.translate.setActive(false);
                that.modify.setActive(false);

                var feature;
                if (that.modifyFeatures.getLength() > 0)
                    feature = that.modifyFeatures.getArray()[0];
                else if (that.selset.getLength() > 0)
                    feature = that.selset.getArray()[0];

                if (feature) {
                    if (feature.getGeometry().intersectsExtent(ext)) {
                        if (that.modifyFeatures.getLength() == 0)
                            that.modifyFeatures.push(feature);
                        feature.setStyle(that.modifyStyle);
                        that.modify.setActive(true);
                        evt.stopPropagation();
                    }
                }

                break;
        }
    }

    AWEdit.prototype.box_onBoxEnd = function () {
        var ext = this.getGeometry().getExtent();

        switch (that._conf._curTool) {
            case "toolEditSelect":
                that.selset.clear();
                that._editor.editLayer.getSource().forEachFeatureIntersectingExtent(ext, function (feature) {
                    that.selset.push(feature);
                });
                break;
        }
    }

    AWEdit.prototype.tool_onClick = function (tool, actived) {
        if (actived) {
            if (that._conf._curTool && that._conf._curTool != tool) {
                that.tool_onClick(that._conf._curTool, false);
            }
            that._conf._curTool = tool;
        }

        switch (tool) {
            case "toolEditSelect":
                that.select.setActive(actived);
                that._conf.box.setActive(actived);
                break;
			case "toolEditPen":
                that.draw.setActive(actived);
                break;
        }
    }

    AWEdit.prototype.item_onClick = function (evt) {
        if (evt.subItem) {
            switch (evt.subItem.id) {
                case "itmEditBegin":
                    var selectLayer = that._conf.selectLayer.getSource();
					var features = selectLayer.getFeatures();
					if (features.length > kp.awt.MAX_SELECT_FEATURE) {
						kp.awt.showWarning("To many features are selected for editing (" + features.length + "/" + kp.awt.MAX_SELECT_FEATURE + ")");
					} else if (features.length == 0) {
						kp.awt.showConfirm("No feature is selected for editing, continue?", function () {
							that._editor.begin();
							that._conf.dynamicLayer.setOpacity(kp.awt.TRANSPARENT_DYNAMICLAYER);
						});
					} else {
						that._editor.begin(features);
						selectLayer.clear();
						that._conf.dynamicLayer.setOpacity(kp.awt.TRANSPARENT_DYNAMICLAYER);
					}
                    break;
                case "itmEditEnd":
                    if (that._editor.isDirty()) {
						vh.awt.showConfirm("Save changes to database?", function () {
							that._editor.applyEdits();
							that._editor.end();
							that._conf.dynamicLayer.setOpacity(1);
						}, function () {
							that._editor.end();
							that._conf.dynamicLayer.setOpacity(1);
						}, true);
					} else {
						that._editor.end();
						that._conf.dynamicLayer.setOpacity(1);
					}
                    break;
                case "itmEditSave":
                    that._editor.applyEdits();
                    break;
				case "itmPenPoint":
					that.draw=that._conf.draws["Point"];
					break;
				case "itmPenPolyline":
					that.draw=that._conf.draws["LineString"];
					break;
				case "itmPenPolygon":
					that.draw=that._conf.draws["Polygon"];
					break;
            }
        } else if (evt.item.id.startsWith("tool")) {
			that.tool_onClick(evt.item.id, true);
        }
    }
    //end of contructor
    return AWEdit;
} ());